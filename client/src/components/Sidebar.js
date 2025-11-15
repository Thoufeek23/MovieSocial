import React, { useContext, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Home, Search, User, FileText, BookOpen, Puzzle, Database } from 'lucide-react';
import { Award } from 'lucide-react';
import * as api from '../api';

const NavItem = ({ to, icon: Icon, label }) => {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-md ${active ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-900'}`}>
      <Icon className="w-5 h-5" />
      <span className="hidden md:inline-block font-medium">{label}</span>
    </Link>
  );
};

const Sidebar = () => {
  const { user, setUser } = useContext(AuthContext);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);
  const profileLink = user ? `/profile/${user.username}` : '/login';
  
  // Check admin status for existing tokens that don't have isAdmin field
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user && user.isAdmin === undefined && !isCheckingAdmin) {
        setIsCheckingAdmin(true);
        try {
          const response = await api.getCurrentUser();
          setUser({ ...user, ...response.data });
        } catch (error) {
          console.error('Failed to fetch admin status:', error);
        } finally {
          setIsCheckingAdmin(false);
        }
      }
    };
    
    checkAdminStatus();
  }, [user, setUser, isCheckingAdmin]);
  
  // Check if user is admin
  const isAdmin = user && user.isAdmin === true;

  return (
    <aside className="w-20 md:w-56 bg-background/0 sticky top-0 h-screen p-4">
      <div className="flex flex-col items-start gap-2">
        {/* logo removed per request */}

        <nav className="flex flex-col w-full gap-1">
          <NavItem to="/" icon={Home} label="Home" />
          <NavItem to="/search" icon={Search} label="Explore" />
          <NavItem to="/discussions" icon={BookOpen} label="Discussions" />
          <NavItem to="/modle" icon={Puzzle} label="Modle" />
          <NavItem to="/reviews" icon={FileText} label="Reviews" />
          <NavItem to="/leaderboard" icon={Award} label="Leaderboard" />
          <NavItem to={profileLink} icon={User} label="Profile" />
          
          {/* Admin Section */}
          {isAdmin && (
            <>
              <div className="border-t border-gray-700 my-2 w-full"></div>
              <div className="text-xs text-gray-500 px-4 mb-1 hidden md:block">ADMIN</div>
              <NavItem to="/admin/puzzles" icon={Database} label="Puzzle Admin" />
            </>
          )}
        </nav>

        {/* post button removed from sidebar per request */}
      </div>
    </aside>
  );
};

export default Sidebar;
