import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import InstantSearchBar from './InstantSearchBar';
import Avatar from './Avatar';
import { Clapperboard } from 'lucide-react';
// post-related UI moved to sidebar; no inline post controls in navbar

const Navbar = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  // Only show the top/global search on the Home screen
  const shouldShowSearch = location.pathname === '/';


  // post modal/flows removed from navbar

  return (
    <nav className="glass sticky top-0 z-50 px-3 py-2">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between max-w-6xl gap-2">
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <Link to="/" aria-label="Home" className="flex items-center gap-2 text-xl md:text-2xl font-bold text-white hover:text-primary transition-colors">
            <Clapperboard size={26} />
            <span className="hidden md:inline">Movie Social</span>
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
              <Avatar username={user.username} avatar={user.avatar} sizeClass="w-9 h-9" linkTo={`/profile/${user.username}`} className="border border-gray-600" />
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