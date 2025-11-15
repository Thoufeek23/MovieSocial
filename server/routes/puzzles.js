const express = require('express');
const router = express.Router();
const {
  getDailyPuzzle,
  getPuzzlesByLanguage,
  getPuzzleStats,
  createPuzzle,
  updatePuzzle,
  deletePuzzle
} = require('../controllers/puzzleController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Public routes - anyone can get daily puzzles
router.get('/daily', getDailyPuzzle);
router.get('/stats', getPuzzleStats);

// Admin-only routes - require authentication and admin privileges
router.get('/', protect, adminOnly, getPuzzlesByLanguage);
router.post('/', protect, adminOnly, createPuzzle);
router.put('/:id', protect, adminOnly, updatePuzzle);
router.delete('/:id', protect, adminOnly, deletePuzzle);

module.exports = router;