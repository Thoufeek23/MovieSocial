import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SearchBar = ({ 
  placeholder = 'Search...',
  onSearch,
  onClear,
  autoFocus = false,
  style = {}
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSearch = () => {
    if (onSearch && query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    if (onClear) onClear();
  };

  const handleSubmit = () => {
    handleSearch();
  };

  return (
    <View style={[styles.container, isFocused && styles.containerFocused, style]}>
      <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
      
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#6b7280"
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={handleSubmit}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoFocus={autoFocus}
        returnKeyType="search"
      />
      
      {query.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <Ionicons name="close-circle" size={20} color="#6b7280" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  containerFocused: {
    borderColor: '#10b981',
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: 'white',
    paddingVertical: 4,
  },
  clearButton: {
    marginLeft: 8,
    padding: 2,
  },
});

export default SearchBar;