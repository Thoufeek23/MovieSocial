import React, { useState, useContext, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../src/context/AuthContext';
import * as api from '../src/api';

export default function CreateReview() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useContext(AuthContext);

  // Determine if editing
  const isEditing = !!params.editReviewId;

  // Form State
  const [rating, setRating] = useState(params.initialRating ? Number(params.initialRating) : 0);
  const [content, setContent] = useState(params.initialContent || '');
  
  // Movie Selection State
  const [selectedMovie, setSelectedMovie] = useState(
    params.movieId ? {
      id: params.movieId,
      title: params.movieTitle,
      poster_path: params.moviePoster,
    } : null
  );
  const [movieSearch, setMovieSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const contentInputRef = useRef(null);

  // Handle Movie Search (if movie not provided)
  const handleMovieSearch = async (query) => {
    setMovieSearch(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await api.searchMovies(query);
      setSearchResults(response.data.results?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error searching movies:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const selectMovie = (movie) => {
    setSelectedMovie(movie);
    setSearchResults([]);
    setMovieSearch('');
  };

  const handleSubmit = async () => {
    if (!selectedMovie) {
      Alert.alert('Missing Movie', 'Please select a movie to review.');
      return;
    }
    if (rating === 0) {
      Alert.alert('Missing Rating', 'Please give this movie a star rating.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Missing Review', 'Please write your thoughts on the movie.');
      return;
    }

    setIsLoading(true);
    try {
      const reviewData = {
        movieId: selectedMovie.id,
        movieTitle: selectedMovie.title,
        moviePoster: selectedMovie.poster_path,
        rating: rating,
        text: content.trim(), // Using 'text' to match typical API structure
      };

      if (isEditing) {
        await api.updateReview(params.editReviewId, reviewData);
        Alert.alert('Success', 'Review updated successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        await api.postReview(reviewData);
        Alert.alert('Success', 'Review posted successfully!', [
          { text: 'OK', onPress: () => router.replace('/(tabs)/reviews') } // Redirect to reviews feed
        ]);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <View className="flex-row gap-2 justify-center my-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={star <= rating ? "star" : "star-outline"} 
              size={40} 
              color={star <= rating ? "#eab308" : "#4b5563"} 
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white font-bold text-lg">{isEditing ? 'Edit Review' : 'Write Review'}</Text>
        <TouchableOpacity 
          onPress={handleSubmit}
          disabled={isLoading}
          className={`px-4 py-2 rounded-full ${isLoading ? 'bg-gray-800' : 'bg-emerald-500'}`}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white font-bold">Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
        
        {/* --- Movie Selection --- */}
        {!selectedMovie ? (
          <View className="mb-6">
            <Text className="text-white font-bold text-base mb-2">Select a Movie</Text>
            <View className="relative">
              <TextInput
                className="bg-gray-900 text-white rounded-xl px-4 py-3 border border-gray-800 focus:border-emerald-500"
                placeholder="Search for a movie..."
                placeholderTextColor="#6b7280"
                value={movieSearch}
                onChangeText={handleMovieSearch}
                returnKeyType="search"
              />
              {isSearching && (
                <ActivityIndicator size="small" color="#10b981" className="absolute right-4 top-3.5" />
              )}
            </View>

            {searchResults.length > 0 && (
              <View className="mt-4">
                <Text className="text-gray-400 text-sm mb-2">Results</Text>
                <FlatList
                  data={searchResults}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      className="mr-4 w-[100px]"
                      onPress={() => selectMovie(item)}
                    >
                      <Image
                        source={{ uri: item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : 'https://via.placeholder.com/150' }}
                        className="w-[100px] h-[150px] rounded-xl bg-gray-800 mb-2"
                        resizeMode="cover"
                      />
                      <Text className="text-white text-xs font-medium text-center" numberOfLines={2}>
                        {item.title}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          </View>
        ) : (
          /* Selected Movie View */
          <View className="flex-row bg-gray-900 p-4 rounded-xl border border-gray-800 gap-4 mb-6">
            <Image
              source={{ uri: selectedMovie.poster_path ? `https://image.tmdb.org/t/p/w300${selectedMovie.poster_path}` : 'https://via.placeholder.com/150' }}
              className="w-20 h-32 rounded-lg bg-gray-800"
              resizeMode="cover"
            />
            <View className="flex-1 justify-center">
              <Text className="text-white font-bold text-xl mb-1">{selectedMovie.title}</Text>
              <Text className="text-gray-400 text-sm">
                {selectedMovie.release_date?.substring(0, 4) || 'Unknown Year'}
              </Text>
              {!isEditing && (
                <TouchableOpacity onPress={() => setSelectedMovie(null)} className="mt-2">
                  <Text className="text-emerald-500 text-sm font-medium">Change Movie</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* --- Rating --- */}
        <View className="mb-6 items-center">
          <Text className="text-gray-400 text-sm font-medium uppercase tracking-wider">Your Rating</Text>
          {renderStars()}
          <Text className="text-emerald-400 font-bold text-lg">
            {rating > 0 ? `${rating} / 5` : 'Select a rating'}
          </Text>
        </View>

        {/* --- Content Input --- */}
        <View className="mb-20">
          <TextInput
            ref={contentInputRef}
            className="bg-gray-900 text-white rounded-xl px-4 py-4 border border-gray-800 focus:border-emerald-500 min-h-[200px] text-base leading-6"
            placeholder="Write your review here..."
            placeholderTextColor="#6b7280"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />
          <Text className="text-gray-600 text-xs text-right mt-2">
            {content.length} characters
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}