import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, MessageCircle, User } from 'lucide-react-native';
import { AuthContext } from '../src/context/AuthContext';
import Avatar from './Avatar';

const RankCard = ({ rank, onLike }) => {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  
  if (!rank || !rank.user) {
    return null;
  }

  const userHasLiked = user && rank.likes?.includes(user._id || user.id);

  const handleRankPress = () => {
    router.push(`/rank/${rank._id}`);
  };

  const handleUserPress = () => {
    if (rank.user?.username) {
      router.push(`/profile/${rank.user.username}`);
    }
  };

  const handleLikePress = () => {
    if (onLike) {
      onLike(rank._id);
    }
  };

  return (
    <View style={styles.card}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.titleContainer}
            onPress={handleRankPress}
            activeOpacity={0.7}
          >
            <Text style={styles.title} numberOfLines={2}>
              {rank.title}
            </Text>
          </TouchableOpacity>
          
          {/* Action Buttons */}
          <View style={styles.actions}>
            {/* Like Button */}
            <TouchableOpacity
              style={[styles.actionButton, userHasLiked && styles.actionButtonLiked]}
              onPress={handleLikePress}
              activeOpacity={0.7}
            >
              <Heart
                color={userHasLiked ? '#ef4444' : '#9ca3af'}
                fill={userHasLiked ? '#ef4444' : 'none'}
                size={16}
              />
              <Text style={[styles.actionText, userHasLiked && styles.actionTextLiked]}>
                {rank.likes?.length || 0}
              </Text>
            </TouchableOpacity>

            {/* Comment Count */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleRankPress}
              activeOpacity={0.7}
            >
              <MessageCircle color="#9ca3af" size={16} />
              <Text style={styles.actionText}>
                {rank.comments?.length || 0}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Description */}
        {rank.description && (
          <Text style={styles.description} numberOfLines={2}>
            {rank.description}
          </Text>
        )}

        {/* User Info */}
        <TouchableOpacity
          style={styles.userInfo}
          onPress={handleUserPress}
          activeOpacity={0.7}
        >
          <Avatar user={rank.user} size={28} />
          <Text style={styles.username}>
            {rank.user?.username || 'Unknown'}
          </Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.date}>
            {new Date(rank.createdAt).toLocaleDateString()}
          </Text>
        </TouchableOpacity>

        {/* Movie Count Label */}
        <Text style={styles.movieCount}>
          {rank.movies?.length || 0} MOVIES
        </Text>
      </View>

      {/* Movie Strip Preview */}
      <View style={styles.movieStripWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.movieStrip}
          contentContainerStyle={styles.movieStripContent}
        >
          {rank.movies?.slice(0, 6).map((movie, index) => (
            <TouchableOpacity
              key={`${rank._id}-${index}`}
              style={styles.movieItem}
              onPress={() => router.push(`/movie/${movie.movieId || movie.id}`)}
              activeOpacity={0.8}
            >
              <View style={styles.posterContainer}>
                <Image
                  source={{ 
                    uri: movie.posterPath || movie.poster_path
                      ? `https://image.tmdb.org/t/p/w200${movie.posterPath || movie.poster_path}`
                      : 'https://via.placeholder.com/200x300/374151/9ca3af?text=No+Image'
                  }}
                  style={styles.poster}
                  resizeMode="cover"
                />
                {/* Rank Badge */}
                <View style={styles.rankBadge}>
                  <Text style={styles.rankBadgeText}>
                    #{movie.rank || index + 1}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
          {rank.movies?.length > 6 && (
            <TouchableOpacity
              style={styles.moreButton}
              onPress={handleRankPress}
              activeOpacity={0.7}
            >
              <Text style={styles.moreButtonNumber}>+{rank.movies.length - 6}</Text>
              <Text style={styles.moreButtonText}>more</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#27272a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
    marginBottom: 12,
  },
  header: {
    padding: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fafafa',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    gap: 6,
  },
  actionButtonLiked: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },
  actionTextLiked: {
    color: '#ef4444',
  },
  description: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  username: {
    fontSize: 14,
    fontWeight: '500',
    color: '#d1d5db',
    marginLeft: 8,
  },
  separator: {
    fontSize: 12,
    color: '#4b5563',
    marginHorizontal: 6,
  },
  date: {
    fontSize: 12,
    color: '#6b7280',
  },
  movieCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  movieStripWrapper: {
    paddingLeft: 20,
    paddingBottom: 20,
  },
  movieStrip: {
    flexGrow: 0,
  },
  movieStripContent: {
    paddingRight: 20,
    alignItems: 'center',
  },
  movieItem: {
    marginRight: 12,
  },
  posterContainer: {
    position: 'relative',
  },
  poster: {
    width: 80,
    height: 112,
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  rankBadge: {
    position: 'absolute',
    top: -6,
    left: -6,
    backgroundColor: '#10b981',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#27272a',
  },
  rankBadgeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
  },
  moreButton: {
    width: 80,
    height: 112,
    backgroundColor: 'rgba(39, 39, 42, 0.5)',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#4b5563',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreButtonNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9ca3af',
  },
  moreButtonText: {
    fontSize: 10,
    color: '#6b7280',
  },
});

export default RankCard;
