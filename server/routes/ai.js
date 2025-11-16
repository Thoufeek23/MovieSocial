const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getMovieRecommendations, testAIConnection } = require('../controllers/aiController');

// @route   GET /api/ai/test
// @desc    Test AI service connection
// @access  Private
router.get('/test', protect, testAIConnection);

// @route   POST /api/ai/movie-recommendations
// @desc    Get AI-powered movie recommendations
// @access  Private
router.post('/movie-recommendations', protect, getMovieRecommendations);

module.exports = router;