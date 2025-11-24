import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import * as api from '../api';
import MovieCard from '../components/MovieCard';
import InstantSearchBar from '../components/InstantSearchBar';
import Avatar from '../components/Avatar';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const SearchPage = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const queryParams = useQuery();
  const query = queryParams.get('q');
  const type = queryParams.get('type') || 'movies'; // Default to movies

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
            const { data } = await api.searchMovies(query);
            setResults(data.results || []);
          }
        } 
        // --- CASE 2: NO QUERY (EXPLORE MODE) ---
        else {
          if (type === 'users') {
            // Fetch Popular Users (now supported by backend when q='')
            const { data } = await api.searchUsers('');
            setResults(data.results || data || []);
          } else {
            // Fetch Personalized/Popular Movies
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
  }, [query, type]);

  return (
    <div>
      {/* Search Bar is always visible */}
      <div className="mb-8">
        <InstantSearchBar className="max-w-3xl" />
      </div>

      {/* Dynamic Heading based on state */}
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        {query ? (
          <span>{type === 'users' ? 'User' : 'Movie'} Results for "{query}"</span>
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