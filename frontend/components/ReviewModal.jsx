import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Modal, 
  StyleSheet, 
  SafeAreaView,
  ScrollView,
  Alert,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as api from '../src/api';

const { width, height } = Dimensions.get('window');

const StarRating = ({ rating, onRatingChange, size = 32 }) => {
  const stars = [1, 2, 3, 4, 5];
  
  const getStarIcon = (starNumber) => {
    if (rating >= starNumber) {
      return "star";
    } else if (rating >= starNumber - 0.5) {
      return "star-half";
    } else {
      return "star-outline";
    }
  };
  
  const getStarColor = (starNumber) => {
    if (rating >= starNumber || rating >= starNumber - 0.5) {
      return "#fbbf24";
    }
    return "#6b7280";
  };
  
  const handleStarPress = (starNumber) => {
    if (rating === starNumber) {
      // If clicking the same star, toggle to half star
      onRatingChange(starNumber - 0.5);
    } else if (rating === starNumber - 0.5) {
      // If clicking half star, go to full star
      onRatingChange(starNumber);
    } else {
      // Otherwise, set to full star
      onRatingChange(starNumber);
    }
  };
  
  return (
    <View>
      <View style={styles.starsContainer}>
        {stars.map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => handleStarPress(star)}
            style={styles.starButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name={getStarIcon(star)}
              size={size}
              color={getStarColor(star)}
            />
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.ratingInstructions}>
        Tap to rate, tap again for half stars
      </Text>
    </View>
  );
};

const ReviewModal = ({
  visible,
  onClose,
  onSubmit,
  movie,
  existingReview = null
}) => {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating || 0);
      setReviewText(existingReview.text || '');
      setIsEditing(true);
    } else {
      setRating(0);
      setReviewText('');
      setIsEditing(false);
    }
  }, [existingReview, visible]);

  const handleSubmit = async () => {
    if (!reviewText.trim()) {
      Alert.alert('Missing Review', 'Please write a review before submitting.');
      return;
    }

    if (rating === 0) {
      Alert.alert('Missing Rating', 'Please select a rating before submitting.');
      return;
    }

    const reviewData = {
      rating,
      text: reviewText.trim(),
      movieId: movie.id,
      movieTitle: movie.title,
      moviePoster: movie.poster_path
    };

    setLoading(true);
    try {
      if (isEditing && existingReview) {
        await api.updateReview(existingReview._id, reviewData);
        Alert.alert('Success', 'Review updated successfully!');
      } else {
        await api.createReview(reviewData);
        Alert.alert('Success', 'Review posted successfully!');
      }
      
      // Reset form
      setRating(0);
      setReviewText('');
      
      // Call parent callback and close modal
      if (onSubmit) {
        onSubmit();
      }
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
      const errorMessage = error.response?.data?.msg || 
                          (isEditing ? 'Failed to update review' : 'Failed to post review');
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setReviewText('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#9ca3af" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Review' : 'Write Review'}
          </Text>
          
          <TouchableOpacity 
            onPress={handleSubmit} 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            disabled={loading}
          >
            <Text style={[styles.submitButtonText, loading && styles.submitButtonTextDisabled]}>
              {loading ? 'Saving...' : 'Post'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Movie Info */}
          {movie && (
            <View style={styles.movieInfo}>
              <Text style={styles.movieTitle} numberOfLines={2}>
                {movie.title}
              </Text>
              <Text style={styles.movieYear}>
                {movie.release_date?.substring(0, 4) || 'Unknown Year'}
              </Text>
            </View>
          )}

          {/* Rating Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Rating</Text>
            <StarRating rating={rating} onRatingChange={setRating} />
            {rating > 0 && (
              <Text style={styles.ratingText}>
                {rating} out of 5 stars
              </Text>
            )}
          </View>

          {/* Review Text Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Review</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Share your thoughts about this movie..."
              placeholderTextColor="#6b7280"
              value={reviewText}
              onChangeText={setReviewText}
              multiline
              textAlignVertical="top"
              maxLength={1000}
            />
            <Text style={styles.characterCount}>
              {reviewText.length}/1000 characters
            </Text>
          </View>

          {/* Tips Section */}
          <View style={styles.tipsSection}>
            <Text style={styles.tipsTitle}>Review Tips:</Text>
            <Text style={styles.tipText}>
              • Share what you liked or disliked about the movie
            </Text>
            <Text style={styles.tipText}>
              • Mention memorable scenes or performances
            </Text>
            <Text style={styles.tipText}>
              • Avoid major spoilers for other viewers
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  submitButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#374151',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  submitButtonTextDisabled: {
    color: '#9ca3af',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  movieInfo: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  movieTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  movieYear: {
    fontSize: 14,
    color: '#9ca3af',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    justifyContent: 'center',
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  ratingInstructions: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  textInput: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: 'white',
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#374151',
  },
  characterCount: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 4,
  },
  tipsSection: {
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
    lineHeight: 16,
  },
});

export default ReviewModal;