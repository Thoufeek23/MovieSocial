import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import * as api from '../api';
import MovieCard from '../components/MovieCard';
import InstantSearchBar from '../components/InstantSearchBar';
import Avatar from '../components/Avatar';
import { Filter, X } from 'lucide-react';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'ko', label: 'Korean' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
  { code: 'ml', label: 'Malayalam' },
];

const DECADES = [
  { value: '2020', label: '2020s' },
  { value: '2010', label: '2010s' },
  { value: '2000', label: '2000s' },
  { value: '1990', label: '1990s' },
  { value: '1980', label: '1980s' },
  { value: '1970', label: '1970s' },
  { value: '1960', label: '1960s' },
];

const SearchPage = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const queryParams = useQuery();
  const query = queryParams.get('q');
  const type = queryParams.get('type') || 'movies';
  const language = queryParams.get('language') || '';
  const decade = queryParams.get('decade') || '';

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setResults([]); // Clear previous results
      try {
        // --- CASE 1: SEARCH QUERY EXISTS ---
        if (query) {
          if (type === 'users') {
            const { data } = await api.searchUsers(query);
            setResults(data.results || data || []);
          } else {
            // --- UPDATED: Pass Filters ---
            const { data } = await api.searchMovies(query, { language, decade });
            setResults(data.results || []);
          }
        } 
        // --- CASE 2: NO QUERY (EXPLORE MODE) ---
        else {
          if (type === 'users') {
            const { data } = await api.searchUsers('');
            setResults(data.results || data || []);
          } else {
            // Fetch Personalized/Popular Movies (Filters not applied here for now)
            try {
              const { data } = await api.getPersonalizedMovies();
              setResults(data.results || data || []);
            } catch (error) {
              const { data } = await api.getPopularMovies();
              setResults(data.results || data || []);
            }
          }
        }
      } catch (error) {
        console.error("Search failed", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [query, type, language, decade]);

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(location.search);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    navigate(`/search?${params.toString()}`);
  };

  const clearFilters = () => {
    const params = new URLSearchParams(location.search);
    params.delete('language');
    params.delete('decade');
    navigate(`/search?${params.toString()}`);
  };

  const hasFilters = language || decade;

  return (
    <div>
      {/* Search Bar is always visible */}
      <div className="mb-6">
        <InstantSearchBar className="max-w-3xl" />
      </div>

      {/* --- FILTER BAR (Only for Movies) --- */}
      {type === 'movies' && query && (
        <div className="mb-8 flex flex-wrap items-center gap-3">
            <div className="flex items-center text-gray-400 text-sm font-semibold mr-1">
                <Filter size={16} className="mr-2" />
                Filters:
            </div>

            <select
                value={language}
                onChange={(e) => updateFilter('language', e.target.value)}
                className={`bg-gray-800 border ${language ? 'border-green-500 text-green-400' : 'border-gray-700 text-gray-300'} text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500`}
            >
                <option value="">Any Language</option>
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>

            <select
                value={decade}
                onChange={(e) => updateFilter('decade', e.target.value)}
                className={`bg-gray-800 border ${decade ? 'border-green-500 text-green-400' : 'border-gray-700 text-gray-300'} text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500`}
            >
                <option value="">Any Decade</option>
                {DECADES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>

            {hasFilters && (
                <button 
                    onClick={clearFilters}
                    className="flex items-center text-xs text-gray-400 hover:text-red-400 transition-colors ml-auto md:ml-2 px-2 py-1"
                >
                    <X size={14} className="mr-1" />
                    Clear
                </button>
            )}
        </div>
      )}

      {/* Dynamic Heading based on state */}
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        {query ? (
          <span>
            {type === 'users' ? 'User' : 'Movie'} Results for "{query}"
            {hasFilters && type === 'movies' && <span className="text-green-500 text-lg ml-3 font-normal">(Filtered)</span>}
          </span>
        ) : (
          <span>{type === 'users' ? 'Popular Users' : 'Explore Movies'}</span>
        )}
      </h1>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : (
        <>
          {results.length === 0 && (
            <div className="py-12 text-center text-gray-500 bg-gray-900/30 rounded-xl border border-gray-800 border-dashed">
              No results found.
            </div>
          )}
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {type === 'users' ? (
              // --- RENDER USERS GRID ---
              results.map((user) => (
                <Link 
                  key={user._id || user.username} 
                  to={`/profile/${user.username}`}
                  className="bg-gray-900 border border-gray-800 p-6 rounded-xl flex flex-col items-center gap-4 hover:border-green-500/50 hover:bg-gray-800 transition-all group shadow-sm hover:shadow-md"
                >
                  <Avatar username={user.username} avatar={user.avatar} sizeClass="w-24 h-24" />
                  <div className="text-center w-full min-w-0">
                    <h3 className="font-bold text-gray-100 truncate w-full text-lg group-hover:text-green-400 transition-colors">
                      {user.username}
                    </h3>
                    <span className="text-sm text-gray-500 block mt-1">
                      {user.followersCount !== undefined ? `${user.followersCount} followers` : 'View Profile'}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              // --- RENDER MOVIES GRID ---
              results.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SearchPage;