const express = require('express');
const router = express.Router();
const { 
    createReview, 
    getMyReviews,
    getFeedReviews, 
    getMovieReviews, 
    getMovieStats,
    updateReview, 
    deleteReview 
} = require('../controllers/reviewController');
const { voteReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createReview);

router.route('/feed')
    .get(protect, getFeedReviews);

router.route('/mine')
    .get(protect, getMyReviews);

router.route('/movie/:movieId')
    .get(getMovieReviews);

// Movie stats (MovieSocial weighted rating + count)
router.route('/movie/:movieId/stats')
    .get(getMovieStats);

// Add the new PUT and DELETE routes
router.route('/:id')
    .put(protect, updateReview)
    .delete(protect, deleteReview);

// Vote on a review (agree/partially/disagree)
router.route('/:id/vote')
    .post(protect, voteReview);

module.exports = router;