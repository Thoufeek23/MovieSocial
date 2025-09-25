import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import * as api from '../api';
import MovieCard from '../components/MovieCard';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const SearchPage = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const query = useQuery().get('q');

  useEffect(() => {
    if (query) {
      const fetchResults = async () => {
        setLoading(true);
        try {
          const { data } = await api.searchMovies(query);
          setResults(data.results);
        } catch (error) {
          console.error("Search failed", error);
        } finally {
          setLoading(false);
        }
      };
      fetchResults();
    }
  }, [query]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Search Results for "{query}"</h1>
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