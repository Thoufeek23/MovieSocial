import React, { useEffect, useState, useContext } from 'react';
import Confetti from 'react-confetti'; // <-- ADDED: For win animation
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import * as api from '../api';
import { ModleContext } from '../context/ModleContext';

// API wrapper (centralized in client/src/api/index.js)

// UTC date helper (YYYY-MM-DD) to match server
function utcYYYYMMDD(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

// --- ADDED: Helper hook for window dimensions ---
const useWindowSize = () => {
  const [size, setSize] = useState([0, 0]);
  useEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }
    window.addEventListener('resize', updateSize);
    updateSize(); // Initial size
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  return { width: size[0], height: size[1] };
};
// -------------------------------------------------


const ModleGame = ({ puzzles: propPuzzles, language = 'English' }) => {
  const { user } = useContext(AuthContext);
  const { updateFromServerPayload, refreshGlobal } = useContext(ModleContext);
  const { width, height } = useWindowSize(); // <-- ADDED: Get window size for confetti
  
  // determine today's date string in YYYY-MM-DD (UTC)
  const todayStr = utcYYYYMMDD();
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
          // Get status from the updated backend API
          const res = await api.getModleStatus(language);
          if (res && res.data) {
            const data = res.data;
            const today = effectiveDate;
            
            // Server now determines if user can play or has already played
            if (!data.canPlay) {
              const message = data.dailyLimitReached 
                ? 'Already played today\'s Modle! One puzzle per day across all languages. Come back tomorrow!'
                : (data.completedToday ? 'You already solved today\'s puzzle.' : 'Cannot play today.');
                
              setTodayPlayed({ 
                correct: data.completedToday, 
                globalDaily: data.dailyLimitReached, 
                date: today,
                msg: message,
                guesses: data.language?.history?.[today]?.guesses || [],
                guessesStatus: data.language?.history?.[today]?.guessesStatus || [] // <-- Make sure to load this
              });
              
              setGuesses(data.language?.history?.[today]?.guesses || []);
              const prevGuesses = (data.language?.history?.[today]?.guesses || []).length;
              setRevealedHints(Math.min(maxReveal, Math.max(1, prevGuesses + 1)));
            } else {
              // User can play - check if they have partial progress
              if (data.language?.history?.[today] && !data.language.history[today].correct) {
                setTodayPlayed(data.language.history[today]);
                setGuesses(data.language.history[today].guesses || []);
                const prevGuesses = (data.language.history[today].guesses || []).length;
                setRevealedHints(Math.min(maxReveal, Math.max(1, prevGuesses + 1)));
              } else {
                // Fresh start
                setTodayPlayed(null);
                setGuesses([]);
                setRevealedHints(1);
              }
            }
            
            // Use primary streak from server
            setStreak(data.primaryStreak || 0);
            return;
          }
        }
      } catch (e) {
        // server fetch failed; fall back below
      }

      // No persistent localStorage fallback
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


  const handleSubmitGuess = (e) => {
    e.preventDefault();
    const normalized = (guess || '').toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!normalized) return;

    // Enforce one guess per revealed hint
    if (!(revealedHints >= maxReveal || guesses.length < revealedHints)) {
      toast('Submit a guess to reveal the next hint.');
      return;
    }

    // Update guesses and reveal next hint immediately
    const newGuesses = [...guesses, normalized];
    setGuesses(newGuesses);
    
    const newRevealedHints = Math.min(maxReveal, newGuesses.length + 1);
    setRevealedHints(newRevealedHints);

    const today = effectiveDate;

  // Send guess to server for validation
  (async () => {
    try {
      const res = await api.postModleResult({ date: today, language, guess: normalized });
      
      if (res && res.data) {
        const server = res.data; // <-- 'server' is defined here
        const langObj = server.language || server;
        const globalObj = server.global;
        
        // Server determines correctness
        if (langObj && langObj.history && langObj.history[today]) {
          const serverResult = langObj.history[today]; // <-- 'serverResult' is defined here
          setTodayPlayed(serverResult);
          
          if ((serverResult.guesses || []).length > newGuesses.length) {
            setGuesses(serverResult.guesses || []);
            const serverHints = Math.min(maxReveal, Math.max(1, (serverResult.guesses || []).length + 1));
            setRevealedHints(serverHints);
          }
          
          if (serverResult.correct) {
            // --- FIX for blank answer ---
            const answer = puzzle.answer || server.solvedAnswer;
            if (server.solvedAnswer && !puzzle.answer) {
              setPuzzle(prev => ({ ...prev, answer: server.solvedAnswer }));
            }
            // -----------------------------

            toast.success(`Correct! The movie was ${answer}.`);
            
            if (refreshGlobal) {
              refreshGlobal();
            }
            
            try {
              const eventDetail = { language: langObj, global: globalObj };
              window.dispatchEvent(new CustomEvent('modleUpdated', { detail: eventDetail }));
              updateFromServerPayload(eventDetail, language);
            } catch (e) {
              // ignore
            }
          } else {
            toast.error('Incorrect guess. Try again!');
          }
        }
        
        const primaryStreak = server.primaryStreak || (globalObj && globalObj.streak) || 0;
        setStreak(primaryStreak);
      }

    } catch (e) {
      if (e.response && e.response.status === 409) {
        const errorMsg = e.response.data?.msg || 'You have already played today.';
        toast.error(errorMsg);
        
        const responseData = e.response.data;
        if (responseData) {
          setTodayPlayed({ 
            correct: responseData.dailyLimitReached || false, 
            globalDaily: responseData.dailyLimitReached || false, 
            date: today,
            msg: errorMsg 
          });
        }
      } else {
        toast.error('Unable to submit guess. Please check your connection.');
      }
    }
  })();

  setGuess('');
  };

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

  // --- REMOVED: "Daily Limit Reached" block ---
  // if (todayPlayed && todayPlayed.globalDaily) { ... }

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
      {/* --- ADDED: Confetti Win Animation --- */}
      <Confetti
        width={width}
        height={height}
        run={todayPlayed && todayPlayed.correct} // Only run when 'correct' is true
        recycle={false} // Run once and stop
        numberOfPieces={500}
        gravity={0.2}
        tweenDuration={7000}
      />
      {/* ------------------------------------- */}

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
      {todayPlayed && (todayPlayed.correct || todayPlayed.globalDaily) && puzzle.answer && (
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
        {revealedHints < maxReveal && !(todayPlayed && (todayPlayed.correct || todayPlayed.globalDaily)) && (
          <div className="text-xs text-gray-500 mt-2">Submit a guess to reveal the next hint.</div>
        )}
      </div>

      <form onSubmit={handleSubmitGuess} className="flex gap-2">
        <input
          value={guess}
          onChange={e => setGuess(e.target.value)}
          placeholder="Enter movie title"
          className="input input-bordered flex-1 px-3 py-2 rounded-md border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
          spellCheck={false}
          autoComplete="off"
          disabled={todayPlayed && (todayPlayed.correct || todayPlayed.globalDaily)}
        />
        <motion.button
          type="submit"
          className="btn btn-primary"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={todayPlayed && (todayPlayed.correct || todayPlayed.globalDaily)}
        >
          Guess
        </motion.button>
      </form>

      <div className="mt-4">
        <h4 className="font-semibold mb-2">Previous guesses</h4>
        <div className="flex flex-col gap-2">
          {guesses.length === 0 && <div className="text-gray-400">No guesses yet.</div>}
          <AnimatePresence>
            {guesses.slice().reverse().map((g, i) => {
              const guessIdx = guesses.length - 1 - i;
              // This logic shows feedback for each guess:
              const isCorrect = todayPlayed && todayPlayed.guessesStatus && todayPlayed.guessesStatus[guessIdx] === true;
              const isIncorrect = todayPlayed && todayPlayed.guessesStatus && todayPlayed.guessesStatus[guessIdx] === false;
              return (
                <motion.div
                  key={guessIdx}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.3, type: 'spring', stiffness: 100 }}
                  className="p-2 bg-background/10 rounded flex items-center justify-between"
                >
                  <div className="font-mono flex items-center gap-2">
                    {g}
                    {isCorrect && <span className="text-green-400 text-lg" title="Correct">✔️</span>}
                    {isIncorrect && <span className="text-red-400 text-lg" title="Incorrect">❌</span>}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className="text-xs text-gray-500">Note: All game logic is server-driven.</div>
      </div>
    </div>
  );
};

export default ModleGame;