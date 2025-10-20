import React, { useEffect, useState, useContext } from 'react';
import * as api from '../api';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Leaderboard = () => {
  const [global, setGlobal] = useState([]);
  const [regionResults, setRegionResults] = useState([]);
  const [userRegion, setUserRegion] = useState(null);
  const [userGlobalRank, setUserGlobalRank] = useState(null);
  const [userRegionRank, setUserRegionRank] = useState(null);
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
        setUserRegion(region || null);
        if (!region) return;
        const res = await api.getLeaderboardRegion(region);
        setRegionResults(res.data || []);
      } catch (e) {
        console.error('Failed to load region leaderboard', e);
      }
    };
    loadRegion();
  }, [user]);

  // compute current user's rank when leaderboards change
  useEffect(() => {
    if (!user || !user.username) {
      setUserGlobalRank(null);
      setUserRegionRank(null);
      return;
    }

    const gIdx = global.findIndex(u => String(u.username) === String(user.username));
    setUserGlobalRank(gIdx >= 0 ? gIdx + 1 : null);

    const rIdx = regionResults.findIndex(u => String(u.username) === String(user.username));
    setUserRegionRank(rIdx >= 0 ? rIdx + 1 : null);
  }, [global, regionResults, user]);

  return (
    <div className="space-y-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold inline">Leaderboard</h1>
          {userGlobalRank && (
            <span className="ml-4 inline-block align-middle bg-card px-3 py-1 rounded-full text-sm text-gray-200">Your global rank: <strong className="ml-2">#{userGlobalRank}</strong></span>
          )}
          {userRegionRank && (
            <span className="ml-3 inline-block align-middle bg-card px-3 py-1 rounded-full text-sm text-gray-200">Your region rank: <strong className="ml-2">#{userRegionRank}</strong></span>
          )}

          <p className="text-gray-400 mt-1">Top reviewers — global and region leaderboards highlighting the community’s most helpful reviewers.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Global leaderboard */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Global</h2>
            <Link to="/leaderboard" className="text-sm text-gray-400">View all</Link>
          </div>

          <div className="bg-card rounded divide-y divide-gray-800 overflow-hidden">
            {global.length === 0 && <div className="p-6 text-gray-400">No entries yet.</div>}
            {global.map((u, idx) => {
              const isTop = idx === 0;
              const rowBg = isTop ? 'bg-primary text-white' : 'bg-card hover:bg-gray-800';
              const nameClass = isTop ? 'text-white' : 'text-gray-100';
              const subClass = isTop ? 'text-primary/90' : 'text-gray-400';
              return (
                <Link key={u.userId} to={`/profile/${u.username}`} className={`p-4 flex items-center gap-4 ${rowBg} transition-colors cursor-pointer`}>
                  <div className="w-10 text-center text-lg font-bold">{idx + 1}</div>
                  <img src={u.avatar || '/default_dp.png'} alt={u.username} className="w-12 h-12 rounded-full object-cover border border-gray-700" />
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold truncate ${nameClass}`}>{u.username}</div>
                    <div className={`text-sm ${subClass}`}>Reviews: <span className="font-medium">{u.reviewCount}</span></div>
                  </div>
                  
                </Link>
              );
            })}
          </div>
        </section>

        {/* Region leaderboard */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Your Region</h2>
            <div className="text-sm text-gray-400">{userRegion ? userRegion : 'Based on your region'}</div>
          </div>

          <div className="bg-card rounded divide-y divide-gray-800 overflow-hidden">
            {regionResults.length === 0 && <div className="p-6 text-gray-400">No region entries yet.</div>}
            {regionResults.map((u, idx) => {
              const isTop = idx === 0;
              const rowBg = isTop ? 'bg-primary text-white' : 'bg-card hover:bg-gray-800';
              const nameClass = isTop ? 'text-white' : 'text-gray-100';
              const subClass = isTop ? 'text-primary/90' : 'text-gray-400';
              return (
                <Link key={u.userId} to={`/profile/${u.username}`} className={`p-4 flex items-center gap-4 ${rowBg} transition-colors cursor-pointer`}>
                  <div className="w-10 text-center text-lg font-bold">{idx + 1}</div>
                  <img src={u.avatar || '/default_dp.png'} alt={u.username} className="w-12 h-12 rounded-full object-cover border border-gray-700" />
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold truncate ${nameClass}`}>{u.username}</div>
                    <div className={`text-sm ${subClass}`}>Reviews: <span className="font-medium">{u.reviewCount}</span></div>
                  </div>
                  <div className="w-24 text-right text-sm text-gray-400">{u.region || ''}</div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Leaderboard;
