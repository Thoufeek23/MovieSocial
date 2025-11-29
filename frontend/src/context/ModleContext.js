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
      console.debug('Failed to fetch global modle status:', e);
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
      console.debug(`Failed to fetch modle status for ${lang}:`, e);
    }
    return null;
  }, [user]);

  // Accept a server payload (the shape returned by POST or GET) and merge into context
  const updateFromServerPayload = useCallback((payload) => {
    if (!payload) return;
    if (payload.global) setGlobal(payload.global);
    if (payload.language) {
      // payload.language may be a language object; we don't know which language key it came from.
      // If it includes a language name, use it; otherwise leave as-is and merge by 'English'.
      // Best-effort: try to detect a language by comparing to existing data keys.
      const langKeys = Object.keys(languageData || {});
      if (langKeys.length === 1) {
        setLanguageData(prev => ({ ...prev, [langKeys[0]]: payload.language }));
      } else {
        // fallback: set under 'English'
        setLanguageData(prev => ({ ...prev, English: payload.language }));
      }
    }
  }, [languageData]);

  // When user logs in/out, refresh global state
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      if (user) {
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