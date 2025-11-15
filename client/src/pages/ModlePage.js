import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Info, PlayCircle, CheckCircle } from 'lucide-react'; // Import icons for a professional look
import * as api from '../api';

// Available languages - no longer need puzzle imports since they come from backend
const availableLanguages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'];

const ModlePage = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [completedToday, setCompletedToday] = useState({});
  const [loading, setLoading] = useState(true);
  const [globalDailyLimitReached, setGlobalDailyLimitReached] = useState(false);
  const [playedLanguage, setPlayedLanguage] = useState(null);

  // Check completion status for all languages
  useEffect(() => {
    const checkCompletionStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const today = new Date().toISOString().slice(0, 10);
        
        // First check global status to see if user has played ANY language today
        try {
          const globalResponse = await api.getModleStatus('global');
          if (globalResponse.data.history && globalResponse.data.history[today]) {
            // User has already played today - set global daily limit reached
            setGlobalDailyLimitReached(true);
            // Find which language they played
            for (const lang of availableLanguages) {
              try {
                const langResponse = await api.getModleStatus(lang);
                if (langResponse.data.history && 
                    langResponse.data.history[today] && 
                    langResponse.data.history[today].correct) {
                  setPlayedLanguage(lang);
                  break;
                }
              } catch (e) { /* ignore */ }
            }
            setLoading(false);
            return;
          }
        } catch (error) {
          console.debug('Failed to check global status:', error);
        }
        
        // If no global daily limit, check individual language completion status
        const statusPromises = availableLanguages.map(async (lang) => {
          try {
            const response = await api.getModleStatus(lang);
            const isCompleted = response.data.history && 
                               response.data.history[today] && 
                               response.data.history[today].correct;
            return { lang, completed: isCompleted };
          } catch (error) {
            return { lang, completed: false };
          }
        });

        const results = await Promise.all(statusPromises);
        const completionMap = {};
        results.forEach(({ lang, completed }) => {
          completionMap[lang] = completed;
        });
        setCompletedToday(completionMap);
      } catch (error) {
        console.error('Failed to check completion status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkCompletionStatus();
  }, [user]);

  const handleChoose = (chosen) => {
    // Check if global daily limit is reached
    if (globalDailyLimitReached) {
      toast.error('Daily limit reached! One Modle per day across all languages. Come back tomorrow!');
      return;
    }
    
    // Check if user has already completed this language today
    if (user && completedToday[chosen]) {
      toast.error(`You already completed today's Modle in ${chosen}! Come back tomorrow for a new puzzle.`);
      return;
    }

    // Allow users to play different languages - global streak system supports this
    // Just navigate to the selected language
    navigate(`/modle/play?lang=${encodeURIComponent(chosen)}`);
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
          <li>Choose any language to play each day. Your streak continues regardless of which language you play.</li>
          <li>Guess the movie title based on the hints provided.</li>
          <li>Each incorrect guess reveals another hint, up to a maximum number of hints.</li>
          <li>Play consistently every day to maintain your streak across all languages!</li>
        </ul>
      </div>

      {/* 3. Language Selection */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-white">
          {globalDailyLimitReached ? "Today's Modle Complete!" : "Choose Your Language for Today"}
        </h2>
      </div>

      {loading && user ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-gray-400">Loading your progress...</p>
        </div>
      ) : globalDailyLimitReached ? (
        <div className="max-w-md mx-auto bg-gray-800 border-2 border-green-500 rounded-xl p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-green-500 mb-2">Daily Limit Reached!</h3>
          <p className="text-white mb-2">
            You've already completed today's Modle{playedLanguage ? ` in ${playedLanguage}` : ''}.
          </p>
          <p className="text-gray-400 mb-4">
            Come back tomorrow for a new puzzle in any language!
          </p>
          <div className="flex items-center justify-center gap-2 bg-gray-700 rounded-lg px-3 py-2">
            <Info className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400 italic">
              One Modle per day across all languages
            </span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {availableLanguages.map(lang => {
            const isCompleted = user && completedToday[lang];
            return (
              <button 
                key={lang} 
                onClick={() => handleChoose(lang)} 
                disabled={isCompleted}
                className={`
                  group relative p-6 rounded-xl border
                  transition-all duration-300 ease-in-out
                  ${isCompleted 
                    ? 'bg-green-900/20 border-green-700 cursor-not-allowed' 
                    : 'bg-card border-gray-700 hover:-translate-y-1 hover:border-primary hover:shadow-lg hover:shadow-primary/10 hover:bg-gradient-to-br hover:from-card hover:to-primary/10'
                  }
                `}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-2xl font-bold ${isCompleted ? 'text-green-400' : 'text-white'}`}>
                    {lang}
                  </span>
                  {isCompleted ? (
                    <CheckCircle 
                      size={28} 
                      className="text-green-400" 
                    />
                  ) : (
                    <PlayCircle 
                      size={28} 
                      className="text-gray-500 transition-all duration-300
                                 group-hover:text-primary group-hover:translate-x-1" 
                    />
                  )}
                </div>
                <div className={`text-sm text-left transition-colors ${
                  isCompleted 
                    ? 'text-green-300' 
                    : 'text-gray-400 group-hover:text-gray-300'
                }`}>
                  {isCompleted ? '✅ Completed today!' : `Play Modle in ${lang}`}
                </div>
              </button>
            );
          })}
        </div>
      )}
      
      {/* (Removed the redundant "Available languages" text for a cleaner look) */}
    </div>
  );
};

export default ModlePage;
