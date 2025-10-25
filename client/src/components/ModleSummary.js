import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const ModleSummary = ({ username }) => {
  const [streak, setStreak] = useState(0);

  const { user } = useContext(AuthContext);

  useEffect(() => {
    let mounted = true;
    const languages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'];

    const fetchServerStreaks = async () => {
      try {
        // If viewing your own profile and authenticated, fetch streaks from server
        if (user && user.username === username && localStorage.getItem('token')) {
          const token = localStorage.getItem('token');
          const apiRoot = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace(/\/$/, '') : 'http://localhost:5001';
          const apiBase = `${apiRoot}/api`;
          // Prefer server-side global union when available
          try {
            const res = await axios.get(`${apiBase}/users/modle/status?language=global`, { headers: { Authorization: `Bearer ${token}` } });
            if (mounted && res && res.data && typeof res.data.streak === 'number') {
              setStreak(res.data.streak || 0);
              return;
            }
          } catch (e) {
            // fallback to per-language polling if global not available
          }
          const promises = languages.map(lang => axios.get(`${apiBase}/users/modle/status?language=${encodeURIComponent(lang)}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.data).catch(() => null));
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
    return () => { mounted = false; };
  }, [username, user]);

  return (
    <div className="inline-flex items-center gap-2 text-sm font-medium text-gray-300">
      <span className="opacity-90">Modle Streak: </span>
      <span className="font-semibold text-gray-100">{streak}🔥</span>
    </div>
  );
};

export default ModleSummary;
