const User = require('../models/User');
const Puzzle = require('../models/Puzzle');
const logger = require('../utils/logger');

// --- Fuzzy Matching Utilities ---

/**
 * Normalizes a movie title for comparison.
 * @param {string} s The string to normalize.
 * @returns {string} The normalized, uppercase string.
 */
function normalizeTitle(s) {
  if (!s) return '';
  return String(s).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Calculates the Levenshtein distance between two strings.
 * @param {string} a The first string.
 * @param {string} b The second string.
 * @returns {number} The distance.
 */
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

// --- Date Utilities ---

/**
 * Gets today's date in 'YYYY-MM-DD' format (UTC).
 * @returns {string}
 */
function getTodayUTC() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Gets yesterday's date in 'YYYY-MM-DD' format (UTC).
 * @param {string} dateStr Today's date string.
 * @returns {string | null}
 */
function getYesterdayUTC(dateStr) {
  const parts = String(dateStr).split('-').map(n => parseInt(n, 10));
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  d.setUTCDate(d.getUTCDate() - 1);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

// --- Mongoose Map/Object Helper Utilities ---
// These are necessary to abstract over whether user.modle is a plain Object or Mongoose Map

/**
 * Safely gets a value from the user.modle Map/Object.
 */
function modleGet(user, key) {
  if (!user.modle) return undefined;
  if (typeof user.modle.get === 'function') return user.modle.get(key);
  return user.modle[key];
}

/**
 * Safely sets a value on the user.modle Map/Object.
 */
function modleSet(user, key, val) {
  if (!user.modle) user.modle = {};
  if (typeof user.modle.set === 'function') return user.modle.set(key, val);
  user.modle[key] = val;
}

/**
 * Safely gets keys from the user.modle Map/Object.
 */
function modleKeys(user) {
  if (!user.modle) return [];
  if (typeof user.modle.keys === 'function') return Array.from(user.modle.keys());
  return Object.keys(user.modle || {});
}

/**
 * Safely gets a value from a history Map/Object.
 */
function historyGet(history, date) {
  if (!history) return undefined;
  if (typeof history.get === 'function') return history.get(date);
  return history[date];
}

/**
 * Safely sets a value on a history Map/Object.
 */
function historySet(history, date, val) {
  if (!history) return;
  if (typeof history.set === 'function') return history.set(date, val);
  history[date] = val;
}

// --- Streak Calculation Utility ---

/**
 * Calculates streak from history - counts consecutive days with correct answers
 * ending on or before today.
 * @param {object | Map} history The history object (or Map) of { 'YYYY-MM-DD': { correct: boolean } }
 * @param {string} today Today's date string 'YYYY-MM-DD'
 * @returns {number} The calculated streak.
 */
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

// --- Controller Functions ---

/**
 * GET /api/users/modle/status
 * Returns authoritative modle status including whether user can play today.
 * Handles ?language=English (for language-specific)
 * and ?language=global (for global-only stats)
 */
const getModleStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('modle');
    const lang = (req.query.language || 'English');
    const today = getTodayUTC();

    // Helper to convert Mongoose Map to plain object if needed
    const getHistoryObj = (historyMap) => {
      if (!historyMap) return {};
      if (typeof historyMap.keys === 'function') {
        return Object.fromEntries(historyMap);
      }
      return historyMap;
    };

    if (lang && String(lang).toLowerCase() === 'global') {
      // --- Global-only request ---
      const g = modleGet(user, '_global') || { lastPlayed: null, streak: 0, history: {} };
      const historyObj = getHistoryObj(g.history);
      const actualStreak = calculateStreakFromHistory(historyObj, today);
      const todayEntry = historyObj[today];
      
      return res.json({ 
        ...g, 
        history: historyObj, 
        streak: actualStreak,
        canPlay: !todayEntry, // Can play if no global entry for today
        playedToday: !!todayEntry,
        completedToday: todayEntry?.correct || false
      });
    }

    // --- Language-specific request ---
    
    // Get language-specific data
    const modle = modleGet(user, lang) || { lastPlayed: null, streak: 0, history: {} };
    const historyObj = getHistoryObj(modle.history);
    const actualStreak = calculateStreakFromHistory(historyObj, today);
    const todayEntry = historyObj[today];
    
    // Get global data for cross-checking
    const globalData = modleGet(user, '_global') || { lastPlayed: null, streak: 0, history: {} };
    const globalHistoryObj = getHistoryObj(globalData.history);
    const globalStreak = calculateStreakFromHistory(globalHistoryObj, today);
    const globalTodayEntry = globalHistoryObj[today];
    
    // Determine play status:
    // 1. If they have a global entry (i.e., solved in *any* language), they can't play.
    // 2. If they completed *this specific* language today, they can't play.
    const canPlay = !globalTodayEntry && !todayEntry?.correct;
    const playedToday = !!todayEntry || !!globalTodayEntry;
    const completedToday = todayEntry?.correct || false;
    const dailyLimitReached = !!globalTodayEntry; // True if they *solved* any language
    
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
      primaryStreak: globalStreak // Global streak is the primary one
    });
  } catch (err) {
    logger.error('getModleStatus error', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

/**
 * POST /api/users/modle/result
 * body: { language: 'English', guess: 'USER_GUESS' }
 * Validates guess server-side, updates user state, and returns new state.
 */
const postModleResult = async (req, res) => {
  try {
    // Use server-side UTC date to prevent client-side tampering.
    const today = getTodayUTC();
    const { language = 'English', guess = '' } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // 1. Get today's puzzle to validate against
    const puzzle = await Puzzle.getPuzzleForDate(today, language);
    if (!puzzle) {
      return res.status(404).json({ msg: 'No puzzle found for today' });
    }

    // 2. Validate the guess server-side (NEVER trust client)
    const normalizedGuess = normalizeTitle(guess.trim());
    const normalizedAnswer = normalizeTitle(puzzle.answer);
    const distance = levenshtein(normalizedGuess, normalizedAnswer);
    // Allow 20% margin of error, or 2 chars, whichever is larger
    const threshold = Math.max(2, Math.ceil(normalizedAnswer.length * 0.2)); 
    const isCorrect = distance <= threshold;

    // 3. Get user's modle objects
    let langObj = modleGet(user, language) || { lastPlayed: null, streak: 0, history: {} };
    langObj.history = langObj.history || ({});
    const globalObj = modleGet(user, '_global') || { lastPlayed: null, streak: 0, history: {} };
    
    // 4. CRITICAL: Check if user already SOLVED ANY language today
    const globalHistoryObj = (typeof globalObj.history?.keys === 'function') ? Object.fromEntries(globalObj.history) : (globalObj.history || {});
    const globalTodayEntry = globalHistoryObj[today];
    
    if (globalTodayEntry && globalTodayEntry.correct) {
      // User has already SOLVED today's puzzle. Block all further attempts.
      return res.status(409).json({ 
        msg: 'Already played today\'s Modle! One puzzle per day. Come back tomorrow!', 
        language: langObj, 
        global: globalObj,
        dailyLimitReached: true
      });
    }

    // 5. Update language-specific history
    const existing = historyGet(langObj.history, today);
    
    // --- ADDED: Helper function for checking guesses ---
    const checkGuess = (g) => levenshtein(g, normalizedAnswer) <= threshold;
    // ---------------------------------------------------

    if (existing) {
      // User is continuing guesses for this language
      if (existing.correct) {
        // This shouldn't be reachable if global check is working, but as a safety:
        return res.status(409).json({ msg: 'Already solved today\'s puzzle', language: langObj, global: globalObj });
      }
      
      // Merge guesses to preserve attempt history
      const mergedGuesses = Array.from(new Set([...(existing.guesses || []), normalizedGuess]));
      
      // --- ADDED: Create guessesStatus array ---
      const guessesStatus = mergedGuesses.map(g => checkGuess(g));
      // -----------------------------------------

      historySet(langObj.history, today, { 
        date: today, 
        correct: isCorrect, 
        guesses: mergedGuesses, 
        guessesStatus: guessesStatus // --- ADDED ---
      });
    } else {
      // First attempt today for this language
      // --- ADDED: Create guessesStatus array ---
      const guessesStatus = [isCorrect];
      // -----------------------------------------
      
      historySet(langObj.history, today, { 
        date: today, 
        correct: isCorrect, 
        guesses: [normalizedGuess], 
        guessesStatus: guessesStatus // --- ADDED ---
      });
    }

    // 6. Recompute language-specific streak
    const newStreak = calculateStreakFromHistory(langObj.history, today);
    langObj.lastPlayed = today;
    langObj.streak = newStreak;
    modleSet(user, language, langObj);

    // 7. Recompute GLOBAL history (only if this guess was correct)
    if (isCorrect) {
      try {
        const union = {};
        const keys = modleKeys(user);
        
        // Build a union of all *correct* solves from all languages
        keys.forEach(k => {
          if (!k || k === '_global') return;
          const l = modleGet(user, k);
          if (!l || !l.history) return;
          
          let historyObj = l.history;
          if (typeof l.history.keys === 'function') {
            historyObj = Object.fromEntries(l.history);
          }
          
          Object.keys(historyObj).forEach(d => {
            const entry = historyObj[d];
            // Only add correct solves to global history
            if (entry && entry.date && entry.correct) {
              union[d] = union[d] || { date: d, correct: true };
            }
          });
        });
        
        const unionLastPlayed = Object.keys(union).length ? Object.keys(union).sort().pop() : null;
        // Calculate global streak (the primary streak)
        const unionStreak = calculateStreakFromHistory(union, today);
        modleSet(user, '_global', { lastPlayed: unionLastPlayed, streak: unionStreak, history: union });
        
      } catch (e) {
        logger.error('Failed to update global modle history', e);
        // Do not fail the request if global aggregation fails
      }
    }

    // 8. Mark for Mongoose and save
    try {
      if (typeof user.markModified === 'function') user.markModified('modle');
    } catch (e) {
      // ignore
    }
    await user.save();

    // 9. Return the new state
    const finalGlobalObj = modleGet(user, '_global');
    const updatedLangObj = modleGet(user, language);
    
    res.json({ 
      language: updatedLangObj, 
      global: finalGlobalObj,
      primaryStreak: (finalGlobalObj && finalGlobalObj.streak) || 0,
      // --- FIX ---
      // Send the correct, full answer string ONLY IF they solved it.
      // This fixes the blank "The movie was ." bug on the client.
      solvedAnswer: isCorrect ? puzzle.answer : null
    });
  } catch (err) {
    logger.error('postModleResult error', err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

module.exports = { getModleStatus, postModleResult };