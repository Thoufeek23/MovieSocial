// server/routes/ranks.js
const express = require('express');
const router = express.Router();
const { getRanks, createRank, updateRank, getRankById, deleteRank } = require('../controllers/rankController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getRanks);
router.post('/', protect, createRank);
router.put('/:id', protect, updateRank);
router.get('/:id', getRankById);
router.delete('/:id', protect, deleteRank);

module.exports = router;