import React from 'react';
import { View, Text, FlatList, StyleSheet, Dimensions } from 'react-native';
import MovieCard from './MovieCard';
import EmptyState from './EmptyState';
import LoadingSpinner from './LoadingSpinner';

const { width } = Dimensions.get('window');
const cardWidth = 192; // Fixed width like client (w-48 = 192px)

const MovieCarousel = ({ 
  title,
  movies = [],
  loading = false,
  onEndReached,
  style = {},
  showDelete = false,
  onDelete,
  showRating = false
}) => {
  if (loading && movies.length === 0) {
    return (
      <View style={[styles.container, style]}>
        {title && <Text style={styles.title}>{title}</Text>}
        <LoadingSpinner animationType="rotate" />
      </View>
    );
  }

  if (!loading && movies.length === 0) {
    return (
      <View style={[styles.container, style]}>
        {title && <Text style={styles.title}>{title}</Text>}
        <EmptyState 
          icon="film-outline" 
          title="No movies found" 
          subtitle="Movies will appear here when available"
          style={styles.emptyState}
        />
      </View>
    );
  }

  const renderMovie = ({ item }) => (
    <View style={styles.cardWrapper}>
      <MovieCard 
        movie={item} 
        showDelete={showDelete}
        onDelete={onDelete ? () => onDelete(item.id) : undefined}
        showRating={showRating}
        cardWidth={cardWidth}
      />
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.carouselContainer}>
        <FlatList
          data={movies}
          renderItem={renderMovie}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
        {/* Gradient fade effect like in client */}
        <View style={styles.fadeGradient} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    marginHorizontal: 20,
  },
  carouselContainer: {
    position: 'relative',
  },
  listContainer: {
    paddingHorizontal: 8, // Match client px-2 sm:px-4
    paddingBottom: 16,
  },
  cardWrapper: {
    width: cardWidth,
    flexShrink: 0,
  },
  separator: {
    width: 16, // space-x-4 equivalent
  },
  fadeGradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 16, // Account for paddingBottom
    width: 64,
    backgroundColor: 'transparent',
    // Note: React Native doesn't have built-in gradients, but this creates the right positioning
    // You could use react-native-linear-gradient for actual gradient effect
  },
  emptyState: {
    paddingVertical: 32,
  },
});

export default MovieCarousel;