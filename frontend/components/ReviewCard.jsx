import React, { useContext, useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Pressable, Dimensions, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../src/context/AuthContext';
import DisplayStars from './DisplayStars';
import * as api from '../src/api';

const { width } = Dimensions.get('window');

const ReviewCard = ({ review, onEdit, onDelete }) => {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [agreement, setAgreement] = useState({ average: null, totalVotes: 0 });
  const [myVote, setMyVote] = useState(null);
  const [fetchedBadges, setFetchedBadges] = useState(null);
  
  const isAuthor = !!user && (
    String(user.id) === String(review.user._id) ||
    String(user._id) === String(review.user._id)
  );

  const canModify = isAuthor && (typeof onEdit === 'function' || typeof onDelete === 'function');
  const IMG_BASE_URL = 'https://image.tmdb.org/t/p/w200';

  useEffect(() => {
    const votes = (review.agreementVotes || []);
    if (votes.length === 0) {
      setAgreement({ average: null, totalVotes: 0 });
      setMyVote(null);
      return;
    }
    const sum = votes.reduce((s, v) => s + (Number(v.value) || 0), 0);
    const avg = Math.round((sum / votes.length) * 100);
    setAgreement({ average: avg, totalVotes: votes.length });
    if (user) {
      const mine = votes.find(v => String(v.user) === String(user.id) || String(v.user) === String(user._id));
      setMyVote(mine ? Number(mine.value) : null);
    }
  }, [review.agreementVotes, user]);

  useEffect(() => {
    let mounted = true;
    const ensureBadges = async () => {
      try {
        if (!review?.user || (review.user.badges && review.user.badges.length > 0)) return;
        const res = await api.getUserProfile(review.user.username);
        if (!mounted) return;
        setFetchedBadges(res.data.badges || []);
      } catch (e) {
        console.debug('Could not fetch reviewer badges', e?.message || e);
      }
    };
    ensureBadges();
    return () => { mounted = false; };
  }, [review.user]);

  const handleVote = async (value) => {
    if (!user) return;
    try {
      const res = await api.voteReview(review._id, value);
      const updated = res.data || res;
      if (updated && updated.agreementVotes) {
        review.agreementVotes = updated.agreementVotes;
        const votes = updated.agreementVotes;
        const sum = votes.reduce((s, v) => s + (Number(v.value) || 0), 0);
        const avg = Math.round((sum / votes.length) * 100);
        setAgreement({ average: avg, totalVotes: votes.length });
        const mine = votes.find(v => String(v.user) === String(user.id) || String(v.user) === String(user._id));
        setMyVote(mine ? Number(mine.value) : null);
      }
    } catch (err) {
      console.error('Vote failed', err);
      Alert.alert('Error', 'Failed to submit vote');
    }
  };

  const handleMoviePress = () => {
    router.push(`/movie/${review.movieId}`);
  };

  const handleUserPress = () => {
    router.push(`/profile/${review.user.username}`);
  };

  const handleEdit = () => {
    if (onEdit) onEdit(review);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete && onDelete(review._id) }
      ]
    );
  };

  const renderBadge = () => {
    const source = (review.user?.badges && review.user.badges.length > 0) ? review.user.badges : fetchedBadges;
    if (!source || source.length === 0) return null;
    
    const badge = source[0];
    const id = (badge.id || badge.name || '').toUpperCase();
    let badgeStyle = styles.badgeDefault;
    
    if (id.includes('DIAMOND')) badgeStyle = styles.badgeDiamond;
    else if (id.includes('GOLD')) badgeStyle = styles.badgeGold;
    else if (id.includes('SILVER')) badgeStyle = styles.badgeSilver;
    else if (id.includes('BRONZE')) badgeStyle = styles.badgeBronze;

    const label = (badge.name || badge.id || '').replace(/_/g, ' ');
    
    return (
      <View style={[styles.badge, badgeStyle]}>
        <Text style={styles.badgeText}>{label}</Text>
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleMoviePress}>
          <Image
            source={{ uri: `${IMG_BASE_URL}${review.moviePoster}` }}
            style={styles.moviePoster}
            resizeMode="cover"
          />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleMoviePress}>
            <Text style={styles.movieTitle} numberOfLines={1}>{review.movieTitle}</Text>
          </TouchableOpacity>
          
          <View style={styles.reviewerInfo}>
            {review.rating > 0 && <DisplayStars rating={review.rating} />}
            <View style={styles.reviewerRow}>
              <Text style={styles.reviewedBy}>Reviewed by </Text>
              <TouchableOpacity onPress={handleUserPress}>
                <Text style={styles.username}>{review.user.username}</Text>
              </TouchableOpacity>
              {renderBadge()}
            </View>
          </View>
        </View>
        
        {canModify && (
          <View style={styles.actions}>
            {onEdit && (
              <TouchableOpacity onPress={handleEdit} style={styles.actionButton}>
                <Ionicons name="pencil" size={16} color="#9ca3af" />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
                <Ionicons name="trash" size={16} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
      
      <Text style={styles.reviewText}>"{review.text}"</Text>
      
      <View style={styles.agreement}>
        <View style={styles.agreementInfo}>
          <Text style={styles.agreementLabel}>Community agreement: </Text>
          <Text style={styles.agreementValue}>
            {agreement.average === null ? 'No votes' : `${agreement.average}%`}
          </Text>
          <Text style={styles.voteCount}>({agreement.totalVotes} votes)</Text>
        </View>
      </View>
      
      <View style={styles.voteButtons}>
        <TouchableOpacity 
          style={[styles.voteButton, myVote === 1 && styles.voteButtonActive]} 
          onPress={() => handleVote(1)}
        >
          <Text style={[styles.voteButtonText, myVote === 1 && styles.voteButtonTextActive]}>Agree (100%)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.voteButton, myVote === 0.5 && styles.voteButtonPartial]} 
          onPress={() => handleVote(0.5)}
        >
          <Text style={[styles.voteButtonText, myVote === 0.5 && styles.voteButtonTextActive]}>Partially (50%)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.voteButton, myVote === 0 && styles.voteButtonDisagree]} 
          onPress={() => handleVote(0)}
        >
          <Text style={[styles.voteButtonText, myVote === 0 && styles.voteButtonTextActive]}>Disagree (0%)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    // Glass morphism effect matching client
    backgroundColor: 'rgba(31, 41, 55, 0.8)', // bg-gray-800 with transparency
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
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
  header: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  moviePoster: {
    width: 60,
    height: 90,
    borderRadius: 6,
  },
  headerContent: {
    flex: 1,
  },
  movieTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  reviewerInfo: {
    gap: 6,
  },

  reviewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  reviewedBy: {
    fontSize: 12,
    color: '#9ca3af',
  },
  username: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeDefault: {
    backgroundColor: '#374151',
  },
  badgeDiamond: {
    backgroundColor: '#8b5cf6',
  },
  badgeGold: {
    backgroundColor: '#f59e0b',
  },
  badgeSilver: {
    backgroundColor: '#9ca3af',
  },
  badgeBronze: {
    backgroundColor: '#92400e',
  },
  badgeText: {
    fontSize: 8,
    color: 'white',
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  reviewText: {
    fontSize: 14,
    color: '#d1d5db',
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 20,
  },
  agreement: {
    marginBottom: 12,
  },
  agreementInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  agreementLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  agreementValue: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: 'bold',
  },
  voteCount: {
    fontSize: 10,
    color: '#6b7280',
    marginLeft: 4,
  },
  voteButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  voteButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#374151',
    borderRadius: 6,
    alignItems: 'center',
  },
  voteButtonActive: {
    backgroundColor: '#059669',
  },
  voteButtonPartial: {
    backgroundColor: '#d97706',
  },
  voteButtonDisagree: {
    backgroundColor: '#dc2626',
  },
  voteButtonText: {
    fontSize: 10,
    color: '#d1d5db',
    fontWeight: '600',
  },
  voteButtonTextActive: {
    color: 'white',
  },
});

export default ReviewCard;