const express = require('express');
const router = express.Router();
const { 
    getUserProfile, 
    addToWatchlist, 
    addToWatched, 
    removeFromWatchlist, 
    removeFromWatched, 
    updateProfile,
    removeProfilePhoto,
    followUser, 
    unfollowUser, 
    searchUsers,
    deleteMyAccount,
    checkUsername,
    updateUsernameOnly,
    getAllUsers, 
    deleteUser 
} = require('../controllers/userController');
const { getModleStatus, postModleResult } = require('../controllers/modleController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// --- 1. Static Routes (Must come FIRST) ---

// Search
router.get('/search', searchUsers);

// Admin: List All Users
// This must be before /:username so "admin" isn't treated as a username
router.get('/admin/list', protect, adminOnly, getAllUsers);

// Current User Operations
router.get('/check-username/:username', checkUsername);
router.patch('/me/username', protect, updateUsernameOnly);
router.patch('/me', protect, updateProfile);
router.delete('/me/avatar', protect, removeProfilePhoto);
router.delete('/me', protect, deleteMyAccount);

// Watchlist & Watched
router.post('/watchlist', protect, addToWatchlist);
router.delete('/watchlist', protect, removeFromWatchlist);
router.post('/watched', protect, addToWatched);
router.delete('/watched', protect, removeFromWatched);

// Modle
router.get('/modle/status', protect, getModleStatus);
router.post('/modle/result', protect, postModleResult);

// --- 2. Parameterized Routes (Must come SECOND) ---

// Follow/Unfollow (Has 2 segments, unlikely to conflict, but good to group)
router.post('/:username/follow', protect, followUser);
router.delete('/:username/follow', protect, unfollowUser);

// Get User Profile (Generic /:username)
// If this was at the top, GET /api/users/admin/list might have been intercepted
router.get('/:username', getUserProfile);

// Admin: Delete User (Generic /:id)
// Must be at the very bottom so it doesn't intercept /me, /watchlist, etc.
router.delete('/:id', protect, adminOnly, deleteUser);

module.exports = router;