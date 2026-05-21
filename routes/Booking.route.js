const express = require('express');
const { createBooking, GetAllBookings, GetAvailableSlots, GetHallBookingsProvider, GetBookingDetails, GetMyBookings, CancelBooking, GetBookingsByHall, UpcomingBookings } = require('../controllers/Booking.controller');
const authentication = require('../middleware/Authentication');
const authorization = require('../middleware/Authorization');

const BookingRouter = express.Router();

BookingRouter.post('/createBooking/:id',authentication,authorization('user'),createBooking);

BookingRouter.get('/all',authentication,authorization('admin'),GetAllBookings);

BookingRouter.get('/available-slots/:hallId',GetAvailableSlots);

BookingRouter.get('/provider/bookings',authentication,authorization('provider'),GetHallBookingsProvider);

BookingRouter.get('/myBookings',authentication,authorization('user'),GetMyBookings);

BookingRouter.patch('/cancel/:bookingId',authentication,authorization('user','admin'),CancelBooking);

BookingRouter.get('/:id',authentication,authorization('user', 'provider', 'admin'),GetBookingDetails);

BookingRouter.get('/hall/:hallId',authentication,authorization('provider'),GetBookingsByHall);

BookingRouter.get('/upcoming/:hallId',authentication,authorization('provider'),UpcomingBookings);
module.exports = BookingRouter