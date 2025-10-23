import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  const storageKey = 'modle_selected_language_date';

  const handleChoose = (chosen) => {
    // check if user already chose a language today
    try {
      const raw = localStorage.getItem(storageKey);
      const today = new Date().toISOString().slice(0, 10);
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj && obj.date === today && obj.lang && obj.lang !== chosen) {
          const isDev = process.env.NODE_ENV === 'development';
          if (!isDev) {
            // In production do not allow switching — show an app-consistent toast
            toast.error(`You already played in ${obj.lang} today. You cannot switch languages until tomorrow.`);
            return;
          }

          // In development allow override but use a styled confirmation toast
          const confirmId = toast.custom((t) => (
            // --- Improved Toast Styling ---
            <div 
              className={`
                bg-card border border-gray-700 rounded-lg shadow-xl p-4 max-w-sm w-full
                transition-all duration-300 ease-in-out
                ${t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
              `}
            >
              <div className="flex items-start gap-3">
                {/* Optional: Add an icon */}
                <div className="flex-shrink-0 pt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 3.001-1.742 3.001H4.42c-1.53 0-2.493-1.667-1.743-3.001l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1.75-5.75a.75.75 0 00-1.5 0v4a.75.75 0 001.5 0v-4z" clipRule="evenodd" />
                  </svg>
                </div>
                {/* Message */}
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Already Played Today</p>
                  <p className="mt-1 text-sm text-gray-400">
                    You already played in <strong>{obj.lang}</strong>. Switch to <strong>{chosen}</strong> for testing?
                  </p>
                </div>
              </div>
              {/* Buttons */}
              <div className="mt-4 flex gap-3 justify-end border-t border-gray-700 pt-3">
                <button 
                  onClick={() => toast.dismiss(confirmId)} 
                  className="px-4 py-2 rounded-md bg-gray-700 text-sm font-medium text-gray-200 hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    toast.dismiss(confirmId);
                    try {
                      localStorage.setItem(storageKey, JSON.stringify({ date: today, lang: chosen }));
                    } catch (err) { /* ignore */ }
                    navigate(`/modle/play?lang=${encodeURIComponent(chosen)}`);
                  }} 
                  className="px-4 py-2 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card focus:ring-primary" // Use theme colors
                >
                  Continue
                </button>
              </div>
            </div>
            // --- End Improved Styling ---
          ));
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
