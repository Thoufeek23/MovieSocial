import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import SearchBar from '../../components/SearchBar';
import MovieCard from '../../components/MovieCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import * as api from '../../src/api';
import { useScrollToTop } from './_layout';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

export default function SearchPage() {
  const router = useRouter();
  const flatListRef = useRef(null);
  const { registerScrollRef } = useScrollToTop();
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadPopularMovies();
  }, []);

  useEffect(() => {
    if (registerScrollRef) {
      registerScrollRef('search', flatListRef);
    }
  }, [registerScrollRef]);

  const loadPopularMovies = async () => {
    try {
      let response;
      try {
        response = await api.getPersonalizedMovies();
      } catch (error) {
        response = await api.getPopularMovies();
      }
      setPopularMovies(response.data.results || []);
    } catch (error) {
      console.error('Failed to load popular movies:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) return;
    setQuery(searchQuery);
    setLoading(true);
    try {
      const response = await api.searchMovies(searchQuery);
      setMovies(response.data.results || []);
    } catch (error) {
      console.error('Search failed:', error);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setMovies([]);
  };

  const renderMovie = ({ item }) => (
    <View style={{ width: cardWidth }}>
      <MovieCard movie={item} />
    </View>
  );

  const displayMovies = query ? movies : popularMovies;
  const showLoading = query ? loading : initialLoading;

  return (
    <View className="flex-1 bg-zinc-950 pt-[120px]">
      <View className="px-5 pt-5 pb-4 border-b border-gray-800">
        <SearchBar
          placeholder="Search for movies..."
          onSearch={handleSearch}
          onClear={handleClear}
          style={{ marginBottom: 0 }}
        />
      </View>

      {showLoading ? (
        <LoadingSpinner text={query ? 'Searching...' : 'Loading popular movies...'} animationType="pulse" />
      ) : (
        <View className="flex-1 px-5">
          {query && (
            <Text className="text-sm text-gray-400 mt-4 mb-2">
              {movies.length} results for "{query}"
            </Text>
          )}
          
          {!query && (
            <Text className="text-lg font-semibold text-white mt-4 mb-2">Popular Movies</Text>
          )}

          {displayMovies.length > 0 ? (
            <FlatList
              ref={flatListRef}
              data={displayMovies}
              renderItem={renderMovie}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              contentContainerStyle={{ paddingTop: 8, paddingBottom: 120 }}
              columnWrapperStyle={{ justifyContent: 'space-between' }}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <EmptyState
              icon="film-outline"
              title={query ? 'No movies found' : 'No popular movies'}
              subtitle={query ? 'Try a different search term' : 'Popular movies will appear here'}
            />
          )}
        </View>
      )}
    </View>
  );
}