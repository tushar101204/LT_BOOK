const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  hallId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hall',
    required: true
  },
  date: {
    type: String,
    required: true,
    format: 'YYYY-MM-DD'
  },
  slot: {
    type: Number,
    required: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Unique compound index to prevent double-booking at database level
reservationSchema.index({ hallId: 1, date: 1, slot: 1 }, { unique: true });

// Index for efficient querying by date and slots
reservationSchema.index({ date: 1, slot: 1 });

// Index for cleanup operations
reservationSchema.index({ bookingId: 1 });

// Optional TTL index for temporary holds (120 seconds)
reservationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 120 });

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation;
