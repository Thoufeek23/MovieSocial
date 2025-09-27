import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import InstantSearchBar from './InstantSearchBar';
import Avatar from './Avatar';
import { Clapperboard } from 'lucide-react';

const Navbar = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  const hideSearchOn = ['/login', '/signup'];
  const shouldShowSearch = !hideSearchOn.includes(location.pathname);


  return (
    <nav className="glass sticky top-0 z-50 p-3">
      <div className="container mx-auto flex items-center justify-between max-w-6xl">
        <div className="flex items-center gap-4">
          <Link to="/" aria-label="Home" className="flex items-center gap-2 text-2xl font-bold text-white hover:text-primary transition-colors">
            <Clapperboard size={28} />
            <span className="hidden sm:inline">Movie Social</span>
          </Link>
          {shouldShowSearch && (
            <div className="hidden md:block w-96">
              <InstantSearchBar />
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
        <div className="md:hidden mt-3 px-4">
          <InstantSearchBar />
        </div>
      )}
    </nav>
  );
};

export default Navbar;