import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from './Avatar';
import toast from 'react-hot-toast';
import * as api from '../api';
import COUNTRIES from '../data/countries'; // Import country data
import { X } from 'lucide-react';

const EditProfileModal = ({ isOpen, onClose, profile, onUpdated }) => {
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar || '');
  const [country, setCountry] = useState(profile?.country || '');
  const [stateRegion, setStateRegion] = useState(profile?.state || ''); // Use 'state' field if available
  const [isLoading, setIsLoading] = useState(false);
  const avatarRef = useRef(null);

  // Update local state if the profile prop changes (e.g., after initial load)
  useEffect(() => {
    if (profile) {
      setBio(profile.bio || '');
      setAvatarPreview(profile.avatar || '');
      setCountry(profile.country || '');
      setStateRegion(profile.state || ''); // Prioritize 'state' field
    }
  }, [profile]);

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

  // Handle country change
  const handleCountryChange = (e) => {
    const countryCode = e.target.value;
    const countryObj = COUNTRIES.find(c => c.code === countryCode);
    setCountry(countryCode);
    // Reset state/region or set to country name if no states
    const statesList = countryObj?.states || [];
    setStateRegion(statesList.length > 0 ? '' : (countryObj ? countryObj.name : ''));
  };

  // Handle saving changes
  const save = async () => {
    setIsLoading(true);
    try {
      const payload = {
        bio,
        country,
        state: stateRegion, // Send the state/region value as 'state'
      };
      // Only include avatar if it's different from the original or a new one was selected
      if (avatarPreview !== profile?.avatar) {
        payload.avatar = avatarPreview;
      }

      await api.updateMyProfile(payload);
      const { data } = await api.getUserProfile(profile.username); // Refetch updated profile
      toast.success('Profile updated');
      onUpdated?.(data); // Notify parent component
      onClose();
    } catch (err) {
      console.error(err);
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
            className="relative bg-card w-full max-w-2xl rounded-lg shadow-xl p-6 border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5 border-b border-gray-700 pb-3">
              <h3 className="text-xl font-semibold text-white">Edit Profile</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-5">
                <Avatar username={profile.username} avatar={avatarPreview} sizeClass="w-20 h-20" className="border-2 border-gray-600" />
                <div>
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
                  <p className="text-xs text-gray-500 mt-1">Max 2MB. PNG, JPG, GIF.</p>
                </div>
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

              {/* Country Section */}
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-300 mb-2">Country</label>
                <select
                  id="country"
                  name="country"
                  value={country}
                  onChange={handleCountryChange}
                  className="w-full p-3 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 appearance-none" // Added appearance-none
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code} className="bg-gray-800 text-white">{c.name}</option> // Added styles for options
                  ))}
                </select>
              </div>

              {/* State/Region Section */}
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-300 mb-2">State / Region</label>
                {(() => {
                  const countryObj = COUNTRIES.find(c => c.code === country);
                  const statesList = countryObj?.states || [];
                  const isDisabled = !country || statesList.length === 0;

                  if (statesList.length > 0) {
                    return (
                      <select
                        id="state"
                        name="state"
                        value={stateRegion}
                        onChange={(e) => setStateRegion(e.target.value)}
                        disabled={isDisabled}
                        className="w-full p-3 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed appearance-none" // Added appearance-none
                      >
                        <option value="">Select state/region</option>
                        {statesList.map(s => (
                          <option key={s} value={s} className="bg-gray-800 text-white">{s}</option> // Added styles for options
                        ))}
                      </select>
                    );
                  } else {
                    // Input field when no predefined states (or country not selected)
                    return (
                      <input
                        id="state"
                        name="state"
                        value={stateRegion} // Value might be country name if no states
                        onChange={(e) => setStateRegion(e.target.value)}
                        disabled={!country} // Only allow input if a country is selected
                        placeholder={country ? "Enter state/region" : "Select a country first"}
                        className="w-full p-3 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    );
                  }
                })()}
                <p className="text-xs text-gray-500 mt-1">Used for regional leaderboards.</p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
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
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditProfileModal;