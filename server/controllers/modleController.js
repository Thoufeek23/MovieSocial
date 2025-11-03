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

// History helpers to work with either Map or plain object
function historyGet(history, date) {
  if (!history) return undefined;
  if (typeof history.get === 'function') return history.get(date);
  return history[date];
}

function historySet(history, date, val) {
  if (!history) return;
  if (typeof history.set === 'function') return history.set(date, val);
  history[date] = val;
}

function getTodayUTC() {
  return new Date().toISOString().slice(0, 10);
}

function getYesterdayUTC(dateStr) {
  const parts = String(dateStr).split('-').map(n => parseInt(n, 10));
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  d.setUTCDate(d.getUTCDate() - 1);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

// GET /api/users/modle/status?language=English
// Returns authoritative modle status. Streaks are evaluated server-side using UTC days.
const getModleStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('modle');
    const lang = (req.query.language || 'English');
    // support a special 'global' language which returns the union-by-date history
    const today = getTodayUTC();

    if (lang && String(lang).toLowerCase() === 'global') {
      const g = modleGet(user, '_global') || { lastPlayed: null, streak: 0, history: {} };
      // If the lastPlayed isn't today or yesterday, the displayed streak should be 0 (user missed a day)
      if (!g.lastPlayed) return res.json({ ...g, streak: 0 });
      const yesterday = getYesterdayUTC(today);
      if (g.lastPlayed !== today && g.lastPlayed !== yesterday) return res.json({ ...g, streak: 0 });
      return res.json(g);
    }

    const modle = modleGet(user, lang) || { lastPlayed: null, streak: 0, history: {} };
    // If user hasn't played today (and also didn't play yesterday), streak is considered 0 per requirement
    if (!modle.lastPlayed) return res.json({ ...modle, streak: 0 });
    const yesterday = getYesterdayUTC(today);
    if (modle.lastPlayed !== today && modle.lastPlayed !== yesterday) return res.json({ ...modle, streak: 0 });
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
    // Use server-side UTC date to prevent client-side tampering/refresh replay.
    const today = getTodayUTC();
    const { language = 'English', correct = false, guesses = [] } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Ensure we handle both plain object and Mongoose Map for user.modle
    let langObj = modleGet(user, language) || { lastPlayed: null, streak: 0, history: {} };

    // Ensure history container
    langObj.history = langObj.history || ({});

    // If an entry exists for today, allow updating it when turning an incorrect entry into a correct one
    const existing = historyGet(langObj.history, today);
    if (existing) {
      // If already correct today, do not allow further changes
      if (existing.correct) {
        const globalObjExisting = modleGet(user, '_global');
        return res.status(409).json({ msg: 'Already played today', language: langObj, global: globalObjExisting });
      }

      // Merge guesses (preserve existing guesses and add new ones)
      const mergedGuesses = Array.from(new Set([...(existing.guesses || []), ...(guesses || [])]));
      // If the new submission is correct, upgrade the entry; otherwise just update guesses
      const newCorrect = existing.correct || !!correct;
      historySet(langObj.history, today, { date: today, correct: newCorrect, guesses: mergedGuesses });
    } else {
      // No entry for today yet — create one
      historySet(langObj.history, today, { date: today, correct: !!correct, guesses: guesses || [] });
    }

    // Helper: compute consecutive correct-streak from history (UTC-aware)
    const computeConsecutiveCorrect = (history = {}, todayStr) => {
      if (!history || typeof history !== 'object') return 0;
      let count = 0;
      let d = todayStr;
      while (true) {
        const entry = historyGet(history, d);
        if (entry && entry.correct) {
          count += 1;
          const prev = getYesterdayUTC(d);
          if (!prev) break;
          d = prev;
        } else break;
      }
      return count;
    };

    // Recompute streak based on history (this handles upgrades from incorrect->correct correctly)
    const newStreak = computeConsecutiveCorrect(langObj.history, today);
    langObj.lastPlayed = today;
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
        // history may be a Map or plain object; iterate accordingly
        if (typeof l.history.keys === 'function') {
          for (const d of l.history.keys()) {
            try {
              const entry = historyGet(l.history, d);
              if (entry) {
                // Preserve whether the entry was a correct solve so global streaks count correctly
                union[d] = union[d] || { date: d, played: true, guesses: entry.guesses || [], correct: !!entry.correct };
              }
            } catch (e) {
              // ignore malformed entries
            }
          }
        } else {
          Object.keys(l.history).forEach(d => {
            try {
              const entry = l.history[d];
              if (entry) union[d] = union[d] || { date: d, played: true, guesses: entry.guesses || [], correct: !!entry.correct };
            } catch (e) {
              // ignore malformed
            }
          });
        }
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
            const prev = getYesterdayUTC(d);
            if (!prev) break;
            d = prev;
          } else break;
        }
        return count;
      };

      const todayStr = today;
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