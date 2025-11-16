import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import ReviewCard from '../../components/ReviewCard';
import ReviewModal from '../../components/ReviewModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import * as api from '../../src/api';
import { useScrollToTop } from './_layout';

export default function ReviewsPage() {
  const { user } = useAuth();
  const flatListRef = useRef(null);
  const { registerScrollRef } = useScrollToTop();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewToEdit, setReviewToEdit] = useState(null);

  useEffect(() => {
    loadReviews();
  }, [user]);

  // Register scroll ref for tab navigation
  useEffect(() => {
    if (registerScrollRef) {
      registerScrollRef('reviews', flatListRef);
    }
  }, [registerScrollRef]);

  const loadReviews = async () => {
    try {
      // Use personalized feed if user is logged in, otherwise regular feed
      const response = user ? await api.fetchPersonalizedFeed().catch(() => api.fetchFeed()) : await api.fetchFeed();
      setReviews(response.data || []);
    } catch (error) {
      // Fallback to regular feed if anything fails
      try {
        const response = await api.fetchFeed();
        setReviews(response.data || []);
      } catch (fallbackError) {
        console.error('Failed to load reviews:', fallbackError);
        setReviews([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReviews();
    setRefreshing(false);
  };

  const handleCreateReview = () => {
    setReviewToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditReview = (review) => {
    setReviewToEdit(review);
    setIsModalOpen(true);
  };

  const handleDeleteReview = async (reviewId) => {
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
              console.error('Failed to delete review:', error);
              Alert.alert('Error', 'Failed to delete review');
            }
          }
        }
      ]
    );
  };

  const handleReviewPosted = async () => {
    // Refresh reviews after posting/editing with personalized logic
    try {
      const response = user ? await api.fetchPersonalizedFeed().catch(() => api.fetchFeed()) : await api.fetchFeed();
      setReviews(response.data || []);
    } catch (error) {
      console.error('Failed to refresh reviews:', error);
    }
  };

  const renderReview = ({ item }) => {
    if (!item || !item._id) {
      return null;
    }
    return (
      <ReviewCard 
        review={item} 
        onEdit={handleEditReview}
        onDelete={handleDeleteReview}
      />
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner text="Loading reviews..." animationType="pulse" />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {user ? 'Reviews For You' : 'Latest Reviews'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {user ? 'Reviews based on your interests' : 'Latest reviews from the community'}
        </Text>
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        {reviews.length > 0 ? (
          <FlatList
            ref={flatListRef}
            data={reviews}
            renderItem={renderReview}
            keyExtractor={(item, index) => item?._id || `review-${index}`}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#10b981"
              />
            }
          />
        ) : (
          <EmptyState
            icon="star-outline"
            title="No reviews yet"
            subtitle="Be the first to review a movie!"
          />
        )}
      </View>

      {/* Review Modal */}
      {reviewToEdit && (
        <ReviewModal
          visible={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setReviewToEdit(null);
          }}
          movie={reviewToEdit.movie || {
            id: reviewToEdit.movieId,
            title: reviewToEdit.movieTitle,
            poster_path: reviewToEdit.moviePoster
          }}
          existingReview={reviewToEdit}
          onSubmit={handleReviewPosted}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
    paddingTop: 120,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#9ca3af',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120, // Increased padding for Samsung navigation compatibility
  },
});