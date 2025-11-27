import React, { useState } from 'react';
import { View, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSubmit = () => {
    if (query.trim()) {
      router.push(`/search?q=${query}`);
      setQuery('');
    }
  };

  return (
    <View className="mb-6 flex-row items-center bg-input rounded-lg border border-border px-3">
      <Ionicons name="search" size={20} color="#9ca3af" className="mr-2" />
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search for a movie..."
        placeholderTextColor="#9ca3af"
        onSubmitEditing={handleSubmit}
        returnKeyType="search"
        className="flex-1 py-3 text-white text-base"
        style={{ outlineStyle: 'none' }} // specific for web-compatibility if reused
      />
    </View>
  );
};

export default SearchBar;