import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import defaultPuzzles from '../data/modlePuzzles';
import toast from 'react-hot-toast';
import { normalizeTitle, levenshtein } from '../utils/fuzzy';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const STORAGE_KEY_PREFIX = 'modle_v1_';

function pickPuzzleForDate(dateStr, puzzles) {
  // dateStr expected as 'YYYY-MM-DD'
  const base = new Date(dateStr + 'T00:00:00Z');
  const daysSinceEpoch = Math.floor(base.getTime() / (24 * 60 * 60 * 1000));
  const n = (puzzles && puzzles.length) ? puzzles.length : 1;
  let index = ((daysSinceEpoch % n) + n) % n;

  // compute yesterday's index and avoid repeating it
  const yesterday = new Date(base.getTime() - 24 * 60 * 60 * 1000);
  const yd = Math.floor(yesterday.getTime() / (24 * 60 * 60 * 1000));
  const yIndex = ((yd % n) + n) % n;
  if (n > 1 && index === yIndex) {
    index = (index + 1) % n;
  }

  const p = (puzzles && puzzles[index]) ? puzzles[index] : (puzzles && puzzles[0]) || { answer: '', hints: [] };
  return { answer: (p.answer || '').toUpperCase(), hints: p.hints || [], index };
}

function getStorageKeyForUser(user, language = 'English') {
  // if user present, namespace by username; otherwise global guest key
  const id = user?.username || 'guest';
  // include language so each language has separate storage (streaks per language)
  return `${STORAGE_KEY_PREFIX}${id}_${language}`;
}

const ModleGame = ({ puzzles: propPuzzles, language = 'English' }) => {
  const { user } = useContext(AuthContext);
  // determine today's date string in YYYY-MM-DD
  const todayStr = new Date().toISOString().slice(0, 10);
  const puzzles = propPuzzles && propPuzzles.length ? propPuzzles : defaultPuzzles;
  const [puzzle] = useState(() => ({ ...pickPuzzleForDate(todayStr, puzzles), date: todayStr }));
  // prepare normalized answer and fuzzy threshold for rendering and matching
  const normAnswer = normalizeTitle(puzzle.answer || '');
  const fuzzyThreshold = Math.max(2, Math.ceil((normAnswer.length || 0) * 0.2));
  const [guess, setGuess] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [todayPlayed, setTodayPlayed] = useState(null); // null | { date, correct, guesses }
  const [streak, setStreak] = useState(0);
  // how many hints are currently revealed to the player; reveal up to 5 hints (or fewer if puzzle has fewer)
  const maxReveal = Math.min(5, (puzzle.hints && puzzle.hints.length) || 5);
  const [revealedHints, setRevealedHints] = useState(1);

  useEffect(() => {
    try {
  const key = getStorageKeyForUser(user, language);
      const raw = localStorage.getItem(key);
      const data = raw ? JSON.parse(raw) : { lastPlayed: null, streak: 0, history: {} };
      const today = puzzle.date;
      if (data.lastPlayed === today && data.history && data.history[today]) {
        setTodayPlayed(data.history[today]);
        setGuesses(data.history[today].guesses || []);
        // reveal hints proportional to previous guesses (at least 1)
        const prevGuesses = (data.history[today].guesses || []).length;
        setRevealedHints(Math.min(maxReveal, Math.max(1, prevGuesses + 1)));
      }
      setStreak(data.streak || 0);
    } catch (err) {
      console.error('Failed to load Modle state', err);
    }
    // If user is signed in, attempt to fetch server-side status and merge
    (async () => {
      try {
        if (user && localStorage.getItem('token')) {
          const token = localStorage.getItem('token');
          const res = await axios.get(`/api/users/modle/status?language=${encodeURIComponent(language)}`, { headers: { Authorization: `Bearer ${token}` } });
          if (res && res.data) {
            const server = res.data;
            // Use server data as source-of-truth; but keep local history entries not present on server
            const key = getStorageKeyForUser(user, language);
            const raw = localStorage.getItem(key);
            const local = raw ? JSON.parse(raw) : { lastPlayed: null, streak: 0, history: {} };

            // merge local-only dates into server history if server missing them (keep server priority)
            const mergedHistory = { ...(server.history || {}) };
            Object.keys(local.history || {}).forEach(d => {
              if (!mergedHistory[d]) mergedHistory[d] = local.history[d];
            });

            const newData = { lastPlayed: server.lastPlayed, streak: server.streak || 0, history: mergedHistory };
            localStorage.setItem(key, JSON.stringify(newData));

            // if server has today's result, reflect it
            const today = puzzle.date;
            if (newData.lastPlayed === today && newData.history && newData.history[today]) {
              setTodayPlayed(newData.history[today]);
              setGuesses(newData.history[today].guesses || []);
              const prevGuesses = (newData.history[today].guesses || []).length;
              setRevealedHints(Math.min(maxReveal, Math.max(1, prevGuesses + 1)));
            }
            setStreak(newData.streak || 0);
          }
        }
      } catch (e) {
        // non-fatal: if server unavailable, rely on localStorage
        // console.debug('Modle server sync skipped', e && e.message ? e.message : e);
      }
    })();
  }, [puzzle, user, maxReveal, language]);

  const saveState = (newState) => {
    try {
      const key = getStorageKeyForUser(user, language);
      const raw = localStorage.getItem(key);
      const data = raw ? JSON.parse(raw) : { lastPlayed: null, streak: 0, history: {} };
      const merged = { ...data, ...newState };
      localStorage.setItem(key, JSON.stringify(merged));
    } catch (err) {
      console.error('Failed to save Modle state', err);
    }
  };

  const handleSubmitGuess = (e) => {
    e.preventDefault();
    const normalized = (guess || '').toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!normalized) return;
    if (todayPlayed && todayPlayed.correct) {
      toast('You already solved today\'s puzzle.');
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
    const today = puzzle.date;

  const key = getStorageKeyForUser(user, language);
    const raw = localStorage.getItem(key);
    const data = raw ? JSON.parse(raw) : { lastPlayed: null, streak: 0, history: {} };

    let newStreak = data.streak || 0;
    // if correct and lastPlayed was yesterday (simple day-diff by date string), increment, else reset to 1
    if (isCorrect) {
      const prevDate = data.lastPlayed;
      // simplistic continuity check: if prevDate === yesterdayString then increment
      const yesterday = new Date(new Date(today).getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      if (prevDate === yesterday) newStreak = (data.streak || 0) + 1;
      else newStreak = 1;
    }

    const newHistory = { ...(data.history || {}) };
    newHistory[today] = { date: today, correct: isCorrect, guesses: newGuesses };

    const newData = { lastPlayed: today, streak: newStreak, history: newHistory };
    saveState(newData);

    setTodayPlayed(newHistory[today]);
    setStreak(newStreak);

    if (isCorrect) {
      const note = dist > 0 ? ' (accepted with minor typo)' : '';
      toast.success(`Correct! The movie was ${puzzle.answer}.${note}`);
      // Sync result to server if user is authenticated
      (async () => {
        try {
          if (user && localStorage.getItem('token')) {
            const token = localStorage.getItem('token');
            await axios.post('/api/users/modle/result', { date: today, language, correct: true, guesses: newGuesses }, { headers: { Authorization: `Bearer ${token}` } });
          }
        } catch (e) {
          // non-fatal: server sync failed, local state remains
          // console.debug('Failed to sync Modle result to server', e && e.message ? e.message : e);
        }
      })();
    } else {
      // For incorrect guesses, also optionally send to server to keep history (non-blocking)
      (async () => {
        try {
          if (user && localStorage.getItem('token')) {
            const token = localStorage.getItem('token');
            await axios.post('/api/users/modle/result', { date: today, language, correct: false, guesses: newGuesses }, { headers: { Authorization: `Bearer ${token}` } });
          }
        } catch (e) {
          // ignore
        }
      })();
      toast.error('Not correct. Try again!');
    }

    setGuess('');
  };

  const resetForTesting = () => {
    // helper for dev: clear today's play for this user
    try {
  const key = getStorageKeyForUser(user, language);
  const raw = localStorage.getItem(key);
  const data = raw ? JSON.parse(raw) : { lastPlayed: null, streak: 0, history: {} };
  if (data.history) delete data.history[puzzle.date];
  if (data.lastPlayed === puzzle.date) data.lastPlayed = null;
  saveState(data);
      setTodayPlayed(null);
      setGuesses([]);
      setRevealedHints(1);
      toast('Reset today\'s result (dev)');
    } catch (err) { console.error(err); }
  };

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
            {todayPlayed && todayPlayed.correct && <div className="text-green-400">Solved</div>}
          </div>
        </div>
      </div>

      {/* --- Win Animation --- */}
      {todayPlayed && todayPlayed.correct && (
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
        {revealedHints < maxReveal && !(todayPlayed && todayPlayed.correct) && (
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
          disabled={todayPlayed && todayPlayed.correct} // Disable input if solved
        />
        {/* --- Button Animation --- */}
        <motion.button
          type="submit"
          className="btn btn-primary" // Uses existing button style from index.css
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={todayPlayed && todayPlayed.correct} // Disable button if solved
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
        <button onClick={resetForTesting} className="btn btn-ghost text-sm">Reset today (dev)</button>
        {/* --- Shortened Note --- */}
        <div className="text-xs text-gray-500">Note: Puzzles are placeholders in source.</div>
      </div>
    </div>
  );
};

export default ModleGame;