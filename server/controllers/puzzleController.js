const Puzzle = require('../models/Puzzle');
const logger = require('../utils/logger');

// Helper to get today's date in UTC YYYY-MM-DD format
function getTodayUTC() {
  return new Date().toISOString().slice(0, 10);
}

// GET /api/puzzles/daily?language=English&date=YYYY-MM-DD
// Get the puzzle for a specific date and language
const getDailyPuzzle = async (req, res) => {
  try {
    const { language = 'English', date = getTodayUTC() } = req.query;
    
    // Validate language
    const validLanguages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'];
    if (!validLanguages.includes(language)) {
      return res.status(400).json({ msg: 'Invalid language' });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ msg: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const puzzle = await Puzzle.getPuzzleForDate(date, language);
    
    if (!puzzle) {
      return res.status(404).json({ msg: `No puzzles found for language: ${language}` });
    }

    // Return puzzle without revealing the answer index for security
    res.json({
      id: puzzle._id,
      answer: puzzle.answer,
      hints: puzzle.hints,
      language: puzzle.language,
      meta: puzzle.meta || {},
      date: date
    });
  } catch (err) {
    logger.error('getDailyPuzzle error', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// GET /api/puzzles?language=English
// Get all puzzles for a language (admin use)
const getPuzzlesByLanguage = async (req, res) => {
  try {
    const { language = 'English' } = req.query;
    
    // Validate language
    const validLanguages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'];
    if (!validLanguages.includes(language)) {
      return res.status(400).json({ msg: 'Invalid language' });
    }

    const puzzles = await Puzzle.getPuzzlesByLanguage(language);
    
    res.json({
      language,
      count: puzzles.length,
      puzzles: puzzles.map(p => ({
        id: p._id,
        answer: p.answer,
        hints: p.hints,
        index: p.index,
        meta: p.meta || {},
        createdAt: p.createdAt
      }))
    });
  } catch (err) {
    logger.error('getPuzzlesByLanguage error', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// GET /api/puzzles/stats
// Get puzzle statistics by language
const getPuzzleStats = async (req, res) => {
  try {
    const stats = await Puzzle.aggregate([
      {
        $group: {
          _id: '$language',
          count: { $sum: 1 },
          lastAdded: { $max: '$createdAt' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const total = await Puzzle.countDocuments();

    res.json({
      total,
      byLanguage: stats.reduce((acc, stat) => {
        acc[stat._id] = {
          count: stat.count,
          lastAdded: stat.lastAdded
        };
        return acc;
      }, {})
    });
  } catch (err) {
    logger.error('getPuzzleStats error', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// POST /api/puzzles (admin only - create new puzzle)
const createPuzzle = async (req, res) => {
  try {
    const { answer, hints, language, meta = {} } = req.body;

    // Basic validation
    if (!answer || !hints || !language) {
      return res.status(400).json({ msg: 'Answer, hints, and language are required' });
    }

    if (!Array.isArray(hints) || hints.length === 0) {
      return res.status(400).json({ msg: 'Hints must be a non-empty array' });
    }

    // Validate language
    const validLanguages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'];
    if (!validLanguages.includes(language)) {
      return res.status(400).json({ msg: 'Invalid language' });
    }

    // Get the next index for this language
    const count = await Puzzle.getCountByLanguage(language);
    
    const puzzle = new Puzzle({
      answer: answer.toUpperCase().trim(),
      hints: hints.map(hint => hint.trim()),
      language,
      index: count, // Auto-increment index
      meta
    });

    await puzzle.save();

    res.status(201).json({
      id: puzzle._id,
      answer: puzzle.answer,
      hints: puzzle.hints,
      language: puzzle.language,
      index: puzzle.index,
      meta: puzzle.meta,
      createdAt: puzzle.createdAt
    });
  } catch (err) {
    if (err.code === 11000) { // Duplicate key error
      return res.status(400).json({ msg: 'Duplicate puzzle index for this language' });
    }
    logger.error('createPuzzle error', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// PUT /api/puzzles/:id (admin only - update puzzle)
const updatePuzzle = async (req, res) => {
  try {
    const { id } = req.params;
    const { answer, hints, meta } = req.body;

    const puzzle = await Puzzle.findById(id);
    if (!puzzle) {
      return res.status(404).json({ msg: 'Puzzle not found' });
    }

    // Update allowed fields
    if (answer) puzzle.answer = answer.toUpperCase().trim();
    if (hints && Array.isArray(hints)) puzzle.hints = hints.map(hint => hint.trim());
    if (meta) puzzle.meta = { ...puzzle.meta, ...meta };

    puzzle.updatedAt = new Date();
    await puzzle.save();

    res.json({
      id: puzzle._id,
      answer: puzzle.answer,
      hints: puzzle.hints,
      language: puzzle.language,
      index: puzzle.index,
      meta: puzzle.meta,
      updatedAt: puzzle.updatedAt
    });
  } catch (err) {
    logger.error('updatePuzzle error', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// DELETE /api/puzzles/:id (admin only - delete puzzle)
const deletePuzzle = async (req, res) => {
  try {
    const { id } = req.params;

    const puzzle = await Puzzle.findById(id);
    if (!puzzle) {
      return res.status(404).json({ msg: 'Puzzle not found' });
    }

    await Puzzle.findByIdAndDelete(id);

    res.json({ msg: 'Puzzle deleted successfully' });
  } catch (err) {
    logger.error('deletePuzzle error', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

module.exports = {
  getDailyPuzzle,
  getPuzzlesByLanguage,
  getPuzzleStats,
  createPuzzle,
  updatePuzzle,
  deletePuzzle
};