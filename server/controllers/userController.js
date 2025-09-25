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

        if (user.watchlist.includes(movieId)) {
            return res.status(400).json({ msg: 'Movie already in watchlist' });
        }

        user.watchlist.push(movieId);
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

        if (user.watched.includes(movieId)) {
            return res.status(400).json({ msg: 'Movie already in watched list' });
        }

        // Optional: Remove from watchlist if it exists there
        user.watchlist = user.watchlist.filter((id) => id !== movieId);

        user.watched.push(movieId);
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
};