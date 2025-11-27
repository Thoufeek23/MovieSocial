import React, { useState, useContext, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Keyboard, 
  FlatList, 
  Image, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../src/context/AuthContext';
import * as api from '../src/api';

export default function CreateDiscussion() {
  const router = useRouter();
  // Get params if redirected from movie page
  const params = useLocalSearchParams();
  const { user } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    movieId: params.movieId || '',
    movieTitle: params.movieTitle || '',
    moviePoster: params.moviePoster || ''
  });

  // If redirected with movie data, initialize selectedMovie
  const [selectedMovie, setSelectedMovie] = useState(
    params.movieId ? {
      id: params.movieId,
      title: params.movieTitle,
      poster_path: params.moviePoster,
      // release_date might be missing from simple params, handle gracefully
    } : null
  );

  const [movieSearch, setMovieSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
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
      const response = await api.searchMovies(query);
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
    setMovieSearch('');
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
        // First comment acts as the "content" body for discussions in this model
        content: formData.content.trim(), 
        movieId: formData.movieId,
        movieTitle: formData.movieTitle
      };

      // 1. Create the discussion container
      const { data: newDisc } = await api.postDiscussion({
        title: discussionData.title,
        movieId: discussionData.movieId,
        movieTitle: discussionData.movieTitle
      });

      // 2. Add the initial comment (content)
      await api.postDiscussionComment(newDisc._id, { text: discussionData.content });

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

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white font-bold text-lg">New Discussion</Text>
        <TouchableOpacity 
          onPress={handleSubmit}
          disabled={isLoading || !formData.title.trim() || !formData.content.trim() || !selectedMovie}
          className={`px-4 py-2 rounded-full ${
            isLoading || !formData.title.trim() || !formData.content.trim() || !selectedMovie 
              ? 'bg-gray-800' 
              : 'bg-emerald-500'
          }`}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className={`font-bold ${
              isLoading || !formData.title.trim() || !formData.content.trim() || !selectedMovie 
                ? 'text-gray-500' 
                : 'text-white'
            }`}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
        
        {/* --- 1. Movie Selection Section --- */}
        {!selectedMovie ? (
          <View className="mb-6">
            <Text className="text-white font-bold text-base mb-2">Select a Movie *</Text>
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

            {/* Search Results */}
            {searchResults.length > 0 && (
              <View className="mt-4">
                <Text className="text-gray-400 text-sm mb-2">Results</Text>
                <FlatList
                  data={searchResults}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item: movie }) => (
                    <TouchableOpacity
                      className="mr-4 w-[100px]"
                      onPress={() => selectMovie(movie)}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={{
                          uri: movie.poster_path 
                            ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
                            : 'https://via.placeholder.com/150x225/333/fff?text=No+Image'
                        }}
                        className="w-[100px] h-[150px] rounded-xl bg-gray-800 mb-2"
                        resizeMode="cover"
                      />
                      <Text className="text-white text-xs font-medium text-center" numberOfLines={2}>
                        {movie.title}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          </View>
        ) : (
          /* Selected Movie View */
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-white font-bold text-base">Movie</Text>
              <TouchableOpacity onPress={() => { setSelectedMovie(null); setSearchResults([]); }}>
                <Text className="text-emerald-500 text-sm font-medium">Change</Text>
              </TouchableOpacity>
            </View>
            
            <View className="flex-row bg-gray-900 p-4 rounded-xl border border-gray-800 items-center gap-4">
              <Image
                source={{
                  uri: selectedMovie.poster_path 
                    ? `https://image.tmdb.org/t/p/w200${selectedMovie.poster_path}`
                    : 'https://via.placeholder.com/150x225/333/fff?text=No+Image'
                }}
                className="w-12 h-18 rounded bg-gray-800"
                resizeMode="cover"
              />
              <View className="flex-1">
                <Text className="text-white font-bold text-lg">{selectedMovie.title}</Text>
                <Text className="text-gray-400 text-sm">
                  {selectedMovie.release_date ? selectedMovie.release_date.substring(0, 4) : 'N/A'}
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            </View>
          </View>
        )}

        {/* --- 2. Title Input --- */}
        <View className="mb-6">
          <Text className="text-white font-bold text-base mb-2">Topic Title *</Text>
          <TextInput
            ref={titleInputRef}
            className="bg-gray-900 text-white rounded-xl px-4 py-3 border border-gray-800 focus:border-emerald-500 text-base font-medium"
            placeholder="What's the topic?"
            placeholderTextColor="#6b7280"
            value={formData.title}
            onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
            maxLength={100}
            onSubmitEditing={() => contentInputRef.current?.focus()}
            returnKeyType="next"
          />
          <Text className="text-gray-600 text-xs text-right mt-1">{formData.title.length}/100</Text>
        </View>

        {/* --- 3. Content Input --- */}
        <View className="mb-8">
          <Text className="text-white font-bold text-base mb-2">Discussion *</Text>
          <TextInput
            ref={contentInputRef}
            className="bg-gray-900 text-white rounded-xl px-4 py-3 border border-gray-800 focus:border-emerald-500 min-h-[150px] text-base leading-6"
            placeholder="Share your thoughts, theories, or questions..."
            placeholderTextColor="#6b7280"
            value={formData.content}
            onChangeText={(text) => setFormData(prev => ({ ...prev, content: text }))}
            maxLength={2000}
            multiline
            textAlignVertical="top"
          />
          <Text className="text-gray-600 text-xs text-right mt-1">{formData.content.length}/2000</Text>
        </View>

        {/* Guidelines */}
        <View className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 border-dashed mb-10">
          <Text className="text-gray-400 text-sm font-bold mb-2">Discussion Guidelines</Text>
          <Text className="text-gray-500 text-xs leading-5">
            • Be respectful and constructive.{'\n'}
            • Avoid major spoilers in titles.{'\n'}
            • Keep it relevant to the selected movie.{'\n'}
            • No hate speech or harassment.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}