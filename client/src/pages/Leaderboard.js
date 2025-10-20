import React, { useEffect, useState, useContext } from 'react';
import * as api from '../api';
import { AuthContext } from '../context/AuthContext';

const Leaderboard = () => {
  const [global, setGlobal] = useState([]);
  const [regionResults, setRegionResults] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const load = async () => {
      try {
        const g = await api.getLeaderboardGlobal();
        setGlobal(g.data || []);
      } catch (e) {
        console.error('Failed to load global leaderboard', e);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadRegion = async () => {
      if (!user || !user.username) return;
      // user's region is stored on server-side profile. fetch my profile to get region.
      try {
        const profile = await api.getUserProfile(user.username);
        const region = profile.data.region;
        if (!region) return;
        const res = await api.getLeaderboardRegion(region);
        setRegionResults(res.data || []);
      } catch (e) {
        console.error('Failed to load region leaderboard', e);
      }
    };
    loadRegion();
  }, [user]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="text-gray-400">Top reviewers across the platform</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Global Leaderboard</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {global.map((u, idx) => (
            <div key={u.userId} className="p-4 bg-card rounded">
              <div className="flex items-center gap-4">
                <img src={u.avatar || '/default_dp.png'} alt={u.username} className="w-12 h-12 rounded-full" />
                <div>
                  <div className="font-semibold">{idx + 1}. {u.username}</div>
                  <div className="text-sm text-gray-400">Reviews: {u.reviewCount}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Region Leaderboard</h2>
        <div className="text-gray-400">Region leaderboard shows users from your signup region.</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {regionResults.map((u, idx) => (
            <div key={u.userId} className="p-4 bg-card rounded">
              <div className="flex items-center gap-4">
                <img src={u.avatar || '/default_dp.png'} alt={u.username} className="w-12 h-12 rounded-full" />
                <div>
                  <div className="font-semibold">{idx + 1}. {u.username}</div>
                  <div className="text-sm text-gray-400">Reviews: {u.reviewCount} • {u.region}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Leaderboard;
