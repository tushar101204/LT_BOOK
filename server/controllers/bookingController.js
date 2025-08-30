const Booking = require('../model/bookingSchema');
const Hall = require('../model/hallSchema');
const User = require('../model/userSchema');
const nodemailer = require("nodemailer");
const xlsx = require('xlsx');
const { parseISO } = require('date-fns');
const mailSender = require("../utills/mailSender");
const bookingRequestTemplate = require("../template/bookingRequestTemplate");
const bookingApprovalTemplate = require("../template/bookingApprovalTemplate");
const bookingRejectionTemplate = require("../template/bookingRejectionTemplate");



const generateBookingEmailTemplate = bookingRequestTemplate;


const upload = async (req, res, next) => {
  if (!req.files || !req.files.file) {
    return res.status(400).send("No file uploaded.");
  }

  try {
    const file = req.files.file;

    // Parse the Excel file
    const workbook = xlsx.read(file.data, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert Excel data to JSON
    const data = xlsx.utils.sheet_to_json(worksheet);

    // Helper function to convert Excel date serial numbers to JavaScript Date objects
    const excelDateToJSDate = (serial) => {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      return new Date(excelEpoch.getTime() + serial * 86400000);
    };

    // Helper function to convert Excel time serial to HH:MM format
    const excelTimeToHHMM = (serial) => {
      const totalMinutes = Math.round(serial * 24 * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };

    // Process each row and find corresponding bookedHallId asynchronously
    const bookings = await Promise.all(
      data.map(async (row) => {
        // Convert dates and times
        const eventStartDate = excelDateToJSDate(row["start date"]);
        const eventEndDate = excelDateToJSDate(row["end date"]);
        const startTimeString = excelTimeToHHMM(row.start_time);
        const endTimeString = excelTimeToHHMM(row.end_time);

        // Combine start and end times with a fixed date
        const startTime = new Date(`2000-01-01T${startTimeString}:00.000Z`);
        const endTime = new Date(`2000-01-01T${endTimeString}:00.000Z`);

        // Validate times
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          console.error("Invalid time format in row:", row);
          return null;
        }

        // Find bookedHallId based on the hall name
        const hall = await Hall.findOne({ name: row.Lt_name });
        const bookedHallId = hall ? hall._id : null;

        if (!bookedHallId) {
          console.warn(`No hall found for name: ${row.Lt_name}`);
          return null; // Skip if no hall matches the name
        }

        // Return formatted booking object
        return {
          eventDateType: "multiple",
          day: row.day,
          bookedHallName: row.Lt_name,
          eventManager: row.teacher_name,
          designation: row.designation,
          startTime,
          endTime,
          department: row.Branch,
          batch: row.Batch,
          eventName: row.course,
          eventStartDate,
          eventEndDate,
          isApproved: "Approved By Admin",
          bookedHallId,
        };
      })
    );

    // Filter out any null entries (e.g., if bookedHallId was not found)
    const validBookings = bookings.filter(Boolean);

    // Save valid bookings to the database
    await Booking.insertMany(validBookings);

    res.status(201).json({ message: "Bookings added successfully" });
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).json({ message: "Error processing file" });
  }
};

const createBooking = async (req, res, next) => {
  try {
    const {
      userId,
      eventManager,
      department,
      institution,
      eventName,
      eventDateType,
      eventDate,
      eventStartDate,
      eventEndDate,
      startTime,
      endTime,
      email,
      bookedHallId,
      bookedHallName,
      organizingClub,
      phoneNumber,
      altNumber,
      isApproved
    } = req.body;

    const hall = await Hall.findById(bookedHallId);
    if (!hall) {
      return res.status(422).json({ error: 'Hall not found' });
    }

    const currentUserId = (req.user && req.user.id) ? req.user.id : userId;
    const user = await User.findById(currentUserId);
    if (!user) {
      return res.status(422).json({ error: 'user not found' });
    }


    if (eventDateType === "full") {
      if (!eventDate ) {
        return res.status(422).json({ error: "Please fill all details" });
      }
    }else if(eventDateType === "half") {
      if (!startTime || !endTime || !eventDate ) {
        return res.status(422).json({ error: "Please fill all details" });
      }
    }else if(eventDateType === "multiple") {
      if (!eventStartDate || !eventEndDate ) {
        return res.status(422).json({ error: "Please fill all details" });
      }else{

        // Check if eventStartDate is before eventEndDate
        const eventStartDateTime = new Date(eventStartDate);
        const eventEndDateTime = new Date(eventEndDate);
        
        if (eventEndDateTime <= eventStartDateTime) {
          return res.status(422).json({ error: 'Event end date should be after event start date' });
        }
      }
    }

      const nameRegex = /^[\w'.]+\s[\w'.]+\s*[\w'.]*\s*[\w'.]*\s*[\w'.]*\s*[\w'.]*$/;

    if (!nameRegex.test(eventManager)) {
      return res.status(422).json({ error: "Please enter your full Event Coordinator name" });
    }

   
  
    
   // Validate start and end time
   const startDateTime = new Date(`2000-01-01T${startTime}:00Z`);
   const endDateTime = new Date(`2000-01-01T${endTime}:00Z`);
   
   // Check if end time is after start time
   if (endDateTime <= startDateTime) {
     return res.status(422).json({ error: 'End time should be after start time' });
    }

    var approvedState="Request Sent";
    console.log(user);
    if(user.userType==="faculty"){
      approvedState="Approved By Admin";
    }

    const booking = new Booking({

      userId:user._id,
      institution,
      department,
      eventManager,
      eventName,
      eventDateType,
      eventDate,
      eventStartDate,
      eventEndDate,
      startTime,
      endTime,
      email,
      bookedHallId: hall._id,
      bookedHall:hall,
      bookedHallName,
      organizingClub,
      // eventDetailFile,
      // eventDetailText,
      phoneNumber,
      altNumber,
      isApproved:approvedState
    });

    await booking.save();

    const html = generateBookingEmailTemplate(eventName, bookedHallName, organizingClub, institution, department, booking._id,eventDate);
    await mailSender(hall.hallCreater, 'New Booking Request', html);

    res.status(201).json({ message: 'Booking created successfully' });
  } catch (error) {
    console.log(error)
    next(error);
  }
};



const getEvents = async (req, res, next) => {
  try {
    const currentDate = new Date().toISOString();

    const bookings = await Booking.find({
      isApproved: "Approved By Admin",
      eventDateType: { $ne: "multiple" },  // Exclude entries with eventDateType "multiple"
      $or: [
        {
          eventDateType: { $in: ["full", "half"] },
          eventDate: { $gte: currentDate }
        }
      ]
    }).populate('bookedHallId');
    
    
    res.json({ bookings });
  } catch (error) {
    next(error);
  }
};



const getBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find().populate('bookedHallId').populate('userId');

    
    res.json({ bookings });
  } catch (error) {
    next(error);
  }
};


const getBookingById = async (req, res, next) => {
  // console.log("function called");

  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId).populate('bookedHallId').populate('userId');
    // console.log(booking);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json({ booking });
  } catch (error) {
    next(error);
  }
};

const getBookingByUserId = async (req, res, next) => {
  try {
    const userId = (req.user && req.user.id) ? req.user.id : null;
    const booking = await Booking.find({  userId:userId }).populate('bookedHallId').populate('userId');
    // if (!mongoose.Types.ObjectId.isValid(userId)) {
    //   return res.status(400).json({ message: 'Invalid userId' });
    // }
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json({ booking });
  } catch (error) {
    next(error);
  }
};


const getBookingAdmin = async (req, res, next) => {
  try {
    let statusArray = ["Approved By Admin", "Rejected By Admin", "Request Sent"];
    const currentUser = (req.user && req.user.id) ? await User.findById(req.user.id) : null;
    const adminEmail = currentUser ? currentUser.email : null;

    const bookings = await Booking.find({
       isApproved: { $in: statusArray },
       $or: [
         { email: adminEmail},
         {'bookedHall.hallCreater': adminEmail },
       ],
    }).populate('bookedHallId')
      .populate('userId');
    res.json({ bookings });
  } catch (error) {
    next(error);
  }
};



const updateBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const {
      eventName,
      eventDateType,
      eventStartDate,
      eventEndDate,
      eventDate,
      startTime,
      endTime,
      rejectionReason,
      isApproved
    } = req.body;

    // const hall = await Hall.findById(hallId);
    // if (!hall) {
    //   return res.status(404).json({ message: 'Hall not found' });
    // }
   


    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        eventName, eventDate, startTime, endTime,eventDateType,
        eventStartDate,
        eventEndDate,

        //  hallId: hall._id,email,
        isApproved,
        rejectionReason,
      },
      { new: true },
    ).populate('bookedHallId');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }


        // Send email based on the updated approval status

    if (isApproved === 'Approved By Admin') {
      // Send email for approval
      const html = bookingApprovalTemplate(booking.eventName, booking.bookedHallName, booking.organizingClub, booking.institution, booking.department, bookingId);
      await mailSender(process.env.ADMIN_LT_BOOK, 'Booking Request Approved', html);
    } else if (isApproved === 'Rejected By Admin') {
      // Send email for rejection
      const html = bookingRejectionTemplate(booking.eventName, booking.bookedHallName, booking.organizingClub, booking.institution, booking.department, bookingId ,rejectionReason);
      await mailSender(booking.email, 'Booking Request Rejected', html);
    }

    res.json({ message: 'Booking updated successfully', booking });
  } catch (error) {
    next(error);
  }
};


const deleteBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findByIdAndDelete(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getalllt = async (req, res) => {
  try {
    const { eventDate, startTime, endTime } = req.body;

    if (!eventDate || !startTime || !endTime) {
      return res.status(400).json({ message: 'Please provide eventDate, startTime, and endTime' });
    }

    // Convert the input times to Date objects
    const eventDateObj = new Date(eventDate);
    const startTimeObj = new Date(startTime);
    const endTimeObj = new Date(endTime);

    // Validate start and end time
    if (startTimeObj >= endTimeObj) {
      return res.status(400).json({ message: 'End time must be later than start time' });
    }

    // Define requestedDay from eventDate
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const requestedDay = daysOfWeek[eventDateObj.getUTCDay()];

    // Find all the booked halls that overlap with the requested time slot
    const overlappingBookings = await Booking.find({
      $or: [
        // Case 1: If `day` field exists, check for time overlap on the specific day
        {
          day: requestedDay,
          $or: [
            { startTime: { $lt: endTimeObj, $gte: startTimeObj } },
            { endTime: { $gt: startTimeObj, $lte: endTimeObj } },
            { startTime: { $lte: startTimeObj }, endTime: { $gte: endTimeObj } }
          ]
        },
        // Case 2: If `day` field does not exist, check for date and time overlap
        {
          day: { $exists: false },
          eventDate: eventDateObj,
          $or: [
            { startTime: { $lt: endTimeObj, $gte: startTimeObj } },
            { endTime: { $gt: startTimeObj, $lte: endTimeObj } },
            { startTime: { $lte: startTimeObj }, endTime: { $gte: endTimeObj } }
          ]
        }
      ]
    }).select('bookedHallId');

    // Get the list of all hall IDs that are booked
    const bookedHallIds = overlappingBookings.map(booking => booking.bookedHallId);

    // Find halls that are not booked in the requested time slot
    const availableHalls = await Hall.find({
      _id: { $nin: bookedHallIds }
    });

    if (availableHalls.length === 0) {
      return res.status(200).json({
        message: 'No halls available for the selected date and time'
      });
    }

    res.status(200).json({ 
      availableHalls,
      message: "Lt fetched successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


module.exports = { upload,createBooking, getBookings, getBookingById, updateBooking, deleteBooking, getBookingByUserId, getEvents, getBookingAdmin, getalllt };
