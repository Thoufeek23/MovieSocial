import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../../src/context/AuthContext';
import * as api from '../../src/api';
import ReviewCard from '../../components/ReviewCard';
import BookmarkButton from '../../components/BookmarkButton';
import DisplayStars from '../../components/DisplayStars';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ReviewModal from '../../components/ReviewModal';
import DiscussionFormModal from '../../components/DiscussionFormModal';

const { width, height } = Dimensions.get('window');

const MovieDetailsPage = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useContext(AuthContext);
  
  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewToEdit, setReviewToEdit] = useState(null);
  const [isDiscussionModalOpen, setIsDiscussionModalOpen] = useState(false);

  const IMG_BASE_URL = 'https://image.tmdb.org/t/p/';

  const fetchMovieData = useCallback(async () => {
    try {
      const { data: movieData } = await api.getMovieDetails(id);
      
      // Fetch reviews and stats in parallel
      const [reviewsRes, statsRes, discussionsRes] = await Promise.allSettled([
        api.getReviewsForMovie(id),
        api.getMovieStats(id),
        api.fetchDiscussions({ movieId: id })
      ]);

      setMovie(movieData);

      if (reviewsRes.status === 'fulfilled') {
        setReviews(reviewsRes.value.data || []);
      } else {
        setReviews([]);
      }

      if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
        const { movieSocialRating, reviewCount } = statsRes.value.data;
        setMovie(m => ({ ...(m || movieData), movieSocialRating, movieSocialCount: reviewCount }));
      } else {
        setMovie(m => ({ ...(m || movieData), movieSocialRating: undefined, movieSocialCount: undefined }));
      }

      if (discussionsRes.status === 'fulfilled') {
        setDiscussions(discussionsRes.value.data || []);
      } else {
        setDiscussions([]);
      }
    } catch (error) {
      console.error("Failed to fetch movie data", error);
      Alert.alert('Error', 'Failed to load movie details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    fetchMovieData();
  }, [fetchMovieData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMovieData();
  }, [fetchMovieData]);

  const handleAddToWatchlist = async () => {
    try {
      await api.addToWatchlist(movie.id);
      Alert.alert('Success', `${movie.title} added to your watchlist!`);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.msg || 'Could not add to watchlist.');
    }
  };

  const handleAddToWatched = async () => {
    try {
      await api.addToWatched(movie.id);
      Alert.alert('Success', `${movie.title} marked as watched!`);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.msg || 'Could not mark as watched.');
    }
  };

  const handleAddReview = () => {
    setReviewToEdit(null);
    setIsReviewModalOpen(true);
  };

  const handleStartDiscussion = () => {
    setIsDiscussionModalOpen(true);
  };

  const handleEditReview = (review) => {
    setReviewToEdit(review);
    setIsReviewModalOpen(true);
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
              Alert.alert('Success', 'Review deleted.');
              setReviews(currentReviews => currentReviews.filter(r => r._id !== reviewId));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete review.');
            }
          }
        }
      ]
    );
  };

  const handleDiscussionPress = (discussionId) => {
    // TODO: Navigate to discussion detail page when created
    router.push(`/discussion/${discussionId}`);
  };

  const renderSocialRating = () => {
    if (movie && typeof movie.movieSocialRating !== 'undefined' && movie.movieSocialRating !== null) {
      return (
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>
            {Number(movie.movieSocialRating).toFixed(1)}
          </Text>
          <Text style={styles.ratingSubtext}>
            Movie Social • {movie.movieSocialCount ?? reviews.length}
          </Text>
        </View>
      );
    }

    if (reviews && reviews.length > 0) {
      const adjustedSum = reviews.reduce((s, r) => {
        const rating = Number(r.rating) || 0;
        const votes = (r.agreementVotes || []);
        let agreementFraction = 1;
        if (votes.length > 0) {
          const voteSum = votes.reduce((vs, v) => vs + (Number(v.value) || 0), 0);
          agreementFraction = voteSum / votes.length;
        }
        const adjusted = rating * (0.75 + 0.25 * agreementFraction);
        return s + adjusted;
      }, 0);
      const weightedAvg = (adjustedSum / reviews.length);
      const displayAvg = Number(weightedAvg.toFixed(1));
      
      return (
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>
            {displayAvg.toFixed(1)}
          </Text>
          <Text style={styles.ratingSubtext}>
            Movie Social • {reviews.length}
          </Text>
        </View>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner />
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={styles.errorContainer}>
        <EmptyState
          title="Movie not found"
          subtitle="The movie you're looking for doesn't exist"
        />
      </View>
    );
  }

  const userReview = reviews.find(r => String(r.user._id) === String(user?.id));

  return (
    <>
      <ReviewModal
        visible={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        movie={movie}
        existingReview={reviewToEdit}
        onSubmit={fetchMovieData}
      />
      
      <DiscussionFormModal
        visible={isDiscussionModalOpen}
        onClose={() => setIsDiscussionModalOpen(false)}
        movie={movie}
        onDiscussionCreated={fetchMovieData}
      />
      
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      {/* Backdrop Header */}
      <View style={styles.backdropContainer}>
        <Image
          source={{
            uri: movie.backdrop_path 
              ? `${IMG_BASE_URL}original${movie.backdrop_path}`
              : `${IMG_BASE_URL}w500${movie.poster_path}`
          }}
          style={styles.backdrop}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(9, 9, 11, 0.8)', '#09090b']}
          style={styles.gradient}
        />
        
        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Movie Info Section */}
      <View style={styles.movieInfoContainer}>
        <View style={styles.movieHeader}>
          <Image
            source={{
              uri: movie.poster_path
                ? `${IMG_BASE_URL}w500${movie.poster_path}`
                : 'https://via.placeholder.com/300x450?text=No+Image'
            }}
            style={styles.poster}
            resizeMode="cover"
          />
          
          <View style={styles.movieDetails}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={3}>{movie.title}</Text>
              {renderSocialRating()}
            </View>
            
            <Text style={styles.year}>
              {movie.release_date?.substring(0, 4) || '—'}
            </Text>
            
            <Text style={styles.overview} numberOfLines={6}>
              {movie.overview}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        {user && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={userReview ? () => handleEditReview(userReview) : handleAddReview}
            >
              <Ionicons 
                name={userReview ? "create-outline" : "add-circle-outline"} 
                size={20} 
                color="white" 
              />
              <Text style={styles.actionButtonText}>
                {userReview ? 'Edit Review' : 'Add Review'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleAddToWatched}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="white" />
              <Text style={styles.actionButtonText}>Mark as Watched</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleAddToWatchlist}
            >
              <Ionicons name="add-circle-outline" size={20} color="white" />
              <Text style={styles.actionButtonText}>Add to Watchlist</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.discussionButton]}
              onPress={handleStartDiscussion}
            >
              <Ionicons name="chatbubbles-outline" size={20} color="white" />
              <Text style={styles.actionButtonText}>Start Discussion</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Reviews Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reviews</Text>
        {reviews.length > 0 ? (
          <View style={styles.reviewsList}>
            {reviews.map(review => (
              <ReviewCard
                key={review._id}
                review={review}
                onEdit={handleEditReview}
                onDelete={handleDeleteReview}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            title="No reviews yet"
            subtitle="Be the first to review this movie!"
            icon="star-outline"
          />
        )}
      </View>

      {/* Discussions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Discussions</Text>
        {discussions.length > 0 ? (
          <View style={styles.discussionsList}>
            {discussions.map(discussion => (
              <TouchableOpacity
                key={discussion._id}
                style={styles.discussionCard}
                onPress={() => handleDiscussionPress(discussion._id)}
              >
                <Image
                  source={{
                    uri: `${IMG_BASE_URL}w154${movie.poster_path}`
                  }}
                  style={styles.discussionPoster}
                  resizeMode="cover"
                />
                <View style={styles.discussionContent}>
                  <Text style={styles.discussionTitle} numberOfLines={2}>
                    {discussion.title}
                  </Text>
                  <Text style={styles.discussionMeta}>
                    Started by {discussion.starter.username} • {discussion.comments.length} comments
                  </Text>
                </View>
                <View style={styles.discussionActions}>
                  <BookmarkButton id={discussion._id} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <EmptyState
            title="No discussions yet"
            subtitle="Start a conversation about this movie!"
            icon="chatbubbles-outline"
          />
        )}
      </View>
    </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#09090b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#09090b',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdropContainer: {
    height: height * 0.4,
    position: 'relative',
  },
  backdrop: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
  },
  movieInfoContainer: {
    padding: 16,
    marginTop: -80,
    zIndex: 5,
  },
  movieHeader: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  poster: {
    width: 120,
    height: 180,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  movieDetails: {
    flex: 1,
    paddingTop: 60,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    marginRight: 12,
  },
  year: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 12,
  },
  overview: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
  },
  ratingBadge: {
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
  },
  ratingSubtext: {
    fontSize: 10,
    color: '#9ca3af',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#10b981',
  },
  discussionButton: {
    backgroundColor: '#2563eb',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    padding: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  reviewsList: {
    gap: 16,
  },
  discussionsList: {
    gap: 12,
  },
  discussionCard: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  discussionPoster: {
    width: 60,
    height: 90,
    borderRadius: 8,
  },
  discussionContent: {
    flex: 1,
  },
  discussionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 6,
  },
  discussionMeta: {
    fontSize: 12,
    color: '#9ca3af',
  },
  discussionActions: {
    justifyContent: 'center',
  },
});

export default MovieDetailsPage;