import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import * as api from '../api';

const InterestsPage = () => {
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [currentBackdrop, setCurrentBackdrop] = useState(0);
  const { setNewUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const languages = [
    { name: 'English', flag: '🇺🇸' },
    { name: 'Hindi', flag: '🇮🇳' },
    { name: 'Tamil', flag: '🇮🇳' },
    { name: 'Malayalam', flag: '🇮🇳' },
    { name: 'Telugu', flag: '🇮🇳' },
    { name: 'Kannada', flag: '🇮🇳' },
    { name: 'Korean', flag: '🇰🇷' },
    { name: 'French', flag: '🇫🇷' },
    { name: 'Spanish', flag: '🇪🇸' }
  ];

  // Background images array (we'll fetch from API like in AuthLayout)
  const [backdrops, setBackdrops] = useState([]);

  useEffect(() => {
    const fetchBackdrops = async () => {
      try {
        const res = await api.getPopularMovies();
        const urls = res.data.results
          .map(m => m.backdrop_path)
          .filter(Boolean)
          .slice(0, 10);
        setBackdrops(urls);
      } catch (error) {
        // Use some default placeholder
        setBackdrops(['']);
      }
    };
    fetchBackdrops();
  }, []);

  // Auto-rotate backgrounds
  useEffect(() => {
    if (backdrops.length > 1) {
      setCurrentBackdrop(0);
      
      const interval = setInterval(() => {
        setCurrentBackdrop(prev => (prev + 1) % backdrops.length);
      }, 6000);
      
      return () => clearInterval(interval);
    }
  }, [backdrops.length]);

  const handleInterestToggle = (language) => {
    if (selectedInterests.includes(language)) {
      setSelectedInterests(selectedInterests.filter(interest => interest !== language));
    } else {
      if (selectedInterests.length < 3) {
        setSelectedInterests([...selectedInterests, language]);
      }
    }
  };

  const handleContinue = async () => {
    try {
      // Save top 3 interests to user profile
      if (selectedInterests.length > 0) {
        const topThreeInterests = selectedInterests.slice(0, 3);
        await api.saveInterests(topThreeInterests);
      }
      // Clear the new user flag since they've completed interests
      setNewUser(false);
      // Navigate to main app
      navigate('/');
    } catch (error) {
      // Still navigate even if saving fails
      setNewUser(false);
      navigate('/');
    }
  };

  const handleSkip = () => {
    // Clear the new user flag even when skipping
    setNewUser(false);
    navigate('/');
  };

  const backgroundStyle = backdrops.length > 0 && backdrops[currentBackdrop] ? {
    backgroundImage: `url(https://image.tmdb.org/t/p/original${backdrops[currentBackdrop]})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  } : {
    background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)'
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={backgroundStyle}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-80" />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-4xl w-full mx-auto">
          
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Choose Your Interests
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed max-w-2xl mx-auto">
              Select up to 3 languages that interest you most. This will help us personalize your movie experience.
            </p>
          </motion.div>

          {/* Languages Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mb-8"
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {languages.map((language, index) => (
                <motion.div
                  key={language.name}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 100, 
                    delay: 0.6 + (index * 0.1) 
                  }}
                >
                  <button
                    onClick={() => handleInterestToggle(language.name)}
                    className={`
                      relative w-full p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105
                      ${selectedInterests.includes(language.name) 
                        ? 'bg-green-600 bg-opacity-30 border-green-500 shadow-lg shadow-green-500/25' 
                        : 'bg-white bg-opacity-10 border-transparent hover:bg-opacity-20 hover:border-gray-500'
                      }
                    `}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="text-4xl mb-3">
                        {language.flag}
                      </div>
                      <div className={`
                        text-lg font-semibold transition-colors duration-300
                        ${selectedInterests.includes(language.name) ? 'text-white' : 'text-gray-200'}
                      `}>
                        {language.name}
                      </div>
                    </div>
                    
                    {selectedInterests.includes(language.name) && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1.5 shadow-lg"
                      >
                        <Check size={16} className="text-white" />
                      </motion.div>
                    )}
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Selection Counter */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.2 }}
            className="text-center mb-8"
          >
            <div className="text-gray-300 text-lg">
              {selectedInterests.length}/3 selected
            </div>
            {selectedInterests.length === 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-2"
              >
                <div className="text-green-400 font-medium">
                  Maximum selections reached
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.4 }}
            className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
          >
            <button
              onClick={handleContinue}
              disabled={selectedInterests.length === 0}
              className={`
                flex-1 py-4 px-8 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105
                ${selectedInterests.length > 0 
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/25' 
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-70'
                }
              `}
            >
              {selectedInterests.length === 0 ? 'Select at least 1 interest' : 'Continue to MovieSocial'}
            </button>

            <button
              onClick={handleSkip}
              className="py-3 px-6 text-gray-300 hover:text-white font-medium transition-colors duration-300 underline hover:no-underline"
            >
              Skip for now
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default InterestsPage;