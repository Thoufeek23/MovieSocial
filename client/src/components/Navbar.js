import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import InstantSearchBar from './InstantSearchBar';
import Avatar from './Avatar';
// Use only MS_logo.png as the navbar logo
// post-related UI moved to sidebar; no inline post controls in navbar

const Navbar = () => {
  const { user } = useContext(AuthContext);
  // derive modle streak for display in navbar (best-effort; prefer language-specific keys)
  const getStreakForUser = () => {
    try {
      const prefix = 'modle_v1_' + (user?.username || 'guest');
      const langs = ['English','Hindi','Tamil','Telugu','Kannada','Malayalam'];
      for (const l of langs) {
        const k = `${prefix}_${l}`;
        const raw = localStorage.getItem(k);
        if (raw) {
          const d = JSON.parse(raw);
          return d.streak || 0;
        }
      }
      const base = localStorage.getItem(prefix);
      if (base) {
        const d = JSON.parse(base);
        return d.streak || 0;
      }
    } catch (e) { /* ignore */ }
    return 0;
  };
  const navbarStreak = getStreakForUser();
  const location = useLocation();

  // Only show the top/global search on the Home screen
  const shouldShowSearch = location.pathname === '/';


  // post modal/flows removed from navbar

  return (
  <nav className="glass sticky top-0 z-50 px-3 py-0">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between max-w-6xl gap-2">
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <Link to="/" aria-label="Home" className="flex items-center justify-center h-full">
            <img src={process.env.PUBLIC_URL + '/MS_logo.png'} alt="Movie Social logo" className="w-32 h-32 max-h-16 md:w-40 md:h-40 md:max-h-20 object-contain mx-auto" />
          </Link>
          {/* Leaderboard moved to sidebar */}
          {shouldShowSearch && (
            <div className="flex-1 md:flex-none ml-4 w-full md:w-96">
              <div className="hidden md:block">
                <InstantSearchBar />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {user ? (
            <>
              <div className="flex items-center gap-2">
                <Avatar username={user.username} avatar={user.avatar} sizeClass="w-9 h-9" linkTo={`/profile/${user.username}`} className="border border-gray-600" />
                <div className="flex flex-col text-right">
                  <Link to="/modle" title="Play Modle" aria-label="Open Modle" className="text-xs text-gray-200 font-semibold cursor-pointer">
                    {navbarStreak} <span aria-hidden="true">🔥</span>
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
      {shouldShowSearch && (
        <div className="md:hidden mt-3 px-4 w-full">
          <InstantSearchBar />
        </div>
      )}
      {/* Post modal removed from navbar; Post now lives as a sidebar action linking to /search */}
    </nav>
  );
};

export default Navbar;