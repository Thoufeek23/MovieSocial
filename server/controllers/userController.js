const User = require('../models/User');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');
const Discussion = require('../models/Discussion');
const Review = require('../models/Review');
const Comment = require('../models/Comment');

// @desc    Get user profile
// @route   GET /api/users/:username
const getUserProfile = async (req, res) => {
    const username = req.params.username;
    
    try {
        // Get user
        const user = await User.findOne({ username: username }).select('-passwordHash');
        
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Build basic profile
        const basicProfile = {
            _id: String(user._id),
            username: user.username,
            email: user.email,
            bio: user.bio || '',
            avatar: user.avatar || '/default_dp.png',
            interests: user.interests || [],
            watched: (user.watched || []).map(entry => 
              typeof entry === 'string' ? entry : entry.movieId || entry
            ),
            watchlist: (user.watchlist || []).filter(id => id),
            followers: [],
            following: [],
            followersCount: 0,
            followingCount: 0,
            isFollowedByCurrentUser: false,
            discussionsStarted: 0,
            discussionsParticipated: 0,
            communityAgreement: { average: null, breakdown: { agreePercent: 0, partialPercent: 0, disagreePercent: 0 }, totalVotes: 0 }
        };

        // Try to load followers
        try {
            if (user.followers && Array.isArray(user.followers) && user.followers.length > 0) {
                const followers = await User.find({ _id: { $in: user.followers } }, 'username avatar');
                basicProfile.followers = followers.map(f => ({ _id: f._id, username: f.username, avatar: f.avatar }));
                basicProfile.followersCount = followers.length;
            }
        } catch (e) {
            console.error(`[PROFILE] Error loading followers:`, e.message);
        }

        // Try to load following
        try {
            if (user.following && Array.isArray(user.following) && user.following.length > 0) {
                const following = await User.find({ _id: { $in: user.following } }, 'username avatar');
                basicProfile.following = following.map(f => ({ _id: f._id, username: f.username, avatar: f.avatar }));
                basicProfile.followingCount = following.length;
            }
        } catch (e) {
            console.error(`[PROFILE] Error loading following:`, e.message);
        }

        // Try to get discussions
        try {
            const startedCount = await Discussion.countDocuments({ starter: user._id });
            basicProfile.discussionsStarted = startedCount;
        } catch (e) {
            console.error(`[PROFILE] Error counting discussions:`, e.message);
        }

        // Try to get community agreement
        try {
            const reviews = await Review.find({ user: user._id }).select('agreementVotes');
            
            if (reviews.length > 0) {
                let totalVotes = 0;
                let sumValues = 0;
                let agreeCount = 0;
                let partialCount = 0;
                let disagreeCount = 0;

                reviews.forEach(r => {
                    if (!r.agreementVotes) return;
                    r.agreementVotes.forEach(v => {
                        if (typeof v.value === 'number') {
                            totalVotes++;
                            sumValues += v.value;
                            if (v.value === 1) agreeCount++;
                            else if (v.value === 0.5) partialCount++;
                            else if (v.value === 0) disagreeCount++;
                        }
                    });
                });

                if (totalVotes > 0) {
                    basicProfile.communityAgreement = {
                        average: Math.round((sumValues / totalVotes) * 100),
                        breakdown: {
                            agreePercent: Math.round((agreeCount / totalVotes) * 100),
                            partialPercent: Math.round((partialCount / totalVotes) * 100),
                            disagreePercent: Math.round((disagreeCount / totalVotes) * 100)
                        },
                        totalVotes
                    };
                }
            }
        } catch (e) {
            console.error(`[PROFILE] Error getting reviews:`, e.message);
        }

        res.json(basicProfile);

    } catch (error) {
        console.error(`[PROFILE] ERROR:`, error.message);
        console.error(error);
        res.status(500).json({ msg: 'Server Error', details: error.message });
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
        
        // --- MODIFIED LOGIC START ---
        if (!q) {
            // If no query is provided, return the top 20 users with the most followers
            const users = await User.aggregate([
                // Calculate size of followers array
                { $addFields: { followersCount: { $size: { $ifNull: ["$followers", []] } } } },
                // Sort by followers count descending
                { $sort: { followersCount: -1 } },
                { $limit: 20 },
                // Return only necessary fields
                { $project: { username: 1, avatar: 1, followersCount: 1 } }
            ]);
            return res.json(users);
        }
        // --- MODIFIED LOGIC END ---

        const re = new RegExp('^' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        const users = await User.find({ username: re }).select('username avatar').limit(12);
        res.json(users);
    } catch (error) {
        // Use logger if available, otherwise console
        if (typeof logger !== 'undefined') logger.error(error);
        else console.error(error);
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

// @desc    Get all users (Admin only)
// @route   GET /api/users/admin/list
const getAllUsers = async (req, res) => {
    try {
        // Return all users sorted by newest first
        const users = await User.find({})
            .select('-passwordHash')
            .sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        logger.error(error);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Delete a user by ID (Admin only)
// @route   DELETE /api/users/:id
const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // Prevent deleting yourself via this route
        if (req.user.id === userId) {
             return res.status(400).json({ msg: 'You cannot delete your own admin account from here.' });
        }

        // --- Cleanup Logic (Same as deleteMyAccount) ---
        try {
            await Comment.deleteMany({ user: userId });
            await Review.updateMany({ likes: userId }, { $pull: { likes: userId } });
            await Review.updateMany({ 'agreementVotes.user': userId }, { $pull: { agreementVotes: { user: userId } } });
            await Review.deleteMany({ user: userId });
        } catch (e) { logger.error(e); }

        try {
            await Discussion.deleteMany({ starter: userId });
            await Discussion.updateMany(
                { 'comments.user': userId },
                { $pull: { comments: { user: userId } } }
            );
        } catch (e) { logger.error(e); }

        try {
            await User.updateMany({ followers: userId }, { $pull: { followers: userId } });
            await User.updateMany({ following: userId }, { $pull: { following: userId } });
        } catch (e) { logger.error(e); }

        await User.findByIdAndDelete(userId);
        
        logger.info(`User ${user.username} deleted by Admin ${req.user.username}`);
        res.json({ msg: 'User deleted successfully' });

    } catch (error) {
        logger.error(error);
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
    getAllUsers, // New export
    deleteUser,  // New export
};