const express = require('express');
const router = express.Router();
const { getUserProfile, addToWatchlist, addToWatched, removeFromWatchlist, removeFromWatched, updateProfile, followUser, unfollowUser, searchUsers } = require('../controllers/userController');
const { getModleStatus, postModleResult } = require('../controllers/modleController');
const { protect } = require('../middleware/authMiddleware');

router.get('/search', searchUsers);
router.get('/:username', getUserProfile);
router.patch('/me', protect, updateProfile);
router.delete('/me', protect, require('../controllers/userController').deleteMyAccount);
router.post('/:username/follow', protect, followUser);
router.delete('/:username/follow', protect, unfollowUser);
router.post('/watchlist', protect, addToWatchlist);
router.post('/watched', protect, addToWatched);
router.delete('/watchlist', protect, removeFromWatchlist);
router.delete('/watched', protect, removeFromWatched);

// Modle endpoints for persisting daily results and fetching status
router.get('/modle/status', protect, getModleStatus);
router.post('/modle/result', protect, postModleResult);

module.exports = router;