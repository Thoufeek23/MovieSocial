import React, { useEffect, useState } from 'react';

const STORAGE_KEY_PREFIX = 'modle_v1_';

const ModleSummary = ({ username }) => {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    try {
      // read per-user key and compute streak from history
      const baseKey = STORAGE_KEY_PREFIX + (username || 'guest');
      const raw = localStorage.getItem(baseKey);
      const data = raw ? JSON.parse(raw) : null;
      if (data && data.history) {
        let count = 0;
        // compute using local dates
        const today = new Date();
        let d = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        while (true) {
          const entry = data.history[d];
          if (entry && entry.correct) {
            count += 1;
            const parts = d.split('-').map(n => parseInt(n, 10));
            const prev = new Date(parts[0], parts[1] - 1, parts[2]);
            prev.setDate(prev.getDate() - 1);
            d = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`;
          } else break;
        }
        setStreak(count);
      }
    } catch (err) {
      // ignore
    }
  }, [username]);

  return (
    <div className="inline-flex items-center gap-2 text-sm font-medium text-gray-300">
      <span className="opacity-90">Modle Streak: </span>
      <span className="font-semibold text-gray-100">{streak}🔥</span>
    </div>
  );
};

export default ModleSummary;
