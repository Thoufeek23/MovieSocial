const express = require('express');
const router = express.Router();
const { getUserProfile, addToWatchlist, addToWatched, removeFromWatchlist, removeFromWatched, updateProfile, followUser, unfollowUser, searchUsers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/search', searchUsers);
router.get('/:username', getUserProfile);
router.patch('/me', protect, updateProfile);
router.post('/:username/follow', protect, followUser);
router.delete('/:username/follow', protect, unfollowUser);
router.post('/watchlist', protect, addToWatchlist);
router.post('/watched', protect, addToWatched);
router.delete('/watchlist', protect, removeFromWatchlist);
router.delete('/watched', protect, removeFromWatched);

module.exports = router;