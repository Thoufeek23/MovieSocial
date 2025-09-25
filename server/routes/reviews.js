const express = require('express');
const router = express.Router();
const { createReview, getFeedReviews, getMovieReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, createReview);
router.route('/feed').get(protect, getFeedReviews);
router.route('/movie/:movieId').get(getMovieReviews);

module.exports = router;