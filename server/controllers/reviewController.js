const Review = require('../models/Review');
const logger = require('../utils/logger');
const badges = require('../utils/badges');
const Parser = require('rss-parser');
const axios = require('axios');
const User = require('../models/User');

// Simple in-memory TTL cache for movie stats to reduce aggregation load
const statsCache = new Map(); // movieId -> { value: { movieSocialRating, reviewCount }, expires: Number }
const STATS_TTL_MS = 30 * 1000; // 30 seconds

// Initialize RSS Parser with custom fields for Letterboxd
const parser = new Parser({
    customFields: {
        item: [
            ['tmdb:movieId', 'tmdbId'],
            ['letterboxd:filmTitle', 'filmTitle'],
            ['letterboxd:filmYear', 'filmYear'],
            ['letterboxd:memberRating', 'memberRating'],
            ['letterboxd:watchedDate', 'watchedDate'],
            ['letterboxd:rewatch', 'isRewatch']
        ]
    }
});

// @desc    Create a new review
// @route   POST /api/reviews
const createReview = async (req, res) => {
    const { movieId, movieTitle, moviePoster, text, rating } = req.body;
    try {
        // rating is required for all reviews
        if (typeof rating === 'undefined' || rating === null) {
            return res.status(400).json({ msg: 'Rating is required' });
        }
        const numericRating = Number(rating);
        if (Number.isNaN(numericRating) || numericRating < 0.5 || numericRating > 5) {
            return res.status(400).json({ msg: 'Rating must be a number between 0.5 and 5' });
        }
        // Prevent a user from posting more than one review per movie
        const existing = await Review.findOne({ user: req.user.id, movieId });
        if (existing) {
            return res.status(400).json({ msg: 'You have already reviewed this movie' });
        }

        const newReview = new Review({
            user: req.user.id,
            movieId,
            movieTitle,
            moviePoster,
            text,
            rating,
        });
        const savedReview = await newReview.save();
        await savedReview.populate('user', 'username avatar _id badges');

        // Invalidate cached stats for this movieId
        try { statsCache.delete(String(movieId)); } catch (e) {}

        // Add this movie to the user's watched list and remove from watchlist if present
        try {
            const User = require('../models/User');
            const user = await User.findById(req.user.id);
            if (user) {
                const mid = String(movieId);
                // remove from watchlist
                user.watchlist = (user.watchlist || []).filter((id) => String(id) !== mid);
                // add to watched if not already there
                if (!((user.watched || []).map(String).includes(mid))) {
                    user.watched = user.watched || [];
                    user.watched.push(mid);
                }
                await user.save();
            }
        } catch (e) {
            // non-fatal: if updating user fails, still return the saved review
            logger.warn('Failed to update user watched list after review:', e.message || e);
        }
        // Award badges (best-effort, non-blocking)
        try {
            badges.handlePostReview(req.user.id).catch(err => logger.warn('badge handlePostReview failed', err));
        } catch (e) {
            logger.warn('Failed to trigger badge handling', e);
        }

        res.status(201).json(savedReview);
    } catch (error) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Import reviews from Letterboxd RSS
// @route   POST /api/reviews/import/letterboxd
const importLetterboxdReviews = async (req, res) => {
    const { username } = req.body;
    
    if (!username) {
        return res.status(400).json({ msg: 'Letterboxd username is required' });
    }

    try {
        // UPDATED: Use the main RSS feed URL
        const feedUrl = `https://letterboxd.com/${username}/rss/`;
        let feed;
        
        try {
            feed = await parser.parseURL(feedUrl);
        } catch (error) {
            logger.error(`Failed to fetch Letterboxd feed for ${username}:`, error);
            return res.status(404).json({ msg: 'Could not fetch Letterboxd feed. Please check the username.' });
        }

        if (!feed.items || feed.items.length === 0) {
            return res.json({ count: 0, msg: 'No entries found in public feed' });
        }

        const User = require('../models/User');
        const tmdbApiKey = process.env.TMDB_API_KEY;
        let importedCount = 0;
        let skippedCount = 0;

        // --- CHANGED: Limit to the latest 10 items ---
        const itemsToProcess = feed.items.slice(0, 10);

        // Process items sequentially to avoid overwhelming APIs
        for (const item of itemsToProcess) {
            try {
                // 1. Determine Rating
                // Letterboxd uses 0.5-5 scale in memberRating
                let rating = item.memberRating ? parseFloat(item.memberRating) : null;
                
                // If no rating, skip (MovieSocial requires rating)
                if (!rating) {
                    skippedCount++;
                    continue;
                }

                // 2. Determine Movie Details (ID and Poster)
                let movieId = item.tmdbId;
                let movieTitle = item.filmTitle;
                let moviePoster = null;

                // If TMDb ID is missing (sometimes happens), search for it
                if (!movieId && movieTitle) {
                    try {
                        const searchUrl = `https://api.themoviedb.org/3/search/movie`;
                        const searchRes = await axios.get(searchUrl, {
                            params: {
                                api_key: tmdbApiKey,
                                query: movieTitle,
                                year: item.filmYear
                            }
                        });
                        
                        if (searchRes.data.results && searchRes.data.results.length > 0) {
                            movieId = searchRes.data.results[0].id;
                            moviePoster = searchRes.data.results[0].poster_path;
                            // Update title to official TMDb title
                            movieTitle = searchRes.data.results[0].title; 
                        }
                    } catch (searchErr) {
                        logger.warn(`Failed to search movie ${movieTitle}:`, searchErr.message);
                    }
                } else if (movieId) {
                    // We have ID, let's fetch poster if possible
                    try {
                        const detailRes = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
                            params: { api_key: tmdbApiKey }
                        });
                        moviePoster = detailRes.data.poster_path;
                        movieTitle = detailRes.data.title;
                    } catch (detailErr) {
                        logger.warn(`Failed to fetch details for movie ${movieId}:`, detailErr.message);
                    }
                }

                if (!movieId || !moviePoster) {
                    skippedCount++;
                    continue; // Couldn't identify movie
                }

                // 3. Check duplicates
                const existing = await Review.findOne({ user: req.user.id, movieId: String(movieId) });
                if (existing) {
                    skippedCount++;
                    continue;
                }

                // 4. Create Review
                // Clean up the description/review text
                let reviewText = item.contentSnippet || item.content || "";
                
                // Letterboxd RSS content usually starts with the poster image in HTML.
                // We want to strip that and just get the text.
                // Regex to remove HTML tags
                reviewText = reviewText.replace(/<[^>]+>/g, '').trim();
                
                // If text is empty (user just rated without review), add generic text
                if (!reviewText) {
                   reviewText = `Rated ${rating} stars on Letterboxd`;
                }

                const newReview = new Review({
                    user: req.user.id,
                    movieId: String(movieId),
                    movieTitle,
                    moviePoster,
                    text: reviewText,
                    rating,
                    createdAt: item.isoDate ? new Date(item.isoDate) : Date.now() // Use original review date
                });

                await newReview.save();
                importedCount++;

                // 5. Update User Watched List
                const user = await User.findById(req.user.id);
                if (user) {
                    const mid = String(movieId);
                    // remove from watchlist
                    user.watchlist = (user.watchlist || []).filter((id) => String(id) !== mid);
                    // add to watched
                    if (!((user.watched || []).map(String).includes(mid))) {
                        user.watched = user.watched || [];
                        user.watched.push(mid);
                    }
                    await user.save();
                }

            } catch (itemError) {
                logger.error('Error importing individual Letterboxd item:', itemError);
                skippedCount++;
            }
        }
        
        // Trigger badges after import
        if (importedCount > 0) {
            try { badges.handlePostReview(req.user.id).catch(() => {}); } catch (e) {}
        }

        res.json({ 
            msg: `Import successful`, 
            imported: importedCount, 
            skipped: skippedCount,
            // --- CHANGED: Updated note text ---
            note: "Note: Only the latest 10 rated films from your public RSS feed were imported."
        });

    } catch (error) {
        logger.error('Import Letterboxd Error:', error);
        res.status(500).json({ msg: 'Server Error during import' });
    }
};

// @desc    Get reviews for the logged-in user
// @route   GET /api/reviews/mine
const getMyReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ user: req.user.id })
            .populate('user', 'username avatar _id badges')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Get latest reviews for the feed
// @route   GET /api/reviews/feed
const getFeedReviews = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('user', 'username avatar _id badges')
            .sort({ createdAt: -1 }) // Sort by most recent
            .limit(20); // Limit to the latest 20 reviews
        // Filter out reviews with null user (deleted user references)
        const validReviews = reviews.filter(r => r.user);
        res.json(validReviews);
    } catch (error) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Get personalized reviews based on user interests and followed users
// @route   GET /api/reviews/personalized
const getPersonalizedFeedReviews = async (req, res) => {
    try {
        let userInterests = [];
        let followingIds = [];
        
        // Get user interests and following list if logged in
        if (req.user?.id) {
            const User = require('../models/User');
            const user = await User.findById(req.user.id).select('interests following');
            userInterests = user?.interests || [];
            followingIds = user?.following || [];
        }
        
        // If no interests and not following anyone, fall back to regular feed
        if (userInterests.length === 0 && followingIds.length === 0) {
            return getFeedReviews(req, res);
        }
        
        // Helper function to shuffle array
        const shuffleArray = (array) => {
            const shuffled = [...array];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        };
        
        // PRIORITY 1: Get reviews from followed users (up to 10)
        let followedReviews = [];
        if (followingIds.length > 0) {
            followedReviews = await Review.find({ user: { $in: followingIds } })
                .populate('user', 'username avatar _id badges')
                .sort({ createdAt: -1 })
                .limit(20);
            
            followedReviews = followedReviews.filter(r => r.user);
            followedReviews = shuffleArray(followedReviews).slice(0, 10);
        }
        
        // PRIORITY 2: Get reviews based on language interests
        let interestBasedReviews = [];
        if (userInterests.length > 0) {
            // Map interests to language codes for movie filtering
            const languageMap = {
                'English': 'en',
                'Hindi': 'hi', 
                'Tamil': 'ta',
                'Telugu': 'te',
                'Malayalam': 'ml',
                'Kannada': 'kn',
                'Korean': 'ko',
                'French': 'fr',
                'Spanish': 'es'
            };
            
            const languageCodes = userInterests
                .filter(interest => languageMap[interest])
                .map(interest => languageMap[interest]);
            
            if (languageCodes.length > 0) {
                // Get movie details for reviews to filter by language
                const axios = require('axios');
                const tmdbApi = axios.create({ baseURL: 'https://api.themoviedb.org/3' });
                
                // Get recent reviews (excluding already selected followed reviews)
                const followedReviewIds = followedReviews.map(r => r._id.toString());
                const allReviews = await Review.find({ 
                    _id: { $nin: followedReviews.map(r => r._id) }
                })
                    .populate('user', 'username avatar _id badges')
                    .sort({ createdAt: -1 })
                    .limit(100);
                
                const validReviews = allReviews.filter(r => r.user);
                const reviewsByLanguage = {};
                
                // Group reviews by language
                for (const review of validReviews) {
                    try {
                        const movieResponse = await tmdbApi.get(`/movie/${review.movieId}`, {
                            params: { api_key: process.env.TMDB_API_KEY }
                        });
                        
                        const movie = movieResponse.data;
                        if (movie.original_language && languageCodes.includes(movie.original_language)) {
                            if (!reviewsByLanguage[movie.original_language]) {
                                reviewsByLanguage[movie.original_language] = [];
                            }
                            reviewsByLanguage[movie.original_language].push(review);
                        }
                    } catch (error) {
                        continue;
                    }
                }
                
                // Shuffle reviews within each language
                Object.keys(reviewsByLanguage).forEach(lang => {
                    reviewsByLanguage[lang] = shuffleArray(reviewsByLanguage[lang]);
                });
                
                // Create balanced mix using round-robin distribution (up to 10)
                const maxReviewsPerLang = Math.ceil(10 / languageCodes.length);
                const languages = Object.keys(reviewsByLanguage);
                
                if (languages.length > 0) {
                    let round = 0;
                    while (interestBasedReviews.length < 10 && round < maxReviewsPerLang) {
                        for (const lang of languages) {
                            if (interestBasedReviews.length >= 10) break;
                            
                            const langReviews = reviewsByLanguage[lang];
                            if (langReviews && langReviews[round]) {
                                interestBasedReviews.push(langReviews[round]);
                            }
                        }
                        round++;
                    }
                }
            }
        }
        
        // Combine followed reviews (priority) + interest-based reviews
        let personalizedReviews = [...followedReviews, ...interestBasedReviews];
        
        // If we don't have enough, fill with general feed
        if (personalizedReviews.length < 20) {
            const personalizedIds = personalizedReviews.map(r => r._id.toString());
            const generalReviews = await Review.find({
                _id: { $nin: personalizedReviews.map(r => r._id) }
            })
                .populate('user', 'username avatar _id badges')
                .sort({ createdAt: -1 })
                .limit(20 - personalizedReviews.length);
            
            const additionalReviews = generalReviews.filter(r => r.user);
            personalizedReviews.push(...additionalReviews);
        }
        
        // Final shuffle to ensure good distribution while keeping followed posts prioritized
        // Keep first 10 (followed), shuffle the rest
        const finalReviews = [
            ...followedReviews,
            ...shuffleArray(personalizedReviews.slice(followedReviews.length))
        ].slice(0, 20);
        
        res.json(finalReviews);
    } catch (error) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Get all reviews for a specific movie
// @route   GET /api/reviews/movie/:movieId
const getMovieReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ movieId: req.params.movieId })
            .populate('user', 'username avatar _id badges')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Get movie social weighted rating and review count
// @route   GET /api/reviews/movie/:movieId/stats
const getMovieStats = async (req, res) => {
    try {
        const movieId = req.params.movieId;
                // check in-memory cache first
                try {
                    const cached = statsCache.get(String(movieId));
                    if (cached && cached.expires > Date.now()) {
                        return res.json(cached.value);
                    }
                } catch (e) {
                    // ignore cache errors
                }
        // Aggregation pipeline:
        // 1) Match reviews for the movieId
        // 2) For each review, compute agreementFraction = avg(agreementVotes.value) if exists, otherwise 1
        // 3) Compute adjustedRating = rating * (0.75 + 0.25 * agreementFraction)
        // 4) Group to compute avgAdjustedRating and count
        const agg = [
            { $match: { movieId: String(movieId) } },
            { $addFields: {
                agreementFraction: {
                    $cond: [
                        { $gt: [{ $size: { $ifNull: ['$agreementVotes', []] } }, 0] },
                        { $avg: '$agreementVotes.value' },
                        1
                    ]
                }
            }},
            { $addFields: {
                adjustedRating: { $multiply: [ '$rating', { $add: [ 0.75, { $multiply: [0.25, '$agreementFraction' ] } ] } ] }
            }},
            { $group: {
                _id: null,
                movieSocialAvg: { $avg: '$adjustedRating' },
                reviewCount: { $sum: 1 }
            }},
            { $project: { _id: 0, movieSocialAvg: { $cond: [ { $ifNull: ['$movieSocialAvg', false] }, '$movieSocialAvg', null ] }, reviewCount: 1 } }
        ];

        const result = await Review.aggregate(agg);
        if (!result || result.length === 0) {
            const out = { movieSocialRating: null, reviewCount: 0 };
            try { statsCache.set(String(movieId), { value: out, expires: Date.now() + STATS_TTL_MS }); } catch (e) {}
            return res.json(out);
        }
        const r = result[0];
        // Round to one decimal for client convenience
        const movieSocialRating = r.movieSocialAvg === null ? null : Number((r.movieSocialAvg).toFixed(1));
        const out = { movieSocialRating, reviewCount: r.reviewCount };
        try { statsCache.set(String(movieId), { value: out, expires: Date.now() + STATS_TTL_MS }); } catch (e) {}
        res.json(out);
    } catch (error) {
        logger.error('getMovieStats error', error);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Update a review
// @route   PUT /api/reviews/:id
const updateReview = async (req, res) => {
    const { text, rating } = req.body;
    try {
        let review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ msg: 'Review not found' });

        // IMPORTANT: Ensure the user owns the review or is an admin
        if (review.user.toString() !== req.user.id && !req.user.isAdmin) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        review.text = text || review.text;
        review.rating = rating || review.rating;
        
        await review.save();
    await review.populate('user', 'username avatar _id badges');
        // Invalidate cache for this movie
        try { statsCache.delete(String(review.movieId)); } catch (e) {}
        res.json(review);
    } catch (error) {
        logger.error(error);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
const deleteReview = async (req, res) => {
    try {
        let review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ msg: 'Review not found' });
        
        // IMPORTANT: Ensure the user owns the review or is an admin
        if (review.user.toString() !== req.user.id && !req.user.isAdmin) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await Review.findByIdAndDelete(req.params.id);

    // Invalidate cache for this movie
    try { statsCache.delete(String(review.movieId)); } catch (e) {}

        res.json({ msg: 'Review removed' });
    } catch (error) {
        res.status(500).json({ msg: 'Server Error' });
    }
};


// @desc    Vote on a review (agree=1, partial=0.5, disagree=0)
// @route   POST /api/reviews/:id/vote
const voteReview = async (req, res) => {
    try {
        const { value } = req.body; // expected numeric: 1, 0.5, or 0
        const allowed = [1, 0.5, 0];
        if (!allowed.includes(value)) return res.status(400).json({ msg: 'Invalid vote value' });

        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ msg: 'Review not found' });

        const uid = req.user.id;
        // Find any existing vote by this user
        const existing = (review.agreementVotes || []).find(v => String(v.user) === String(uid));
        if (existing && Number(existing.value) === Number(value)) {
            // Toggle off: user clicked the same vote again -> remove it
            review.agreementVotes = (review.agreementVotes || []).filter(v => String(v.user) !== String(uid));
        } else {
            // Remove any existing vote by this user then add the new one
            review.agreementVotes = (review.agreementVotes || []).filter(v => String(v.user) !== String(uid));
            review.agreementVotes.push({ user: uid, value });
        }
        await review.save();
        await review.populate('user', 'username avatar _id');

    // Invalidate cached stats for this movie because agreementVotes changed
    try { statsCache.delete(String(review.movieId)); } catch (e) {}

    res.json(review);
    } catch (error) {
        logger.error(error);
        res.status(500).json({ msg: 'Server Error' });
    }
};

const getUserReviews = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const reviews = await Review.find({ user: user._id })
            .populate('user', 'username avatar _id badges')
            .sort({ createdAt: -1 });
            
        res.json(reviews);
    } catch (error) {
        logger.error('getUserReviews error', error);
        res.status(500).json({ msg: 'Server Error' });
    }
};

module.exports = {
    createReview,
    importLetterboxdReviews,
    getUserReviews,
    getMyReviews,
    getFeedReviews,
    getPersonalizedFeedReviews,
    getMovieReviews,
    getMovieStats,
    updateReview,
    deleteReview,
    voteReview,
};