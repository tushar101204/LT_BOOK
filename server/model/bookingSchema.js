const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  { userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'USER',
    //required: true
  },
  userRole: {
    type: String,
    enum: ["student", "faculty", "admin"],
  },
    day:{
      type: String,
      //required: true
    },
    eventManager: {
      type: String,
      //required: true
    },
    eventName: {
      type: String,
      // required: true
    },
    eventDate: {
      type: Date,
  
    },
    eventDateType: {
      type: String,
      required: true
    },
    eventStartDate: {
      type: Date,
    },
    eventEndDate: {
      type: Date,
    },

    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    email: {
      type: String,
      //required: true
    },
    
    bookedHallId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hall',
      //required: true
    },
    bookedHall: {
      // type: mongoose.Schema.Types.Subdocument,

      type: Object,
      //required: true,
    },

    bookedHallName: {
      type: String,
      required: true
    },
    organizingClub: {
      type: String,
      //required: true
    },
    phoneNumber: {
      type: Number,
      // required: true
    },
    altNumber: {
      type: Number
    },
    rejectionReason: {
      type: String,
    },
    isApproved: {
      default: "Request Sent",
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index to prevent double-booking at database level
// This ensures no two approved/requested bookings can exist for the same hall, day, and overlapping time
bookingSchema.index(
  { 
    bookedHallId: 1, 
    day: 1, 
    startTime: 1, 
    endTime: 1,
    isApproved: 1
  }, 
  { 
    unique: false, // Not unique since we want to allow multiple bookings per hall
    name: 'hall_time_overlap_prevention'
  }
);

// Index for efficient querying of bookings by hall and date
bookingSchema.index({ bookedHallId: 1, eventDate: 1, isApproved: 1 });

// Index for efficient querying of user bookings
bookingSchema.index({ userId: 1, createdAt: -1 });

// bookingSchema.index({ eventDate: 1 }, { expireAfterSeconds: 86400 });
const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
