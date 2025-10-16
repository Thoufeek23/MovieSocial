const Review = require('../models/Review');

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
        if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
            return res.status(400).json({ msg: 'Rating must be a number between 1 and 5' });
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
        await savedReview.populate('user', 'username avatar _id');

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
            console.error('Failed to update user watched list after review:', e.message || e);
        }
        res.status(201).json(savedReview);
    } catch (error) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Get reviews for the logged-in user
// @route   GET /api/reviews/mine
const getMyReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ user: req.user.id })
            .populate('user', 'username avatar _id')
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
            .populate('user', 'username avatar _id')
            .sort({ createdAt: -1 }) // Sort by most recent
            .limit(20); // Limit to the latest 20 reviews
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Get all reviews for a specific movie
// @route   GET /api/reviews/movie/:movieId
const getMovieReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ movieId: req.params.movieId })
            .populate('user', 'username avatar _id')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
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

        // IMPORTANT: Ensure the user owns the review
        if (review.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        review.text = text || review.text;
        review.rating = rating || review.rating;
        
        await review.save();
        await review.populate('user', 'username avatar _id');
        res.json(review);
    } catch (error) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
const deleteReview = async (req, res) => {
    try {
        let review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ msg: 'Review not found' });
        
        // IMPORTANT: Ensure the user owns the review
        if (review.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await Review.findByIdAndDelete(req.params.id);

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

        res.json(review);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server Error' });
    }
};

module.exports = {
    createReview,
    getMyReviews,
    getFeedReviews,
    getMovieReviews,
    updateReview,
    deleteReview,
    voteReview,
};