import React, { useState, useContext, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  Alert,
  ScrollView,
  Keyboard,
  FlatList,
  Image
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../src/context/AuthContext';
import { createReview, searchMovies } from '../src/api';
import MovieCard from '../components/MovieCard';

const CreateReview = () => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    content: '',
    rating: 0,
    movieId: '',
    movieTitle: '',
    moviePoster: ''
  });
  const [movieSearch, setMovieSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const contentInputRef = useRef(null);

  const handleMovieSearch = async (query) => {
    setMovieSearch(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await searchMovies(query);
      console.log('Full movie search response:', response);
      
      // Handle different possible response structures
      let results = [];
      if (response?.data?.results) {
        results = response.data.results;
      } else if (response?.results) {
        results = response.results;
      } else if (Array.isArray(response?.data)) {
        results = response.data;
      } else if (Array.isArray(response)) {
        results = response;
      }
      
      console.log('Processed results:', results);
      setSearchResults(Array.isArray(results) ? results.slice(0, 5) : []);
    } catch (error) {
      console.error('Error searching movies:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectMovie = (movie) => {
    setSelectedMovie(movie);
    setFormData(prev => ({
      ...prev,
      movieId: movie.id.toString(),
      movieTitle: movie.title,
      moviePoster: movie.poster_path
    }));
    setSearchResults([]);
    setMovieSearch(movie.title);
    // Focus on content input after selecting movie
    setTimeout(() => contentInputRef.current?.focus(), 100);
  };

  const StarRating = ({ rating, onRatingChange, size = 36 }) => {
    const stars = [1, 2, 3, 4, 5];
    
    const getStarIcon = (starNumber) => {
      if (rating >= starNumber) {
        return "star";
      } else if (rating >= starNumber - 0.5) {
        return "star-half";
      } else {
        return "star-outline";
      }
    };
    
    const getStarColor = (starNumber) => {
      if (rating >= starNumber || rating >= starNumber - 0.5) {
        return "#fbbf24";
      }
      return "#6b7280";
    };
    
    const handleStarPress = (starNumber) => {
      if (rating === starNumber) {
        // If clicking the same star, toggle to half star
        onRatingChange(starNumber - 0.5);
      } else if (rating === starNumber - 0.5) {
        // If clicking half star, go to full star
        onRatingChange(starNumber);
      } else {
        // Otherwise, set to full star
        onRatingChange(starNumber);
      }
    };
    
    return (
      <View>
        <View style={styles.starsContainer}>
          {stars.map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => handleStarPress(star)}
              style={styles.starButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name={getStarIcon(star)}
                size={size}
                color={getStarColor(star)}
              />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ratingInstructions}>
          Tap to rate, tap again for half stars
        </Text>
      </View>
    );
  };

  const handleSubmit = async () => {
    if (!formData.content.trim() || formData.rating === 0 || !selectedMovie) {
      Alert.alert('Error', 'Please select a movie, give a rating, and write your review');
      return;
    }

    setIsLoading(true);
    try {
      const reviewData = {
        text: formData.content.trim(), // Server expects 'text' not 'content'
        rating: Number(formData.rating), // Ensure it's a number
        movieId: parseInt(formData.movieId),
        movieTitle: formData.movieTitle,
        moviePoster: formData.moviePoster
      };

      // Validate rating range  
      if (reviewData.rating < 0.5 || reviewData.rating > 5) {
        Alert.alert('Error', 'Rating must be between 0.5 and 5 stars');
        return;
      }

      console.log('Sending review data:', reviewData);
      await createReview(reviewData);
      Alert.alert('Success', 'Review created successfully!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/reviews') }
      ]);
    } catch (error) {
      console.error('Error creating review:', error);
      console.error('Error details:', error.response?.data);
      Alert.alert('Error', 'Failed to create review. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Write Review</Text>
        <TouchableOpacity 
          onPress={handleSubmit}
          disabled={isLoading || !formData.content.trim() || formData.rating === 0 || !selectedMovie}
          style={[styles.submitButton, {
            opacity: (isLoading || !formData.content.trim() || formData.rating === 0 || !selectedMovie) ? 0.5 : 1
          }]}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? 'Publishing...' : 'Publish'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {/* Movie Search */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Movie *</Text>
          <TextInput
            style={styles.input}
            placeholder="Search for a movie..."
            placeholderTextColor="#888"
            value={movieSearch}
            onChangeText={handleMovieSearch}
            returnKeyType="search"
          />
          {isSearching && (
            <Text style={styles.searchingText}>Searching...</Text>
          )}
        </View>

        {/* Search Results Carousel */}
        {searchResults.length > 0 && (
          <View style={styles.searchResultsContainer}>
            <Text style={styles.searchResultsTitle}>Search Results</Text>
            <FlatList
              data={searchResults}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.carouselContainer}
              renderItem={({ item: movie }) => (
                <TouchableOpacity
                  style={styles.carouselItem}
                  onPress={() => selectMovie(movie)}
                  activeOpacity={0.8}
                >
                  <View style={styles.moviePosterContainer}>
                    <Image
                      source={{
                        uri: movie.poster_path 
                          ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
                          : 'https://via.placeholder.com/150x225/333/fff?text=No+Image'
                      }}
                      style={styles.moviePoster}
                      resizeMode="cover"
                    />
                    <View style={styles.movieOverlay}>
                      <Text style={styles.movieTitle} numberOfLines={2}>
                        {movie.title}
                      </Text>
                      <Text style={styles.movieYear}>
                        {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.selectButton}>
                    <Text style={styles.selectButtonText}>Select</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Selected Movie */}
        {selectedMovie && (
          <View style={styles.selectedMovieContainer}>
            <Text style={styles.selectedMovieLabel}>Selected Movie:</Text>
            <View style={styles.selectedMovieCard}>
              <Image
                source={{
                  uri: selectedMovie.poster_path 
                    ? `https://image.tmdb.org/t/p/w300${selectedMovie.poster_path}`
                    : 'https://via.placeholder.com/150x225/333/fff?text=No+Image'
                }}
                style={styles.selectedMoviePoster}
                resizeMode="cover"
              />
              <View style={styles.selectedMovieInfo}>
                <Text style={styles.selectedMovieTitle}>{selectedMovie.title}</Text>
                <Text style={styles.selectedMovieYear}>
                  {selectedMovie.release_date ? new Date(selectedMovie.release_date).getFullYear() : 'N/A'}
                </Text>
                <TouchableOpacity 
                  style={styles.changeMovieButton}
                  onPress={() => {
                    setSelectedMovie(null);
                    setMovieSearch('');
                    setFormData(prev => ({
                      ...prev,
                      movieId: '',
                      movieTitle: '',
                      moviePoster: ''
                    }));
                  }}
                >
                  <Text style={styles.changeMovieButtonText}>Change Movie</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Rating */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Rating *</Text>
          <StarRating 
            rating={formData.rating} 
            onRatingChange={(rating) => setFormData(prev => ({ ...prev, rating }))} 
          />
          {formData.rating > 0 && (
            <Text style={styles.ratingText}>
              {formData.rating} out of 5 stars
            </Text>
          )}
        </View>

        {/* Review Content */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Your Review *</Text>
          <TextInput
            ref={contentInputRef}
            style={styles.contentInput}
            placeholder="Share your thoughts about this movie..."
            placeholderTextColor="#888"
            value={formData.content}
            onChangeText={(text) => setFormData(prev => ({ ...prev, content: text }))}
            maxLength={1000}
            multiline={true}
            textAlignVertical="top"
            returnKeyType="default"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          <Text style={styles.charCount}>{formData.content.length}/1000</Text>
        </View>

        <View style={styles.guidelines}>
          <Text style={styles.guidelinesTitle}>Review Guidelines</Text>
          <Text style={styles.guidelinesText}>
            • Be honest and constructive in your reviews{'\n'}
            • Avoid major spoilers without warnings{'\n'}
            • Focus on what you liked or didn't like{'\n'}
            • Help other movie lovers make informed choices
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  submitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#10b981',
    borderRadius: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  form: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    minHeight: 50,
  },
  contentInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    minHeight: 120,
    maxHeight: 200,
  },
  searchingText: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
    fontStyle: 'italic',
  },
  searchResultsContainer: {
    marginBottom: 25,
  },
  searchResultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  carouselContainer: {
    paddingLeft: 0,
  },
  carouselItem: {
    marginRight: 15,
    width: 140,
  },
  moviePosterContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#2a2a2a',
  },
  moviePoster: {
    width: 140,
    height: 200,
  },
  movieOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 8,
  },
  movieTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  movieYear: {
    color: '#ccc',
    fontSize: 10,
    marginBottom: 4,
  },

  selectButton: {
    backgroundColor: '#10b981',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  selectedMovieContainer: {
    marginBottom: 25,
  },
  selectedMovieLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  selectedMovieCard: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#10b981',
  },
  selectedMoviePoster: {
    width: 80,
    height: 120,
    borderRadius: 8,
  },
  selectedMovieInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
  },
  selectedMovieTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedMovieYear: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 8,
  },

  changeMovieButton: {
    backgroundColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  changeMovieButtonText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    justifyContent: 'center',
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  ratingInstructions: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  charCount: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
    marginTop: 5,
  },
  guidelines: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
  },
  guidelinesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  guidelinesText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
});

export default CreateReview;