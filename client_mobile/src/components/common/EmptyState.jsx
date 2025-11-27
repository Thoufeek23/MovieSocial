import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

const EmptyState = ({ message = 'Nothing here yet.', ctaText = 'Explore', ctaLink = '/' }) => {
  return (
    <View className="p-6 bg-card rounded-lg items-center justify-center border border-border mx-4">
      <Text className="text-4xl mb-3">🎬</Text>
      <Text className="text-gray-300 mb-4 text-center font-medium">{message}</Text>
      
      <Link href={ctaLink} asChild>
        <TouchableOpacity className="bg-primary px-6 py-2.5 rounded-full active:opacity-80">
          <Text className="text-white font-bold text-center">
            {ctaText}
          </Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
};

export default EmptyState;