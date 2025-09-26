const express = require('express');
const router = express.Router();
const { getUserProfile, addToWatchlist, addToWatched, removeFromWatchlist, removeFromWatched } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:username', getUserProfile);
router.post('/watchlist', protect, addToWatchlist);
router.post('/watched', protect, addToWatched);
router.delete('/watchlist', protect, removeFromWatchlist);
router.delete('/watched', protect, removeFromWatched);

module.exports = router;