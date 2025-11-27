import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Modal, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as api from '../../api';
import MovieCard from '../MovieCard';

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

const FilterChip = ({ label, selected, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    className={`px-3 py-1.5 rounded-full mr-2 border ${
      selected 
        ? 'bg-primary/20 border-primary' 
        : 'bg-zinc-800 border-zinc-700'
    }`}
  >
    <Text className={`text-xs font-medium ${selected ? 'text-primary' : 'text-gray-400'}`}>
      {label}
    </Text>
  </TouchableOpacity>
);

const PickMovieModal = ({ isOpen, setIsOpen, onMoviePicked }) => {
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('');
  const [decade, setDecade] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length > 1) {
        fetchResults(query);
      } else {
        setResults([]);
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [query, language, decade]);

  const fetchResults = async (searchQuery) => {
    setLoading(true);
    try {
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

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black/80 justify-end sm:justify-center">
        <View className="bg-card w-full h-[90%] rounded-t-2xl sm:rounded-xl sm:h-[85%] sm:max-w-5xl sm:mx-auto border-t border-border overflow-hidden flex flex-col">
          
          {/* Header */}
          <View className="flex-row justify-between items-center p-4 border-b border-border">
            <Text className="text-xl font-bold text-foreground">Pick a movie</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text className="text-gray-400 text-base">Close</Text>
            </TouchableOpacity>
          </View>

          {/* Search & Filters */}
          <View className="p-4 space-y-4 bg-background/50">
            <View className="flex-row items-center bg-input rounded-xl border border-border px-3">
              <Feather name="search" size={18} color="#9ca3af" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search movies..."
                placeholderTextColor="#6b7280"
                className="flex-1 p-3 text-white text-base"
                autoFocus
              />
            </View>

            {/* Filter Chips */}
            <View>
              <Text className="text-xs text-gray-500 mb-2 font-bold uppercase">Filters</Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={[{ type: 'reset' }, ...LANGUAGES, ...DECADES]}
                keyExtractor={(item) => item.code || item.value || 'reset'}
                renderItem={({ item }) => {
                  if (item.type === 'reset') {
                     if (!language && !decade) return null;
                     return (
                        <TouchableOpacity onPress={() => { setLanguage(''); setDecade(''); }} className="mr-2 justify-center">
                           <Feather name="x-circle" size={20} color="#ef4444" />
                        </TouchableOpacity>
                     );
                  }
                  
                  const isLang = !!item.code;
                  const val = item.code || item.value;
                  const isSelected = isLang ? language === val : decade === val;
                  
                  return (
                    <FilterChip 
                      label={item.label} 
                      selected={isSelected} 
                      onPress={() => isLang ? setLanguage(isSelected ? '' : val) : setDecade(isSelected ? '' : val)} 
                    />
                  );
                }}
              />
            </View>
          </View>

          {/* Results */}
          <View className="flex-1 bg-background px-2">
            {loading && (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#16a34a" />
              </View>
            )}

            {!loading && results.length > 0 && (
              <FlatList
                data={results}
                numColumns={2}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingVertical: 10 }}
                renderItem={({ item }) => (
                  <View className="flex-1 m-1">
                    <MovieCard 
                      movie={item} 
                      disabledLink={true}
                      onClick={() => {
                        onMoviePicked(item);
                        handleClose();
                      }}
                    />
                  </View>
                )}
              />
            )}

            {!loading && results.length === 0 && (
              <View className="flex-1 justify-center items-center opacity-50">
                <Feather name={query.length > 1 ? "search" : "film"} size={48} color="white" />
                <Text className="text-gray-400 mt-4 text-center">
                  {query.length > 1 ? `No movies found for "${query}"` : "Start typing to search"}
                </Text>
              </View>
            )}
          </View>

        </View>
      </View>
    </Modal>
  );
};

export default PickMovieModal;