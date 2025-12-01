import React, { useState, useEffect, useRef } from 'react';
import { View, Text, SafeAreaView, FlatList, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import SearchBar from '../../components/SearchBar';
import MovieCard from '../../components/MovieCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import SkeletonLoader, { MovieCardSkeleton } from '../../components/SkeletonLoader';
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

  // Register scroll ref for tab navigation
  useEffect(() => {
    if (registerScrollRef) {
      registerScrollRef('search', flatListRef);
    }
  }, [registerScrollRef]);

  const loadPopularMovies = async () => {
    try {
      let response;
      try {
        // Try personalized movies first
        response = await api.getPersonalizedMovies();
      } catch (error) {
        // Fallback to popular movies
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
    <View style={styles.cardWrapper}>
      <MovieCard movie={item} />
    </View>
  );

  const displayMovies = query ? movies : popularMovies;
  const showLoading = query ? loading : initialLoading;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SearchBar
          placeholder="Search for movies..."
          onSearch={handleSearch}
          onClear={handleClear}
          style={styles.searchBar}
        />
      </View>

      {showLoading ? (
        <View style={styles.loadingContainer}>
          <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.cardWrapper}>
                <MovieCardSkeleton />
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.content}>
          {query && (
            <Text style={styles.resultsText}>
              {movies.length} results for "{query}"
            </Text>
          )}
          
          {!query && (
            <Text style={styles.sectionTitle}>Popular Movies</Text>
          )}

          {displayMovies.length > 0 ? (
            <FlatList
              ref={flatListRef}
              data={displayMovies}
              renderItem={renderMovie}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              contentContainerStyle={styles.listContainer}
              columnWrapperStyle={styles.row}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
    paddingTop: 120,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  searchBar: {
    marginBottom: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    paddingTop: 20,
  },
  resultsText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  listContainer: {
    paddingTop: 8,
    paddingBottom: 120, // Increased padding for Samsung navigation compatibility
  },
  row: {
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: cardWidth,
  },
});