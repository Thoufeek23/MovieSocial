import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import * as api from '../api';
import MovieCard from '../components/MovieCard';
import InstantSearchBar from '../components/InstantSearchBar';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const SearchPage = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const query = useQuery().get('q');

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        if (query) {
          const { data } = await api.searchMovies(query);
          setResults(data.results || []);
        } else {
          // No query: show personalized or popular movies on the Explore page
          try {
            const { data } = await api.getPersonalizedMovies();
            setResults(data.results || data || []);
          } catch (error) {
            // Fallback to popular movies if not logged in or error
            const { data } = await api.getPopularMovies();
            setResults(data.results || data || []);
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
  }, [query]);

  return (
    <div>
      {!query ? (
        <div className="mb-6">
          <InstantSearchBar className="max-w-2xl" />
        </div>
      ) : (
        <h1 className="text-3xl font-bold mb-6">Search Results for "{query}"</h1>
      )}

      {loading ? <p>Searching...</p> : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {results.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchPage;