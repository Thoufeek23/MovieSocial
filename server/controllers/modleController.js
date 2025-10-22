const User = require('../models/User');
const logger = require('../utils/logger');

// Helper to ensure nested objects
function ensure(obj, key, defaultVal) {
  if (!obj[key]) obj[key] = defaultVal;
  return obj[key];
}

// GET /api/users/modle/status?language=English
const getModleStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('modle');
    const lang = req.query.language || 'English';
    const modle = (user && user.modle && user.modle[lang]) ? user.modle[lang] : { lastPlayed: null, streak: 0, history: {} };
    res.json(modle);
  } catch (err) {
    logger.error('getModleStatus error', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// POST /api/users/modle/result
// body: { date: 'YYYY-MM-DD', language: 'English', correct: boolean, guesses: [] }
const postModleResult = async (req, res) => {
  try {
    const { date, language = 'English', correct = false, guesses = [] } = req.body;
    if (!date) return res.status(400).json({ msg: 'date is required' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    user.modle = user.modle || {};
    user.modle[language] = user.modle[language] || { lastPlayed: null, streak: 0, history: {} };

    // Prevent overwriting if result already recorded for this date
    if (user.modle[language].history && user.modle[language].history[date]) {
      // return current record
      return res.json(user.modle[language]);
    }

    // Determine new streak value
    const prevDate = user.modle[language].lastPlayed;
    const yesterday = new Date(new Date(date).getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    let newStreak = user.modle[language].streak || 0;
    if (correct) {
      if (prevDate === yesterday) newStreak = (user.modle[language].streak || 0) + 1;
      else newStreak = 1;
    }

    // Save history for the date
    user.modle[language].history = user.modle[language].history || {};
    user.modle[language].history[date] = { date, correct, guesses };
    user.modle[language].lastPlayed = date;
    user.modle[language].streak = newStreak;

    await user.save();

    res.json(user.modle[language]);
  } catch (err) {
    logger.error('postModleResult error', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

module.exports = { getModleStatus, postModleResult };
