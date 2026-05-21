const Review = require('../models/Reviews.model');
const mongoose = require('mongoose');
const Hall = require('../models/Hall.model');

const createReview = async (req, res) => {

    const { rating, comment } = req.body;
    const { hallId } = req.params;

    try {

        if (!mongoose.Types.ObjectId.isValid(hallId)) {
            return res.status(400).json({
                message: "Invalid hall ID"
            });
        }

        if (!rating) {
            return res.status(400).json({
                message: "Rating is required"
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                message: "Rating must be between 1 and 5"
            });
        }

        const hall = await Hall.findById(hallId);

        if (!hall) {
            return res.status(404).json({
                message: "Hall not found"
            });
        }

        const existingReview = await Review.findOne({
            user: req.user.id,
            hall: hallId
        });

        if (existingReview) {
            return res.status(400).json({
                message: "You already reviewed this hall"
            });
        }

        const review = await Review.create({user: req.user.id,hall: hallId,rating,comment: comment || ""});

        const reviews = await Review.find({ hall: hallId });

        const totalRatings = reviews.reduce((acc, item) => {return acc + item.rating;}, 0);

        const averageRating =totalRatings / reviews.length;

        hall.rating = Number(averageRating.toFixed(1));
        hall.reviewsCount = reviews.length;

        await hall.save();

        await review.populate("user", "name email");
        await review.populate("hall", "name");

        return res.status(201).json({
            message: "Review created successfully",
            data: review
        });

    } catch (error) {

        if (error.code === 11000) {
            return res.status(400).json({
                message: "You already reviewed this hall"
            });
        }

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });

    }
};

const getHallReviews = async (req, res) => {
    const { hallId } = req.params;
    try {
        if(!hallId) {
            return res.status(400).json({
                message: "Hall ID is required"
            });
        }

        const reviews = await Review.find({ hall: hallId }).populate("user", "name email").populate("hall", "name");
        return res.status(200).json({
            message: "Hall reviews fetched successfully",
            data: reviews
        });
    } catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
}

const UpdateReview = async (req, res) => {

    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    try {

        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            return res.status(400).json({
                message: "Invalid review ID"
            });
        }

        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({
                message: "Review not found"
            });
        }

        if (review.user.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You are not allowed to update this review"
            });
        }

        if (rating && (rating < 1 || rating > 5)) {
            return res.status(400).json({
                message: "Rating must be between 1 and 5"
            });
        }

        const updatedReview = await Review.findByIdAndUpdate(
            reviewId,
            {
                rating,
                comment
            },
            {
                new: true,
                runValidators: true
            }
        )
        .populate("user", "name email")
        .populate("hall", "name");

        // تحديث متوسط التقييم
        const reviews = await Review.find({
            hall: review.hall
        });

        const totalRatings = reviews.reduce((acc, item) => {
            return acc + item.rating;
        }, 0);

        const averageRating = totalRatings / reviews.length;

        await Hall.findByIdAndUpdate(review.hall, {
            rating: Number(averageRating.toFixed(1)),
            reviewsCount: reviews.length
        });

        return res.status(200).json({
            message: "Review updated successfully",
            data: updatedReview
        });

    } catch (error) {

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });

    }

};

const deleteReview = async (req, res) => {

    const { reviewId } = req.params;

    try {

        if (!mongoose.Types.ObjectId.isValid(reviewId)) {
            return res.status(400).json({
                message: "Invalid review ID"
            });
        }

        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({
                message: "Review not found"
            });
        }

        if (review.user.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You are not allowed to delete this review"
            });
        }

        await Review.findByIdAndDelete(reviewId);

        const reviews = await Review.find({
            hall: review.hall
        });

        let averageRating = 0;

        if (reviews.length > 0) {

            const totalRatings = reviews.reduce((acc, item) => {
                return acc + item.rating;
            }, 0);

            averageRating = totalRatings / reviews.length;
        }

        await Hall.findByIdAndUpdate(review.hall, {
            rating: Number(averageRating.toFixed(1)),
            reviewsCount: reviews.length
        });

        return res.status(200).json({
            message: "Review deleted successfully"
        });

    } catch (error) {

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });

    }

};


const MyReviews = async (req, res) => {

    try {

        const reviews = await Review.find({
            user: req.user.id
        })
        .populate("hall", "name images location rating")
        .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "My reviews fetched successfully",
            count: reviews.length,
            data: reviews
        });

    } catch (error) {

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });

    }

};

module.exports = { 
    createReview
    ,getHallReviews
    ,UpdateReview
    ,deleteReview
    ,MyReviews
 };