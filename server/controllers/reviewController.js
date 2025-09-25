const Review = require('../models/Review');

// @desc    Create a new review
// @route   POST /api/reviews
const createReview = async (req, res) => {
    const { movieId, movieTitle, moviePoster, text, rating } = req.body;
    try {
        const newReview = new Review({
            user: req.user.id,
            movieId,
            movieTitle,
            moviePoster,
            text,
            rating,
        });
        const savedReview = await newReview.save();
        await savedReview.populate('user', 'username');
        res.status(201).json(savedReview);
    } catch (error) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Get latest reviews for the feed
// @route   GET /api/reviews/feed
const getFeedReviews = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('user', 'username avatar')
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
            .populate('user', 'username avatar')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

module.exports = {
    createReview,
    getFeedReviews,
    getMovieReviews,
};