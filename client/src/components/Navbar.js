import React, { useContext, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ModleContext } from '../context/ModleContext';
import InstantSearchBar from './InstantSearchBar';
import Avatar from './Avatar';
import { Menu } from 'lucide-react';
import * as api from '../api';
// Use only MS_logo.png as the navbar logo
// post-related UI moved to sidebar; no inline post controls in navbar

const Navbar = ({ onToggleSidebar }) => {
  const { user } = useContext(AuthContext);
  const { global, refreshGlobal } = useContext(ModleContext);
  // derive modle streak for display in navbar (per-user). Server is source-of-truth for authenticated users.
  const [navbarStreak, setNavbarStreak] = useState(0);

  useEffect(() => {
    let didCancel = false;
    (async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Prefer server-provided global streak if available
        try {
          // Prefer ModleContext global if available
          if (global && typeof global.streak === 'number') {
            setNavbarStreak(global.streak || 0);
            return;
          }
          // otherwise, try refreshing global from context
          const g = await refreshGlobal();
          if (didCancel) return;
          if (g && typeof g.streak === 'number') {
            setNavbarStreak(g.streak || 0);
            return;
          }
        } catch (e) {
          // fallback to per-language polling
        }

        const languages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'];
        const promises = languages.map(lang => api.getModleStatus(lang).then(r => r.data).catch(() => null));
        const results = await Promise.all(promises);
        if (didCancel) return;
        const streaks = results.map(r => (r && typeof r.streak === 'number') ? r.streak : 0);
        const maxStreak = streaks.length ? Math.max(...streaks) : 0;
        setNavbarStreak(maxStreak || 0);
      } catch (e) {
        // ignore and keep default 0
      }
    })();
    // Listen for modle updates to refresh navbar streak immediately after a play
    const handler = async (e) => {
      try {
        console.debug('modleUpdated event received in Navbar; fetching authoritative global...', e && e.detail);
        // Always fetch authoritative global state from server to avoid races or stale event payloads
        const g = await refreshGlobal();
        if (g && typeof g.streak === 'number') {
          setNavbarStreak(g.streak || 0);
          return;
        }
        // As a fallback, try to use event payload if fetch failed
        const payload = e && e.detail;
        if (!payload) return;
        const s = (payload.global && payload.global.streak != null) ? payload.global.streak : (payload.language && payload.language.streak != null ? payload.language.streak : null);
        const num = (typeof s === 'number') ? s : (s ? Number(s) : 0);
        if (!Number.isNaN(num)) setNavbarStreak(num || 0);
      } catch (err) { console.debug('modleUpdated handler error in Navbar', err); }
    };
    window.addEventListener('modleUpdated', handler);
    return () => { didCancel = true; window.removeEventListener('modleUpdated', handler); };
  }, [user, global, refreshGlobal]);
  const location = useLocation();

  // Only show the top/global search on the Home screen
  const shouldShowSearch = location.pathname === '/';


  // post modal/flows removed from navbar

  return (
  <nav className="glass sticky top-0 z-50 px-3 py-0">
      <div className="container mx-auto flex items-center justify-between max-w-6xl gap-2">
        {/* Hamburger Menu - Only visible on mobile */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden flex-shrink-0 text-white p-2 hover:bg-gray-800 rounded-md transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Logo - Centered on mobile, left-aligned on desktop */}
        <div className="flex items-center gap-4 flex-1 md:flex-initial justify-center md:justify-start">
          <Link to="/" aria-label="Home" className="flex items-center justify-center h-full">
            <img src={process.env.PUBLIC_URL + '/MS_logo.png'} alt="Movie Social logo" className="w-32 h-32 max-h-16 md:w-40 md:h-40 md:max-h-20 object-contain" />
          </Link>
          {/* Leaderboard moved to sidebar */}
          {shouldShowSearch && (
            <div className="flex-1 md:flex-none ml-4 w-full md:w-96 hidden md:block">
              <InstantSearchBar />
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          {user ? (
            <>
              {/* AI Movie Picker Icon - Hidden per user request */}
              {/*<Link 
                to="/ai-recommendations" 
                title="Pick a movie for me"
                className="p-2 rounded-lg hover:bg-gray-800 transition-all duration-200"
              >
                <Sparkles className="w-5 h-5 text-green-400" />
              </Link>*/}
              <div className="flex items-center gap-2">
                <Avatar username={user.username} avatar={user.avatar} sizeClass="w-9 h-9" linkTo={`/profile/${user.username}`} className="border border-gray-600" />
                <div className="flex flex-col text-right">
                  <Link to="/modle" title="Play Modle" aria-label="Open Modle" className="text-xs text-gray-200 font-semibold cursor-pointer">
                    {(global && typeof global.streak === 'number') ? global.streak : navbarStreak} <span aria-hidden="true">🔥</span>
                  </Link>
                </div>
                {/* badge removed per request */}
              </div>
              {/* Logout moved to profile three-dots menu */}
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Login</Link>
              <Link to="/signup" className="btn btn-primary">Sign Up</Link>
            </>
          )}
        </div>
      </div>
      {/* Instant search bar removed from mobile view */}
      {/* Post modal removed from navbar; Post now lives as a sidebar action linking to /search */}
    </nav>
  );
};

export default Navbar;