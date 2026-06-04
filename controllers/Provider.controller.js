const Book = require("../models/Booking.model");
const Hall = require("../models/Hall.model");
const Review = require("../models/Reviews.model");
const mongoose = require("mongoose");

const ProviderBookings = async (req, res) => {
    try {

        const hall = await Hall.find({ provider: req.user.id });

        const hallIds = hall.map(hall => hall._id);

        const bookings = await Book.find({hall: { $in: hallIds }}).populate("hall", "name location images")
        .populate("user", "name email phone");
        

        return res.status(200).json({
            message: "Bookings fetched successfully",
            results: bookings.length,
            data: bookings
        })
    } catch (error) {
        return res.status(500).json({
            error: error.message
        })
    }
}

const ProviderHalls = async (req, res) => {
    try {
        const halls = await Hall.find({ provider: req.user.id });

        if(halls.length === 0) {
            return res.status(200).json({
                message: "No Halls Added"
            })
        }

        return res.status(200).json({
            message: "Halls fetched successfully",
            results: halls.length,
            data: halls
        })
    } catch (error) {
        return res.status(500).json({
            error: error.message
        })
    }
}

const ProviderReviews = async (req, res) => {

    try {

        const halls = await Hall.find({
            provider: req.user.id
        });

        const hallIds = halls.map(hall => hall._id);

        const reviews = await Review.find({
            hall: { $in: hallIds }
        })
        .populate("hall", "name images")
        .populate("user", "name email");

        return res.status(200).json({
            message: "Provider reviews fetched successfully",
            results: reviews.length,
            data: reviews
        });

    } catch (error) {

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });

    }
};

const ProviderStatistics = async (req, res) => {
    try {
        const providerHalls = await Hall.find({ provider: req.user.id });
        const hallIds = providerHalls.map(hall => hall._id);
        
        const localToday = new Date();       
        
        const utcToday = new Date(Date.UTC(
            localToday.getFullYear(),
            localToday.getMonth(),
            localToday.getDate(),
            0, 0, 0, 0
        ));

        const hallsNumber = providerHalls.length;

        const bookingsNumber = await Book.countDocuments({ hall: { $in: hallIds } });
        
        const reviewsNumber = await Review.countDocuments({ hall: { $in: hallIds } });

        const upcomingBookingsNumber = await Book.countDocuments({ 
            hall: { $in: hallIds }, 
            status: "confirmed",
            bookingDate: { $gte: utcToday } 
        });

        
        const completedBookingsNumber = await Book.countDocuments({ 
            hall: { $in: hallIds }, 
            status: "confirmed",
            bookingDate: { $lt: utcToday } 
        });
        
        const avgRatingResult = await Review.aggregate([
            { $match: { hall: { $in: hallIds } } },
            { $group: { _id: null, avgRating: { $avg: "$rating" } } }
        ]);

        const avgRating = avgRatingResult.length > 0 ? avgRatingResult[0].avgRating : 0;


        return res.status(200).json({
            message: "Statistics fetched successfully",
            data: {
                hallsNumber,
                bookingsNumber,
                reviewsNumber,
                upcomingBookingsNumber,   
                completedBookingsNumber,  
                avgRating: Number(avgRating.toFixed(1)) 
            }
        });

    } catch (error) {
        return res.status(500).json({
            error: error.message
        });
    }
}

module.exports = {
     ProviderBookings,
     ProviderHalls,
     ProviderReviews,
     ProviderStatistics
     }