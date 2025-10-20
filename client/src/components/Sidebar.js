import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Home, Search, User, FileText, BookOpen } from 'lucide-react';
import { Award } from 'lucide-react';

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
  const { user } = useContext(AuthContext);
  const profileLink = user ? `/profile/${user.username}` : '/login';

  return (
    <aside className="w-20 md:w-56 bg-background/0 sticky top-0 h-screen p-4">
      <div className="flex flex-col items-start gap-2">
        {/* logo removed per request */}

        <nav className="flex flex-col w-full gap-1">
          <NavItem to="/" icon={Home} label="Home" />
          <NavItem to="/search" icon={Search} label="Explore" />
          <NavItem to="/discussions" icon={BookOpen} label="Discussions" />
          <NavItem to="/reviews" icon={FileText} label="Reviews" />
          <NavItem to="/leaderboard" icon={Award} label="Leaderboard" />
          <NavItem to={profileLink} icon={User} label="Profile" />
        </nav>

        {/* post button removed from sidebar per request */}
      </div>
    </aside>
  );
};

export default Sidebar;
