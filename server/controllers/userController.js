const User = require('../models/User');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');
const Discussion = require('../models/Discussion');
const Review = require('../models/Review');

// @desc    Get user profile
// @route   GET /api/users/:username
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username })
            .select('-passwordHash')
            .populate('followers', 'username avatar')
            .populate('following', 'username avatar');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        const profile = user.toObject();
        profile.followersCount = (user.followers || []).length;
        profile.followingCount = (user.following || []).length;
        profile.isFollowedByCurrentUser = false;

        let currentUserId = null;
        if (req.user) {
            currentUserId = req.user.id;
        } else if (req.headers && req.headers.authorization) {
            try {
                const auth = req.headers.authorization;
                if (auth.startsWith('Bearer ')) {
                    const token = auth.split(' ')[1];
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    currentUserId = decoded.user && decoded.user.id ? decoded.user.id : null;
                }
            } catch (e) {}
        }

        if (currentUserId) {
            profile.isFollowedByCurrentUser = (user.followers || []).some(f => String(f._id) === String(currentUserId));
        }

        try {
            const startedCount = await Discussion.countDocuments({ starter: user._id });
            const participatedCountAgg = await Discussion.aggregate([
                { $match: { 'comments.user': user._id } },
                { $group: { _id: '$_id' } },
                { $count: 'count' }
            ]);
            const participatedCount = (participatedCountAgg[0] && participatedCountAgg[0].count) || 0;

            profile.discussionsStarted = startedCount;
            profile.discussionsParticipated = participatedCount;
        } catch (e) {
            profile.discussionsStarted = 0;
            profile.discussionsParticipated = 0;
        }
        
        try {
            const reviews = await Review.find({ user: user._id }, 'agreementVotes');
            let totalVotes = 0;
            let sumValues = 0;
            let agreeCount = 0;
            let partialCount = 0;
            let disagreeCount = 0;

            reviews.forEach(r => {
                (r.agreementVotes || []).forEach(v => {
                    totalVotes += 1;
                    const val = Number(v.value) || 0;
                    sumValues += val;
                    if (val === 1) agreeCount += 1;
                    else if (val === 0.5) partialCount += 1;
                    else if (val === 0) disagreeCount += 1;
                });
            });

            const average = totalVotes > 0 ? (sumValues / totalVotes) * 100 : null; 
            const agreePercent = totalVotes > 0 ? Math.round((agreeCount / totalVotes) * 100) : 0;
            const partialPercent = totalVotes > 0 ? Math.round((partialCount / totalVotes) * 100) : 0;
            const disagreePercent = totalVotes > 0 ? Math.round((disagreeCount / totalVotes) * 100) : 0;

            profile.communityAgreement = {
                average: average === null ? null : Math.round(average),
                breakdown: { agreePercent, partialPercent, disagreePercent },
                totalVotes
            };
        } catch (e) {
            profile.communityAgreement = { average: null, breakdown: { agreePercent: 0, partialPercent: 0, disagreePercent: 0 }, totalVotes: 0 };
        }
        res.json(profile);
    } catch (error) {
        logger.error(error);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Update current user's profile (bio, avatar)
// @route   PATCH /api/users/me
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        const { bio, avatar, interests } = req.body;
        if (typeof bio !== 'undefined') user.bio = bio;
        if (typeof avatar !== 'undefined') user.avatar = avatar;
        if (Array.isArray(interests)) user.interests = interests.slice(0, 3);

        await user.save();
        res.json({ msg: 'Profile updated', user });
    } catch (error) {
        logger.error(error);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Follow a user
// @route   POST /api/users/:username/follow
const followUser = async (req, res) => {
    try {
        const target = await User.findOne({ username: req.params.username });
        if (!target) return res.status(404).json({ msg: 'User not found' });
        const me = await User.findById(req.user.id);
        if (!me) return res.status(404).json({ msg: 'User not found' });

        if (String(target._id) === String(me._id)) {
            return res.status(400).json({ msg: "You can't follow yourself" });
        }

        if (!((me.following || []).map(String).includes(String(target._id)))) {
            me.following = me.following || [];
            me.following.push(target._id);
            await me.save();
        }
        if (!((target.followers || []).map(String).includes(String(me._id)))) {
            target.followers = target.followers || [];
            target.followers.push(me._id);
            await target.save();
        }

        res.json({ msg: 'Followed user' });
    } catch (error) {
        logger.error(error);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Unfollow a user
// @route   DELETE /api/users/:username/follow
const unfollowUser = async (req, res) => {
    try {
        const target = await User.findOne({ username: req.params.username });
        if (!target) return res.status(404).json({ msg: 'User not found' });
        const me = await User.findById(req.user.id);
        if (!me) return res.status(404).json({ msg: 'User not found' });

        me.following = (me.following || []).filter(id => String(id) !== String(target._id));
        target.followers = (target.followers || []).filter(id => String(id) !== String(me._id));

        await me.save();
        await target.save();

        res.json({ msg: 'Unfollowed user' });
    } catch (error) {
        logger.error(error);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Add a movie to the user's watchlist
// @route   POST /api/users/watchlist
const addToWatchlist = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const { movieId } = req.body;
        const mid = String(movieId);

        if (user.watchlist.map(String).includes(mid)) {
            return res.status(400).json({ msg: 'Movie already in watchlist' });
        }

        // Remove from watched if exists (handle objects)
        user.watched = (user.watched || []).filter(entry => {
            const entryId = typeof entry === 'string' ? entry : entry.movieId;
            return String(entryId) !== mid;
        });

        user.watchlist.push(mid);
        await user.save();
        res.json(user.watchlist);
    } catch (error) {
        logger.error(error);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// --- UPDATED: Add to Watched (Allows Duplicates/Rewatches) ---
const addToWatched = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const { movieId, date } = req.body;
        const mid = String(movieId);

        // --- FIX: Removed the check that prevents duplicates ---
        // We now want to allow multiple entries for rewatches

        // Remove from watchlist if it exists there
        user.watchlist = (user.watchlist || []).filter((id) => String(id) !== mid);

        // Initialize array if undefined
        user.watched = user.watched || [];
        
        // Push the new watched entry with its specific date
        // Mongoose will automatically cast this object to the subdocument schema
        user.watched.push({
            movieId: mid,
            watchedAt: date ? new Date(date) : new Date()
        });

        await user.save();
        res.json(user.watched);
    } catch (error) {
        logger.error('addToWatched error:', error);
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
        logger.error(error);
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
        
        // Filter out the movie (removes ALL instances/rewatches of this movie)
        // Handles both legacy string format and new object format
        user.watched = (user.watched || []).filter((entry) => {
            if (typeof entry === 'string') return entry !== mid;
            return entry.movieId !== mid;
        });

        await user.save();
        res.json(user.watched);
    } catch (error) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Search users by username prefix
// @route   GET /api/users/search?q=...
const searchUsers = async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        if (!q) return res.json([]);
        const re = new RegExp('^' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        const users = await User.find({ username: re }).select('username avatar').limit(12);
        res.json(users);
    } catch (error) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// DELETE /api/users/me - delete current user's account and cascade cleanups
const deleteMyAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        try {
            const Comment = require('../models/Comment');
            await Comment.deleteMany({ user: userId });
            await Review.updateMany({ likes: userId }, { $pull: { likes: userId } });
            await Review.updateMany({ 'agreementVotes.user': userId }, { $pull: { agreementVotes: { user: userId } } });
            await Review.deleteMany({ user: userId });
        } catch (e) {}

        try {
            await Discussion.deleteMany({ starter: userId });
            await Discussion.updateMany(
                { 'comments.user': userId },
                { $pull: { comments: { user: userId } } }
            );
        } catch (e) {}

        try {
            await User.updateMany({ followers: userId }, { $pull: { followers: userId } });
            await User.updateMany({ following: userId }, { $pull: { following: userId } });
        } catch (e) {}

        await User.findByIdAndDelete(userId);
        res.json({ msg: 'Account deleted' });
    } catch (error) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

module.exports = {
    getUserProfile,
    updateProfile,
    followUser,
    unfollowUser,
    addToWatchlist,
    addToWatched,
    removeFromWatchlist,
    removeFromWatched,
    searchUsers,
    deleteMyAccount,
};