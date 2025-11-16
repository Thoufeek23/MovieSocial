const axios = require('axios');
const logger = require('../utils/logger');

// Simple concurrency runner to avoid ESM-only dependency: runs async fn over items
// with at most `concurrency` tasks in parallel. Mutates items in place when fn does.
async function runWithConcurrency(items, concurrency, fn) {
    if (!Array.isArray(items) || items.length === 0) return;
    const limit = Math.max(1, Number(concurrency) || 3);
    let idx = 0;
    const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
        while (true) {
            const i = idx++;
            if (i >= items.length) break;
            try {
                // eslint-disable-next-line no-await-in-loop
                await fn(items[i], i);
            } catch (e) {
                // swallow per-item errors; fn should log as needed
            }
        }
    });
    await Promise.all(workers);
}

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
        const logger = require('../utils/logger');
        if (OMDB_ENABLED && OMDB_API_KEY && Array.isArray(data.results) && data.results.length > 0) {
            // Limit concurrent OMDb requests to avoid hitting upstream rate limits.
            // Adjust concurrency as needed via env var OMDB_CONCURRENCY (default 3).
            const concurrency = Number(process.env.OMDB_CONCURRENCY) || 3;

            await runWithConcurrency(data.results, concurrency, async (m) => {
                const title = m.title || m.original_title;
                const year = m.release_date ? m.release_date.substring(0,4) : undefined;
                // Try cache first (key by title|year)
                const key = `omdb:t:${title}|y:${year}`;
                const cached = cache.get(key);
                if (cached) {
                    m.imdbRating = cached.imdbRating;
                    m.imdbRatingSource = cached.imdbRatingSource;
                    return;
                }

                try {
                    const omdbRes = await axios.get('http://www.omdbapi.com/', { params: { apikey: OMDB_API_KEY, t: title, y: year } });
                    if (omdbRes.data && omdbRes.data.imdbRating && omdbRes.data.imdbRating !== 'N/A') {
                        m.imdbRating = omdbRes.data.imdbRating;
                        m.imdbRatingSource = 'OMDb';
                        cache.set(key, { imdbRating: m.imdbRating, imdbRatingSource: m.imdbRatingSource });
                    } else if (typeof m.vote_average !== 'undefined') {
                        m.imdbRating = m.vote_average;
                        m.imdbRatingSource = 'TMDb';
                    }
                } catch (e) {
                    // Log OMDb errors to help debugging (include status, Retry-After and body if present)
                    try {
                        const status = e.response?.status;
                        const retryAfter = e.response?.headers?.['retry-after'];
                        logger.warn('OMDb item fetch failed', status, 'Retry-After:', retryAfter, e.response?.data || e.message);
                        // If 401, disable OMDb enrichment for process lifetime
                        if (status === 401 || (e.response?.data && typeof e.response.data.Error === 'string' && e.response.data.Error.toLowerCase().includes('invalid api key'))) {
                            OMDB_ENABLED = false;
                            logger.warn('OMDb appears to be disabled due to invalid API key. Further OMDb calls will be skipped until server restart.');
                        }
                    } catch (logErr) {
                        logger.warn('OMDb item fetch failed (logging error)', e.message || e);
                    }
                    // ignore per-item failures and fallback
                    if (typeof m.vote_average !== 'undefined') {
                        m.imdbRating = m.vote_average;
                        m.imdbRatingSource = 'TMDb';
                    }
                }
            });
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
                    const omdbRes = await axios.get('http://www.omdbapi.com/', { params: { apikey: OMDB_API_KEY, i: imdbId } });
                    if (omdbRes.data && omdbRes.data.imdbRating && omdbRes.data.imdbRating !== 'N/A') {
                        imdbRating = omdbRes.data.imdbRating;
                        imdbRatingSource = 'OMDb';
                        cache.set(key, { imdbRating, imdbRatingSource });
                    }
                }
            } catch (err) {
                // If OMDb fails, we'll fall back to TMDb vote_average below
                try {
                    const status = err.response?.status;
                    const retryAfter = err.response?.headers?.['retry-after'];
                    logger.warn('OMDb fetch failed', status, 'Retry-After:', retryAfter, err.response?.data || err.message);
                    if (status === 401 || (err.response?.data && typeof err.response.data.Error === 'string' && err.response.data.Error.toLowerCase().includes('invalid api key'))) {
                        OMDB_ENABLED = false;
                        logger.warn('OMDb appears to be disabled due to invalid API key. Further OMDb calls will be skipped until server restart.');
                    }
                } catch (logErr) {
                    logger.warn('OMDb fetch failed (logging error)', err.message || err);
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
            // Limit concurrent OMDb requests for popular list as well
            const concurrency = Number(process.env.OMDB_CONCURRENCY) || 3;

            await runWithConcurrency(data.results, concurrency, async (m) => {
                const title = m.title || m.original_title;
                const year = m.release_date ? m.release_date.substring(0,4) : undefined;
                // try cache first
                const key = `omdb:t:${title}|y:${year}`;
                const cached = cache.get(key);
                if (cached) {
                    m.imdbRating = cached.imdbRating;
                    m.imdbRatingSource = cached.imdbRatingSource;
                    return;
                }
                try {
                    const omdbRes = await axios.get('http://www.omdbapi.com/', { params: { apikey: OMDB_API_KEY, t: title, y: year } });
                    if (omdbRes.data && omdbRes.data.imdbRating && omdbRes.data.imdbRating !== 'N/A') {
                        m.imdbRating = omdbRes.data.imdbRating;
                        m.imdbRatingSource = 'OMDb';
                        cache.set(key, { imdbRating: m.imdbRating, imdbRatingSource: m.imdbRatingSource });
                    } else if (typeof m.vote_average !== 'undefined') {
                        m.imdbRating = m.vote_average;
                        m.imdbRatingSource = 'TMDb';
                    }
                } catch (e) {
                    try {
                        const status = e.response?.status;
                        const retryAfter = e.response?.headers?.['retry-after'];
                        logger.warn('OMDb item fetch failed', status, 'Retry-After:', retryAfter, e.response?.data || e.message);
                        if (status === 401 || (e.response?.data && typeof e.response.data.Error === 'string' && e.response.data.Error.toLowerCase().includes('invalid api key'))) {
                            OMDB_ENABLED = false;
                            logger.warn('OMDb appears to be disabled due to invalid API key. Further OMDb calls will be skipped until server restart.');
                        }
                    } catch (logErr) {
                        logger.warn('OMDb item fetch failed (logging error)', e.message || e);
                    }
                    if (typeof m.vote_average !== 'undefined') {
                        m.imdbRating = m.vote_average;
                        m.imdbRatingSource = 'TMDb';
                    }
                }
            });
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


// @desc    Get personalized movies based on user interests
// @route   GET /api/movies/personalized
const getPersonalizedMovies = async (req, res) => {
    try {
        // Get user interests
        const userId = req.user?.id;
        let userInterests = [];
        
        if (userId) {
            const User = require('../models/User');
            const user = await User.findById(userId).select('interests username');
            userInterests = user?.interests || [];
        }
        
        // If no interests, fall back to popular movies
        if (userInterests.length === 0) {
            return getPopularMovies(req, res);
        }
        
        // Map interests to language codes for TMDB API
        const languageMap = {
            'English': 'en',
            'Hindi': 'hi',
            'Tamil': 'ta',
            'Telugu': 'te',
            'Kannada': 'kn',
            'Malayalam': 'ml',
            'Korean': 'ko',
            'French': 'fr',
            'Spanish': 'es'
        };
        
        
        const languageCodes = userInterests
            .map(interest => languageMap[interest])
            .filter(Boolean);
        
        
        let allMovies = [];
        
        // Strategy 1: Try to get movies in user's preferred languages
        if (languageCodes.length > 0) {
            
            for (const langCode of languageCodes) {
                for (let page = 1; page <= 2; page++) {
                    const params = {
                        api_key: TMDB_API_KEY,
                        page: page,
                        sort_by: 'primary_release_date.desc',
                        'primary_release_date.lte': new Date().toISOString().split('T')[0],
                        'vote_count.gte': 5, // Lowered threshold for regional content
                        with_original_language: langCode
                    };
                    
                    
                    try {
                        const { data } = await axios.get(`${TMDB_API_BASE_URL}/discover/movie`, { params });
                        
                        if (data.results && data.results.length > 0) {
                            // Tag movies with their language for debugging
                            const taggedMovies = data.results.map(movie => ({ 
                                ...movie, 
                                _source: `${langCode}_preferred` 
                            }));
                            allMovies.push(...taggedMovies);
                        }
                    } catch (error) {
                        logger.warn(`Error fetching ${langCode} movies:`, error.message);
                    }
                }
            }
        }
        
        
        // Strategy 2: If we don't have enough movies, add some popular Indian cinema
        if (allMovies.length < 15 && (languageCodes.includes('hi') || languageCodes.includes('ta') || languageCodes.includes('te') || languageCodes.includes('ml') || languageCodes.includes('kn'))) {
            
            const indianLanguages = ['hi', 'ta', 'te', 'ml', 'kn'];
            for (const lang of indianLanguages) {
                const params = {
                    api_key: TMDB_API_KEY,
                    page: 1,
                    sort_by: 'popularity.desc',
                    'primary_release_date.gte': '2020-01-01', // Recent movies
                    'vote_count.gte': 20,
                    with_original_language: lang
                };
                
                try {
                    const { data } = await axios.get(`${TMDB_API_BASE_URL}/discover/movie`, { params });
                    if (data.results && data.results.length > 0) {
                        const taggedMovies = data.results.slice(0, 3).map(movie => ({ 
                            ...movie, 
                            _source: `${lang}_popular` 
                        }));
                        allMovies.push(...taggedMovies);
                    }
                } catch (error) {
                    logger.warn(`Error fetching popular ${lang} movies:`, error.message);
                }
            }
        }
        
        
        // Strategy 3: Final fallback - add some recent popular movies if still not enough
        if (allMovies.length < 10) {
            logger.warn(`Only got ${allMovies.length} movies, adding recent popular movies as fallback...`);
            
            const fallbackParams = {
                api_key: TMDB_API_KEY,
                page: 1,
                sort_by: 'primary_release_date.desc',
                'primary_release_date.lte': new Date().toISOString().split('T')[0],
                'vote_count.gte': 100, // Higher threshold for fallback
                'vote_average.gte': 6.0 // Only good movies
            };
            
            try {
                const fallbackRes = await axios.get(`${TMDB_API_BASE_URL}/discover/movie`, { params: fallbackParams });
                if (fallbackRes.data.results) {
                    const taggedMovies = fallbackRes.data.results.map(movie => ({ 
                        ...movie, 
                        _source: 'fallback_popular' 
                    }));
                    allMovies.push(...taggedMovies);
                }
            } catch (error) {
                logger.error('Error fetching fallback movies:', error.message);
            }
        }
        
        // Shuffle movies to mix languages evenly instead of showing all movies from one language first
        const shuffleArray = (array) => {
            const shuffled = [...array];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        };
        
        // Group movies by language for balanced distribution
        const moviesByLang = {};
        allMovies.forEach(movie => {
            const lang = movie.original_language || 'unknown';
            if (!moviesByLang[lang]) moviesByLang[lang] = [];
            moviesByLang[lang].push(movie);
        });
        
        // Sort movies within each language by popularity/release date
        Object.keys(moviesByLang).forEach(lang => {
            moviesByLang[lang].sort((a, b) => {
                // Primary sort: popularity (higher popularity first)
                const popDiff = (b.popularity || 0) - (a.popularity || 0);
                if (Math.abs(popDiff) > 1) return popDiff;
                
                // Secondary sort: release date (newer first)
                return new Date(b.release_date || '1900-01-01') - new Date(a.release_date || '1900-01-01');
            });
        });
        
        // Create balanced mix by taking movies round-robin from each language
        const sortedMovies = [];
        const languages = Object.keys(moviesByLang);
        const maxMoviesPerLang = Math.ceil(20 / languages.length); // Ensure fair distribution
        let maxRounds = Math.max(...Object.values(moviesByLang).map(movies => movies.length));
        
        for (let round = 0; round < maxRounds && sortedMovies.length < 20; round++) {
            for (const lang of shuffleArray(languages)) { // Shuffle language order each round
                if (sortedMovies.length >= 20) break;
                
                const langMovies = moviesByLang[lang];
                if (round < langMovies.length) {
                    // Only add if this language hasn't exceeded its fair share
                    const currentLangCount = sortedMovies.filter(m => m.original_language === lang).length;
                    if (currentLangCount < maxMoviesPerLang) {
                        sortedMovies.push(langMovies[round]);
                    }
                }
            }
        }
        
        // Fill remaining slots with best remaining movies if needed
        const usedIds = new Set(sortedMovies.map(m => m.id));
        const remainingMovies = allMovies
            .filter(m => !usedIds.has(m.id))
            .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        
        while (sortedMovies.length < 20 && remainingMovies.length > 0) {
            sortedMovies.push(remainingMovies.shift());
        }
        
        // Add OMDb ratings if available
        const OMDB_API_KEY = process.env.OMDB_API_KEY;
        if (OMDB_ENABLED && OMDB_API_KEY && sortedMovies.length > 0) {
            const concurrency = Number(process.env.OMDB_CONCURRENCY) || 3;
            await runWithConcurrency(sortedMovies, concurrency, async (m) => {
                const title = m.title || m.original_title;
                const year = m.release_date ? m.release_date.substring(0, 4) : undefined;
                const key = `omdb:t:${title}|y:${year}`;
                const cached = cache.get(key);
                if (cached) {
                    m.imdbRating = cached.imdbRating;
                    m.imdbRatingSource = cached.imdbRatingSource;
                    return;
                }
                
                try {
                    const omdbRes = await axios.get('http://www.omdbapi.com/', { params: { apikey: OMDB_API_KEY, t: title, y: year } });
                    if (omdbRes.data && omdbRes.data.imdbRating && omdbRes.data.imdbRating !== 'N/A') {
                        m.imdbRating = omdbRes.data.imdbRating;
                        m.imdbRatingSource = 'OMDb';
                        cache.set(key, { imdbRating: m.imdbRating, imdbRatingSource: m.imdbRatingSource });
                    } else if (typeof m.vote_average !== 'undefined') {
                        m.imdbRating = m.vote_average;
                        m.imdbRatingSource = 'TMDb';
                    }
                } catch (e) {
                    if (typeof m.vote_average !== 'undefined') {
                        m.imdbRating = m.vote_average;
                        m.imdbRatingSource = 'TMDb';
                    }
                }
            });
        } else {
            sortedMovies.forEach(m => {
                if (typeof m.vote_average !== 'undefined') {
                    m.imdbRating = m.vote_average;
                    m.imdbRatingSource = 'TMDb';
                }
            });
        }
        
        // Remove the _source tag before sending to client
        const cleanMovies = sortedMovies.map(movie => {
            const { _source, ...cleanMovie } = movie;
            return cleanMovie;
        });
        
        if (sortedMovies.length > 0) {
            
            // Log language distribution
            const langStats = {};
            sortedMovies.forEach(m => {
                langStats[m.original_language] = (langStats[m.original_language] || 0) + 1;
            });
        }
        
        res.json({ results: cleanMovies });
    } catch (err) {
        logger.error('Error fetching personalized movies:', err);
        // Fallback to popular movies on error
        return getPopularMovies(req, res);
    }
};

module.exports = {
    searchMovies,
    getMovieDetails,
    getPopularMovies,
    getPersonalizedMovies
};
