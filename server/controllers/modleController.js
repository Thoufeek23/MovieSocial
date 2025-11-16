const User = require('../models/User');
const Puzzle = require('../models/Puzzle');
const logger = require('../utils/logger');

// Fuzzy matching utilities (same as client-side)
function normalizeTitle(s) {
  if (!s) return '';
  return String(s).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prev = new Array(b.length + 1);
  let curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    const ai = a.charAt(i - 1);
    for (let j = 1; j <= b.length; j++) {
      const cost = ai === b.charAt(j - 1) ? 0 : 1;
      const deletion = prev[j] + 1;
      const insertion = curr[j - 1] + 1;
      const substitution = prev[j - 1] + cost;
      curr[j] = Math.min(deletion, insertion, substitution);
    }
    // swap
    const tmp = prev; prev = curr; curr = tmp;
  }
  return prev[b.length];
}

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

// Calculate streak from history - counts consecutive days with correct answers ending on or before today
function calculateStreakFromHistory(history, today) {
  if (!history || typeof history !== 'object') return 0;
  
  let streak = 0;
  let currentDate = today;
  
  while (currentDate) {
    const entry = historyGet(history, currentDate);
    if (entry && entry.correct) {
      streak++;
      const prevDate = getYesterdayUTC(currentDate);
      if (!prevDate) break;
      currentDate = prevDate;
    } else {
      break;
    }
  }
  
  return streak;
}

// GET /api/users/modle/status?language=English
// Returns authoritative modle status including whether user can play today
const getModleStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('modle');
    const lang = (req.query.language || 'English');
    const today = getTodayUTC();

    if (lang && String(lang).toLowerCase() === 'global') {
      const g = modleGet(user, '_global') || { lastPlayed: null, streak: 0, history: {} };
      const historyObj = (typeof g.history?.keys === 'function') ? Object.fromEntries(g.history) : (g.history || {});
      const actualStreak = calculateStreakFromHistory(historyObj, today);
      const todayEntry = historyObj[today];
      
      return res.json({ 
        ...g, 
        history: historyObj, 
        streak: actualStreak,
        canPlay: !todayEntry, // Can play if no entry for today
        playedToday: !!todayEntry,
        completedToday: todayEntry?.correct || false
      });
    }

    const modle = modleGet(user, lang) || { lastPlayed: null, streak: 0, history: {} };
    const historyObj = (typeof modle.history?.keys === 'function') ? Object.fromEntries(modle.history) : (modle.history || {});
    const actualStreak = calculateStreakFromHistory(historyObj, today);
    
    // Check global daily limit (one puzzle per day across all languages)
    const globalData = modleGet(user, '_global') || { lastPlayed: null, streak: 0, history: {} };
    const globalHistoryObj = (typeof globalData.history?.keys === 'function') ? Object.fromEntries(globalData.history) : (globalData.history || {});
    const globalStreak = calculateStreakFromHistory(globalHistoryObj, today);
    const globalTodayEntry = globalHistoryObj[today];
    
    // Check specific language status
    const todayEntry = historyObj[today];
    
    // Determine if user can play:
    // 1. If they have a global entry for today, they can't play any language
    // 2. If they completed this specific language today, they can't play this language
    const canPlay = !globalTodayEntry && !todayEntry?.correct;
    const playedToday = !!todayEntry || !!globalTodayEntry;
    const completedToday = todayEntry?.correct || false;
    const dailyLimitReached = !!globalTodayEntry;
    
    res.json({ 
      language: {
        ...modle, 
        history: historyObj, 
        streak: actualStreak
      },
      global: {
        ...globalData,
        history: globalHistoryObj,
        streak: globalStreak
      },
      canPlay,
      playedToday,
      completedToday,
      dailyLimitReached,
      primaryStreak: globalStreak // Use global streak as primary
    });
  } catch (err) {
    logger.error('getModleStatus error', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// POST /api/users/modle/result
// body: { date: 'YYYY-MM-DD', language: 'English', guess: 'USER_GUESS' }
// Note: Server validates the answer, doesn't trust client's 'correct' determination
const postModleResult = async (req, res) => {
  try {
    // Use server-side UTC date to prevent client-side tampering/refresh replay.
    const today = getTodayUTC();
    const { language = 'English', guess = '' } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Get today's puzzle to validate against
    const puzzle = await Puzzle.getPuzzleForDate(today, language);
    if (!puzzle) {
      return res.status(404).json({ msg: 'No puzzle found for today' });
    }

    // Validate the guess server-side (NEVER trust client)
    const normalizedGuess = normalizeTitle(guess.trim());
    const normalizedAnswer = normalizeTitle(puzzle.answer);
    const distance = levenshtein(normalizedGuess, normalizedAnswer);
    const threshold = Math.max(2, Math.ceil(normalizedAnswer.length * 0.2));
    const isCorrect = distance <= threshold;

    // Ensure we handle both plain object and Mongoose Map for user.modle
    let langObj = modleGet(user, language) || { lastPlayed: null, streak: 0, history: {} };

    // Ensure history container
    langObj.history = langObj.history || ({});

    // CRITICAL: Check if user already CORRECTLY SOLVED ANY language today (one per day globally)
    const globalObj = modleGet(user, '_global') || { lastPlayed: null, streak: 0, history: {} };
    const globalHistoryObj = (typeof globalObj.history?.keys === 'function') ? Object.fromEntries(globalObj.history) : (globalObj.history || {});
    const globalTodayEntry = globalHistoryObj[today];
    
    // Only block if they have a CORRECT entry for today (not just any entry)
    if (globalTodayEntry && globalTodayEntry.correct) {
      // User has already SOLVED today's puzzle in ANY language - block all further attempts
      return res.status(409).json({ 
        msg: 'Already played today\'s Modle! One puzzle per day across all languages. Come back tomorrow!', 
        language: langObj, 
        global: globalObj,
        dailyLimitReached: true
      });
    }

    // Check if user already played this specific language today (fallback safety)
    const existing = historyGet(langObj.history, today);
    if (existing) {
      // If already solved correctly today, don't allow any further attempts
      if (existing.correct) {
        const globalObjExisting = modleGet(user, '_global');
        return res.status(409).json({ msg: 'Already solved today\'s puzzle', language: langObj, global: globalObjExisting });
      }
      
      // If they haven't solved it yet, allow them to continue with more guesses
      // But merge the guesses to preserve their attempt history
      const mergedGuesses = Array.from(new Set([...(existing.guesses || []), normalizedGuess]));
      historySet(langObj.history, today, { date: today, correct: isCorrect, guesses: mergedGuesses });
    } else {
      // First attempt today - create new entry
      historySet(langObj.history, today, { date: today, correct: isCorrect, guesses: [normalizedGuess] });
    }

    // Recompute streak based on history (this handles upgrades from incorrect->correct correctly)
    const newStreak = calculateStreakFromHistory(langObj.history, today);
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
        
        // Convert Map to object if needed for consistent iteration
        let historyObj = l.history;
        if (typeof l.history.keys === 'function') {
          historyObj = Object.fromEntries(l.history);
        }
        
        Object.keys(historyObj).forEach(d => {
          try {
            const entry = historyObj[d];
            // Only add to global history if the puzzle was actually solved correctly
            // This prevents incorrect guesses from blocking play across all languages
            if (entry && entry.date && entry.correct) {
              union[d] = union[d] || { date: d, played: true, guesses: entry.guesses || [], correct: true };
            }
          } catch (e) {
            // ignore malformed entries
          }
        });
      });      const todayStr = today;
      const unionLastPlayed = Object.keys(union).length ? Object.keys(union).sort().pop() : null;
      // Calculate global streak - this is the main streak that increments daily regardless of language
      const unionStreak = calculateStreakFromHistory(union, todayStr);
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

    // Return both the language-specific and global objects with global streak as primary
    const finalGlobalObj = modleGet(user, '_global');
    const updatedLangObj = modleGet(user, language);
    res.json({ 
      language: updatedLangObj, 
      global: finalGlobalObj,
      // Send primary streak (global) for display
      primaryStreak: (finalGlobalObj && finalGlobalObj.streak) || 0
    });
  } catch (err) {
    logger.error('postModleResult error', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

module.exports = { getModleStatus, postModleResult };