const express = require('express');
const router = express.Router();
const { getUserProfile, addToWatchlist, addToWatched } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:username', getUserProfile);
router.post('/watchlist', protect, addToWatchlist);
router.post('/watched', protect, addToWatched);

module.exports = router;