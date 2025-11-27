import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { MotiView } from 'moti';
import MovieCard from '../MovieCard';

const MovieCarousel = ({ title, movies, showRating = false }) => {
  return (
    <View className="mb-6">
      <Text className="text-xl font-bold text-foreground mb-4 px-4">{title}</Text>
      
      <FlatList
        horizontal
        data={movies}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
        renderItem={({ item, index }) => (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: index * 100, type: 'timing', duration: 300 }}
            className="w-40"
          >
            <MovieCard movie={item} showRating={showRating} />
          </MotiView>
        )}
      />
    </View>
  );
};

export default MovieCarousel;