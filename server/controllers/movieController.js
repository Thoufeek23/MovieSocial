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
        // Request external_ids along with movie details so we can find imdb_id
        // Request external_ids and videos so the client can show IMDb/YouTube trailer info
        const { data } = await axios.get(`${TMDB_API_BASE_URL}/movie/${id}`, {
            params: { api_key: TMDB_API_KEY, append_to_response: 'external_ids,videos' },
        });

        // Attempt to fetch IMDb rating via OMDb if API key is available
        const OMDB_API_KEY = process.env.OMDB_API_KEY;
        let imdbRating = null;
        let imdbRatingSource = null;

        const imdbId = data?.external_ids?.imdb_id;
        if (OMDB_API_KEY && imdbId) {
            try {
                const omdbRes = await axios.get('http://www.omdbapi.com/', {
                    params: { apikey: OMDB_API_KEY, i: imdbId }
                });
                if (omdbRes.data && omdbRes.data.imdbRating && omdbRes.data.imdbRating !== 'N/A') {
                    imdbRating = omdbRes.data.imdbRating;
                    imdbRatingSource = 'OMDb';
                }
            } catch (err) {
                // If OMDb fails, we'll fall back to TMDb vote_average below
                console.warn('OMDb fetch failed', err?.message || err);
            }
        }

        // Fallback to TMDb vote_average if no OMDb rating found
        if (!imdbRating && typeof data.vote_average !== 'undefined') {
            imdbRating = data.vote_average;
            imdbRatingSource = 'TMDb';
        }

        // Attach rating info to the response object
        data.imdbRating = imdbRating;
        data.imdbRatingSource = imdbRatingSource;

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