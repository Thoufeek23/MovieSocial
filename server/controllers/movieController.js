const axios = require('axios');
const logger = require('../utils/logger');

// Simple concurrency runner
async function runWithConcurrency(items, concurrency, fn) {
    if (!Array.isArray(items) || items.length === 0) return;
    const limit = Math.max(1, Number(concurrency) || 3);
    let idx = 0;
    const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
        while (true) {
            const i = idx++;
            if (i >= items.length) break;
            try {
                await fn(items[i], i);
            } catch (e) { }
        }
    });
    await Promise.all(workers);
}

// OMDb API call with retry
async function omdbApiCall(params, maxRetries = 3) {
    if (omdbCircuitBreaker.shouldSkip()) {
        const error = new Error('OMDb API temporarily unavailable (circuit breaker open)');
        error.circuitBreakerOpen = true;
        throw error;
    }
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await axios.get('http://www.omdbapi.com/', {
                params,
                timeout: 15000,
                headers: { 'User-Agent': 'MovieSocial-App/1.0' }
            });
            omdbCircuitBreaker.recordSuccess();
            return response;
        } catch (error) {
            const status = error.response?.status;
            const retryAfter = error.response?.headers?.['retry-after'];
            if (status === 401 || status === 403) {
                OMDB_ENABLED = false;
                throw error;
            }
            const isRetryableError = status === 522 || status === 524 || (status >= 520 && status <= 529) ||
                error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' ||
                error.code === 'ENOTFOUND' || error.code === 'ECONNRESET';
            if (attempt < maxRetries && isRetryableError) {
                const baseDelay = 1000;
                const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt - 1), 10000);
                const retryDelay = retryAfter ? parseInt(retryAfter) * 1000 : exponentialDelay;
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                continue;
            }
            omdbCircuitBreaker.recordFailure();
            throw error;
        }
    }
}

const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const cache = require('../utils/cache');
let OMDB_ENABLED = !!process.env.OMDB_API_KEY;

let omdbCircuitBreaker = {
    failures: 0,
    lastFailureTime: null,
    isOpen: false,
    threshold: parseInt(process.env.OMDB_CIRCUIT_BREAKER_THRESHOLD) || 5,
    timeout: (parseInt(process.env.OMDB_CIRCUIT_BREAKER_TIMEOUT) || 5) * 60 * 1000,
    shouldSkip() {
        if (!this.isOpen) return false;
        const now = Date.now();
        if (now - this.lastFailureTime > this.timeout) {
            this.failures = 0;
            this.isOpen = false;
            return false;
        }
        return true;
    },
    recordFailure() {
        this.failures++;
        this.lastFailureTime = Date.now();
        if (this.failures >= this.threshold) {
            this.isOpen = true;
        }
    },
    recordSuccess() {
        this.failures = 0;
        this.isOpen = false;
    }
};

const searchMovies = async (req, res) => {
    const { query, language, decade } = req.query; // Extract new params
    try {
        // Fetch first 5 pages to get ~100 results
        const pageRequests = [1, 2, 3, 4, 5].map(page =>
            axios.get(`${TMDB_API_BASE_URL}/search/movie`, {
                params: {
                    api_key: TMDB_API_KEY,
                    query,
                    page
                },
            }).catch(e => ({ data: { results: [] } }))
        );

        const responses = await Promise.all(pageRequests);

        let combinedResults = [];
        responses.forEach(response => {
            if (response.data && Array.isArray(response.data.results)) {
                combinedResults.push(...response.data.results);
            }
        });

        // Deduplicate
        const seen = new Set();
        const uniqueResults = combinedResults.filter(m => {
            const duplicate = seen.has(m.id);
            seen.add(m.id);
            return !duplicate;
        });

        // --- NEW FILTERING LOGIC START ---
        let filteredResults = uniqueResults;

        // Filter by Language
        if (language) {
            filteredResults = filteredResults.filter(m => m.original_language === language);
        }

        // Filter by Decade
        if (decade) {
            const startYear = parseInt(decade);
            const endYear = startYear + 9;
            filteredResults = filteredResults.filter(m => {
                if (!m.release_date) return false;
                const releaseYear = parseInt(m.release_date.substring(0, 4));
                return releaseYear >= startYear && releaseYear <= endYear;
            });
        }
        // --- NEW FILTERING LOGIC END ---

        const data = { results: filteredResults };

        const OMDB_API_KEY = process.env.OMDB_API_KEY;
        // Check filteredResults instead of uniqueResults to save API calls
        if (OMDB_ENABLED && OMDB_API_KEY && filteredResults.length > 0) {
            const concurrency = Number(process.env.OMDB_CONCURRENCY) || 3;
            // Enrich top 30 of the FILTERED list
            const moviesToEnrich = filteredResults.slice(0, 30);

            await runWithConcurrency(moviesToEnrich, concurrency, async (m) => {
                // ... (keep existing enrichment logic) ...
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
                    const omdbRes = await omdbApiCall({ apikey: OMDB_API_KEY, t: title, y: year });
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

const getMovieDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const { data } = await axios.get(`${TMDB_API_BASE_URL}/movie/${id}`, {
            params: { api_key: TMDB_API_KEY, append_to_response: 'external_ids,videos' },
        });
        const OMDB_API_KEY = process.env.OMDB_API_KEY;
        let imdbRating = null;
        let imdbRatingSource = null;
        const imdbId = data?.external_ids?.imdb_id;
        if (OMDB_ENABLED && OMDB_API_KEY && imdbId) {
            try {
                const key = `omdb:i:${imdbId}`;
                const cached = cache.get(key);
                if (cached) {
                    imdbRating = cached.imdbRating;
                    imdbRatingSource = cached.imdbRatingSource;
                } else {
                    const omdbRes = await omdbApiCall({ apikey: OMDB_API_KEY, i: imdbId });
                    if (omdbRes.data && omdbRes.data.imdbRating && omdbRes.data.imdbRating !== 'N/A') {
                        imdbRating = omdbRes.data.imdbRating;
                        imdbRatingSource = 'OMDb';
                        cache.set(key, { imdbRating, imdbRatingSource });
                    }
                }
            } catch (err) { }
        }
        if (!imdbRating && typeof data.vote_average !== 'undefined') {
            imdbRating = data.vote_average;
            imdbRatingSource = 'TMDb';
        }
        data.imdbRating = imdbRating;
        data.imdbRatingSource = imdbRatingSource;
        res.json(data);
    } catch (err) {
        res.status(500).json({ msg: 'Error fetching movie details' });
    }
};

const getPopularMovies = async (req, res) => {
    try {
        // Fetch 5 pages for popular movies as well
        const pageRequests = [1, 2, 3, 4, 5].map(page =>
            axios.get(`${TMDB_API_BASE_URL}/movie/popular`, {
                params: { api_key: TMDB_API_KEY, page },
            }).catch(e => ({ data: { results: [] } }))
        );

        const responses = await Promise.all(pageRequests);
        let combinedResults = [];
        responses.forEach(response => {
            if (response.data && Array.isArray(response.data.results)) {
                combinedResults.push(...response.data.results);
            }
        });

        // Deduplicate
        const seen = new Set();
        const uniqueResults = combinedResults.filter(m => {
            const duplicate = seen.has(m.id);
            seen.add(m.id);
            return !duplicate;
        });

        const data = { results: uniqueResults };

        const OMDB_API_KEY = process.env.OMDB_API_KEY;
        if (OMDB_ENABLED && OMDB_API_KEY && uniqueResults.length > 0) {
            const concurrency = Number(process.env.OMDB_CONCURRENCY) || 3;
            const moviesToEnrich = uniqueResults.slice(0, 20);

            await runWithConcurrency(moviesToEnrich, concurrency, async (m) => {
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
                    const omdbRes = await omdbApiCall({ apikey: OMDB_API_KEY, t: title, y: year });
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

const getPersonalizedMovies = async (req, res) => {
    try {
        const userId = req.user?.id;
        let userInterests = [];

        if (userId) {
            const User = require('../models/User');
            const user = await User.findById(userId).select('interests username');
            userInterests = user?.interests || [];
        }

        const languageMap = {
            'English': 'en', 'Hindi': 'hi', 'Tamil': 'ta', 'Telugu': 'te',
            'Kannada': 'kn', 'Malayalam': 'ml', 'Korean': 'ko',
            'French': 'fr', 'Spanish': 'es'
        };

        const languageCodes = userInterests
            .map(interest => languageMap[interest])
            .filter(Boolean);

        let allMovies = [];

        // Strategy 0: If NO interests, fetch global popular movies (Pages 1-8)
        if (languageCodes.length === 0) {
            const pageRequests = [1, 2, 3, 4, 5, 6, 7, 8].map(page =>
                axios.get(`${TMDB_API_BASE_URL}/movie/popular`, {
                    params: { api_key: TMDB_API_KEY, page }
                }).catch(e => ({ data: { results: [] } }))
            );

            const responses = await Promise.all(pageRequests);
            responses.forEach(response => {
                if (response.data && response.data.results) {
                    allMovies.push(...response.data.results);
                }
            });
        }

        // Strategy 1: User's preferred languages
        if (languageCodes.length > 0) {
            for (const langCode of languageCodes) {
                // Fetch 5 pages per language
                const pageRequests = [1, 2, 3, 4, 5].map(page => {
                    const params = {
                        api_key: TMDB_API_KEY,
                        page: page,
                        sort_by: 'primary_release_date.desc',
                        'primary_release_date.lte': new Date().toISOString().split('T')[0],
                        'vote_count.gte': 5,
                        with_original_language: langCode
                    };
                    return axios.get(`${TMDB_API_BASE_URL}/discover/movie`, { params })
                        .catch(e => ({ data: { results: [] } }));
                });

                const responses = await Promise.all(pageRequests);
                responses.forEach(response => {
                    if (response.data && response.data.results) {
                        const taggedMovies = response.data.results.map(movie => ({
                            ...movie,
                            _source: `${langCode}_preferred`
                        }));
                        allMovies.push(...taggedMovies);
                    }
                });
            }
        }

        // Strategy 2: Popular Indian Cinema fallback
        if (allMovies.length < 50 && (languageCodes.includes('hi') || languageCodes.includes('ta') || languageCodes.includes('te') || languageCodes.includes('ml') || languageCodes.includes('kn'))) {
            const indianLanguages = ['hi', 'ta', 'te', 'ml', 'kn'];
            for (const lang of indianLanguages) {
                const params = {
                    api_key: TMDB_API_KEY,
                    page: 1,
                    sort_by: 'popularity.desc',
                    'primary_release_date.gte': '2020-01-01',
                    'vote_count.gte': 20,
                    with_original_language: lang
                };
                try {
                    const { data } = await axios.get(`${TMDB_API_BASE_URL}/discover/movie`, { params });
                    if (data.results && data.results.length > 0) {
                        const taggedMovies = data.results.slice(0, 10).map(movie => ({
                            ...movie,
                            _source: `${lang}_popular`
                        }));
                        allMovies.push(...taggedMovies);
                    }
                } catch (error) { }
            }
        }

        // Strategy 3: Final fallback
        if (allMovies.length < 20) {
            const fallbackParams = {
                api_key: TMDB_API_KEY,
                page: 1,
                sort_by: 'primary_release_date.desc',
                'primary_release_date.lte': new Date().toISOString().split('T')[0],
                'vote_count.gte': 100,
                'vote_average.gte': 6.0
            };
            try {
                const fallbackRes = await axios.get(`${TMDB_API_BASE_URL}/discover/movie`, { params: fallbackParams });
                if (fallbackRes.data.results) {
                    allMovies.push(...fallbackRes.data.results);
                }
            } catch (error) { }
        }

        const shuffleArray = (array) => {
            const shuffled = [...array];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        };

        // Deduplicate
        const uniqueMovies = [];
        const seenIds = new Set();
        for (const m of allMovies) {
            if (!seenIds.has(m.id)) {
                seenIds.add(m.id);
                uniqueMovies.push(m);
            }
        }

        // NO LIMIT: Return all results shuffled/mixed
        let sortedMovies = shuffleArray(uniqueMovies);

        // Add OMDb ratings (Concurrency limited)
        const OMDB_API_KEY = process.env.OMDB_API_KEY;
        if (OMDB_ENABLED && OMDB_API_KEY && sortedMovies.length > 0) {
            const concurrency = Number(process.env.OMDB_CONCURRENCY) || 3;
            // Enrich top 30
            const moviesToEnrich = sortedMovies.slice(0, 30);

            await runWithConcurrency(moviesToEnrich, concurrency, async (m) => {
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
                    const omdbRes = await omdbApiCall({ apikey: OMDB_API_KEY, t: title, y: year });
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

        const cleanMovies = sortedMovies.map(movie => {
            const { _source, ...cleanMovie } = movie;
            return cleanMovie;
        });

        res.json({ results: cleanMovies });
    } catch (err) {
        logger.error('Error fetching personalized movies:', err);
        return getPopularMovies(req, res);
    }
};

module.exports = {
    searchMovies,
    getMovieDetails,
    getPopularMovies,
    getPersonalizedMovies
};