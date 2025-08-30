const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { auth, isAdmin, isFaculty } = require("../middleware/authenticate");



// router.get('/bookings', auth, bookingController.getBookings);
router.get('/bookingsAdmin', auth, isAdmin, bookingController.getBookingAdmin);
router.get('/events',  bookingController.getEvents);
router.get('/bookingsView/:bookingId',auth, bookingController.getBookingById);
// router.get('/bookings/:id', bookingController.getBookingById);
router.get('/bookingsFaculty',auth, bookingController.getBookingByUserId);
router.post('/bookings',auth, bookingController.createBooking);
router.put('/bookingsEdit/:bookingId',auth, bookingController.updateBooking);
router.delete('/bookings/:bookingId', bookingController.deleteBooking);
router.post('/showlt', bookingController.getalllt);
router.post('/upload',bookingController.upload);
router.post('/debug-overlap', bookingController.debugOverlap); // Debug endpoint for testing overlap queries


module.exports = router;
