import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import * as api from '../api';
import { Search, Film } from 'lucide-react';
import Avatar from './Avatar';

const InstantSearchBar = ({ className = 'w-full', maxResults = 5 }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize state from URL params
  const getParams = () => new URLSearchParams(location.search);
  const [query, setQuery] = useState(getParams().get('q') || '');
  const [searchType, setSearchType] = useState(getParams().get('type') || 'movies'); 
  
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync state with URL changes (e.g. browser back button or navigation)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    const t = params.get('type') || 'movies';
    if (q !== query) setQuery(q);
    if (t !== searchType) setSearchType(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const fetchResults = async (searchQuery) => {
    if (searchQuery.length > 2) {
      setLoading(true);
      setError('');
      try {
        let data = [];
        if (searchType === 'movies') {
          // --- UPDATED: Pass Filters to Instant Search ---
          const params = new URLSearchParams(location.search);
          const filters = {
            language: params.get('language'),
            decade: params.get('decade')
          };
          const res = await api.searchMovies(searchQuery, filters);
          data = res.data.results || [];
          // -----------------------------------------------
        } else {
          const res = await api.searchUsers(searchQuery);
          data = res.data.results || res.data || [];
        }
        
        setResults((data || []).slice(0, maxResults));
        setIsOpen(true);
      } catch (err) {
        console.error('Search failed', err);
        setError('Could not fetch search results.');
        setResults([]);
        setIsOpen(true);
      } finally {
        setLoading(false);
      }
    } else {
      setResults([]);
      setIsOpen(false);
      setError('');
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      // Only auto-search if user is typing; don't trigger on initial empty load
      if (query) fetchResults(query);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, searchType, location.search]); // Add location.search dependency to refetch if filters change

  const closeDropdown = () => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  const wrapperRef = useRef(null);
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    const handleGlobalKey = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleGlobalKey);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleGlobalKey);
    };
  }, []);

  // When navigating away, close dropdown
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length > 0) {
      // --- UPDATED: Preserve Filters ---
      const params = new URLSearchParams(location.search);
      params.set('q', trimmed);
      params.set('type', searchType);
      navigate(`/search?${params.toString()}`);
      // ---------------------------------
      setIsOpen(false);
    }
  };

  const handleTypeToggle = (type) => {
    setSearchType(type);
    setResults([]);
    // If we are already on the search page, update the URL immediately
    if (location.pathname === '/search') {
      const trimmed = query.trim();
      // --- UPDATED: Preserve Filters ---
      const params = new URLSearchParams(location.search);
      params.set('type', type);
      if (trimmed) params.set('q', trimmed);
      navigate(`/search?${params.toString()}`);
      // ---------------------------------
    }
  };

  return (
    <div className={`relative z-50 ${className}`} ref={wrapperRef}>
      <div className="flex items-center gap-3">
        
        {/* SEARCH INPUT (Left Side) */}
        <form onSubmit={handleSubmit} className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-green-500 transition-colors" size={18} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${searchType}...`}
            className="w-full bg-card p-2.5 pl-10 rounded-xl border border-gray-800 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none transition-all placeholder:text-gray-600"
            aria-label={`Search ${searchType}`}
          />
          
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl border border-gray-800 shadow-2xl overflow-hidden max-h-[60vh] overflow-y-auto z-50">
              {loading && <div className="p-4 text-sm text-gray-400 text-center">Searching...</div>}
              {error && !loading && <div className="p-4 text-sm text-red-400 text-center">{error}</div>}
              {!loading && !error && results.length === 0 && <div className="p-4 text-sm text-gray-500 text-center">No results found</div>}

              {!loading && results.map((item) => (
                searchType === 'movies' ? (
                  <Link
                    key={item.id}
                    to={`/movie/${item.id}`}
                    onClick={closeDropdown}
                    className="flex items-center p-3 hover:bg-white/5 transition-colors border-b border-gray-800/50 last:border-0"
                  >
                    {item.poster_path ? (
                      <img src={`https://image.tmdb.org/t/p/w92${item.poster_path}`} alt={item.title} className="w-10 h-14 object-cover rounded shadow-sm mr-3" />
                    ) : (
                      <div className="w-10 h-14 bg-gray-800 rounded mr-3 flex items-center justify-center">
                        <Film size={20} className="text-gray-600" />
                      </div>
                    )}
                    <div className="flex-1 overflow-hidden">
                      <p className="font-semibold text-gray-200 truncate">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.release_date?.substring(0, 4)}</p>
                    </div>
                  </Link>
                ) : (
                  <Link
                    key={item._id || item.username}
                    to={`/profile/${item.username}`}
                    onClick={closeDropdown}
                    className="flex items-center p-3 hover:bg-white/5 transition-colors border-b border-gray-800/50 last:border-0"
                  >
                    <div className="mr-3">
                      <Avatar username={item.username} avatar={item.avatar} sizeClass="w-10 h-10" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-semibold text-gray-200 truncate">{item.username}</p>
                      <p className="text-xs text-gray-500">View Profile</p>
                    </div>
                  </Link>
                )
              ))}
            </div>
          )}
        </form>

        {/* TOGGLE BUTTONS (Right Side) */}
        <div className="flex bg-black/20 p-1 rounded-lg border border-gray-700/50 shrink-0">
          <button
            type="button"
            onClick={() => handleTypeToggle('movies')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              searchType === 'movies' 
                ? 'bg-green-600 text-white shadow-sm ring-1 ring-green-500' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            Movies
          </button>
          <button
            type="button"
            onClick={() => handleTypeToggle('users')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              searchType === 'users' 
                ? 'bg-green-600 text-white shadow-sm ring-1 ring-green-500' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            Users
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstantSearchBar;