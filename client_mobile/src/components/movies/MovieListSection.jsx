import React from 'react';
import { View, Text } from 'react-native';
import MovieCard from '../MovieCard';
import EmptyState from '../EmptyState';

const MovieListSection = ({ title, movies, emptyMessage, emptyCtaText, emptyCtaLink, showDelete, onDelete }) => {
  return (
    <View className="mb-10 px-4">
      <View className="border-b-2 border-border pb-2 mb-4">
        <Text className="text-xl font-bold text-foreground">{title}</Text>
      </View>

      {movies.length === 0 ? (
        <EmptyState 
          message={emptyMessage} 
          ctaText={emptyCtaText} 
          ctaLink={emptyCtaLink} 
        />
      ) : (
        <View className="flex-row flex-wrap" style={{ gap: 12 }}>
          {movies.map(movie => (
            <View key={movie.id} style={{ width: '48%' }}> 
              {/* Width 48% allows 2 columns with a small gap */}
              <MovieCard
                movie={movie}
                showDelete={showDelete}
                onDelete={() => onDelete(movie)}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default MovieListSection;