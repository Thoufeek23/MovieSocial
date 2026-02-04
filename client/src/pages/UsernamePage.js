import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import * as api from '../api';
import AuthLayout from '../components/AuthLayout';

const UsernamePage = () => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(null);
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const checkUsernameAvailability = async (value) => {
    if (!value || value.trim().length < 5 || value.trim().length > 15) {
      setIsAvailable(null);
      return;
    }

    setIsChecking(true);
    try {
      const res = await api.checkUsername(value.trim());
      setIsAvailable(res.data.available);
    } catch (err) {
      console.error('Error checking username:', err);
    } finally {
      setIsChecking(false);
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setUsername(value);
    setError('');
    
    // Debounce the availability check
    const timer = setTimeout(() => {
      checkUsernameAvailability(value);
    }, 500);

    return () => clearTimeout(timer);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!username.trim()) {
      setError('Please enter a username.');
      return;
    }

    if (username.trim().length < 5) {
      setError('Username must be at least 5 characters.');
      return;
    }

    if (username.trim().length > 15) {
      setError('Username cannot be more than 15 characters.');
      return;
    }

    if (isAvailable === false) {
      setError('This username is already taken.');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await api.updateUsername(username.trim());
      // Update user context with new username
      setUser({ ...user, username: data.username });
      // Navigate to interests
      navigate('/interests');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to set username.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <AuthLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-md">
        <motion.h2 variants={itemVariants} className="text-4xl font-bold mb-3 text-white">
          Choose Your Username
        </motion.h2>
        <motion.p variants={itemVariants} className="text-gray-400 mb-6">
          Pick a unique username to identify yourself in the community.
        </motion.p>

        {error && (
          <motion.p variants={itemVariants} className="bg-red-500/20 text-red-400 p-3 rounded-lg text-center font-medium mb-4">
            {error}
          </motion.p>
        )}

        <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              name="username"
              value={username}
              onChange={handleChange}
              placeholder="Username"
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isLoading}
            />
            {isChecking && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin h-5 w-5 border-2 border-purple-500 border-t-transparent rounded-full"></div>
              </div>
            )}
            {!isChecking && isAvailable === true && username.length >= 5 && (
              <div className="absolute right-3 top-3">
                <div className="h-5 w-5 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              </div>
            )}
            {!isChecking && isAvailable === false && username.length >= 5 && (
              <div className="absolute right-3 top-3">
                <div className="h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
              </div>
            )}
          </div>

          <div className="text-xs text-gray-400 space-y-1">
            <p className={username.trim().length >= 5 ? 'text-green-400' : ''}>
              • Must be 5-20 characters
            </p>
            <p className={isAvailable === true ? 'text-green-400' : isAvailable === false ? 'text-red-400' : ''}>
              • Must be unique
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || isChecking || isAvailable === false || username.trim().length < 5}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Setting Username...' : 'Continue'}
          </button>
        </motion.form>
      </motion.div>
    </AuthLayout>
  );
};

export default UsernamePage;
