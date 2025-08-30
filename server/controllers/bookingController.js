const mongoose = require('mongoose');
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
  try {
    // Validate file upload
    if (!req.files || !req.files.file) {
      return res.status(400).json({ 
        success: false,
        error: "No file uploaded" 
      });
    }

    const file = req.files.file;
    
    // Validate file type
    if (!file.mimetype.includes('spreadsheet') && !file.name.endsWith('.xlsx')) {
      return res.status(400).json({ 
        success: false,
        error: "Please upload a valid Excel file (.xlsx)" 
      });
    }

    // Parse the Excel file
    const workbook = xlsx.read(file.data, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert Excel data to JSON
    const data = xlsx.utils.sheet_to_json(worksheet);
    
    if (!data || data.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: "Excel file is empty or contains no data" 
      });
    }

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
        try {
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
        } catch (rowError) {
          console.error("Error processing row:", row, rowError);
          return null;
        }
      })
    );

    // Filter out any null entries (e.g., if bookedHallId was not found)
    const validBookings = bookings.filter(Boolean);
    
    if (validBookings.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: "No valid bookings found in the uploaded file" 
      });
    }

    // Save valid bookings to the database
    await Booking.insertMany(validBookings);

    res.status(201).json({ 
      success: true,
      message: "Bookings uploaded successfully",
      totalProcessed: data.length,
      validBookings: validBookings.length,
      failedBookings: data.length - validBookings.length
    });
  } catch (error) {
    console.error("Error processing Excel file:", error);
    res.status(500).json({ 
      success: false,
      error: "Error processing uploaded file",
      details: error.message 
    });
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

    // Validate required fields
    if (!bookedHallId || !eventName || !eventDateType) {
      return res.status(422).json({ 
        success: false,
        error: 'Hall ID, event name, and event date type are required' 
      });
    }
    // Validate hall exists
    const hall = await Hall.findById(bookedHallId);
    if (!hall) {
      return res.status(422).json({ 
        success: false,
        error: 'Hall not found' 
      });
    } 
    // Get current user
    const currentUserId = (req.user && req.user.id) ? req.user.id : userId;
    const user = await User.findById(currentUserId);
    if (!user) {
      return res.status(422).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    // Validate half-day booking requirements
    if (eventDateType === "half") {
      if (!startTime || !endTime || !eventDate) {
        return res.status(422).json({ 
          success: false,
          error: "Please fill all details for half-day booking" 
        });
      }
    }
    // Validate start and end time
    if (startTime && endTime) {
      const startDateTime = new Date(`2000-01-01T${startTime}:00Z`);
      const endDateTime = new Date(`2000-01-01T${endTime}:00Z`);

      if (endDateTime <= startDateTime) {
        return res.status(422).json({ 
          success: false,
          error: 'End time should be after start time' 
        });
      }
    }
    // Determine approval state: faculty -> auto approved, student -> request sent
    const approvedState = user.userType === "faculty" ? "Approved By Admin" : "Request Sent";

    // Use user's email if available, otherwise fallback to submitted email
    const recipientEmail = user.email || email;

    // RESOLVE CONCURRENT BOOKING ISSUE: Use transaction to prevent double-booking
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Simple overlap check to prevent double-booking
        let hasOverlap = false;
        
        if (eventDateType === "multiple" && eventStartDate && eventEndDate) {
          // For multiple day bookings, check if any existing booking overlaps
          const existingBookings = await Booking.find({
            bookedHallId: hall._id,
            isApproved: { $in: ["Approved By Admin", "Request Sent"] }
          }).session(session);
          
          for (const existing of existingBookings) {
            if (existing.eventStartDate && existing.eventEndDate) {
              if (new Date(eventStartDate) <= existing.eventEndDate && new Date(eventEndDate) >= existing.eventStartDate) {
                hasOverlap = true;
                break;
              }
            }
          }
        } else if (eventDate && startTime && endTime) {
          // For single day bookings, check time overlap
          const eventDateObj = new Date(eventDate);
          const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
          const requestedDay = daysOfWeek[eventDateObj.getUTCDay()];
          
          const existingBookings = await Booking.find({
            bookedHallId: hall._id,
            isApproved: { $in: ["Approved By Admin", "Request Sent"] }
          }).session(session);
          
          for (const existing of existingBookings) {
            if (existing.day === requestedDay || (!existing.day && existing.eventDate && existing.eventDate.toDateString() === eventDateObj.toDateString())) {
              if (existing.startTime && existing.endTime && startTime && endTime) {
                // Simple time string comparison
                if (startTime < existing.endTime && endTime > existing.startTime) {
                  hasOverlap = true;
                  break;
                }
              }
            }
          }
        }
        
        if (hasOverlap) {
          throw new Error('Hall is already booked for the requested time slot');
        }
        
        // Create and save the booking
        const booking = new Booking({
          userId: user._id,
          userRole: user.userType,
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
          email: recipientEmail,
          bookedHallId: hall._id,
          bookedHall: hall,
          bookedHallName,
          organizingClub,
          phoneNumber,
          altNumber,
          isApproved: approvedState
        });

        await booking.save({ session });
        return booking;
      });
      // If transaction succeeds, send emails
      const booking = await Booking.findOne({
        userId: user._id,
        eventName,
        bookedHallId: hall._id,
        eventDate: eventDate || eventStartDate
      }).sort({ createdAt: -1 });

      if (user.userType === "faculty") {
        // Send confirmation to faculty
        const html = bookingApprovalTemplate(
          booking.eventName,
          booking.bookedHallName,
          booking.organizingClub,
          booking.institution,
          booking.department,
          booking._id
        );
        await mailSender(recipientEmail, 'LT Booking Confirmed', html);
      } else {
        // Send "request submitted" email to student
        const htmlStudent = bookingRequestTemplate(
          booking.eventName,
          booking.bookedHallName,
          booking.organizingClub,
          booking.institution,
          booking.department,
          booking._id,
          booking.eventDate
        );
        await mailSender(recipientEmail, 'Booking Request Submitted', htmlStudent);

        // Notify admin for approval
        const adminEmail = process.env.ADMIN_LT_BOOK;
        if (adminEmail) {
          const htmlAdmin = generateBookingEmailTemplate(
            booking.eventName,
            booking.bookedHallName,
            booking.organizingClub,
            booking.institution,
            booking.department,
            booking._id,
            booking.eventDate
          );
          await mailSender(adminEmail, 'New Booking Request - Approval Required', htmlAdmin);
        } else {
          console.warn('ADMIN_LT_BOOK not set — admin will not be notified of booking requests.');
        }
      }

      res.status(201).json({ 
        success: true,
        message: 'Booking created successfully',
        bookingId: booking._id
      });

    } finally {
      await session.endSession();
    }

  } catch (error) {
    console.error('Error creating booking:', error);
    
    // Handle specific error for double-booking
    if (error.message === 'Hall is already booked for the requested time slot') {
      return res.status(409).json({ 
        success: false,
        error: 'Hall is already booked for the requested time slot. Please choose a different time or hall.' 
      });
    }
    
    // Handle transaction-related errors
    if (error.message.includes('Transaction numbers') || error.message.includes('session')) {
      console.error('Transaction error, attempting fallback approach...');
      
      // Fallback: Simple availability check without transaction
      try {
        let hasOverlap = false;
        
        if (eventDateType === "multiple" && eventStartDate && eventEndDate) {
          // For multiple day bookings, check if any existing booking overlaps
          const existingBookings = await Booking.find({
            bookedHallId: hall._id,
            isApproved: { $in: ["Approved By Admin", "Request Sent"] }
          });
          
          for (const existing of existingBookings) {
            if (existing.eventStartDate && existing.eventEndDate) {
              if (new Date(eventStartDate) <= existing.eventEndDate && new Date(eventEndDate) >= existing.eventStartDate) {
                hasOverlap = true;
                break;
              }
            }
          }
        } else if (eventDate && startTime && endTime) {
          // For single day bookings, check time overlap
          const eventDateObj = new Date(eventDate);
          const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
          const requestedDay = daysOfWeek[eventDateObj.getUTCDay()];
          
          const existingBookings = await Booking.find({
            bookedHallId: hall._id,
            isApproved: { $in: ["Approved By Admin", "Request Sent"] }
          });
          
          for (const existing of existingBookings) {
            if (existing.day === requestedDay || (!existing.day && existing.eventDate && existing.eventDate.toDateString() === eventDateObj.toDateString())) {
              if (existing.startTime && existing.endTime && startTime && endTime) {
                // Simple time string comparison
                if (startTime < existing.endTime && endTime > existing.startTime) {
                  hasOverlap = true;
                  break;
                }
              }
            }
          }
        }
        
        if (hasOverlap) {
          return res.status(409).json({ 
            success: false,
            error: 'Hall is already booked for the requested time slot. Please choose a different time or hall.' 
          });
        }
        
        // If no overlaps, create booking without transaction
        const booking = new Booking({
          userId: user._id,
          userRole: user.userType,
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
          email: recipientEmail,
          bookedHallId: hall._id,
          bookedHall: hall,
          bookedHallName,
          organizingClub,
          phoneNumber,
          altNumber,
          isApproved: approvedState
        });
        
        await booking.save();
        
        // Send emails (same logic as before)
        if (user.userType === "faculty") {
          const html = bookingApprovalTemplate(
            booking.eventName,
            booking.bookedHallName,
            booking.organizingClub,
            booking.institution,
            booking.department,
            booking._id
          );
          await mailSender(recipientEmail, 'LT Booking Confirmed', html);
        } else {
          const htmlStudent = bookingRequestTemplate(
            booking.eventName,
            booking.bookedHallName,
            booking.organizingClub,
            booking.institution,
            booking.department,
            booking._id,
            booking.eventDate
          );
          await mailSender(recipientEmail, 'Booking Request Submitted', htmlStudent);
          
          const adminEmail = process.env.ADMIN_LT_BOOK;
          if (adminEmail) {
            const htmlAdmin = generateBookingEmailTemplate(
              booking.eventName,
              booking.bookedHallName,
              booking.organizingClub,
              booking.institution,
              booking.department,
              booking._id,
              booking.eventDate
            );
            await mailSender(adminEmail, 'New Booking Request - Approval Required', htmlAdmin);
          }
        }
        
        return res.status(201).json({ 
          success: true,
          message: 'Booking created successfully (fallback mode)',
          bookingId: booking._id
        });
        
      } catch (fallbackError) {
        console.error('Fallback approach also failed:', fallbackError);
        return res.status(500).json({ 
          success: false,
          error: 'Failed to create booking. Please try again later.' 
        });
      }
    }
    
    next(error);
  }
};


const getEvents = async (req, res, next) => {
  try {
    const currentDate = new Date().toISOString();

    // Get approved events that are not multiple-day events and are in the future
    const bookings = await Booking.find({
      isApproved: "Approved By Admin",
      eventDateType: { $ne: "multiple" },
      $or: [
        {
          eventDateType: { $in: ["full", "half"] },
          eventDate: { $gte: currentDate }
        }
      ]
    })
    .populate('bookedHallId')
    .sort({ eventDate: 1, startTime: 1 }) // Sort by date and time for better UX
    .lean(); // Use lean() for better performance when you don't need Mongoose documents
    
    res.json({ 
      success: true,
      count: bookings.length,
      bookings 
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    next(error);
  }
};


const getBookings = async (req, res, next) => {
  try {
    // Get all bookings with populated hall and user information
    const bookings = await Booking.find()
      .populate('bookedHallId', 'name capacity location') // Only populate necessary hall fields
      .populate('userId', 'name email userType') // Only populate necessary user fields
      .sort({ createdAt: -1 }) // Sort by creation date, newest first
      .lean(); // Use lean() for better performance
    
    res.json({ 
      success: true,
      count: bookings.length,
      bookings 
    });
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    next(error);
  }
};


const getBookingById = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    
    // Validate booking ID format
    if (!bookingId || bookingId.trim() === '') {
      return res.status(400).json({ 
        success: false,
        error: 'Valid booking ID is required' 
      });
    }

    // Get booking by ID with populated hall and user information
    const booking = await Booking.findById(bookingId)
      .populate('bookedHallId', 'name capacity location amenities')
      .populate('userId', 'name email userType department')
      .lean();

    if (!booking) {
      return res.status(404).json({ 
        success: false,
        error: 'Booking not found' 
      });
    }
    
    res.json({ 
      success: true,
      booking 
    });
  } catch (error) {
    console.error('Error fetching booking by ID:', error);
    next(error);
  }
};

const getBookingByUserId = async (req, res, next) => {
  try {
    const userId = (req.user && req.user.id) ? req.user.id : null;
    
    // Check if user is authenticated
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        error: 'User authentication required' 
      });
    }

    // Get all bookings for the authenticated user
    const bookings = await Booking.find({ userId })
      .populate('bookedHallId', 'name capacity location')
      .populate('userId', 'name email userType')
      .sort({ createdAt: -1 }) // Sort by creation date, newest first
      .lean();

    // Note: find() returns an array, so we check length instead of truthiness
    if (bookings.length === 0) {
      return res.status(200).json({ 
        success: true,
        message: 'No bookings found for this user',
        count: 0,
        bookings: [] 
      });
    }

    res.json({ 
      success: true,
      count: bookings.length,
      bookings 
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    next(error);
  }
};


const getBookingAdmin = async (req, res, next) => {
  try {
    const statusArray = ["Approved By Admin", "Rejected By Admin", "Request Sent"];
    const currentUser = (req.user && req.user.id) ? await User.findById(req.user.id) : null;
    
    // Check if user is authenticated
    if (!currentUser) {
      return res.status(401).json({ 
        success: false,
        error: 'User authentication required' 
      });
    }

    const adminEmail = currentUser.email;
    
    // Get admin bookings based on multiple criteria
    const bookings = await Booking.find({
      $or: [
        { isApproved: { $in: statusArray } },           // All bookings with specific statuses
        { email: adminEmail },                          // Bookings by admin
        { 'bookedHall.hallCreater': adminEmail }        // Bookings in halls created by admin
      ]
    })
    .populate('bookedHallId', 'name capacity location')
    .populate('userId', 'name email userType')
    .sort({ createdAt: -1 }) // Sort by creation date, newest first
    .lean();

    res.json({ 
      success: true,
      count: bookings.length,
      adminEmail,
      bookings 
    });
  } catch (error) {
    console.error('Error fetching admin bookings:', error);
    next(error);
  }
};



const updateBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    // Validate booking ID
    if (!bookingId || bookingId.trim() === '') {
      return res.status(400).json({ 
        success: false,
        error: 'Valid booking ID is required' 
      });
    }

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

    // Validate required fields for approval/rejection
    if (isApproved === 'Rejected By Admin' && !rejectionReason) {
      return res.status(400).json({ 
        success: false,
        error: 'Rejection reason is required when rejecting a booking' 
      });
    }

    // Update the booking
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        eventName, 
        eventDate, 
        startTime, 
        endTime, 
        eventDateType,
        eventStartDate,
        eventEndDate,
        isApproved,
        rejectionReason,
        updatedAt: new Date() // Track when booking was last updated
      },
      { 
        new: true,
        runValidators: true // Ensure validation runs on update
      }
    ).populate('bookedHallId', 'name capacity location');

    if (!booking) {
      return res.status(404).json({ 
        success: false,
        error: 'Booking not found' 
      });
    }

    // Send email based on the updated approval status
    const recipient = booking.email || (booking.userId && booking.userId.email);

    if (isApproved === 'Approved By Admin') {
      // Send approval email to the booking owner
      const html = bookingApprovalTemplate(
        booking.eventName,
        booking.bookedHallName,
        booking.organizingClub,
        booking.institution,
        booking.department,
        bookingId
      );
      
      if (recipient) {
        await mailSender(recipient, 'Booking Request Approved', html);
      } else {
        console.warn('No recipient email found for booking approval notification.');
      }
    } else if (isApproved === 'Rejected By Admin') {
      // Send rejection email to the booking owner
      const html = bookingRejectionTemplate(
        booking.eventName,
        booking.bookedHallName,
        booking.organizingClub,
        booking.institution,
        booking.department,
        bookingId,
        rejectionReason
      );
      
      if (recipient) {
        await mailSender(recipient, 'Booking Request Rejected', html);
      } else {
        console.warn('No recipient email found for booking rejection notification.');
      }
    }

    res.json({ 
      success: true,
      message: 'Booking updated successfully', 
      booking 
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    next(error);
  }
};



const deleteBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    
    // Validate booking ID
    if (!bookingId || bookingId.trim() === '') {
      return res.status(400).json({ 
        success: false,
        error: 'Valid booking ID is required' 
      });
    }

    // Check if user has permission to delete this booking
    const currentUserId = req.user && req.user.id ? req.user.id : null;
    if (currentUserId) {
      const booking = await Booking.findById(bookingId);
      if (booking && booking.userId.toString() !== currentUserId) {
        // Check if user is admin or hall creator
        const user = await User.findById(currentUserId);
        const hall = await Hall.findById(booking.bookedHallId);
        
        if (user.userType !== 'admin' && hall.hallCreater !== user.email) {
          return res.status(403).json({ 
            success: false,
            error: 'You do not have permission to delete this booking' 
          });
        }
      }
    }

    // Delete the booking
    const deletedBooking = await Booking.findByIdAndDelete(bookingId);
    
    if (!deletedBooking) {
      return res.status(404).json({ 
        success: false,
        error: 'Booking not found' 
      });
    }

    res.json({ 
      success: true,
      message: 'Booking deleted successfully',
      deletedBooking: {
        id: deletedBooking._id,
        eventName: deletedBooking.eventName,
        bookedHallName: deletedBooking.bookedHallName
      }
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    next(error);
  }
};

const getalllt = async (req, res) => {
  try {
    const { eventDate, startTime, endTime } = req.body;

    // Validate required parameters
    if (!eventDate || !startTime || !endTime) {
      return res.status(400).json({ 
        success: false,
        error: 'Please provide eventDate, startTime, and endTime' 
      });
    }

    // Convert the input times to Date objects
    const eventDateObj = new Date(eventDate);
    const startTimeObj = new Date(startTime);
    const endTimeObj = new Date(endTime);

    // Validate date format
    if (isNaN(eventDateObj.getTime())) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid event date format' 
      });
    }

    // Validate start and end time
    if (startTimeObj >= endTimeObj) {
      return res.status(400).json({ 
        success: false,
        error: 'End time must be later than start time' 
      });
    }

    // Define requestedDay from eventDate
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const requestedDay = daysOfWeek[eventDateObj.getUTCDay()];

    // Find all the booked halls that overlap with the requested time slot
    const overlapQuery = {
      isApproved: { $in: ["Approved By Admin", "Request Sent"] }, // Only consider active bookings
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
    };

    // Get the list of all hall IDs that are booked using distinct to avoid loading documents
    const bookedHallIds = await Booking.distinct('bookedHallId', overlapQuery);

    // Find halls that are not booked in the requested time slot
    const availableHalls = await Hall.find({
      _id: { $nin: bookedHallIds }
    })
    .select('name location capacity amenities description') // Only select necessary fields
    .sort({ name: 1 }) // Sort alphabetically for better UX
    .lean(); // Use lean() for better performance

    if (availableHalls.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No halls available for the selected date and time',
        count: 0,
        availableHalls: []
      });
    }

    res.status(200).json({ 
      success: true,
      availableHalls,
      count: availableHalls.length,
      message: "Available halls fetched successfully",
      requestedDate: eventDate,
      requestedTime: `${startTime} - ${endTime}`,
      requestedDay
    });
  } catch (error) {
    console.error('Error fetching available halls:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    });
  }
};


// Debug function to test overlap queries
const debugOverlap = async (req, res) => {
  try {
    const { eventDate, startTime, endTime, bookedHallId } = req.body;
    
    console.log("Debug overlap request:", { eventDate, startTime, endTime, bookedHallId });
    
    if (!eventDate || !startTime || !endTime || !bookedHallId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }
    
    const eventDateObj = new Date(eventDate);
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const requestedDay = daysOfWeek[eventDateObj.getUTCDay()];
    
    // Simple overlap check using existing data format
    const existingBookings = await Booking.find({
      bookedHallId: bookedHallId,
      isApproved: { $in: ["Approved By Admin", "Request Sent"] }
    });
    
    let hasOverlap = false;
    let overlappingDetails = [];
    
    for (const existing of existingBookings) {
      if (existing.day === requestedDay || (!existing.day && existing.eventDate && existing.eventDate.toDateString() === eventDateObj.toDateString())) {
        if (existing.startTime && existing.endTime && startTime && endTime) {
          // Simple time string comparison
          if (startTime < existing.endTime && endTime > existing.startTime) {
            hasOverlap = true;
            overlappingDetails.push({
              id: existing._id,
              day: existing.day,
              eventDate: existing.eventDate,
              startTime: existing.startTime,
              endTime: existing.endTime,
              isApproved: existing.isApproved
            });
          }
        }
      }
    }
    
    res.json({
      success: true,
      hasOverlap,
      overlappingDetails,
      count: overlappingDetails.length,
      requestedDay,
      requestedDate: eventDate,
      requestedTime: `${startTime} - ${endTime}`,
      totalBookingsChecked: existingBookings.length
    });
    
  } catch (error) {
    console.error('Debug overlap error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = { upload, createBooking, getBookings, getBookingById, updateBooking, deleteBooking, getBookingByUserId, getEvents, getBookingAdmin, getalllt, debugOverlap };
