import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Film, Filter, X } from 'lucide-react';
import * as api from '../api';
import MovieCard from './MovieCard';

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

const PickMovieModal = ({ isOpen, setIsOpen, onMoviePicked }) => {
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('');
  const [decade, setDecade] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length > 1) {
        fetchResults(query);
      } else {
        setResults([]);
      }
    }, 400);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, language, decade]); // Trigger search when query or filters change

  const fetchResults = async (searchQuery) => {
    setLoading(true);
    try {
      // Pass the filters to the API
      const { data } = await api.searchMovies(searchQuery, { language, decade });
      setResults(data.results || []);
    } catch (error) {
      console.error(error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
    setLanguage('');
    setDecade('');
    setResults([]);
  };

  const clearFilters = () => {
    setLanguage('');
    setDecade('');
  };

  const hasFilters = language || decade;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" 
          onClick={handleClose}
        >
          <motion.div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-card w-full max-w-5xl h-[85vh] rounded-xl p-6 flex flex-col border border-gray-800 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Pick a movie</h3>
              <button 
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>

            {/* Custom Search Bar */}
            <div className="space-y-3 mb-6">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-green-500 transition-colors" size={18} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search movies to add..."
                  className="w-full bg-black/40 p-3 pl-10 rounded-xl border border-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none transition-all placeholder:text-gray-600 text-white"
                  autoFocus
                />
              </div>

              {/* Filter Controls (Only visible if there is a query or user wants to filter) */}
              <div className="flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center text-gray-400 text-sm font-semibold mr-1">
                  <Filter size={16} className="mr-2" />
                  Filters:
                </div>

                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className={`bg-gray-800 border ${language ? 'border-green-500 text-green-400' : 'border-gray-700 text-gray-300'} text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500`}
                >
                  <option value="">Any Language</option>
                  {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>

                <select
                  value={decade}
                  onChange={(e) => setDecade(e.target.value)}
                  className={`bg-gray-800 border ${decade ? 'border-green-500 text-green-400' : 'border-gray-700 text-gray-300'} text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500`}
                >
                  <option value="">Any Decade</option>
                  {DECADES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>

                {hasFilters && (
                  <button 
                    onClick={clearFilters}
                    className="flex items-center text-xs text-gray-400 hover:text-red-400 transition-colors ml-auto sm:ml-2 px-2 py-1"
                  >
                    <X size={14} className="mr-1" />
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Results Grid */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {loading && (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              )}

              {!loading && results.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {results.map((movie) => (
                    <div key={movie.id} className="h-full">
                      <MovieCard 
                        movie={movie} 
                        disabledLink={true}
                        onClick={() => {
                          onMoviePicked(movie);
                          handleClose();
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {!loading && results.length === 0 && query.length > 1 && (
                <div className="flex flex-col items-center justify-center h-60 text-gray-500">
                  <Search size={48} className="mb-4 opacity-20" />
                  <p>No movies found for "{query}"</p>
                  {hasFilters && <p className="text-sm mt-2 text-gray-600">Try adjusting your filters</p>}
                </div>
              )}

              {!loading && results.length === 0 && query.length <= 1 && (
                <div className="flex flex-col items-center justify-center h-60 text-gray-500">
                  <Film size={48} className="mb-4 opacity-20" />
                  <p>Start typing to search for movies</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PickMovieModal;