import React, { useEffect, useState } from 'react';

const STORAGE_KEY_PREFIX = 'modle_v1_';

const ModleSummary = ({ username }) => {
  const [streak, setStreak] = useState(0);
  const [lastPlayed, setLastPlayed] = useState(null);

  useEffect(() => {
    try {
      const key = STORAGE_KEY_PREFIX + (username || 'guest');
      const raw = localStorage.getItem(key);
      const data = raw ? JSON.parse(raw) : null;
      if (data) {
        setStreak(data.streak || 0);
        setLastPlayed(data.lastPlayed || null);
      }
    } catch (err) {
      // ignore
    }
  }, [username]);

  return (
    <div className="text-sm text-gray-300">
      <div className="font-semibold text-gray-100">Modle</div>
      <div className="text-xs">Streak: <span className="font-medium">{streak}</span></div>
      <div className="text-xs">Last played: <span className="font-medium">{lastPlayed || 'Never'}</span></div>
    </div>
  );
};

export default ModleSummary;
