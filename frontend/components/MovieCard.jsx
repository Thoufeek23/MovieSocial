import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import * as api from '../src/api';

const { width } = Dimensions.get('window');
const defaultCardWidth = (width - 60) / 2; // 2 cards per row with margins

const MovieCard = ({ movie, showDelete = false, onDelete, cardWidth, showRating = false }) => {
  const router = useRouter();
  const IMG_BASE_URL = 'https://image.tmdb.org/t/p/w500';

  // Social Rating Component (matching client style)
  const SocialRating = ({ movieId }) => {
    const [avg, setAvg] = useState(null);
    const [count, setCount] = useState(0);

    // SVG Circle Progress constants (matching client)
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const strokeWidth = 3;

    useEffect(() => {
      let mounted = true;
      const loadRating = async () => {
        try {
          const res = await api.getMovieStats(movieId);
          const data = res.data || {};
          if (!mounted) return;
          if (typeof data.movieSocialRating === 'undefined' || data.movieSocialRating === null) {
            setAvg(null);
            setCount(data.reviewCount || 0);
          } else {
            setAvg(Number(data.movieSocialRating).toFixed(1));
            setCount(data.reviewCount || 0);
          }
        } catch (err) {
          console.error('Failed to load social rating', err);
        }
      };
      loadRating();
      return () => { mounted = false; };
    }, [movieId]);

    // Calculate the stroke-dashoffset for the progress circle (rating is out of 5)
    // Convert rating to percentage: rating/5 gives us the fraction of the circle to fill
    const progressOffset = circumference - (avg / 5) * circumference;

    if (count > 0) {
      return (
        <View style={styles.socialRatingContainer}>
          <View style={styles.ratingContent}>
            {/* Circular Progress Rating (SVG like client) */}
            <View style={styles.circularProgress}>
              <Svg height="40" width="40" viewBox="0 0 40 40">
                {/* Background Circle */}
                <Circle
                  cx="20"
                  cy="20"
                  r={radius}
                  stroke="rgba(55, 65, 81, 0.5)"
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                {/* Progress Circle */}
                <Circle
                  cx="20"
                  cy="20"
                  r={radius}
                  stroke="#10b981"
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={progressOffset}
                  transform="rotate(-90 20 20)"
                />
                {/* Rating Text */}
                <SvgText
                  x="20"
                  y="24"
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="600"
                  fill="white"
                >
                  {avg}
                </SvgText>
              </Svg>
            </View>
            
            {/* Review Count */}
            <View style={styles.userCount}>
              <Ionicons name="people" size={14} color="#9ca3af" />
              <Text style={styles.userCountText}>
                {count} {count === 1 ? 'user' : 'users'}
              </Text>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.socialRatingContainer}>
        <View style={styles.firstRateContainer}>
          <Ionicons name="add-circle" size={16} color="#10b981" />
          <Text style={styles.firstRateText}>Be the first to rate</Text>
        </View>
      </View>
    );
  };

  const handlePress = () => {
    router.push(`/movie/${movie.id}`);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (typeof onDelete === 'function') onDelete();
  };

  const finalCardWidth = cardWidth || defaultCardWidth;

  return (
    <TouchableOpacity 
      style={[styles.card, { width: finalCardWidth }]} 
      onPress={handlePress} 
      activeOpacity={0.7}
    >
      {showDelete && (
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="close" size={16} color="white" />
        </TouchableOpacity>
      )}
      
      <Image
        source={{
          uri: movie.poster_path ? `${IMG_BASE_URL}${movie.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image'
        }}
        style={styles.poster}
        resizeMode="cover"
      />
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">{movie.title}</Text>
        <Text style={styles.year}>{movie.release_date?.substring(0, 4) || '—'}</Text>
        
        <View style={styles.ratingContainer}>
          {typeof movie.id !== 'undefined' && (
            <SocialRating movieId={movie.id} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    // Glass morphism effect matching client
    backgroundColor: 'rgba(24, 24, 27, 0.8)', // bg-card with transparency  
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    // Glass effect shadow and border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    // Glass border
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 20,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    padding: 6,
  },
  poster: {
    width: '100%',
    aspectRatio: 2/3,
  },
  content: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 120, // Ensure consistent height
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    height: 20, // Fixed height for single line
  },
  year: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
  },
  ratingContainer: {
    marginTop: 'auto',
    minHeight: 44, // Matching client min-height
  },
  socialRatingContainer: {
    minHeight: 44,
    justifyContent: 'center',
  },
  ratingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // Matching client gap-3
  },
  circularProgress: {
    width: 40,
    height: 40,
  },
  userCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userCountText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  firstRateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  firstRateText: {
    fontSize: 12,
    color: 'rgba(16, 185, 129, 0.8)', // Matching client text-primary/80
    fontStyle: 'italic',
    fontWeight: '500',
  },
});

export default MovieCard;