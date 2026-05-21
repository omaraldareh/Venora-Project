const Book = require('../models/Booking.model');
const Hall = require('../models/Hall.model');
const mongoose = require('mongoose');

const createBooking = async (req, res) => {

    const { bookingDate, slot } = req.body;

    try {

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid hall ID"
            });
        }

        if (
            !bookingDate ||
            !slot ||
            !slot.startTime ||
            !slot.endTime
        ) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

        if (
            !timeRegex.test(slot.startTime) ||
            !timeRegex.test(slot.endTime)
        ) {
            return res.status(400).json({
                message: "Invalid time format. Use HH:mm"
            });
        }

        const start = new Date(`1970-01-01T${slot.startTime}:00`);
        const end = new Date(`1970-01-01T${slot.endTime}:00`);

        if (end <= start) {
            return res.status(400).json({
                message: "End time must be after start time"
            });
        }

        const normalizedDate = new Date(bookingDate);
        normalizedDate.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (normalizedDate < today) {
            return res.status(400).json({
                message: "Cannot book past dates"
            });
        }

        const bookingDateTime = new Date(bookingDate);

        const [hours, minutes] = slot.startTime.split(":");

        bookingDateTime.setHours(hours, minutes, 0, 0);

        const now = new Date();

        if (bookingDateTime < now) {
            return res.status(400).json({
                message: "Cannot book past time slots"
            });
        }

        const diffInHours =
            (bookingDateTime - now) / (1000 * 60 * 60);

        if (diffInHours < 2) {
            return res.status(400).json({
                message:
                    "Bookings must be made at least 2 hours in advance"
            });
        }

        const hall = await Hall.findById(req.params.id);

        if (!hall) {
            return res.status(404).json({
                message: "Hall not found"
            });
        }

        if (hall.status !== "approved") {
            return res.status(400).json({
                message: "Hall is not approved"
            });
        }

        // Check Selected Slot Exists
        const selectedSlot = hall.availableSlots.find((s) => {
            return (s.startTime === slot.startTime && s.endTime === slot.endTime);
        });

        if (!selectedSlot) {
            return res.status(400).json({
                message: "Selected slot does not exist"
            });
        }

        const existingBooking = await Book.findOne({
            hall: hall._id,
            bookingDate: normalizedDate,
            "slot.startTime": slot.startTime,
            "slot.endTime": slot.endTime,
            status: { $ne: "cancelled" }
        });

        if (existingBooking) {
            return res.status(400).json({
                message:
                    "This slot is already booked for the selected date"
            });
        }

        const newBooking = new Book({
            user: req.user.id,
            hall: hall._id,
            bookingDate: normalizedDate,
            slot: {
                startTime: slot.startTime,
                endTime: slot.endTime
            },
            totalPrice: selectedSlot.price
        });

        await newBooking.save();

        await newBooking.populate("user", "name email");
        await newBooking.populate("hall","name location images");

        return res.status(201).json({
            message: "Booking created successfully",
            booking: newBooking
        });

    } catch (error) {

        if (error.code === 11000) {
            return res.status(400).json({
                message: "This slot is already booked"
            });
        }

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

const GetMyBookings = async (req, res) => {
    try {
        const bookings = await Book.find({ user: req.user.id }).populate("hall", "name location images price");

        return res.status(200).json({
            message: "Bookings fetched successfully",
            data: bookings
        });
    } catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
}

const GetBookingDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const booking = await Book.findById(id).populate("hall");

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        return res.status(200).json({
            message: "Booking fetched successfully",
            data: booking
        });
    } catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
}

const CancelBooking = async (req, res) => {

    const { bookingId } = req.params;

    try {

        if (!bookingId) {
            return res.status(400).json({
                message: "Booking id is required"
            });
        }

        const booking = await Book.findById(bookingId);

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        // Check booking owner
        if (booking.user.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You are not allowed to cancel this booking"
            });
        }

        // Already cancelled
        if (booking.status === "cancelled") {
            return res.status(400).json({
                message: "Booking already cancelled"
            });
        }

        // Booking datetime
        const bookingDateTime = new Date(booking.bookingDate);

        const [hours, minutes] =
            booking.slot.startTime.split(":");

        bookingDateTime.setHours(hours, minutes, 0, 0);

        const now = new Date();

        // Difference in hours
        const diffInHours =
            (bookingDateTime - now) / (1000 * 60 * 60);

        // Prevent cancellation within 24 hours
        if (diffInHours < 24) {
            return res.status(400).json({
                message:
                    "Bookings cannot be cancelled less than 24 hours before start time"
            });
        }

        booking.status = "cancelled";

        await booking.save();

        return res.status(200).json({
            message: "Booking cancelled successfully"
        });

    } catch (error) {

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });

    }
};

 const GetHallBookingsProvider = async (req, res) => {

    try {

        const halls = await Hall.find({
            provider: req.user.id
        });

        const hallIds = halls.map(hall => hall._id);

        const bookings = await Book.find({
            hall: { $in: hallIds }
        })
        .populate("hall", "name location images")
        .populate("user", "name email phone");

        return res.status(200).json({
            message: "Bookings fetched successfully",
            data: bookings
        });

    } catch (error) {

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });

    }
}

const GetAvailableSlots = async (req, res) => {

    const { hallId } = req.params;
    const { date } = req.query;

    try {

        if (!date) {
            return res.status(400).json({
                message: "Date is required"
            });
        }

        const hall = await Hall.findById(hallId);

        if (!hall) {
            return res.status(404).json({
                message: "Hall not found"
            });
        }

        const normalizedDate = new Date(date);
        normalizedDate.setHours(0,0,0,0);

        const bookings = await Book.find({
            hall: hallId,
            bookingDate: normalizedDate,
            status: "confirmed"
        });

        const bookedSlots = bookings.map((booking) => ({
            startTime: booking.slot.startTime,
            endTime: booking.slot.endTime
        }));

        const availableSlots = hall.availableSlots.filter((slot) => {

            const isBooked = bookedSlots.some((booked) =>
                booked.startTime === slot.startTime &&
                booked.endTime === slot.endTime
            );

            return !isBooked;
        });

        return res.status(200).json({
            message: "Available slots fetched successfully",
            data: availableSlots
        });

    } catch (error) {

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });

    }

}

const GetAllBookings = async (req, res) => {

    try {

        const bookings = await Book.find()
        .populate("user", "name email")
        .populate("hall", "name");

        return res.status(200).json({
            message: "Bookings fetched successfully",
            data: bookings
        });

    } catch (error) {

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });

    }

}

const GetBookingsByHall = async (req,res) => {
    const {hallId} = req.params;

    try {
        const hall = await Hall.findById(hallId);
        
        if (!hall) {
            return res.status(404).json({
                message: "Hall not found"
            });
        }

        if (hall.provider.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You are not allowed to view these bookings"
            });
        }


        const bookings = await Book.find({hall: hallId }).populate("user","-password").populate("hall","-__v");

        if (!bookings) {
            return res.status(404).json({
                message: "No Bookings found for The this Hall"
            });
        }

        if (bookings.length === 0) {
            return res.status(200).json({
                message: "No bookings found for this hall",
                data: []
            });
        }

        return res.status(200).json({
            message: "Bookings fetched successfully",
            data: bookings
        });
    } catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
}

const UpcomingBookings = async (req, res) => {

    const { hallId } = req.params;

    try {

        const hall = await Hall.findById(hallId);

        if (!hall) {
            return res.status(404).json({
                message: "Hall not found"
            });
        }

        if (hall.provider.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You are not allowed to view these bookings"
            });
        }

        const today = new Date();
        today.setHours(0,0,0,0);

        const bookings = await Book.find({hall: hallId,bookingDate: { $gte: today },status: "confirmed"})
        .populate("user", "name email phone").populate("hall", "name location").sort({ bookingDate: 1 });

        return res.status(200).json({
            message: "Upcoming bookings fetched successfully",
            data: bookings
        });

    } catch (error) {

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });

    }

}

module.exports = 
{createBooking,
 GetMyBookings,
 GetBookingDetails,
 CancelBooking,
 GetHallBookingsProvider,
 GetAvailableSlots,
 GetAllBookings,
 GetBookingsByHall,
 UpcomingBookings
};