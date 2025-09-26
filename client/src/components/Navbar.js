import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import InstantSearchBar from './InstantSearchBar';
import { Clapperboard } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const hideSearchOn = ['/login', '/signup'];
  const shouldShowSearch = !hideSearchOn.includes(location.pathname);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-card/80 backdrop-blur-sm sticky top-0 z-50 p-4 border-b border-gray-800">
      <div className="container mx-auto flex justify-between items-center max-w-6xl">
        <Link to="/" aria-label="Home" className="flex items-center gap-2 text-2xl font-bold text-white hover:text-primary transition-colors">
          <Clapperboard size={28} />
          Movie Social
        </Link>
        {shouldShowSearch && (
          <div className="hidden md:block">
            <InstantSearchBar />
          </div>
        )}
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Link to={`/profile/${user.username}`} className="text-gray-300 hover:text-white transition-colors">Profile</Link>
              <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-300 hover:text-white transition-colors">Login</Link>
              <Link to="/signup" className="bg-primary hover:bg-green-700 text-primary-foreground font-bold py-2 px-4 rounded-lg transition-colors">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
       {shouldShowSearch && (
         <div className="md:hidden mt-4">
           <InstantSearchBar />
         </div>
       )}
    </nav>
  );
};

export default Navbar;