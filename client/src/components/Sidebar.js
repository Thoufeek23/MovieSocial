import React, { useContext, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Home, Search, User, FileText, BookOpen, Puzzle, Database, MessageCircle, Users, ListOrdered } from 'lucide-react';
import * as api from '../api';

// Updated NavItem to accept a 'badge' prop
const NavItem = ({ to, icon: Icon, label, badge }) => {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-md relative ${active ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-900'}`}>
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
      
      {/* Badge Display */}
      {badge > 0 && (
        <span className="ml-auto bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  );
};

const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const { user, setUser, unreadCount, updateUnreadCount, setIsLinkedInCardMinimized } = useContext(AuthContext);
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

  // Close mobile sidebar when clicking a link
  const handleLinkClick = () => {
    setIsMobileOpen(false);
  };

  const handleMinimizedCardClick = () => {
    setIsLinkedInCardMinimized(false);
  };

  return (
    <>
      {/* Overlay for mobile - only shows when sidebar is open */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:sticky top-0 h-screen bg-background z-40 transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          w-56 md:w-56 p-4
        `}
      >
        <div className="flex flex-col items-start gap-2">
          {/* logo removed per request */}

          <nav className="flex flex-col w-full gap-1 mt-12 md:mt-0">
            <div onClick={handleLinkClick}>
              <NavItem to="/" icon={Home} label="Home" />
            </div>
            <div onClick={handleLinkClick}>
              <NavItem to="/search" icon={Search} label="Explore" />
            </div>
            <div onClick={handleLinkClick}>
              <NavItem to="/discussions" icon={BookOpen} label="Discussions" />
            </div>
            <div onClick={handleLinkClick}>
              <NavItem to="/ranks" icon={ListOrdered} label="Ranks" />
            </div>
            <div onClick={handleLinkClick}>
              <NavItem to="/modle" icon={Puzzle} label="Modle" />
            </div>
            <div onClick={handleLinkClick}>
              <NavItem to="/reviews" icon={FileText} label="Reviews" />
            </div>
            
            {/* Pass the unreadCount to the Messages item */}
            <div onClick={handleLinkClick}>
              <NavItem to="/messages" icon={MessageCircle} label="Messages" badge={unreadCount} />
            </div>
            
            {/*<NavItem to="/leaderboard" icon={Award} label="Leaderboard" />*/}
            <div onClick={handleLinkClick}>
              <NavItem to={profileLink} icon={User} label="Profile" />
            </div>
            
            {/* LinkedIn Card Widget - Always visible */}
            <div
              onClick={handleMinimizedCardClick}
              className="mt-3 mx-2 p-3 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 cursor-pointer hover:border-gray-600 transition-all duration-300 hover:shadow-lg"
            >
              <div className="flex flex-col items-center gap-2">
                <img
                  src="/Thoufeek_Funkopop.png"
                  alt="Thoufeek"
                  className="w-16 h-16 object-contain rounded-lg"
                />
                <p className="text-xs text-gray-400 text-center leading-tight">
                  Chat with me!
                </p>
              </div>
            </div>
            
            {/* Admin Section */}
            {isAdmin && (
              <>
                <div className="border-t border-gray-700 my-2 w-full"></div>
                <div className="text-xs text-gray-500 px-4 mb-1">ADMIN</div>
                <div onClick={handleLinkClick}>
                  <NavItem to="/admin/puzzles" icon={Database} label="Puzzle Admin" />
                </div>
                <div onClick={handleLinkClick}>
                  <NavItem to="/admin/users" icon={Users} label="User Admin" />
                </div>
              </>
            )}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;