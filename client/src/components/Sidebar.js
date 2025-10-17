import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Home, Search, User, FileText, BookOpen, PlusCircle } from 'lucide-react';

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
        <div className="mb-4 px-2">
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-card rounded-full w-12 h-12 flex items-center justify-center" aria-hidden>
              {/* Plain circle logo (no dash) */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="2" fill="#6b7280" />
              </svg>
            </div>
          </Link>
        </div>

        <nav className="flex flex-col w-full gap-1">
          <NavItem to="/" icon={Home} label="Home" />
          <NavItem to="/search" icon={Search} label="Explore" />
          <NavItem to="/discussions" icon={BookOpen} label="Discussions" />
          <NavItem to="/reviews" icon={FileText} label="Reviews" />
          <NavItem to={profileLink} icon={User} label="Profile" />
        </nav>

        <div className="mt-auto w-full">
          <Link to="/search" className="flex items-center gap-3 px-4 py-3 rounded-md text-gray-300 hover:bg-gray-900">
            <PlusCircle className="w-5 h-5" />
            <span className="hidden md:inline-block font-medium">Post</span>
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
