import React, { useEffect, useState, useContext } from 'react';
import { View, Text, DeviceEventEmitter } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { ModleContext } from '../../context/ModleContext';
import * as api from '../../api';

const ModleSummary = ({ username }) => {
  const [streak, setStreak] = useState(0);
  const { user } = useContext(AuthContext);
  const { global, refreshGlobal } = useContext(ModleContext);

  useEffect(() => {
    let mounted = true;
    const languages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'];

    const fetchServerStreaks = async () => {
      try {
        if (!user) {
          if (mounted) setStreak(0);
          return;
        }

        // 1. If viewing own profile, try context first
        if (user.username === username) {
          if (global && typeof global.streak === 'number') {
            if (mounted) setStreak(global.streak || 0);
            return;
          }
          // Try refresh
          try {
            const g = await refreshGlobal();
            if (mounted && g && typeof g.streak === 'number') {
              setStreak(g.streak || 0);
              return;
            }
          } catch (e) {}
        }

        // 2. Fallback to API call
        if (user.username === username) {
          try {
            const res = await api.getModleStatus('global');
            if (mounted && res && res.data && typeof res.data.streak === 'number') {
              setStreak(res.data.streak || 0);
              return;
            }
          } catch (e) {}

          // 3. Fallback to polling languages (legacy)
          const promises = languages.map(lang => api.getModleStatus(lang).then(r => r.data).catch(() => null));
          const results = await Promise.all(promises);
          const streaks = results.map(r => (r && typeof r.streak === 'number') ? r.streak : 0);
          const maxStreak = streaks.length ? Math.max(...streaks) : 0;
          if (mounted) setStreak(maxStreak || 0);
          return;
        }

        if (mounted) setStreak(0);
      } catch (err) {
        if (mounted) setStreak(0);
      }
    };

    fetchServerStreaks();

    // Event Listener for updates
    const subscription = DeviceEventEmitter.addListener('modleUpdated', (payload) => {
      try {
        // If own profile, prefer server refresh
        if (user && user.username === username) {
          refreshGlobal().then(g => {
            if (mounted && g && typeof g.streak === 'number') {
              setStreak(g.streak);
            }
          }).catch(() => {});
        }

        // Or use payload
        if (payload) {
          const s = (payload.global?.streak != null) 
            ? payload.global.streak 
            : (payload.language?.streak != null ? payload.language.streak : null);
            
          const num = Number(s);
          if (!isNaN(num) && mounted) setStreak(num || 0);
        }
      } catch (err) {
        // ignore
      }
    });

    return () => { 
      mounted = false; 
      subscription.remove();
    };
  }, [username, user, global, refreshGlobal]);

  const displayed = (user && user.username === username && global && typeof global.streak === 'number') 
    ? global.streak 
    : streak;

  return (
    <View className="flex-row items-center gap-1">
      <Text className="text-sm font-medium text-gray-300 opacity-90">Modle Streak:</Text>
      <Text className="text-sm font-semibold text-gray-100">{displayed} 🔥</Text>
    </View>
  );
};

export default ModleSummary;