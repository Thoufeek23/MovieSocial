const axios = require('axios');

const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

// @desc    Search for movies on TMDb
// @route   GET /api/movies/search
const searchMovies = async (req, res) => {
    const { query } = req.query;
    try {
        const { data } = await axios.get(`${TMDB_API_BASE_URL}/search/movie`, {
            params: { api_key: TMDB_API_KEY, query },
        });
        res.json(data);
    } catch (err) {
        res.status(500).json({ msg: 'Error fetching from TMDb API' });
    }
};

// @desc    Get details for a specific movie from TMDb
// @route   GET /api/movies/:id
const getMovieDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const { data } = await axios.get(`${TMDB_API_BASE_URL}/movie/${id}`, {
            params: { api_key: TMDB_API_KEY },
        });
        res.json(data);
    } catch (err) {
        res.status(500).json({ msg: 'Error fetching movie details' });
    }
};

// @desc    Get popular movies from TMDb
// @route   GET /api/movies/popular
const getPopularMovies = async (req, res) => {
     try {
        const { data } = await axios.get(`${TMDB_API_BASE_URL}/movie/popular`, {
            params: { api_key: TMDB_API_KEY },
        });
        res.json(data);
    } catch (err) {
        res.status(500).json({ msg: 'Error fetching popular movies' });
    }
};


module.exports = {
    searchMovies,
    getMovieDetails,
    getPopularMovies
};