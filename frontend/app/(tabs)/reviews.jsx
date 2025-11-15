import React, { useState, useEffect } from 'react';
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
import ReviewCard from '../../components/ReviewCard';
import ReviewModal from '../../components/ReviewModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import * as api from '../../src/api';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewToEdit, setReviewToEdit] = useState(null);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const response = await api.fetchFeed();
      setReviews(response.data || []);
    } catch (error) {
      console.error('Failed to load reviews:', error);
      setReviews([]);
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
    // Refresh reviews after posting/editing
    try {
      const response = await api.fetchFeed();
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
      {/* Content */}
      <View style={styles.content}>
        {reviews.length > 0 ? (
          <FlatList
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

  content: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
});