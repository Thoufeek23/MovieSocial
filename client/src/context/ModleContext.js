import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as api from '../api';
import { AuthContext } from './AuthContext';

const ModleContext = createContext({
  global: null,
  languageData: {},
  refreshGlobal: async () => {},
  refreshLanguage: async (lang) => {},
  updateFromServerPayload: (payload) => {},
});

const ModleProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [global, setGlobal] = useState(null);
  const [languageData, setLanguageData] = useState({});

  const refreshGlobal = useCallback(async () => {
    try {
      if (!user) return null;
      const res = await api.getModleStatus('global');
      if (res && res.data) {
        setGlobal(res.data);
        return res.data;
      }
    } catch (e) {
      // ignore
    }
    return null;
  }, [user]);

  const refreshLanguage = useCallback(async (lang = 'English') => {
    try {
      if (!user) return null;
      const res = await api.getModleStatus(lang);
      if (res && res.data) {
        setLanguageData(prev => ({ ...prev, [lang]: res.data }));
        return res.data;
      }
    } catch (e) {
      // ignore
    }
    return null;
  }, [user]);

  const updateFromServerPayload = useCallback((payload, lang) => {
    if (!payload) return;
    if (payload.global) setGlobal(payload.global);
    if (payload.language) {
      
      // --- FIX 2 ---: Removed the old logic that guessed the language key
      // We now explicitly use the 'lang' passed into the function.
      const langToUpdate = lang || 'English'; // Fallback just in case
      setLanguageData(prev => ({ ...prev, [langToUpdate]: payload.language }));
      
    }
  }, []);

  // When user logs in/out, refresh global state
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      if (user && localStorage.getItem('token')) {
        await refreshGlobal();
      } else {
        // clear when logged out
        setGlobal(null);
        setLanguageData({});
      }
    })();
    return () => { mounted = false; };
  }, [user, refreshGlobal]);

  return (
    <ModleContext.Provider value={{ global, languageData, refreshGlobal, refreshLanguage, updateFromServerPayload }}>
      {children}
    </ModleContext.Provider>
  );
};

export { ModleContext, ModleProvider };
