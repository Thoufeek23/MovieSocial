const User = require('../models/User');

// @desc    Get user profile
// @route   GET /api/users/:username
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username }).select('-passwordHash');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Add a movie to the user's watchlist
// @route   POST /api/users/watchlist
const addToWatchlist = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const { movieId } = req.body;
        // normalize to strings for safe comparison
        const mid = String(movieId);

        if (user.watchlist.map(String).includes(mid)) {
            return res.status(400).json({ msg: 'Movie already in watchlist' });
        }

        // If movie is in watched, remove it to enforce exclusivity
        user.watched = (user.watched || []).filter((id) => String(id) !== mid);

        user.watchlist.push(mid);
        await user.save();
        res.json(user.watchlist);
    } catch (error) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Add a movie to the user's watched list
// @route   POST /api/users/watched
const addToWatched = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const { movieId } = req.body;
        const mid = String(movieId);

        if ((user.watched || []).map(String).includes(mid)) {
            return res.status(400).json({ msg: 'Movie already in watched list' });
        }

        // Remove from watchlist if it exists there
        user.watchlist = (user.watchlist || []).filter((id) => String(id) !== mid);

        user.watched = user.watched || [];
        user.watched.push(mid);
        await user.save();
        res.json(user.watched);
    } catch (error) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Remove a movie from the user's watchlist
// @route   DELETE /api/users/watchlist
const removeFromWatchlist = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const { movieId } = req.body;
        const mid = String(movieId);
        user.watchlist = (user.watchlist || []).filter((id) => String(id) !== mid);
        await user.save();
        res.json(user.watchlist);
    } catch (error) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Remove a movie from the user's watched list
// @route   DELETE /api/users/watched
const removeFromWatched = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const { movieId } = req.body;
        const mid = String(movieId);
        user.watched = (user.watched || []).filter((id) => String(id) !== mid);
        await user.save();
        res.json(user.watched);
    } catch (error) {
        res.status(500).json({ msg: 'Server Error' });
    }
};


module.exports = {
    getUserProfile,
    addToWatchlist,
    addToWatched,
    removeFromWatchlist,
    removeFromWatched,
};