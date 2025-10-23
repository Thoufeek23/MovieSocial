import React, { useEffect, useState } from 'react';

const STORAGE_KEY_PREFIX = 'modle_v1_';

const ModleSummary = ({ username }) => {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    try {
      // prefer user-scoped key; language-specific keys are stored by ModleGame as '<prefix><username>_<language>'
      const baseKey = STORAGE_KEY_PREFIX + (username || 'guest');
      // if there is a language-suffixed key, prefer that (best-effort: check common languages)
      const languages = ['English','Hindi','Tamil','Telugu','Kannada','Malayalam'];
      let found = null;
      for (const lang of languages) {
        const k = `${baseKey}_${lang}`;
        const r = localStorage.getItem(k);
        if (r) { found = r; break; }
      }
      const raw = found || localStorage.getItem(baseKey);
      const data = raw ? JSON.parse(raw) : null;
      if (data) {
        setStreak(data.streak || 0);
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
