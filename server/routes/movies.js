const express = require('express');
const router = express.Router();
const { searchMovies, getMovieDetails, getPopularMovies } = require('../controllers/movieController');

router.get('/search', searchMovies);
router.get('/popular', getPopularMovies);
router.get('/:id', getMovieDetails);

module.exports = router;