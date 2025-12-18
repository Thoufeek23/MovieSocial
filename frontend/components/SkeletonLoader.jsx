import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Professional Skeleton Loader Component with Smooth Wave Animation
 * Displays animated skeleton placeholders while content is loading
 * 
 * Usage:
 * <SkeletonLoader width={200} height={40} borderRadius={8} />
 * <SkeletonLoader width="100%" height={100} style={styles.customSkeleton} />
 */
const SkeletonLoader = ({ 
  width = 100, 
  height = 100, 
  borderRadius = 8, 
  style = {},
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.delay(300),
      ])
    ).start();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#27272a',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          transform: [{ translateX }],
          opacity,
        }}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1, width: 300 }}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
});

export default SkeletonLoader;

/**
 * Preset Skeleton Components for Common Use Cases
 */

// Movie Card Skeleton
export const MovieCardSkeleton = () => (
  <View style={skeletonStyles.movieCardContainer}>
    <SkeletonLoader width={160} height={240} borderRadius={12} style={{ marginBottom: 8 }} />
    <SkeletonLoader width={140} height={16} borderRadius={4} style={{ marginBottom: 6 }} />
    <SkeletonLoader width={120} height={14} borderRadius={4} />
  </View>
);

// Review Card Skeleton
export const ReviewCardSkeleton = () => (
  <View style={skeletonStyles.reviewCardContainer}>
    <View style={{ flexDirection: 'row', marginBottom: 12, alignItems: 'center' }}>
      <SkeletonLoader width={40} height={40} borderRadius={20} style={{ marginRight: 12, flexShrink: 0 }} />
      <View style={{ flex: 1 }}>
        <SkeletonLoader width={120} height={14} borderRadius={4} style={{ marginBottom: 6 }} />
        <SkeletonLoader width={80} height={12} borderRadius={4} />
      </View>
    </View>
    <SkeletonLoader width="100%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
    <SkeletonLoader width="95%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
    <SkeletonLoader width="80%" height={14} borderRadius={4} />
  </View>
);

// Discussion Card Skeleton
export const DiscussionCardSkeleton = () => (
  <View style={skeletonStyles.discussionCardContainer}>
    <View style={{ flexDirection: 'row', marginBottom: 12, alignItems: 'center' }}>
      <SkeletonLoader width={36} height={36} borderRadius={18} style={{ marginRight: 10, flexShrink: 0 }} />
      <View style={{ flex: 1 }}>
        <SkeletonLoader width={130} height={14} borderRadius={4} style={{ marginBottom: 6 }} />
        <SkeletonLoader width={90} height={12} borderRadius={4} />
      </View>
    </View>
    <SkeletonLoader width="100%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
    <SkeletonLoader width="95%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
    <SkeletonLoader width="85%" height={12} borderRadius={4} />
  </View>
);

// Message Skeleton
export const MessageSkeleton = ({ isMe = false }) => (
  <View style={[skeletonStyles.messageContainer, isMe ? skeletonStyles.messageMe : skeletonStyles.messageThem]}>
    <SkeletonLoader width={200} height={40} borderRadius={12} />
  </View>
);

// Profile Header Skeleton
export const ProfileHeaderSkeleton = () => (
  <View style={skeletonStyles.profileHeaderContainer}>
    <SkeletonLoader width={80} height={80} borderRadius={40} style={{ marginBottom: 12 }} />
    <SkeletonLoader width={150} height={20} borderRadius={4} style={{ marginBottom: 8 }} />
    <SkeletonLoader width={200} height={14} borderRadius={4} style={{ marginBottom: 16 }} />
    <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 12, alignSelf: 'stretch' }}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={{ alignItems: 'center' }}>
          <SkeletonLoader width={40} height={20} borderRadius={4} style={{ marginBottom: 6 }} />
          <SkeletonLoader width={60} height={12} borderRadius={4} />
        </View>
      ))}
    </View>
  </View>
);

// Stats Row Skeleton
export const StatsRowSkeleton = () => (
  <View style={skeletonStyles.statsRowContainer}>
    {[1, 2, 3].map((i) => (
      <View key={i} style={skeletonStyles.statContainer}>
        <SkeletonLoader width={40} height={24} borderRadius={4} style={{ marginBottom: 6 }} />
        <SkeletonLoader width={60} height={12} borderRadius={4} />
      </View>
    ))}
  </View>
);

// Conversation List Skeleton
export const ConversationSkeleton = () => (
  <View style={skeletonStyles.conversationContainer}>
    {[1, 2, 3, 4, 5].map((i) => (
      <View key={i} style={{ flexDirection: 'row', marginBottom: 16, alignItems: 'center', paddingHorizontal: 20 }}>
        <SkeletonLoader width={48} height={48} borderRadius={24} style={{ marginRight: 12, flexShrink: 0 }} />
        <View style={{ flex: 1 }}>
          <SkeletonLoader width={120} height={14} borderRadius={4} style={{ marginBottom: 6 }} />
          <SkeletonLoader width="90%" height={12} borderRadius={4} />
        </View>
        <SkeletonLoader width={40} height={20} borderRadius={4} style={{ marginLeft: 8, flexShrink: 0 }} />
      </View>
    ))}
  </View>
);

// Rank Card Skeleton
export const RankCardSkeleton = () => (
  <View style={skeletonStyles.rankCardContainer}>
    {/* Header */}
    <View style={{ marginBottom: 12 }}>
      <SkeletonLoader width="70%" height={20} borderRadius={4} style={{ marginBottom: 8 }} />
      <SkeletonLoader width="85%" height={14} borderRadius={4} style={{ marginBottom: 12 }} />
    </View>
    
    {/* User Info */}
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
      <SkeletonLoader width={28} height={28} borderRadius={14} style={{ marginRight: 8 }} />
      <SkeletonLoader width={100} height={12} borderRadius={4} style={{ marginRight: 8 }} />
      <SkeletonLoader width={60} height={12} borderRadius={4} />
    </View>
    
    {/* Movie Count */}
    <SkeletonLoader width={80} height={12} borderRadius={4} style={{ marginBottom: 8 }} />
    
    {/* Movie Strip */}
    <View style={{ flexDirection: 'row', gap: 12 }}>
      {[1, 2, 3, 4].map((i) => (
        <SkeletonLoader key={i} width={80} height={112} borderRadius={8} />
      ))}
    </View>
  </View>
);

// Search Result Skeleton
export const SearchResultSkeleton = () => (
  <View style={skeletonStyles.searchResultContainer}>
    {[1, 2, 3].map((i) => (
      <View key={i} style={{ flexDirection: 'row', marginBottom: 16, padding: 12, backgroundColor: '#27272a', borderRadius: 12 }}>
        <SkeletonLoader width={60} height={84} borderRadius={8} style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <SkeletonLoader width="90%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
          <SkeletonLoader width="60%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
          <SkeletonLoader width="80%" height={12} borderRadius={4} />
        </View>
      </View>
    ))}
  </View>
);

// Modle Language Card Skeleton
export const ModleLanguageCardSkeleton = () => (
  <View style={skeletonStyles.modleCardContainer}>
    {[1, 2, 3, 4].map((i) => (
      <View key={i} style={{
        backgroundColor: '#1f2937',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#374151',
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <SkeletonLoader width={120} height={20} borderRadius={4} />
          <SkeletonLoader width={32} height={32} borderRadius={16} />
        </View>
        <SkeletonLoader width="70%" height={14} borderRadius={4} />
      </View>
    ))}
  </View>
);

// Rank Detail Page Skeleton
export const RankDetailSkeleton = () => (
  <View style={{ padding: 20 }}>
    {/* Header */}
    <SkeletonLoader width="90%" height={32} borderRadius={8} style={{ marginBottom: 12 }} />
    <SkeletonLoader width="100%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
    <SkeletonLoader width="70%" height={16} borderRadius={4} style={{ marginBottom: 20 }} />
    
    {/* User Info */}
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
      <SkeletonLoader width={36} height={36} borderRadius={18} style={{ marginRight: 12 }} />
      <View>
        <SkeletonLoader width={100} height={14} borderRadius={4} style={{ marginBottom: 4 }} />
        <SkeletonLoader width={60} height={12} borderRadius={4} />
      </View>
    </View>
    
    {/* Action Buttons */}
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
      <SkeletonLoader width={80} height={40} borderRadius={20} />
      <SkeletonLoader width={80} height={40} borderRadius={20} />
    </View>
    
    {/* Movies List */}
    <SkeletonLoader width={150} height={20} borderRadius={4} style={{ marginBottom: 16 }} />
    {[1, 2, 3, 4].map((i) => (
      <View key={i} style={{
        backgroundColor: '#27272a',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
      }}>
        <SkeletonLoader width={36} height={36} borderRadius={18} />
        <SkeletonLoader width={60} height={84} borderRadius={8} />
        <View style={{ flex: 1 }}>
          <SkeletonLoader width="90%" height={16} borderRadius={4} style={{ marginBottom: 8 }} />
          <SkeletonLoader width="40%" height={14} borderRadius={4} />
        </View>
      </View>
    ))}
  </View>
);

const skeletonStyles = StyleSheet.create({
  movieCardContainer: {
    marginRight: 12,
    marginBottom: 12,
    width: 160,
    flexShrink: 0,
  },
  reviewCardContainer: {
    padding: 12,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    marginBottom: 12,
  },
  discussionCardContainer: {
    padding: 12,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    marginBottom: 12,
  },
  messageContainer: {
    marginVertical: 8,
    paddingHorizontal: 12,
  },
  messageMe: {
    alignItems: 'flex-end',
  },
  messageThem: {
    alignItems: 'flex-start',
  },
  profileHeaderContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    width: '100%',
  },
  statsRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
  },
  statContainer: {
    alignItems: 'center',
  },
  conversationContainer: {
    paddingTop: 20,
  },
  rankCardContainer: {
    padding: 20,
    backgroundColor: '#27272a',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  searchResultContainer: {
    paddingHorizontal: 16,
  },
  modleCardContainer: {
    paddingHorizontal: 16,
  },
});
