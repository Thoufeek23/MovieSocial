const axios = require('axios');

const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const cache = require('../utils/cache');
// Toggle to avoid repeated OMDb calls after a known-bad key
let OMDB_ENABLED = !!process.env.OMDB_API_KEY;

// @desc    Search for movies on TMDb
// @route   GET /api/movies/search
const searchMovies = async (req, res) => {
    const { query } = req.query;
    try {
        const { data } = await axios.get(`${TMDB_API_BASE_URL}/search/movie`, {
            params: { api_key: TMDB_API_KEY, query },
        });
        // Optionally enrich with OMDb IMDb ratings per result if we have an OMDb API key
        const OMDB_API_KEY = process.env.OMDB_API_KEY;
        if (OMDB_ENABLED && OMDB_API_KEY && Array.isArray(data.results) && data.results.length > 0) {
            await Promise.all(data.results.map(async (m) => {
                try {
                    const title = m.title || m.original_title;
                    const year = m.release_date ? m.release_date.substring(0,4) : undefined;
                    // Try cache first (key by title|year)
                    const key = `omdb:t:${title}|y:${year}`;
                    const cached = cache.get(key);
                    if (cached) {
                        m.imdbRating = cached.imdbRating;
                        m.imdbRatingSource = cached.imdbRatingSource;
                    } else {
                        const omdbRes = await axios.get('http://www.omdbapi.com/', { params: { apikey: OMDB_API_KEY, t: title, y: year } });
                        if (omdbRes.data && omdbRes.data.imdbRating && omdbRes.data.imdbRating !== 'N/A') {
                            m.imdbRating = omdbRes.data.imdbRating;
                            m.imdbRatingSource = 'OMDb';
                            cache.set(key, { imdbRating: m.imdbRating, imdbRatingSource: m.imdbRatingSource });
                        } else if (typeof m.vote_average !== 'undefined') {
                            m.imdbRating = m.vote_average;
                            m.imdbRatingSource = 'TMDb';
                        }
                    }
                } catch (e) {
                    // Log OMDb errors to help debugging (include status and body if present)
                    try {
                        console.warn('OMDb item fetch failed', e.response?.status, e.response?.data || e.message);
                        // If we get a 401 Unauthorized, disable OMDb enrichment for the lifetime of this process
                        if (e.response?.status === 401 || (e.response?.data && typeof e.response.data.Error === 'string' && e.response.data.Error.toLowerCase().includes('invalid api key'))) {
                            OMDB_ENABLED = false;
                            console.warn('OMDb appears to be disabled due to invalid API key. Further OMDb calls will be skipped until server restart.');
                        }
                    } catch (logErr) {
                        console.warn('OMDb item fetch failed (logging error)', e.message || e);
                    }
                    // ignore per-item failures and fallback
                    if (typeof m.vote_average !== 'undefined') {
                        m.imdbRating = m.vote_average;
                        m.imdbRatingSource = 'TMDb';
                    }
                }
            }));
        } else {
            // No OMDb key; fall back to TMDb rating for each result
            if (Array.isArray(data.results)) {
                data.results.forEach(m => {
                    if (typeof m.vote_average !== 'undefined') {
                        m.imdbRating = m.vote_average;
                        m.imdbRatingSource = 'TMDb';
                    }
                });
            }
        }

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
        if (OMDB_ENABLED && OMDB_API_KEY && imdbId) {
            try {
                // Try cache by imdb id first
                const key = `omdb:i:${imdbId}`;
                const cached = cache.get(key);
                if (cached) {
                    imdbRating = cached.imdbRating;
                    imdbRatingSource = cached.imdbRatingSource;
                } else {
                    const omdbRes = await axios.get('http://www.omdbapi.com/', {
                        params: { apikey: OMDB_API_KEY, i: imdbId }
                    });
                    if (omdbRes.data && omdbRes.data.imdbRating && omdbRes.data.imdbRating !== 'N/A') {
                        imdbRating = omdbRes.data.imdbRating;
                        imdbRatingSource = 'OMDb';
                        cache.set(key, { imdbRating, imdbRatingSource });
                    }
                }
            } catch (err) {
                // If OMDb fails, we'll fall back to TMDb vote_average below
                try {
                    console.warn('OMDb fetch failed', err.response?.status, err.response?.data || err.message);
                    if (err.response?.status === 401 || (err.response?.data && typeof err.response.data.Error === 'string' && err.response.data.Error.toLowerCase().includes('invalid api key'))) {
                        OMDB_ENABLED = false;
                        console.warn('OMDb appears to be disabled due to invalid API key. Further OMDb calls will be skipped until server restart.');
                    }
                } catch (logErr) {
                    console.warn('OMDb fetch failed (logging error)', err.message || err);
                }
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
        const OMDB_API_KEY = process.env.OMDB_API_KEY;
        if (OMDB_ENABLED && OMDB_API_KEY && Array.isArray(data.results) && data.results.length > 0) {
            await Promise.all(data.results.map(async (m) => {
                try {
                    const title = m.title || m.original_title;
                    const year = m.release_date ? m.release_date.substring(0,4) : undefined;
                    // try cache first
                    const key = `omdb:t:${title}|y:${year}`;
                    const cached = cache.get(key);
                    if (cached) {
                        m.imdbRating = cached.imdbRating;
                        m.imdbRatingSource = cached.imdbRatingSource;
                    } else {
                        const omdbRes = await axios.get('http://www.omdbapi.com/', { params: { apikey: OMDB_API_KEY, t: title, y: year } });
                        if (omdbRes.data && omdbRes.data.imdbRating && omdbRes.data.imdbRating !== 'N/A') {
                            m.imdbRating = omdbRes.data.imdbRating;
                            m.imdbRatingSource = 'OMDb';
                            cache.set(key, { imdbRating: m.imdbRating, imdbRatingSource: m.imdbRatingSource });
                        } else if (typeof m.vote_average !== 'undefined') {
                            m.imdbRating = m.vote_average;
                            m.imdbRatingSource = 'TMDb';
                        }
                    }
                } catch (e) {
                    try {
                        console.warn('OMDb item fetch failed', e.response?.status, e.response?.data || e.message);
                        if (e.response?.status === 401 || (e.response?.data && typeof e.response.data.Error === 'string' && e.response.data.Error.toLowerCase().includes('invalid api key'))) {
                            OMDB_ENABLED = false;
                            console.warn('OMDb appears to be disabled due to invalid API key. Further OMDb calls will be skipped until server restart.');
                        }
                    } catch (logErr) {
                        console.warn('OMDb item fetch failed (logging error)', e.message || e);
                    }
                    if (typeof m.vote_average !== 'undefined') {
                        m.imdbRating = m.vote_average;
                        m.imdbRatingSource = 'TMDb';
                    }
                }
            }));
        } else {
            if (Array.isArray(data.results)) {
                data.results.forEach(m => {
                    if (typeof m.vote_average !== 'undefined') {
                        m.imdbRating = m.vote_average;
                        m.imdbRatingSource = 'TMDb';
                    }
                });
            }
        }

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