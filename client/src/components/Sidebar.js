import React, { useContext, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Home, Search, User, FileText, BookOpen, Puzzle, Database, MessageCircle } from 'lucide-react';
import { Award } from 'lucide-react';
import * as api from '../api';

// Updated NavItem to accept a 'badge' prop
const NavItem = ({ to, icon: Icon, label, badge }) => {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-md relative ${active ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-900'}`}>
      <Icon className="w-5 h-5" />
      <span className="hidden md:inline-block font-medium">{label}</span>
      
      {/* Badge Display */}
      {badge > 0 && (
        <span className="absolute top-2 left-7 md:top-auto md:left-auto md:relative md:ml-auto bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  );
};

const Sidebar = () => {
  const { user, setUser, unreadCount, updateUnreadCount } = useContext(AuthContext);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);
  const profileLink = user ? `/profile/${user.username}` : '/login';
  
  // Poll for unread messages every 60 seconds to keep sidebar updated
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
        updateUnreadCount();
    }, 60000);
    return () => clearInterval(interval);
  }, [user, updateUnreadCount]);

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
          
          {/* Pass the unreadCount to the Messages item */}
          <NavItem to="/messages" icon={MessageCircle} label="Messages" badge={unreadCount} />
          
          {/*<NavItem to="/leaderboard" icon={Award} label="Leaderboard" />*/}
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
      </div>
    </aside>
  );
};

export default Sidebar;