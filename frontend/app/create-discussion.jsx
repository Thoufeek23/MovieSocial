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
import { createDiscussion, searchMovies } from '../src/api';

const CreateDiscussion = () => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    movieId: '',
    movieTitle: '',
    moviePoster: ''
  });
  const [movieSearch, setMovieSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const titleInputRef = useRef(null);
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
      setSearchResults(response.data.results?.slice(0, 5) || []);
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
    // Focus on title input after selecting movie
    setTimeout(() => titleInputRef.current?.focus(), 100);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim() || !selectedMovie) {
      Alert.alert('Error', 'Please select a movie, add a title, and write your discussion content');
      return;
    }

    setIsLoading(true);
    try {
      const discussionData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        movieId: formData.movieId || null,
        movieTitle: formData.movieTitle || null
      };

      await createDiscussion(discussionData);
      Alert.alert('Success', 'Discussion created successfully!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/discussions') }
      ]);
    } catch (error) {
      console.error('Error creating discussion:', error);
      Alert.alert('Error', 'Failed to create discussion. Please try again.');
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
        <Text style={styles.headerTitle}>New Discussion</Text>
        <TouchableOpacity 
          onPress={handleSubmit}
          disabled={isLoading || !formData.title.trim() || !formData.content.trim() || !selectedMovie}
          style={[styles.submitButton, {
            opacity: (isLoading || !formData.title.trim() || !formData.content.trim() || !selectedMovie) ? 0.5 : 1
          }]}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? 'Creating...' : 'Post'}
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

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            ref={titleInputRef}
            style={styles.titleInput}
            placeholder="What would you like to discuss about this movie?"
            placeholderTextColor="#888"
            value={formData.title}
            onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
            maxLength={100}
            multiline={false}
            returnKeyType="next"
            onSubmitEditing={() => contentInputRef.current?.focus()}
          />
          <Text style={styles.charCount}>{formData.title.length}/100</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Content *</Text>
          <TextInput
            ref={contentInputRef}
            style={styles.contentInput}
            placeholder="Share your thoughts, theories, or questions..."
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
          <Text style={styles.guidelinesTitle}>Discussion Guidelines</Text>
          <Text style={styles.guidelinesText}>
            • Be respectful and constructive in your discussions{'\n'}
            • Avoid major spoilers in titles{'\n'}
            • Use clear, descriptive titles{'\n'}
            • Stay on topic and contribute meaningfully
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
  titleInput: {
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
  charCount: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
    marginTop: 5,
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

export default CreateDiscussion;