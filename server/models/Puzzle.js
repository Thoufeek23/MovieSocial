const mongoose = require('mongoose');

const PuzzleSchema = new mongoose.Schema({
  answer: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    index: true
  },
  hints: [{
    type: String,
    required: true,
    trim: true
  }],
  language: {
    type: String,
    required: true,
    enum: ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'],
    index: true
  },
  // Index within the language for deterministic daily selection
  index: {
    type: Number,
    required: true,
    min: 0
  },
  // Optional metadata
  meta: {
    year: Number,
    director: String,
    genre: String,
    notes: String
  },
  // For tracking puzzle creation and updates
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure unique index per language
PuzzleSchema.index({ language: 1, index: 1 }, { unique: true });

// Also create compound index for efficient queries
PuzzleSchema.index({ language: 1, createdAt: 1 });

// Method to get puzzle count for a language
PuzzleSchema.statics.getCountByLanguage = async function(language) {
  return this.countDocuments({ language });
};

// Method to get puzzle for specific date and language
PuzzleSchema.statics.getPuzzleForDate = async function(dateStr, language) {
  // Use the same logic as frontend for consistency
  const puzzles = await this.find({ language }).sort({ index: 1 });
  if (!puzzles.length) return null;
  
  const base = new Date(dateStr + 'T00:00:00.000Z');
  const daysSinceEpoch = Math.floor(base.getTime() / (24 * 60 * 60 * 1000));
  const n = puzzles.length;
  let index = ((daysSinceEpoch % n) + n) % n;
  
  // Avoid repeating yesterday's puzzle
  const yesterday = new Date(base.getTime() - 24 * 60 * 60 * 1000);
  const yd = Math.floor(yesterday.getTime() / (24 * 60 * 60 * 1000));
  const yIndex = ((yd % n) + n) % n;
  if (n > 1 && index === yIndex) {
    index = (index + 1) % n;
  }
  
  return puzzles[index];
};

// Method to get all puzzles for a language
PuzzleSchema.statics.getPuzzlesByLanguage = async function(language) {
  return this.find({ language }).sort({ index: 1 });
};

module.exports = mongoose.model('Puzzle', PuzzleSchema);