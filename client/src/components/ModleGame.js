import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import puzzles from '../data/modlePuzzles';
import toast from 'react-hot-toast';

// CONTRACT:
// - Inputs: none (daily puzzle is read from constants / placeholders)
// - Outputs: localStorage updates for lastPlayed, streak, and todays result; optionally server sync can be added where commented
// - Error modes: localStorage unavailable

// Use a puzzles list in `client/src/data/modlePuzzles.js`.
// Determine puzzle for a given date in a deterministic way (days since epoch modulo list length),
// and avoid repeating yesterday's puzzle by advancing the index if it would repeat.

const STORAGE_KEY_PREFIX = 'modle_v1_';

function pickPuzzleForDate(dateStr) {
  // dateStr expected as 'YYYY-MM-DD'
  const base = new Date(dateStr + 'T00:00:00Z');
  const daysSinceEpoch = Math.floor(base.getTime() / (24 * 60 * 60 * 1000));
  const n = puzzles.length || 1;
  let index = ((daysSinceEpoch % n) + n) % n;

  // compute yesterday's index and avoid repeating it
  const yesterday = new Date(base.getTime() - 24 * 60 * 60 * 1000);
  const yd = Math.floor(yesterday.getTime() / (24 * 60 * 60 * 1000));
  const yIndex = ((yd % n) + n) % n;
  if (n > 1 && index === yIndex) {
    index = (index + 1) % n;
  }

  const p = puzzles[index] || puzzles[0];
  return { answer: (p.answer || '').toUpperCase(), hints: p.hints || [], index };
}

function getStorageKeyForUser(user) {
  // if user present, namespace by username; otherwise global guest key
  const id = user?.username || 'guest';
  return STORAGE_KEY_PREFIX + id;
}

const ModleGame = () => {
  const { user } = useContext(AuthContext);
  // determine today's date string in YYYY-MM-DD
  const todayStr = new Date().toISOString().slice(0, 10);
  const [puzzle] = useState(() => ({ ...pickPuzzleForDate(todayStr), date: todayStr }));
  const [guess, setGuess] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [todayPlayed, setTodayPlayed] = useState(null); // null | { date, correct, guesses }
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    try {
      const key = getStorageKeyForUser(user);
      const raw = localStorage.getItem(key);
      const data = raw ? JSON.parse(raw) : { lastPlayed: null, streak: 0, history: {} };
      const today = puzzle.date;
      if (data.lastPlayed === today && data.history && data.history[today]) {
        setTodayPlayed(data.history[today]);
        setGuesses(data.history[today].guesses || []);
      }
      setStreak(data.streak || 0);
    } catch (err) {
      console.error('Failed to load Modle state', err);
    }
  }, [puzzle, user]);

  const saveState = (newState) => {
    try {
      const key = getStorageKeyForUser(user);
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

    const newGuesses = [...guesses, normalized];
    setGuesses(newGuesses);

    const isCorrect = normalized === puzzle.answer.toUpperCase();
    const today = puzzle.date;

    const key = getStorageKeyForUser(user);
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
      toast.success(`Correct! The movie was ${puzzle.answer}.`);
      // TODO: optionally sync to server: send { username, date, correct, guesses }
    } else {
      toast.error('Not correct. Try again!');
    }

    setGuess('');
  };

  const resetForTesting = () => {
    // helper for dev: clear today's play for this user
    try {
      const key = getStorageKeyForUser(user);
      const raw = localStorage.getItem(key);
      const data = raw ? JSON.parse(raw) : { lastPlayed: null, streak: 0, history: {} };
      if (data.history) delete data.history[puzzle.date];
      if (data.lastPlayed === puzzle.date) data.lastPlayed = null;
  saveState(data);
      setTodayPlayed(null);
      setGuesses([]);
      toast('Reset today\'s result (dev)');
    } catch (err) { console.error(err); }
  };

  return (
    <div className="bg-card p-4 rounded-md">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-400">Puzzle date: <span className="font-semibold text-gray-100">{puzzle.date}</span></div>
            <div className="text-sm text-gray-400">Streak: <span className="font-semibold text-gray-100">{streak}</span></div>
          </div>
          <div className="text-right text-sm text-gray-400">
            <div>Guesses: {guesses.length}</div>
            {todayPlayed && todayPlayed.correct && <div className="text-green-400">Solved</div>}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold">Hints</h3>
        <ul className="list-disc list-inside text-gray-300">
          {puzzle.hints.map((h, i) => <li key={i}>{h}</li>)}
        </ul>
      </div>

      <form onSubmit={handleSubmitGuess} className="flex gap-2">
        <input
          value={guess}
          onChange={e => setGuess(e.target.value)}
          placeholder="Enter movie title"
          className="input input-bordered flex-1 text-black placeholder-gray-500 caret-black"
          spellCheck={false}
          autoComplete="off"
        />
        <button type="submit" className="btn btn-primary">Guess</button>
      </form>

      <div className="mt-4">
        <h4 className="font-semibold mb-2">Previous guesses</h4>
        <div className="flex flex-col gap-2">
          {guesses.length === 0 && <div className="text-gray-400">No guesses yet.</div>}
          {guesses.map((g, i) => (
            <div key={i} className="p-2 bg-background/10 rounded flex items-center justify-between">
              <div className="font-mono">{g}</div>
              <div className="text-sm text-gray-400">{g === puzzle.answer ? 'Correct' : '—'}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button onClick={resetForTesting} className="btn btn-ghost text-sm">Reset today (dev)</button>
        <div className="text-xs text-gray-500">Note: Answer/hints are placeholders in source. Replace with server-driven daily puzzles when available.</div>
      </div>
    </div>
  );
};

export default ModleGame;
