const mongoose = require('mongoose');
const Booking = require('../model/bookingSchema');
const Hall = require('../model/hallSchema');
const User = require('../model/userSchema');
const Reservation = require('../models/reservation');
const { isoToMinutesSinceMidnightUTC, getSlotNumbersFromISOs, toDateStringYYYYMMDD } = require('../utils/slots');
const nodemailer = require("nodemailer");
const xlsx = require('xlsx');
const { parseISO } = require('date-fns');
const mailSender = require("../utills/mailSender");
const bookingRequestTemplate = require("../template/bookingRequestTemplate");
const bookingApprovalTemplate = require("../template/bookingApprovalTemplate");
const bookingRejectionTemplate = require("../template/bookingRejectionTemplate");

// Slot duration in minutes
const SLOT_MINUTES = 15;



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
          // Add slot information for reservation system
          dateStr: toDateStringYYYYMMDD(eventStartDate),
          slots: getSlotNumbersFromISOs(startTime, endTime, SLOT_MINUTES)
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

    // Save valid bookings to the database and create reservations
    const createdBookings = await Booking.insertMany(validBookings);
    
    // Create reservations for all valid bookings
    const reservationDocs = [];
    for (let i = 0; i < validBookings.length; i++) {
      const booking = validBookings[i];
      const createdBooking = createdBookings[i];
      
      if (booking.slots && booking.dateStr) {
        const bookingReservations = booking.slots.map(slot => ({
          hallId: booking.bookedHallId,
          date: booking.dateStr,
          slot: slot,
          bookingId: createdBooking._id
        }));
        reservationDocs.push(...bookingReservations);
      }
    }
    
    if (reservationDocs.length > 0) {
      try {
        await Reservation.insertMany(reservationDocs, { ordered: true });
      } catch (reservationError) {
        // If reservations fail, cleanup the created bookings
        if (reservationError.code === 11000) {
          await Booking.deleteMany({ _id: { $in: createdBookings.map(b => b._id) } });
          return res.status(409).json({ 
            success: false,
            error: 'Some slots are already reserved. Please check availability and try again.' 
          });
        }
        throw reservationError;
      }
    }

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

    // SLOT-BASED RESERVATION SYSTEM: Prevents double-booking at database level
    // Compute date string and slot numbers for the requested time
    const dateStr = toDateStringYYYYMMDD(eventDate || eventStartDate || eventEndDate);
    
    if (!startTime || !endTime) {
      return res.status(422).json({ 
        success: false,
        error: 'Start time and end time are required for slot-based booking' 
      });
    }
    
    // Get slot numbers covering the requested time range
    const slots = getSlotNumbersFromISOs(startTime, endTime, SLOT_MINUTES);
    
    if (slots.length === 0) {
      return res.status(422).json({ 
        success: false,
        error: 'Invalid time range for slot booking' 
      });
    }
    
    // Build reservation documents for all required slots
    const reservationDocs = slots.map(slot => ({
      hallId: hall._id,
      date: dateStr,
      slot: slot
    }));
    
    let reservationsCreated = false;
    
    try {
      // Attempt to reserve all slots atomically - unique index prevents race conditions
      await Reservation.insertMany(reservationDocs, { ordered: true });
      reservationsCreated = true;
      
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

      await booking.save();
      
      // Link reservations to the booking
      await Reservation.updateMany(
        { hallId: hall._id, date: dateStr, slot: { $in: slots } },
        { $set: { bookingId: booking._id } }
      );
      
      // Send emails based on user type
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
      
    } catch (error) {
      // Handle duplicate key error (slot already reserved)
      if (error.code === 11000) {
        return res.status(409).json({ 
          success: false,
          error: 'Slot already reserved. Please choose a different time or hall.' 
        });
      }
      
      // If reservations were created but booking failed, cleanup reservations
      if (reservationsCreated) {
        await Reservation.deleteMany({ 
          hallId: hall._id, 
          date: dateStr, 
          slot: { $in: slots }, 
          bookingId: null 
        });
      }
      
      throw error;
    }
    
  } catch (error) {
    console.error('Error creating booking:', error);
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

    // TODO: If admin changes date/time, implement logic to release old reservations 
    // and attempt to reserve new slots. For now, require client to delete and re-create 
    // booking if event time changes to avoid complexity.
    // Recommended behavior: Release old reservations, check new slot availability, 
    // reserve new slots if available, otherwise return error.

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

    // Clean up associated reservations
    await Reservation.deleteMany({ bookingId: deletedBooking._id });

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

    // SLOT-BASED AVAILABILITY CHECK: Use reservation system instead of overlap queries
    const dateStr = toDateStringYYYYMMDD(eventDate);
    const slots = getSlotNumbersFromISOs(startTime, endTime, SLOT_MINUTES);
    
    if (slots.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid time range for slot-based availability check' 
      });
    }

    // Find all halls that have reserved slots for the requested time
    const reservedHallIds = await Reservation.find({ 
      date: dateStr, 
      slot: { $in: slots } 
    }).distinct('hallId');

    // Find halls that are not reserved in the requested time slot
    const availableHalls = await Hall.find({
      _id: { $nin: reservedHallIds }
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
      requestedSlots: slots
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


// Debug function to test slot-based reservation system
const debugOverlap = async (req, res) => {
  try {
    const { eventDate, startTime, endTime, bookedHallId } = req.body;
    
    console.log("Debug slot reservation request:", { eventDate, startTime, endTime, bookedHallId });
    
    if (!eventDate || !startTime || !endTime || !bookedHallId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }
    
    // Convert to slot-based system
    const dateStr = toDateStringYYYYMMDD(eventDate);
    const slots = getSlotNumbersFromISOs(startTime, endTime, SLOT_MINUTES);
    
    if (slots.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid time range for slot-based system'
      });
    }
    
    // Check existing reservations for the requested slots
    const existingReservations = await Reservation.find({
      hallId: bookedHallId,
      date: dateStr,
      slot: { $in: slots }
    }).populate('bookingId');
    
    // Check existing bookings for the same hall/date
    const existingBookings = await Booking.find({
      bookedHallId: bookedHallId,
      isApproved: { $in: ["Approved By Admin", "Request Sent"] }
    });
    
    res.json({
      success: true,
      requestedDate: eventDate,
      requestedTime: `${startTime} - ${endTime}`,
      requestedSlots: slots,
      dateStr: dateStr,
      slotMinutes: SLOT_MINUTES,
      existingReservations: existingReservations.map(r => ({
        slot: r.slot,
        bookingId: r.bookingId,
        createdAt: r.createdAt
      })),
      existingBookings: existingBookings.map(b => ({
        id: b._id,
        eventName: b.eventName,
        startTime: b.startTime,
        endTime: b.endTime,
        isApproved: b.isApproved
      })),
      reservationCount: existingReservations.length,
      bookingCount: existingBookings.length,
      slotsAvailable: slots.length - existingReservations.length
    });
    
  } catch (error) {
    console.error('Debug slot reservation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = { upload, createBooking, getBookings, getBookingById, updateBooking, deleteBooking, getBookingByUserId, getEvents, getBookingAdmin, getalllt, debugOverlap };
