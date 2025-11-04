import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import puzzlesEng from '../data/modlePuzzles';
import puzzlesHindi from '../data/modlePuzzlesHindi';
import puzzlesTamil from '../data/modlePuzzlesTamil';
import puzzlesTelugu from '../data/modlePuzzlesTelugu';
import puzzlesKannada from '../data/modlePuzzlesKannada';
import puzzlesMalayalam from '../data/modlePuzzlesMalayalam';
import { Info, PlayCircle } from 'lucide-react'; // Import icons for a professional look

const languageMap = {
  English: puzzlesEng,
  Hindi: puzzlesHindi,
  Tamil: puzzlesTamil,
  Telugu: puzzlesTelugu,
  Kannada: puzzlesKannada,
  Malayalam: puzzlesMalayalam,
};

const ModlePage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  // Scope the local selection key by username when signed in to avoid cross-account interference
  const storageKey = user && user.username ? `modle_selected_language_date_${user.username}` : 'modle_selected_language_date';

  const handleChoose = (chosen) => {
    // check if user already chose a language today
    try {
      // If a legacy global selection key exists but we're signed in, ignore/remove it to prevent cross-account blocking
      const legacyKey = 'modle_selected_language_date';
      if (user && localStorage.getItem(legacyKey)) {
        try { localStorage.removeItem(legacyKey); } catch (e) { /* ignore */ }
      }

      const raw = localStorage.getItem(storageKey);
      // local date YYYY-MM-DD
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj && obj.date === today && obj.lang && obj.lang !== chosen) {
          // enforce in production: cannot switch languages until tomorrow
          toast.error(`You already played in ${obj.lang} today. You cannot switch languages until tomorrow.`);
          return;
        }
      }

      // save choice for today and proceed to play page
  localStorage.setItem(storageKey, JSON.stringify({ date: today, lang: chosen }));
  navigate(`/modle/play?lang=${encodeURIComponent(chosen)}`);
    } catch (err) {
      console.error('Failed to save language selection', err);
      navigate(`/modle/play?lang=${encodeURIComponent(chosen)}`);
    }
  };

  return (
    // Use a constrained width and center it, with more padding
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">

      {/* 1. Gradient Title */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold pb-2
                       bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Modle — Movie Wordle
        </h1>
        <p className="text-lg text-gray-400">Guess the movie of the day!</p>
      </div>

      {/* 2. "How to Play" Card */}
      <div className="bg-card p-5 rounded-xl border border-gray-700 mb-10 shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <Info size={20} className="text-blue-400" />
          <h2 className="text-xl font-semibold text-white">How to Play</h2>
        </div>
        <ul className="list-disc list-inside text-gray-300 space-y-1.5 text-sm md:text-base">
          <li>Choose one language to play per day. Your streak is tracked per language.</li>
          <li>Guess the movie title based on the hints provided.</li>
          <li>Each incorrect guess reveals another hint, up to a maximum number of hints.</li>
          <li>You can only guess once per revealed hint until all hints are shown.</li>
        </ul>
      </div>

      {/* 3. Language Selection */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-white">Choose Your Language for Today</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Object.keys(languageMap).map(lang => (
          <button 
            key={lang} 
            onClick={() => handleChoose(lang)} 
            // 4. Animated, Gradient-Hover Cards
            className={`
              group relative p-6 bg-card rounded-xl
              border border-gray-700
              transition-all duration-300 ease-in-out
              hover:-translate-y-1 hover:border-primary
              hover:shadow-lg hover:shadow-primary/10
              hover:bg-gradient-to-br hover:from-card hover:to-primary/10
            `}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-2xl font-bold text-white">{lang}</span>
              <PlayCircle 
                size={28} 
                className="text-gray-500 transition-all duration-300
                           group-hover:text-primary group-hover:translate-x-1" 
              />
            </div>
            <div className="text-sm text-gray-400 text-left transition-colors group-hover:text-gray-300">
              Play Modle in {lang}
            </div>
          </button>
        ))}
      </div>
      
      {/* (Removed the redundant "Available languages" text for a cleaner look) */}
    </div>
  );
};

export default ModlePage;
