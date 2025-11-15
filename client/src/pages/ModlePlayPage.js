import React, { useEffect, useState, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ModleGame from '../components/ModleGame';
import * as api from '../api';
import toast from 'react-hot-toast';
// Available languages - puzzles now come from backend
const availableLanguages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'];

const ModlePlayPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [canPlay, setCanPlay] = useState(false);
  const lang = searchParams.get('lang') || 'English';

  // Check if user has already played today
  useEffect(() => {
    const checkPlayStatus = async () => {
      if (!user) {
        // Allow non-authenticated users to play (they won't have persistent state)
        setCanPlay(true);
        setIsCheckingStatus(false);
        return;
      }

      try {
        const response = await api.getModleStatus(lang);
        const modleStatus = response.data;
        
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().slice(0, 10);
        
        // Check if user played today and got it correct
        if (modleStatus.history && modleStatus.history[today] && modleStatus.history[today].correct) {
          toast.error(`You already completed today's Modle in ${lang}! Come back tomorrow for a new puzzle.`);
          navigate('/modle');
          return;
        }
        
        // User hasn't completed today's puzzle, allow them to play
        setCanPlay(true);
      } catch (error) {
        console.error('Failed to check Modle status:', error);
        // On error, allow them to play (fail gracefully)
        setCanPlay(true);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkPlayStatus();
  }, [user, lang, navigate]);

  // if invalid language, go back to selection
  if (!availableLanguages.includes(lang)) {
    // redirect back to language selection
    navigate('/modle');
    return null;
  }

  if (isCheckingStatus) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-gray-400">Checking your game status...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!canPlay) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <p className="text-gray-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Modle — {lang}</h1>
      <p className="text-gray-400 mb-4">Playing Modle in <strong>{lang}</strong>. You can only choose one language per day.</p>
      <ModleGame language={lang} />
    </div>
  );
};

export default ModlePlayPage;
