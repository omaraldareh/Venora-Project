const User = require("../models/User.model");
const Hall = require("../models/Hall.model");
const Book = require("../models/Booking.model");
const Review = require("../models/Reviews.model");
const mongoose = require("mongoose");

const pendingHalls = async (req, res) => {
    try {
       const halls = await Hall.find({status: "pending"});

        return res.status(200).json({
            message: "Halls fetched successfully",
            data: halls
        });
    } catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message
        })
    }
}

const ApproveHall = async (req, res) => {
    const { hallId } = req.params; 

    try {
        if(!hallId) {
            return res.status(400).json({
                message: "Hall ID is required"
            });
        }

        const hall = await Hall.findById(hallId);

        if(!hall) {
            return res.status(404).json({
                message: "Hall not found"
            });
        }

        if(hall.status === "approved") {
            return res.status(400).json({
                message: "Hall is already approved"
            });
        }

        hall.status = "approved";
        await hall.save();
        return res.status(200).json({
            message: "Hall approved successfully"
        });

    } catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message
        })
    }
}

const rejectHall = async (req, res) => {
    const { hallId } = req.params;

    try {
        if(!hallId) {
            return res.status(400).json({
                message: "Hall ID is required"
            });
        }

        const hall = await Hall.findById(hallId);

        if(!hall) {
            return res.status(404).json({
                message: "Hall not found"
            });
        }

        if (hall.status === "rejected") {
            return res.status(400).json({
                message: "Hall is already rejected"
            });
        }


        hall.status = "rejected";

        await hall.save();
        return res.status(200).json({
            message: "Hall rejected successfully"
        });

    } catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message
        })
    }
}

const Dashboard = async (req, res) => {
    try {
        const totalUser = await User.countDocuments({role: "user"});
        const totalProviders = await User.countDocuments({role: "provider"});
        const totalHalls = await Hall.countDocuments();
        const totalPendingHalls = await Hall.countDocuments({status: "pending"});
        const totalApprovedHalls = await Hall.countDocuments({status: "approved"});
        const totalRejectedHalls = await Hall.countDocuments({status: "rejected"});
        const totalBookings = await Book.countDocuments();
        const confirmedBookings = await Book.countDocuments({status: "confirmed"});
        const cancelledBookings = await Book.countDocuments({status: "cancelled"});
        const totalReviews = await Review.countDocuments();
        return res.status(200).json({
            message: "Dashboard fetched successfully",
            data: {
                totalUser,
                totalHalls,
                totalPendingHalls,
                totalApprovedHalls,
                totalRejectedHalls,
                totalProviders,
                totalBookings,
                confirmedBookings,
                cancelledBookings,
                totalReviews
            }
        });
    } catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message
        })
    }
}

module.exports = {
    pendingHalls,
    ApproveHall,
    rejectHall,
    Dashboard
};