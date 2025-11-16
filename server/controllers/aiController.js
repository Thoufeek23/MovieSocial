const axios = require('axios');
const logger = require('../utils/logger');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// @desc    Get AI-powered movie recommendations based on user preferences
// @route   POST /api/ai/movie-recommendations
const getMovieRecommendations = async (req, res) => {
    try {
        if (!GEMINI_API_KEY) {
            return res.status(500).json({ msg: 'Gemini API key not configured' });
        }

        const {
            genres,
            mood,
            languages,
            endings,
            themes,
            enjoys,
            pace,
            characters,
            experience,
            watchWith,
            releasePeriod
        } = req.body;

        // Validate required fields
        if (!genres || !mood || !languages) {
            return res.status(400).json({ 
                msg: 'Missing required preferences',
                details: 'Please fill out all required fields'
            });
        }

        // Create a detailed prompt for Gemini
        const languageInstructions = Array.isArray(languages) && languages.length > 0 && !languages.includes('Any language is fine') 
            ? `STRICTLY recommend movies ONLY in these languages: ${languages.join(', ')}. Do not recommend movies in other languages.`
            : 'Recommend movies in any language, but prioritize based on user preferences.';

        const prompt = `Based on the following movie preferences, recommend exactly 10 POPULAR and WELL-KNOWN movies. Focus on mainstream movies that are widely available and likely to be in movie databases.

User Preferences:
- Genres: ${Array.isArray(genres) ? genres.join(', ') : genres}
- Mood: ${mood}
- Languages: ${Array.isArray(languages) ? languages.join(', ') : languages}
- Preferred endings: ${endings}
- Story themes: ${Array.isArray(themes) ? themes.join(', ') : themes}
- Enjoys movies with: ${Array.isArray(enjoys) ? enjoys.join(', ') : enjoys}
- Pace preference: ${pace}
- Character types: ${Array.isArray(characters) ? characters.join(', ') : characters}
- Movie experience: ${experience}
- Watches movies: ${watchWith}
- Release period: ${releasePeriod}

LANGUAGE REQUIREMENT: ${languageInstructions}

IMPORTANT RULES:
1. ${languageInstructions}
2. Only recommend mainstream, popular movies (not obscure or indie films)
3. Use EXACT movie titles as they appear in movie databases
4. For non-English movies, use the most commonly known title (original title or English title)
5. Include movies from acclaimed directors, popular actors, or well-known films in the specified languages
6. Ensure all movies actually exist and are real
7. Use simple, clean movie titles without extra punctuation
8. If user selected specific languages like Tamil, Telugu, Hindi, etc., prioritize Bollywood, Tollywood, Kollywood hits

Return ONLY a valid JSON array:
[
  {
    "title": "Exact Movie Title",
    "year": 2020,
    "reason": "Brief explanation why this fits their preferences",
    "tmdb_search_query": "Exact Movie Title"
  }
]`;

        // Call Gemini API
        const response = await axios.post(
            GEMINI_API_URL,
            {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-goog-api-key': GEMINI_API_KEY
                },
                timeout: 30000 // 30 second timeout
            }
        );

        const aiResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!aiResponse) {
            throw new Error('Invalid response from Gemini API');
        }

        // Parse the JSON response
        let recommendations;
        try {
            // Extract JSON from the response (remove any markdown formatting)
            const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
            const jsonString = jsonMatch ? jsonMatch[0] : aiResponse;
            recommendations = JSON.parse(jsonString);
        } catch (parseError) {
            throw new Error('Failed to parse AI recommendations');
        }

        if (!Array.isArray(recommendations)) {
            throw new Error('AI response is not an array');
        }

        // Now search for each movie in TMDB to get the actual movie data
        const TMDB_API_KEY = process.env.TMDB_API_KEY;
        const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';
        
        const movieResults = await Promise.allSettled(
            recommendations.map(async (rec) => {
                try {
                    // Try multiple search strategies
                    const searchQueries = [
                        rec.tmdb_search_query || rec.title,
                        rec.title,
                        rec.title.replace(/[^\w\s]/g, ''), // Remove special characters
                        rec.title.split(':')[0], // Remove subtitle after colon
                        rec.title.split('(')[0].trim() // Remove content in parentheses
                    ].filter(Boolean);

                    let movie = null;

                    for (const query of searchQueries) {
                        // First try with year
                        if (rec.year && !movie) {
                            const searchResponse = await axios.get(`${TMDB_API_BASE_URL}/search/movie`, {
                                params: {
                                    api_key: TMDB_API_KEY,
                                    query: query,
                                    year: rec.year
                                }
                            });

                            if (searchResponse.data.results && searchResponse.data.results.length > 0) {
                                movie = searchResponse.data.results[0];
                                break;
                            }
                        }

                        // Then try without year
                        if (!movie) {
                            const searchResponse = await axios.get(`${TMDB_API_BASE_URL}/search/movie`, {
                                params: {
                                    api_key: TMDB_API_KEY,
                                    query: query
                                }
                            });

                            if (searchResponse.data.results && searchResponse.data.results.length > 0) {
                                movie = searchResponse.data.results[0];
                                break;
                            }
                        }
                    }

                    if (movie) {
                        return {
                            ...movie,
                            ai_reason: rec.reason,
                            ai_title: rec.title,
                            ai_year: rec.year
                        };
                    }

                    return null;
                } catch (error) {
                    return null;
                }
            })
        );

        // Filter out failed searches and null results
        let validMovies = movieResults
            .filter(result => result.status === 'fulfilled' && result.value !== null)
            .map(result => result.value);

        // Language matching algorithm
        const languageMatchingEnabled = Array.isArray(languages) && languages.length > 0 && !languages.includes('Any language is fine');
        
        if (languageMatchingEnabled && validMovies.length > 0) {
            // Map user language preferences to ISO codes and common variations
            const languageMapping = {
                'English': ['en', 'english'],
                'Tamil': ['ta', 'tamil'],
                'Telugu': ['te', 'telugu'],
                'Malayalam': ['ml', 'malayalam'],
                'Hindi': ['hi', 'hindi'],
                'Kannada': ['kn', 'kannada'],
                'Korean': ['ko', 'korean'],
                'Japanese': ['ja', 'japanese'],
                'French': ['fr', 'french'],
                'Spanish': ['es', 'spanish'],
                'German': ['de', 'german'],
                'Italian': ['it', 'italian'],
                'Chinese': ['zh', 'chinese', 'mandarin'],
                'Russian': ['ru', 'russian']
            };

            // Get all accepted language codes
            const acceptedLanguageCodes = [];
            languages.forEach(userLang => {
                const codes = languageMapping[userLang];
                if (codes) {
                    acceptedLanguageCodes.push(...codes);
                }
            });

            // Filter movies that match user's language preferences
            const languageMatchedMovies = validMovies.filter(movie => {
                const movieLang = movie.original_language?.toLowerCase();
                const isMatch = acceptedLanguageCodes.includes(movieLang);
                return isMatch;
            });

            // If we have some matches, use them; if we need more, get additional movies
            if (languageMatchedMovies.length > 0) {
                validMovies = languageMatchedMovies;
                
                // If we don't have enough movies (less than 5), try to get more in the preferred languages
                if (validMovies.length < 5) {
                    try {
                        // Get popular movies in the preferred languages
                        const additionalMovies = await getMoviesInLanguages(acceptedLanguageCodes, TMDB_API_KEY, TMDB_API_BASE_URL, 10 - validMovies.length);
                        
                        // Add AI reasoning to additional movies
                        additionalMovies.forEach(movie => {
                            movie.ai_reason = `Popular ${languages.join('/')} movie recommendation`;
                            movie.ai_title = movie.title;
                            movie.ai_year = movie.release_date ? new Date(movie.release_date).getFullYear() : null;
                        });
                        
                        validMovies = [...validMovies, ...additionalMovies];
                    } catch (error) {
                        // Continue with existing movies if additional fetch fails
                    }
                }
            } else {
                // No language matches found, get popular movies in preferred languages as replacement
                try {
                    const replacementMovies = await getMoviesInLanguages(acceptedLanguageCodes, TMDB_API_KEY, TMDB_API_BASE_URL, 10);
                    
                    replacementMovies.forEach(movie => {
                        movie.ai_reason = `Popular ${languages.join('/')} movie (AI recommendations didn't match your language preferences)`;
                        movie.ai_title = movie.title;
                        movie.ai_year = movie.release_date ? new Date(movie.release_date).getFullYear() : null;
                    });
                    
                    validMovies = replacementMovies;
                } catch (error) {
                    // Continue with original movies if replacement fails
                }
            }
        }

        if (validMovies.length === 0) {
            // Fallback: Get popular movies as backup recommendations
            try {
                const fallbackResponse = await axios.get(`${TMDB_API_BASE_URL}/movie/popular`, {
                    params: { api_key: TMDB_API_KEY, page: 1 }
                });
                
                const fallbackMovies = fallbackResponse.data.results?.slice(0, 10) || [];
                
                if (fallbackMovies.length > 0) {
                    // Add fallback ratings
                    fallbackMovies.forEach(movie => {
                        if (typeof movie.vote_average !== 'undefined') {
                            movie.imdbRating = movie.vote_average;
                            movie.imdbRatingSource = 'TMDb';
                        }
                        movie.ai_reason = 'Popular movie recommendation (AI search failed)';
                        movie.ai_title = movie.title;
                        movie.ai_year = movie.release_date ? new Date(movie.release_date).getFullYear() : null;
                    });
                    
                    return res.json({
                        recommendations: fallbackMovies,
                        total: fallbackMovies.length,
                        fallback: true,
                        preferences_used: {
                            genres, mood, languages, endings, themes, enjoys, pace, characters, experience, watchWith, releasePeriod
                        }
                    });
                }
            } catch (fallbackError) {
                // Fallback also failed, return error
            }
            
            return res.status(404).json({ msg: 'No movies found matching your preferences' });
        }

        // Add IMDb ratings if available
        const OMDB_API_KEY = process.env.OMDB_API_KEY;
        if (OMDB_API_KEY && validMovies.length > 0) {
            const cache = require('../utils/cache');
            await Promise.allSettled(validMovies.map(async (movie) => {
                const title = movie.title || movie.original_title;
                const year = movie.release_date ? movie.release_date.substring(0, 4) : undefined;
                const key = `omdb:t:${title}|y:${year}`;
                const cached = cache.get(key);
                
                if (cached) {
                    movie.imdbRating = cached.imdbRating;
                    movie.imdbRatingSource = cached.imdbRatingSource;
                    return;
                }

                try {
                    const omdbRes = await axios.get('http://www.omdbapi.com/', {
                        params: { apikey: OMDB_API_KEY, t: title, y: year }
                    });
                    if (omdbRes.data && omdbRes.data.imdbRating && omdbRes.data.imdbRating !== 'N/A') {
                        movie.imdbRating = omdbRes.data.imdbRating;
                        movie.imdbRatingSource = 'OMDb';
                        cache.set(key, { imdbRating: movie.imdbRating, imdbRatingSource: movie.imdbRatingSource });
                    } else if (typeof movie.vote_average !== 'undefined') {
                        movie.imdbRating = movie.vote_average;
                        movie.imdbRatingSource = 'TMDb';
                    }
                } catch (e) {
                    if (typeof movie.vote_average !== 'undefined') {
                        movie.imdbRating = movie.vote_average;
                        movie.imdbRatingSource = 'TMDb';
                    }
                }
            }));
        } else {
            // Add TMDb ratings as fallback
            validMovies.forEach(movie => {
                if (typeof movie.vote_average !== 'undefined') {
                    movie.imdbRating = movie.vote_average;
                    movie.imdbRatingSource = 'TMDb';
                }
            });
        }

        res.json({
            recommendations: validMovies,
            total: validMovies.length,
            preferences_used: {
                genres,
                mood,
                languages,
                endings,
                themes,
                enjoys,
                pace,
                characters,
                experience,
                watchWith,
                releasePeriod
            }
        });

    } catch (error) {
        if (error.response) {
            // Gemini API error
            const status = error.response.status;
            const errorData = error.response.data;
            
            if (status === 400) {
                return res.status(400).json({ 
                    msg: 'Invalid request to AI service',
                    details: errorData?.error?.message || 'Bad request'
                });
            } else if (status === 401 || status === 403) {
                return res.status(500).json({ 
                    msg: 'AI service authentication failed',
                    details: 'Please check API key configuration'
                });
            } else if (status === 429) {
                return res.status(429).json({ 
                    msg: 'Too many requests to AI service',
                    details: 'Please try again later'
                });
            }
            
            return res.status(500).json({ 
                msg: 'Failed to get AI recommendations',
                details: errorData?.error?.message || `API error: ${status}`
            });
        }
        
        if (error.code === 'ECONNABORTED') {
            return res.status(500).json({ 
                msg: 'AI service timeout',
                details: 'The request took too long. Please try again.'
            });
        }
        
        res.status(500).json({ 
            msg: 'Failed to generate movie recommendations',
            details: error.message 
        });
    }
};

// Test endpoint to verify AI service is working
const testAIConnection = async (req, res) => {
    try {
        if (!GEMINI_API_KEY) {
            return res.status(500).json({ 
                msg: 'Gemini API key not configured',
                configured: false 
            });
        }

        // Simple test request
        const testResponse = await axios.post(
            GEMINI_API_URL,
            {
                contents: [{
                    parts: [{
                        text: "Say 'Hello, AI is working!' in exactly those words."
                    }]
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 20,
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-goog-api-key': GEMINI_API_KEY
                },
                timeout: 10000
            }
        );

        const aiResponse = testResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        res.json({
            msg: 'AI service is working',
            configured: true,
            response: aiResponse,
            status: 'success'
        });

    } catch (error) {
        res.status(500).json({
            msg: 'AI service test failed',
            configured: !!GEMINI_API_KEY,
            error: error.message,
            status: 'failed'
        });
    }
};

// Helper function to get popular movies in specific languages
const getMoviesInLanguages = async (languageCodes, tmdbApiKey, tmdbBaseUrl, limit = 10) => {
    const movies = [];
    const seenIds = new Set();
    
    // Try to get movies from each language
    for (const langCode of languageCodes) {
        if (movies.length >= limit) break;
        
        try {
            // Get popular movies in this language
            const response = await axios.get(`${tmdbBaseUrl}/discover/movie`, {
                params: {
                    api_key: tmdbApiKey,
                    with_original_language: langCode,
                    sort_by: 'popularity.desc',
                    'vote_count.gte': 10, // Ensure some popularity
                    page: 1
                }
            });
            
            const langMovies = response.data.results || [];
            
            // Add unique movies
            for (const movie of langMovies) {
                if (movies.length >= limit) break;
                if (!seenIds.has(movie.id)) {
                    seenIds.add(movie.id);
                    movies.push(movie);
                }
            }
        } catch (error) {
            // Continue to next language if this one fails
        }
    }
    
    // If still not enough movies, try recent releases in those languages
    if (movies.length < limit) {
        for (const langCode of languageCodes) {
            if (movies.length >= limit) break;
            
            try {
                const response = await axios.get(`${tmdbBaseUrl}/discover/movie`, {
                    params: {
                        api_key: tmdbApiKey,
                        with_original_language: langCode,
                        sort_by: 'release_date.desc',
                        'primary_release_date.gte': '2020-01-01', // Recent movies
                        'vote_count.gte': 5,
                        page: 1
                    }
                });
                
                const langMovies = response.data.results || [];
                
                for (const movie of langMovies) {
                    if (movies.length >= limit) break;
                    if (!seenIds.has(movie.id)) {
                        seenIds.add(movie.id);
                        movies.push(movie);
                    }
                }
            } catch (error) {
                // Continue to next language if this one fails
            }
        }
    }
    
    return movies.slice(0, limit);
};

module.exports = {
    getMovieRecommendations,
    testAIConnection,
    getMoviesInLanguages
};