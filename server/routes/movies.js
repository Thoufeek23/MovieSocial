const express = require('express');
const router = express.Router();
const { searchMovies, getMovieDetails, getPopularMovies, getPersonalizedMovies } = require('../controllers/movieController');
const { protect } = require('../middleware/authMiddleware');

router.get('/search', searchMovies);
router.get('/popular', getPopularMovies);
router.get('/personalized', protect, getPersonalizedMovies);
router.get('/:id', getMovieDetails);

module.exports = router;