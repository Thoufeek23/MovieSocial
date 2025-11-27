import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as api from '../../api';
// CHANGED: Corrected import path from '../MovieCard' to './MovieCard'
import MovieCard from './MovieCard';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'hi', label: 'Hindi' },
  // Add more languages as needed
];

const PickMovieModal = ({ visible, onClose, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('en'); // Default language
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  const searchMovies = useCallback(async () => {
    if (!searchQuery.trim()) {
      setMovies([]);
      return;
    }

    setLoading(true);
    try {
      const response = await api.searchMovies(searchQuery, { language }); // Pass language to API
      setMovies(response.data.results || []);
    } catch (error) {
      console.error("Failed to search movies:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, language]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      searchMovies();
    }, 500); // Debounce search by 500ms

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, searchMovies]);

  const handleClose = () => {
    setSearchQuery('');
    setMovies([]);
    onClose();
  };

  const handleLanguageSelect = (langCode) => {
    setLanguage(langCode);
    setShowLanguageDropdown(false);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View className="flex-1 bg-zinc-950 pt-4">
        {/* Header */}
        <View className="px-4 pb-4 flex-row items-center justify-between border-b border-gray-800">
          <Text className="text-white text-lg font-bold">Select a Movie</Text>
          <TouchableOpacity onPress={handleClose}>
            <Feather name="x" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Search & Filter */}
        <View className="px-4 py-3 gap-3">
          {/* Search Bar */}
          <View className="flex-row items-center bg-gray-900 rounded-xl px-3 border border-gray-800 h-12">
            <Feather name="search" size={20} color="#9ca3af" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search movies..."
              placeholderTextColor="#6b7280"
              className="flex-1 ml-3 text-white text-base"
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Feather name="x-circle" size={18} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>

          {/* Language Filter */}
          <View className="relative z-10">
            <TouchableOpacity 
              onPress={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="flex-row items-center bg-gray-900 self-start px-3 py-2 rounded-lg border border-gray-800"
            >
              <Feather name="globe" size={16} color="#9ca3af" />
              <Text className="text-gray-300 ml-2 mr-1 text-sm">
                {LANGUAGES.find(l => l.code === language)?.label || 'Language'}
              </Text>
              <Feather name="chevron-down" size={16} color="#9ca3af" />
            </TouchableOpacity>

            {/* Dropdown */}
            {showLanguageDropdown && (
              <View className="absolute top-10 left-0 bg-gray-800 rounded-lg border border-gray-700 w-40 py-1 shadow-xl">
                <FlatList 
                  data={LANGUAGES}
                  keyExtractor={item => item.code}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      onPress={() => handleLanguageSelect(item.code)}
                      className={`px-3 py-2 flex-row items-center justify-between ${language === item.code ? 'bg-gray-700' : ''}`}
                    >
                      <Text className={`text-sm ${language === item.code ? 'text-white font-semibold' : 'text-gray-300'}`}>
                        {item.label}
                      </Text>
                      {language === item.code && <Feather name="check" size={14} color="#10b981" />}
                    </TouchableOpacity>
                  )}
                  style={{ maxHeight: 200 }}
                />
              </View>
            )}
          </View>
        </View>

        {/* Results */}
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#10b981" />
          </View>
        ) : (
          <FlatList
            data={movies}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View className="flex-1 p-2 items-center">
                <MovieCard 
                  movie={item} 
                  disabledLink={true} 
                  onClick={() => {
                    onSelect(item);
                    handleClose();
                  }}
                />
              </View>
            )}
            numColumns={2} // Grid layout
            contentContainerStyle={{ padding: 8, paddingBottom: 40 }}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            ListEmptyComponent={
              !loading && searchQuery ? (
                <View className="items-center mt-20">
                  <Feather name="film" size={48} color="#374151" />
                  <Text className="text-gray-500 mt-4 text-center px-10">No movies found matching "{searchQuery}"</Text>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </Modal>
  );
};

export default PickMovieModal;