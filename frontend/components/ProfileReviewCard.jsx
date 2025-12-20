import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronDown, ChevronUp, Star } from 'lucide-react-native';
import { AuthContext } from '../src/context/AuthContext';

const IMG_BASE_URL = 'https://image.tmdb.org/t/p/w92';

const ProfileReviewCard = ({ review, onEdit, onDelete }) => {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [agreement, setAgreement] = useState({ average: null, totalVotes: 0 });
  
  const isOwnReview = user && (review.user?._id === user.id || review.user?._id === user._id);

  // Calculate agreement percentage
  useEffect(() => {
    const votes = review.agreementVotes || [];
    if (votes.length === 0) {
      setAgreement({ average: null, totalVotes: 0 });
      return;
    }
    const sum = votes.reduce((s, v) => s + (Number(v.value) || 0), 0);
    const avg = Math.round((sum / votes.length) * 100);
    setAgreement({ average: avg, totalVotes: votes.length });
  }, [review.agreementVotes]);

  const handleMoviePress = () => {
    router.push(`/movie/${review.movieId}`);
  };

  const renderStars = () => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={14}
        fill={i < Math.round(review.rating) ? '#eab308' : 'transparent'}
        color={i < Math.round(review.rating) ? '#eab308' : '#4b5563'}
      />
    ));
  };

  return (
    <View style={styles.card}>
      {/* Compact Header */}
      <View style={styles.header}>
        {/* Movie Poster */}
        <TouchableOpacity onPress={handleMoviePress}>
          <Image
            source={{ uri: `${IMG_BASE_URL}${review.moviePoster}` }}
            style={styles.moviePoster}
            resizeMode="cover"
          />
        </TouchableOpacity>

        {/* Right Side */}
        <View style={styles.headerContent}>
          {/* Top Row: Title */}
          <TouchableOpacity onPress={handleMoviePress}>
            <Text style={styles.movieTitle} numberOfLines={1}>
              {review.movieTitle}
            </Text>
          </TouchableOpacity>

          {/* Stats Row: Stars & Agreement */}
          <View style={styles.statsRow}>
            <View style={styles.starsContainer}>
              {renderStars()}
            </View>

            {/* Community Agreement Badge */}
            <View style={styles.agreementBadge}>
              <Text style={styles.agreementText}>
                {agreement.average === null ? '0%' : `${agreement.average}%`} ({agreement.totalVotes})
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Toggle Arrow */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          onPress={() => setIsExpanded(!isExpanded)}
          style={styles.toggleButton}
          activeOpacity={0.7}
        >
          {isExpanded ? (
            <ChevronUp size={16} color="#6b7280" />
          ) : (
            <ChevronDown size={16} color="#6b7280" />
          )}
        </TouchableOpacity>
      </View>

      {/* Collapsible Review Text */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          <Text style={styles.reviewText}>{review.text}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(75, 85, 99, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    gap: 12,
  },
  moviePoster: {
    width: 48,
    height: 72,
    borderRadius: 6,
  },
  headerContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  movieTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e5e7eb',
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  agreementBadge: {
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  agreementText: {
    fontSize: 10,
    color: '#9ca3af',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: -8,
  },
  toggleButton: {
    padding: 4,
    width: '100%',
    alignItems: 'center',
  },
  expandedContent: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(75, 85, 99, 0.5)',
  },
  reviewText: {
    fontSize: 13,
    color: '#d1d5db',
    lineHeight: 20,
  },
});

export default ProfileReviewCard;
