const express = require('express');

const authentication = require('../middleware/Authentication');
const authorization = require('../middleware/Authorization');
const { createReview, getHallReviews, UpdateReview, deleteReview, MyReviews } = require('../controllers/Review.controller');

const ReviewRouter = express.Router();

ReviewRouter.post('/createReview/:hallId',authentication,authorization('user'),createReview);
ReviewRouter.get('/HallReviews/:hallId', getHallReviews);
ReviewRouter.put('/updateReview/:reviewId',authentication,authorization('user'),UpdateReview);
ReviewRouter.delete('/deleteReview/:reviewId',authentication,authorization('user'),deleteReview);
ReviewRouter.get('/myReviews',authentication,authorization('user'),MyReviews);
module.exports = ReviewRouter