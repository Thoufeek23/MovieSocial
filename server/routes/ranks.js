// server/routes/ranks.js
const express = require('express');
const router = express.Router();
const { getRanks, createRank, updateRank, toggleLikeRank, getRankById, deleteRank } = require('../controllers/rankController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getRanks);
router.post('/', protect, createRank);
router.put('/:id', protect, updateRank);
router.put('/:id/like', protect, toggleLikeRank); // Added Like Route
router.get('/:id', getRankById);
router.delete('/:id', protect, deleteRank);

module.exports = router;