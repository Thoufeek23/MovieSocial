import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from './Avatar';
import toast from 'react-hot-toast';
import * as api from '../api';

import { X } from 'lucide-react';

const EditProfileModal = ({ isOpen, onClose, profile, onUpdated }) => {
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [interests, setInterests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const avatarRef = useRef(null);

  // Available language interests
  const availableInterests = [
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

  // Initialize state only when modal opens for the first time
  useEffect(() => {
    if (isOpen && profile && !initialized) {
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setAvatarPreview(profile.avatar || '');
      setInterests(profile.interests || []);
      setInitialized(true);
    }
    // Reset initialization flag when modal closes
    if (!isOpen && initialized) {
      setInitialized(false);
    }
  }, [isOpen, profile, initialized]);

  const handleInterestToggle = (languageName) => {
    if (interests.includes(languageName)) {
      setInterests(interests.filter(interest => interest !== languageName));
    } else {
      if (interests.length < 3) {
        setInterests([...interests, languageName]);
      }
    }
  };

  if (!isOpen) return null;

  // Handle avatar file selection
  const handleFile = (file, setter, maxSize = 2 * 1024 * 1024) => {
    if (!file) return;
    if (file.size > maxSize) { toast.error('File too large (max 2MB)'); return; }
    const reader = new FileReader();
    reader.onload = () => setter(reader.result);
    reader.onerror = () => toast.error('Failed to read file');
    reader.readAsDataURL(file);
  };



  // Handle saving changes
  const save = async () => {
    // Validate username
    if (username.trim().length < 3 || username.trim().length > 20) {
      toast.error('Username must be between 3 and 20 characters');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        username: username.trim(),
        bio,
        interests: interests.slice(0, 3), // Ensure only top 3 interests
      };
      // Only include avatar if it's different from the original or a new one was selected
      if (avatarPreview !== profile?.avatar) {
        payload.avatar = avatarPreview;
      }

      const response = await api.updateMyProfile(payload);
      
      // If username was changed, the backend returns a new token
      if (response.data?.token) {
        // Update token in localStorage
        localStorage.setItem('token', response.data.token);
      }
      
      const { data } = await api.getUserProfile(username.trim()); // Refetch updated profile
      toast.success('Profile updated');
      onUpdated?.(data); // Notify parent component
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 200 } },
    exit: { opacity: 0, scale: 0.95, y: -20, transition: { duration: 0.2 } },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={onClose}
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative bg-card w-full max-w-2xl max-h-[90vh] rounded-lg shadow-xl border border-gray-700 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 pb-3 border-b border-gray-700 flex-shrink-0">
              <h3 className="text-xl font-semibold text-white">Edit Profile</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 p-6 overflow-y-auto flex-1">
              {/* Username Section */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  maxLength={20}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">3-20 characters. This will be your unique identifier.</p>
              </div>

              {/* Avatar Section */}
              <div className="flex items-center gap-5">
                <Avatar username={profile.username} avatar={avatarPreview} sizeClass="w-20 h-20" className="border-2 border-gray-600" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Change Avatar</label>
                  <input
                    ref={avatarRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFile(e.target.files?.[0], setAvatarPreview)}
                    className="block w-full text-sm text-gray-400
                               file:mr-4 file:py-2 file:px-4
                               file:rounded-full file:border-0
                               file:text-sm file:font-semibold
                               file:bg-primary/20 file:text-primary
                               hover:file:bg-primary/30 cursor-pointer"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-xs text-gray-500">Max 2MB. PNG, JPG, GIF.</p>
                    {avatarPreview && avatarPreview !== '/default_dp.png' && (
                      <button
                        type="button"
                        onClick={() => setAvatarPreview('/default_dp.png')}
                        className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Interests Section */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Interests</label>
                <p className="text-xs text-gray-500 mb-3">Select up to 3 movie languages that interest you</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {availableInterests.map((language) => (
                    <button
                      key={language.name}
                      type="button"
                      onClick={() => handleInterestToggle(language.name)}
                      className={`
                        relative p-3 rounded-lg border-2 transition-all duration-200 text-left
                        ${
                          interests.includes(language.name)
                            ? 'bg-green-600/20 border-green-500 text-white'
                            : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-700/50'
                        }
                        ${interests.length >= 3 && !interests.includes(language.name) ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                      disabled={interests.length >= 3 && !interests.includes(language.name)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{language.flag}</span>
                        <span className="text-sm font-medium">{language.name}</span>
                      </div>
                      {interests.includes(language.name) && (
                        <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">{interests.length}/3 selected</p>
              </div>

              {/* Bio Section */}
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                <textarea
                  id="bio"
                  className="w-full h-24 p-3 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 resize-none"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={200}
                  placeholder="Tell us a bit about yourself..."
                />
                <p className="text-xs text-gray-500 mt-1 text-right">{bio.length}/200</p>
              </div>
            </div>

            {/* Action Buttons - Fixed at bottom */}
            <div className="flex justify-end gap-3 p-6 pt-4 border-t border-gray-700 flex-shrink-0 bg-card">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                disabled={isLoading}
                className="px-5 py-2 rounded-md bg-gray-700 text-gray-200 font-medium hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={save}
                disabled={isLoading}
                className="px-5 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditProfileModal;