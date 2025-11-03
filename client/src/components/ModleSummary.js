import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import * as api from '../api';
import { ModleContext } from '../context/ModleContext';

const ModleSummary = ({ username }) => {
  const [streak, setStreak] = useState(0);

  const { user } = useContext(AuthContext);
  const { global, refreshGlobal } = useContext(ModleContext);

  useEffect(() => {
    let mounted = true;
    const languages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'];

    const fetchServerStreaks = async () => {
      try {
        // If viewing your own profile and authenticated, prefer ModleContext global
        if (user && user.username === username && localStorage.getItem('token')) {
          if (global && typeof global.streak === 'number') {
            if (mounted) setStreak(global.streak || 0);
            return;
          }
          // try to refresh via context
          try {
            const g = await refreshGlobal();
            if (mounted && g && typeof g.streak === 'number') {
              setStreak(g.streak || 0);
              return;
            }
          } catch (e) {
            // fallback to per-language polling
          }
        }

        // If not returned above, fall back to previous per-language polling
        if (user && user.username === username && localStorage.getItem('token')) {
          //const apiRoot = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace(/\/$/, '') : 'http://localhost:5001';
          // Prefer server-side global union when available
          try {
            try {
              const res = await api.getModleStatus('global');
              if (mounted && res && res.data && typeof res.data.streak === 'number') {
                setStreak(res.data.streak || 0);
                return;
              }
            } catch (e) {
              // fallback to per-language polling if global not available
            }
          } catch (e) {
            // fallback to per-language polling if global not available
          }
          const promises = languages.map(lang => api.getModleStatus(lang).then(r => r.data).catch(() => null));
          const results = await Promise.all(promises);
          const streaks = results.map(r => (r && typeof r.streak === 'number') ? r.streak : 0);
          const maxStreak = streaks.length ? Math.max(...streaks) : 0;
          if (mounted) setStreak(maxStreak || 0);
          return;
        }

        // For other viewers or unauthenticated users we don't persist or read localStorage;
        // show a neutral 0 (server is the source-of-truth when signed in as the owner).
        if (mounted) setStreak(0);
      } catch (err) {
        // ignore server errors and keep default
        if (mounted) setStreak(0);
      }
    };

    fetchServerStreaks();
    // Listen for modle updates from other parts of the app (e.g. after playing)
    const handler = async (e) => {
      try {
        console.debug('modleUpdated event received in ModleSummary; fetching authoritative global...', e && e.detail);
        // For owner's profile prefer an authoritative server read to avoid races
        if (user && user.username === username && localStorage.getItem('token')) {
          try {
            const g = await refreshGlobal();
            if (mounted && g && typeof g.streak === 'number') {
              setStreak(g.streak || 0);
              return;
            }
          } catch (e) {
            // fallthrough to payload fallback
          }
        }

        // Fallback: use event payload if server fetch isn't available
        const payload = e && e.detail;
        if (!payload) return;
        const s = (payload.global && payload.global.streak != null) ? payload.global.streak : (payload.language && payload.language.streak != null ? payload.language.streak : null);
        const num = (typeof s === 'number') ? s : (s ? Number(s) : 0);
        if (!Number.isNaN(num) && mounted) setStreak(num || 0);
      } catch (err) { console.debug('modleUpdated handler error in ModleSummary', err); }
    };
    window.addEventListener('modleUpdated', handler);
    return () => { mounted = false; window.removeEventListener('modleUpdated', handler); };
  }, [username, user, global, refreshGlobal]);

  const displayed = (user && user.username === username && global && typeof global.streak === 'number') ? global.streak : streak;
  return (
    <div className="inline-flex items-center gap-2 text-sm font-medium text-gray-300">
      <span className="opacity-90">Modle Streak: </span>
      <span className="font-semibold text-gray-100">{displayed}🔥</span>
    </div>
  );
};

export default ModleSummary;
