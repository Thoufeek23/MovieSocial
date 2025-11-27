import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import * as api from '../api';

export const ModleContext = createContext();

export const ModleProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  
  // 'global' holds the unified stats: { streak, lastPlayedDate, etc. }
  const [global, setGlobal] = useState({ streak: 0 });

  // 1. Fetch global stats from server whenever user logs in or mounts
  useEffect(() => {
    if (user) {
      refreshGlobal();
    } else {
      setGlobal({ streak: 0 });
    }
  }, [user]);

  const refreshGlobal = async () => {
    try {
      // Fetch status for 'global' virtual language to get unified streak
      const { data } = await api.getModleStatus('global');
      if (data) {
        setGlobal(prev => ({
          ...prev,
          streak: data.streak || 0,
          // You can extend this with other global stats if needed
        }));
        return data;
      }
    } catch (error) {
      console.log('Failed to refresh global modle stats', error);
    }
    return null;
  };

  // 2. Helper to update context from a game result payload (optimistic update)
  // This is called by ModleGame after a correct guess
  const updateFromServerPayload = (payload, language) => {
    if (!payload) return;

    // The server returns { global: { streak: N, ... }, language: { ... } }
    if (payload.global) {
      setGlobal(prev => ({
        ...prev,
        streak: payload.global.streak ?? prev.streak
      }));
    }
  };

  return (
    <ModleContext.Provider value={{ global, refreshGlobal, updateFromServerPayload }}>
      {children}
    </ModleContext.Provider>
  );
};