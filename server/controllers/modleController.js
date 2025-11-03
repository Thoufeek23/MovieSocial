const User = require('../models/User');
const logger = require('../utils/logger');

// Helper to ensure nested objects
function ensure(obj, key, defaultVal) {
  if (!obj[key]) obj[key] = defaultVal;
  return obj[key];
}

// Helpers to abstract over plain object or Mongoose Map for user.modle
function modleGet(user, key) {
  if (!user.modle) return undefined;
  if (typeof user.modle.get === 'function') return user.modle.get(key);
  return user.modle[key];
}

function modleSet(user, key, val) {
  if (!user.modle) user.modle = {};
  if (typeof user.modle.set === 'function') return user.modle.set(key, val);
  user.modle[key] = val;
}

function modleKeys(user) {
  if (!user.modle) return [];
  if (typeof user.modle.keys === 'function') return Array.from(user.modle.keys());
  return Object.keys(user.modle || {});
}

// GET /api/users/modle/status?language=English
const getModleStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('modle');
    const lang = (req.query.language || 'English');
    // support a special 'global' language which returns the union-by-date history
    if (lang && String(lang).toLowerCase() === 'global') {
      const g = modleGet(user, '_global') || { lastPlayed: null, streak: 0, history: {} };
      return res.json(g);
    }

    const modle = modleGet(user, lang) || { lastPlayed: null, streak: 0, history: {} };
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
    // Ensure we handle both plain object and Mongoose Map for user.modle
    let langObj = modleGet(user, language) || { lastPlayed: null, streak: 0, history: {} };

    // Prevent overwriting if result already recorded for this date
    if (langObj.history && langObj.history[date]) {
      return res.json(langObj);
    }

    // Determine new streak value
    const prevDate = langObj.lastPlayed;
    // Parse incoming date (expected 'YYYY-MM-DD') as a local date (avoid timezone shifts)
    let yesterday = null;
    try {
      const parts = String(date).split('-').map(n => parseInt(n, 10));
      if (parts.length === 3 && parts.every(p => !Number.isNaN(p))) {
        const parsed = new Date(parts[0], parts[1] - 1, parts[2]); // local date
        const yd = new Date(parsed.getTime() - 24 * 60 * 60 * 1000);
        yesterday = `${yd.getFullYear()}-${String(yd.getMonth() + 1).padStart(2, '0')}-${String(yd.getDate()).padStart(2, '0')}`;
      }
    } catch (e) {
      // fallback to the old UTC-based calculation if parsing fails
      yesterday = new Date(new Date(date).getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    }

  let newStreak = langObj.streak || 0;
    if (correct) {
      // If the previous play was exactly yesterday, increment the streak.
      // Otherwise, the user missed a day — reset the streak to 0 per new requirement.
      if (prevDate === yesterday) newStreak = (user.modle[language].streak || 0) + 1;
      else newStreak = 0;
    }

  // Save history for the date (language-specific)
  langObj.history = langObj.history || {};
  langObj.history[date] = { date, correct, guesses };
  langObj.lastPlayed = date;
  langObj.streak = newStreak;
  modleSet(user, language, langObj);

    // Recompute a global, union-by-date history across all languages and store it at user.modle._global
    try {
      const union = {};
      const keys = modleKeys(user);
      keys.forEach(k => {
        if (!k || k === '_global') return;
        const l = modleGet(user, k);
        if (!l || !l.history) return;
        Object.keys(l.history).forEach(d => {
          try {
            const entry = l.history[d];
            if (entry && entry.correct) {
              // mark the date as correct in the union; store one of the guesses if available
              union[d] = union[d] || { date: d, correct: true, guesses: entry.guesses || [] };
            }
          } catch (e) {
            // ignore malformed entries
          }
        });
      });

      // helper to compute streak from union history using local date strings (YYYY-MM-DD)
      const computeStreak = (history = {}, todayStr) => {
        if (!history || typeof history !== 'object') return 0;
        let count = 0;
        let d = todayStr;
        while (true) {
          const entry = history[d];
          if (entry && entry.correct) {
            count += 1;
            const parts = String(d).split('-').map(n => parseInt(n, 10));
            if (parts.length !== 3 || parts.some(isNaN)) break;
            const prev = new Date(parts[0], parts[1] - 1, parts[2]);
            prev.setDate(prev.getDate() - 1);
            const y = prev.getFullYear();
            const m = String(prev.getMonth() + 1).padStart(2, '0');
            const day = String(prev.getDate()).padStart(2, '0');
            d = `${y}-${m}-${day}`;
          } else break;
        }
        return count;
      };

      const todayStr = date;
      const unionLastPlayed = Object.keys(union).length ? Object.keys(union).sort().pop() : null;
      const unionStreak = computeStreak(union, todayStr);
      modleSet(user, '_global', { lastPlayed: unionLastPlayed, streak: unionStreak, history: union });
    } catch (e) {
      // if global aggregation fails, ignore and continue with language-specific save
    }

    // If `modle` is a Mixed/plain Object, ensure Mongoose notices nested changes
    try {
      if (typeof user.markModified === 'function') user.markModified('modle');
    } catch (e) {
      // ignore
    }

    await user.save();

    // Return both the language-specific and global objects so client can display the authoritative streak
    const globalObj = modleGet(user, '_global');
    res.json({ language: modleGet(user, language), global: globalObj });
  } catch (err) {
    logger.error('postModleResult error', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

module.exports = { getModleStatus, postModleResult };
