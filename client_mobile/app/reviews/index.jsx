import React, { useEffect, useState, useContext, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  RefreshControl, 
  Alert, 
  TouchableOpacity 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../src/context/AuthContext';
import * as api from '../../src/api';

// CHANGED: Corrected import paths to point to src/components/...
import ReviewCard from '../../src/components/movies/ReviewCard';
import LoadingSpinner from '../../src/components/common/LoadingSpinner';
import EmptyState from '../../src/components/common/EmptyState';

export default function ReviewsPage() {
  const { movieId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useContext(AuthContext);
  
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [movieTitle, setMovieTitle] = useState('');

  const loadReviews = useCallback(async () => {
    try {
      let response;
      if (movieId) {
        // Load reviews for a specific movie
        response = await api.getReviewsForMovie(movieId);
        
        // Also fetch movie details to get the title for the header
        try {
          const movieRes = await api.getMovieDetails(movieId);
          setMovieTitle(movieRes.data.title);
        } catch (e) { /* ignore */ }
        
      } else {
        // Load user's personalized feed or general feed
        if (user) {
          try {
            response = await api.fetchPersonalizedFeed();
          } catch (e) {
            response = await api.fetchFeed();
          }
        } else {
          response = await api.fetchFeed();
        }
      }
      
      setReviews(response.data || []);
    } catch (error) {
      console.error("Failed to load reviews:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [movieId, user]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const onRefresh = () => {
    setRefreshing(true);
    loadReviews();
  };

  const handleDeleteReview = (reviewId) => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await api.deleteReview(reviewId);
              setReviews(prev => prev.filter(r => r._id !== reviewId));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete review');
            }
          }
        }
      ]
    );
  };

  // Helper to navigate to edit screen
  const handleEditReview = (review) => {
    router.push({
      pathname: '/create-review',
      params: {
        editReviewId: review._id,
        movieId: review.movieId,
        movieTitle: review.movieTitle,
        moviePoster: review.moviePoster,
        initialContent: review.text || review.content, // Check API response field name
        initialRating: review.rating
      }
    });
  };

  const renderHeader = () => {
    if (movieId && movieTitle) {
      return (
        <View className="px-5 py-4 border-b border-gray-800">
          <Text className="text-white text-lg font-bold">Reviews for</Text>
          <Text className="text-emerald-500 text-2xl font-extrabold">{movieTitle}</Text>
        </View>
      );
    }
    if (!movieId) {
      return (
        <View className="px-5 py-4 border-b border-gray-800">
          <Text className="text-white text-2xl font-bold">
            {user ? 'Your Feed' : 'Recent Reviews'}
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top']}>
      {/* Top Nav Bar */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-800">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white font-bold text-lg ml-2">Reviews</Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <LoadingSpinner />
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => (
            <ReviewCard 
              review={item} 
              onDelete={handleDeleteReview}
              onEdit={handleEditReview}
            />
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
          }
          ListEmptyComponent={
            <EmptyState 
              icon="chatbubble-outline"
              title="No reviews yet"
              subtitle={movieId ? "Be the first to review this movie!" : "Check back later for new reviews."}
              style={{ marginTop: 50 }}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}