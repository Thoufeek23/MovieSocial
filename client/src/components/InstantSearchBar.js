import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import * as api from '../api';
import { Search, Film } from 'lucide-react';

// Combined instant search + form search. Behaviors preserved:
// - As-you-type suggestions (debounced)
// - Enter / form submit navigates to full search page
// - Shows a user-facing error message when the API call fails

const InstantSearchBar = ({ className = 'w-full', maxResults = 5 }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchResults = async (searchQuery) => {
    if (searchQuery.length > 2) {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.searchMovies(searchQuery);
        setResults((data.results || []).slice(0, maxResults)); // Show top N results
        setIsOpen(true);
      } catch (err) {
        console.error('Search failed', err);
        setError('Could not fetch search results. Please try again.');
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

  // Simple debounce using useEffect
  useEffect(() => {
    const t = setTimeout(() => {
      fetchResults(query);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const closeDropdown = () => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
    setError('');
  };

  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleGlobalKey = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleGlobalKey);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleGlobalKey);
    };
  }, []);

  // Close the dropdown when the route or query string changes (e.g., user navigated)
  useEffect(() => {
    if (isOpen) {
      setIsOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length > 0) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
      setIsOpen(false);
      // keep the query in the input in case the user navigates back
    }
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search movies..."
          className="w-full bg-card p-2 pl-10 rounded-lg border-2 border-transparent focus:border-primary focus:outline-none transition-colors"
          aria-label="Search movies"
        />
      </form>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-card rounded-lg shadow-lg z-10 overflow-hidden">
          {loading && (
            <div className="p-3 text-sm text-gray-400">Searching...</div>
          )}

          {error && !loading && (
            <div className="p-3 text-sm text-red-400">{error}</div>
          )}

          {!loading && !error && results.length === 0 && (
            <div className="p-3 text-sm text-gray-400">No results</div>
          )}

          {!loading && results.map((movie) => (
            <Link
              key={movie.id}
              to={`/movie/${movie.id}`}
              onClick={closeDropdown}
              className="flex items-center p-3 hover:bg-primary/20 transition-colors"
            >
              {movie.poster_path ? (
                <img src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`} alt={movie.title} className="w-10 h-14 object-cover rounded mr-3" />
              ) : (
                <div className="w-10 h-14 bg-gray-700 rounded mr-3 flex items-center justify-center">
                  <Film size={24} className="text-gray-500" />
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <p className="font-semibold truncate">{movie.title}</p>
                <p className="text-sm text-gray-400">{movie.release_date?.substring(0, 4)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default InstantSearchBar;