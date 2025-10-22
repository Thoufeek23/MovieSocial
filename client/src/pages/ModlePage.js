import React from 'react';
import { useNavigate } from 'react-router-dom';
// LanguageSelect was used in an earlier iteration; the page now uses large buttons for language selection.
import toast from 'react-hot-toast';
import puzzlesEng from '../data/modlePuzzles';
import puzzlesHindi from '../data/modlePuzzlesHindi';
import puzzlesTamil from '../data/modlePuzzlesTamil';
import puzzlesTelugu from '../data/modlePuzzlesTelugu';
import puzzlesKannada from '../data/modlePuzzlesKannada';
import puzzlesMalayalam from '../data/modlePuzzlesMalayalam';

const languageMap = {
  English: puzzlesEng,
  Hindi: puzzlesHindi,
  Tamil: puzzlesTamil,
  Telugu: puzzlesTelugu,
  Kannada: puzzlesKannada,
  Malayalam: puzzlesMalayalam,
};

const ModlePage = () => {
  // note: language state is managed by the play route via query param; no local state needed here

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

          // In development allow override but use a styled confirmation toast (same pattern used elsewhere)
          const confirmId = toast.custom((t) => (
            <div className={`bg-card p-4 rounded shadow-lg ${t.visible ? 'animate-enter' : 'animate-leave'}`}>
              <div className="text-sm">You already played in <strong>{obj.lang}</strong> today. Switch to <strong>{chosen}</strong> for testing?</div>
              <div className="mt-3 flex gap-2 justify-end">
                <button onClick={() => toast.dismiss(confirmId)} className="px-3 py-1 rounded bg-gray-700">Cancel</button>
                <button onClick={() => {
                  toast.dismiss(confirmId);
                  try {
                    localStorage.setItem(storageKey, JSON.stringify({ date: today, lang: chosen }));
                  } catch (err) { /* ignore */ }
                  navigate(`/modle/play?lang=${encodeURIComponent(chosen)}`);
                }} className="px-3 py-1 rounded bg-green-600 text-white">Continue</button>
              </div>
            </div>
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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Modle — Movie Wordle</h1>
      <p className="text-gray-400 mb-4">Guess the movie of the day. Choose one language to play today.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {Object.keys(languageMap).map(l => (
          <button key={l} onClick={() => handleChoose(l)} className="p-3 bg-card rounded text-left hover:shadow">
            <div className="font-semibold">{l}</div>
            <div className="text-xs text-gray-400">Play Modle in {l}</div>
          </button>
        ))}
      </div>

      <div className="text-sm text-gray-400">Available languages: Tamil, Hindi, Telugu, Kannada, English, Malayalam</div>
    </div>
  );
};

export default ModlePage;
