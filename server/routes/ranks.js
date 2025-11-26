// server/routes/ranks.js
const express = require('express');
const router = express.Router();
const { 
  getRanks, 
  createRank, 
  updateRank, 
  toggleLikeRank, 
  getRankById, 
  deleteRank,
  addRankComment,
  deleteRankComment,
  editRankComment,
  addRankReply,
  deleteRankReply
} = require('../controllers/rankController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getRanks);
router.post('/', protect, createRank);
router.put('/:id', protect, updateRank);
router.put('/:id/like', protect, toggleLikeRank);
router.get('/:id', getRankById);
router.delete('/:id', protect, deleteRank);

// Comment routes
router.post('/:id/comments', protect, addRankComment);
router.put('/:id/comments/:commentId', protect, editRankComment);
router.delete('/:id/comments/:commentId', protect, deleteRankComment);
router.post('/:id/comments/:commentId/replies', protect, addRankReply);
router.delete('/:id/comments/:commentId/replies/:replyId', protect, deleteRankReply);

module.exports = router;