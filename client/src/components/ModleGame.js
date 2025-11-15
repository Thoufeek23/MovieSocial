import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { normalizeTitle, levenshtein } from '../utils/fuzzy';
import { motion, AnimatePresence } from 'framer-motion';
import * as api from '../api';
import { ModleContext } from '../context/ModleContext';

// API wrapper (centralized in client/src/api/index.js)

// Note: localStorage usage for modle state removed. Server is the source-of-truth for authenticated users.
// Local date helper (YYYY-MM-DD) using the user's local timezone
function localYYYYMMDD(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
// no localStorage key helpers — we no longer persist modle state in localStorage



const ModleGame = ({ puzzles: propPuzzles, language = 'English' }) => {
  const { user } = useContext(AuthContext);
  const { updateFromServerPayload, refreshGlobal } = useContext(ModleContext);
  // determine today's date string in YYYY-MM-DD
  const todayStr = localYYYYMMDD();
  const effectiveDate = todayStr;
  
  // State for puzzle - now loaded from backend
  const [puzzle, setPuzzle] = useState(null);
  const [puzzleLoading, setPuzzleLoading] = useState(true);
  const [puzzleError, setPuzzleError] = useState(null);
  const [guess, setGuess] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [todayPlayed, setTodayPlayed] = useState(null); // null | { date, correct, guesses }
  const [streak, setStreak] = useState(0);
  const [revealedHints, setRevealedHints] = useState(1);

  // Calculate values that depend on puzzle being loaded
  const normAnswer = puzzle ? normalizeTitle(puzzle.answer || '') : '';
  const fuzzyThreshold = Math.max(2, Math.ceil((normAnswer.length || 0) * 0.2));
  const maxReveal = puzzle ? Math.min(5, (puzzle.hints && puzzle.hints.length) || 5) : 5;

  // Load puzzle from backend
  useEffect(() => {
    const loadPuzzle = async () => {
      try {
        setPuzzleLoading(true);
        setPuzzleError(null);
        
        const res = await api.getDailyPuzzle(language, effectiveDate);
        if (res && res.data) {
          const puzzleData = res.data;
          setPuzzle({
            answer: puzzleData.answer,
            hints: puzzleData.hints,
            date: puzzleData.date,
            meta: puzzleData.meta || {}
          });
        } else {
          throw new Error('No puzzle data received');
        }
      } catch (error) {
        console.error('Failed to load puzzle:', error);
        setPuzzleError(error.message || 'Failed to load puzzle');
        // Fallback to a default puzzle structure
        setPuzzle({
          answer: 'LOADING',
          hints: ['Puzzle is loading...', 'Please check your connection'],
          date: effectiveDate,
          meta: {}
        });
      } finally {
        setPuzzleLoading(false);
      }
    };

    loadPuzzle();
  }, [language, effectiveDate]);

  useEffect(() => {
    // If user is signed in, prefer server as the source-of-truth.
    const load = async () => {
      try {
        if (user && localStorage.getItem('token')) {
          // First check global status to see if user has played today
          const globalRes = await api.getModleStatus('global');
          if (globalRes && globalRes.data) {
            const globalServer = globalRes.data;
            const today = effectiveDate;
            
            // Check if user has played ANY language today
            if (globalServer.history && globalServer.history[today]) {
              // User has already played today - block all languages
              setTodayPlayed({ 
                correct: true, 
                globalDaily: true, 
                date: today,
                msg: 'Already played today\'s Modle! One puzzle per day across all languages.' 
              });
              setStreak(globalServer.streak || 0);
              setGuesses([]);
              setRevealedHints(1);
              return;
            }
          }
          
          // If not played globally, get language-specific data
          const res = await api.getModleStatus(language);
          if (res && res.data) {
            const server = res.data;
            const today = effectiveDate;
            if (server.history && server.history[today]) {
              setTodayPlayed(server.history[today]);
              setGuesses(server.history[today].guesses || []);
              const prevGuesses = (server.history[today].guesses || []).length;
              setRevealedHints(Math.min(maxReveal, Math.max(1, prevGuesses + 1)));
            } else {
              setTodayPlayed(null);
              setGuesses([]);
              setRevealedHints(1);
            }
            // Use global streak for display (cross-language streak)
            setStreak(server.globalStreak || server.streak || 0);
            return;
          }
        }
      } catch (e) {
        // server fetch failed; fall back to localStorage below
      }

      // No persistent localStorage fallback: for unauthenticated users or if server fetch fails
      // we keep in-memory defaults so the UI remains functional but not persisted across reloads.
      setTodayPlayed(null);
      setGuesses([]);
      setRevealedHints(1);
      setStreak(0);
    };

    // Only load modle status if puzzle is loaded
    if (puzzle && !puzzleLoading) {
      load();
    }
  }, [puzzle, user, maxReveal, language, effectiveDate, puzzleLoading]);

  // No persistent saveState: persistence happens on the server for authenticated users.

  const handleSubmitGuess = (e) => {
    e.preventDefault();
    const normalized = (guess || '').toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!normalized) return;
    if (todayPlayed && (todayPlayed.correct || todayPlayed.globalDaily)) {
      const message = todayPlayed.globalDaily 
        ? 'Already played today\'s Modle! One puzzle per day across all languages. Come back tomorrow!' 
        : 'You already solved today\'s puzzle.';
      toast.error(message);
      return;
    }

    // Enforce one guess per revealed hint until the player has seen maxReveal hints.
    // If revealedHints < maxReveal, player may only submit up to revealedHints guesses.
    if (!(revealedHints >= maxReveal || guesses.length < revealedHints)) {
      toast('Submit a guess to reveal the next hint.'); // Simplified message
      return;
    }

    const newGuesses = [...guesses, normalized];
    setGuesses(newGuesses);

    // Reveal another hint after each submitted guess, up to the configured cap (maxReveal)
    setRevealedHints(prev => Math.min(maxReveal, prev + 1));

    // Fuzzy matching: allow small typos. Normalize and compute Levenshtein distance.
    const normAnswer = normalizeTitle(puzzle.answer);
    const guessNorm = normalized;
    const dist = levenshtein(guessNorm, normAnswer);
    // threshold rules: allow distance up to 2 or 20% of answer length (whichever is larger)
    const threshold = Math.max(2, Math.ceil(normAnswer.length * 0.2));
    const isCorrect = dist <= threshold;
    const today = effectiveDate;

  // Build an in-memory history entry for the UI. For authenticated users we will persist
  // immediately to the server and update the UI from the server response.
  const newHistory = {};
  newHistory[today] = { date: today, correct: isCorrect, guesses: newGuesses };

  // Update UI immediately (in-memory) - streak will be updated from server response
  setTodayPlayed(newHistory[today]);
  setGuesses(newGuesses);

    if (isCorrect) {
      const note = dist > 0 ? ' (accepted with minor typo)' : '';
      toast.success(`Correct! The movie was ${puzzle.answer}.${note}`);
      // Sync result to server if user is authenticated. Update UI from server response (authoritative).
      (async () => {
        try {
            // prepare holders so we can dispatch an event after sync
            let langObj = null;
            let globalObj = null;
            if (user && localStorage.getItem('token')) {
            const res = await api.postModleResult({ date: today, language, correct: true, guesses: newGuesses });
            console.debug('POST /api/users/modle/result response:', res && res.data ? res.data : res);
            if (res && res.data) {
              const server = res.data;
              // server may return either the legacy language object or a { language, global } shape
              langObj = server.language || server; // prefer server.language when present
              globalObj = server.global;
              if (langObj && langObj.history && langObj.history[today]) {
                setTodayPlayed(langObj.history[today]);
                setGuesses(langObj.history[today].guesses || []);
                setRevealedHints(Math.min(maxReveal, Math.max(1, (langObj.history[today].guesses || []).length + 1)));
              }
              // Always use primary/global streak for display
              const primaryStreak = server.primaryStreak || (globalObj && globalObj.streak) || (server.globalStreak) || 0;
              setStreak(primaryStreak);
            }

            // Extra safety: re-fetch authoritative server state after POST to avoid any visibility/race issues
            try {
              const check = await api.getModleStatus(language);
              console.debug('GET after POST /api/users/modle/status:', check && check.data ? check.data : check);
              if (check && check.data) {
                const s = check.data;
                // update holders from authoritative GET
                langObj = s.language || s;
                globalObj = s.global;
                if (langObj && langObj.history && langObj.history[today]) {
                  setTodayPlayed(langObj.history[today]);
                  setGuesses(langObj.history[today].guesses || []);
                  setRevealedHints(Math.min(maxReveal, Math.max(1, (langObj.history[today].guesses || []).length + 1)));
                }
                // Use primary/global streak for display
                const primaryStreak = check.data.primaryStreak || (globalObj && globalObj.streak) || check.data.globalStreak || 0;
                setStreak(primaryStreak);
              }
            } catch (err) {
              console.debug('GET after POST failed:', err);
            }
          }
            // Notify other UI parts (navbar, profile) that modle state changed
            try {
              const eventDetail = { language: langObj || null, global: globalObj || null };
              console.debug('Dispatching modleUpdated event from ModleGame:', eventDetail);
              window.dispatchEvent(new CustomEvent('modleUpdated', { detail: eventDetail }));
              // Also update centralized ModleContext so components read consistent state
              try { updateFromServerPayload(eventDetail); } catch (e) { /* ignore */ }
              // Fetch authoritative global state from server and update context/UI
              try {
                const g = await refreshGlobal();
                if (g) {
                  // If the GET returned authoritative language history for today, prefer that
                  if (g.history && g.history[today]) {
                    setTodayPlayed(g.history[today]);
                    setGuesses(g.history[today].guesses || []);
                    setRevealedHints(Math.min(maxReveal, Math.max(1, (g.history[today].guesses || []).length + 1)));
                  }
                  if (typeof g.streak === 'number') setStreak(g.streak || 0);
                  // notify listeners with the full global payload
                  try { window.dispatchEvent(new CustomEvent('modleUpdated', { detail: { global: g } })); } catch (e) {}
                }
              } catch (e) {
                // ignore
              }
            } catch (e) {
              // ignore event dispatch failures
            }
        } catch (e) {
          // non-fatal: server sync failed, local state remains
          console.debug('POST /api/users/modle/result error:', e);
          
          // Handle daily limit reached
          if (e.response && e.response.status === 409) {
            const errorMsg = e.response.data?.msg || 'You have already played today.';
            const isGlobalLimit = e.response?.data?.dailyLimitReached;
            toast.error(errorMsg);
            
            // If global daily limit, set appropriate state
            if (isGlobalLimit) {
              setTodayPlayed({ 
                correct: true, 
                globalDaily: true, 
                date: today,
                msg: errorMsg 
              });
            }
          }
        }
      })();
    } else {
      // For incorrect guesses, also optionally send to server to keep history (non-blocking)
      (async () => {
        try {
            if (user && localStorage.getItem('token')) {
            const res = await api.postModleResult({ date: today, language, correct: false, guesses: newGuesses });
            console.debug('POST /api/users/modle/result (incorrect) response:', res && res.data ? res.data : res);
            if (res && res.data) {
              const server = res.data;
              const langObj = server.language || server;
              const globalObj = server.global;
              if (langObj && langObj.history && langObj.history[today]) {
                setTodayPlayed(langObj.history[today]);
                setGuesses(langObj.history[today].guesses || []);
                setRevealedHints(Math.min(maxReveal, Math.max(1, (langObj.history[today].guesses || []).length + 1)));
              }
              // Always use primary/global streak for display
              const primaryStreak = server.primaryStreak || (globalObj && globalObj.streak) || (server.globalStreak) || 0;
              setStreak(primaryStreak);
            }

            // Extra safety: re-fetch authoritative server state after POST
            try {
              const check = await api.getModleStatus(language);
              console.debug('GET after POST (incorrect) /api/users/modle/status:', check && check.data ? check.data : check);
              if (check && check.data) {
                const s = check.data;
                const langObj = s.language || s;
                const globalObj = s.global;
                if (langObj && langObj.history && langObj.history[today]) {
                  setTodayPlayed(langObj.history[today]);
                  setGuesses(langObj.history[today].guesses || []);
                  setRevealedHints(Math.min(maxReveal, Math.max(1, (langObj.history[today].guesses || []).length + 1)));
                }
                // Use primary/global streak for display
                const primaryStreak = check.data.primaryStreak || (globalObj && globalObj.streak) || check.data.globalStreak || 0;
                setStreak(primaryStreak);
              }
            } catch (err) {
              console.debug('GET after POST (incorrect) failed:', err);
            }
          }
        } catch (e) {
          // ignore
          console.debug('POST /api/users/modle/result (incorrect) error:', e);
          
          // Handle daily limit reached
          if (e.response && e.response.status === 409) {
            const errorMsg = e.response.data?.msg || 'You have already played today.';
            const isGlobalLimit = e.response?.data?.dailyLimitReached;
            
            // If global daily limit, set appropriate state and show error
            if (isGlobalLimit) {
              toast.error(errorMsg);
              setTodayPlayed({ 
                correct: true, 
                globalDaily: true, 
                date: today,
                msg: errorMsg 
              });
            }
          }
        }
      })();
      toast.error('Not correct. Try again!');
    }

    setGuess('');
  };

  // reset helper removed (dev/testing-only)

  // Show loading state
  if (puzzleLoading) {
    return (
      <div className="bg-card p-4 rounded-md max-w-2xl mx-auto">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-gray-400">Loading today's puzzle...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (puzzleError && (!puzzle || puzzle.answer === 'LOADING')) {
    return (
      <div className="bg-card p-4 rounded-md max-w-2xl mx-auto">
        <div className="text-center py-8">
          <p className="text-red-400 mb-2">Failed to load puzzle</p>
          <p className="text-gray-400 text-sm">{puzzleError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn btn-primary mt-4"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show puzzle not found state
  if (!puzzle) {
    return (
      <div className="bg-card p-4 rounded-md max-w-2xl mx-auto">
        <div className="text-center py-8">
          <p className="text-gray-400">No puzzle available for today.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card p-4 rounded-md max-w-2xl mx-auto">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-400">Puzzle date: <span className="font-semibold text-gray-100">{puzzle.date}</span></div>
            <div className="text-sm text-gray-400">Streak: <span className="font-semibold text-gray-100">{streak} <span aria-hidden="true">🔥</span></span></div>
          </div>
          <div className="text-right text-sm text-gray-400">
            <div>Guesses: {guesses.length}</div>
            {todayPlayed && (todayPlayed.correct || todayPlayed.globalDaily) && (
              <div className={todayPlayed.globalDaily ? "text-yellow-400" : "text-green-400"}>
                {todayPlayed.globalDaily ? "Daily Limit" : "Solved"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- Win Animation --- */}
      {todayPlayed && (todayPlayed.correct || todayPlayed.globalDaily) && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="mb-4 p-3 bg-green-500/20 text-green-300 text-center rounded font-semibold"
        >
          🎉 Correct! The movie was {puzzle.answer}. 🎉
        </motion.div>
      )}

      <div className="mb-4">
        <h3 className="font-semibold mb-3">Hints <span className="text-sm text-gray-400">({revealedHints}/{maxReveal})</span></h3>
        {/* --- Improved Hint Styling --- */}
        <div className="flex flex-col gap-2">
          <AnimatePresence>
            {(puzzle.hints || []).slice(0, revealedHints).map((h, i) => (
              <motion.div
                key={i}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.3, type: 'spring', stiffness: 100 }}
                className="flex items-center gap-3 p-3 bg-background/20 rounded-lg"
              >
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-primary/20 text-primary font-bold rounded-full text-sm">
                  {i + 1}
                </span>
                <span className="text-gray-200">{h}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {/* --- Reduced Hint Explanation Text --- */}
        {revealedHints < maxReveal && !(todayPlayed && (todayPlayed.correct || todayPlayed.globalDaily)) && (
          <div className="text-xs text-gray-500 mt-2">Submit a guess to reveal the next hint.</div>
        )}
      </div>

      <form onSubmit={handleSubmitGuess} className="flex gap-2">
        {/* --- Styled Input Textbox --- */}
        <input
          value={guess}
          onChange={e => setGuess(e.target.value)}
          placeholder="Enter movie title"
          className="input input-bordered flex-1 px-3 py-2 rounded-md border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" // Updated styles
          spellCheck={false}
          autoComplete="off"
          disabled={todayPlayed && (todayPlayed.correct || todayPlayed.globalDaily)} // Disable input if solved or daily limit reached
        />
        {/* --- Button Animation --- */}
        <motion.button
          type="submit"
          className="btn btn-primary" // Uses existing button style from index.css
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={todayPlayed && (todayPlayed.correct || todayPlayed.globalDaily)} // Disable button if solved or daily limit reached
        >
          Guess
        </motion.button>
      </form>

      <div className="mt-4">
        <h4 className="font-semibold mb-2">Previous guesses</h4>
        <div className="flex flex-col gap-2">
          {guesses.length === 0 && <div className="text-gray-400">No guesses yet.</div>}
          {/* --- Reversed Guess List Animation --- */}
          <AnimatePresence>
            {guesses.slice().reverse().map((g, i) => (
              <motion.div
                key={guesses.length - 1 - i} // Use stable original index as key
                layout
                initial={{ opacity: 0, y: -10 }} // Animate from top
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.3, type: 'spring', stiffness: 100 }}
                className="p-2 bg-background/10 rounded flex items-center justify-between"
              >
                <div className="font-mono">{g}</div>
                <div className="text-sm text-gray-400">
                  {(() => {
                    try {
                      const d = levenshtein(g, normAnswer);
                      return d <= fuzzyThreshold ? '✅ Correct' : '❌ Incorrect';
                    } catch (e) { return '❌ Incorrect'; }
                  })()}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className="text-xs text-gray-500">Note: Puzzles are placeholders in source.</div>
      </div>
    </div>
  );
};

export default ModleGame;