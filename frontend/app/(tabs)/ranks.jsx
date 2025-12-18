import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  FlatList, 
  RefreshControl,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import RankCard from '../../components/RankCard';
import EmptyState from '../../components/EmptyState';
import SkeletonLoader, { RankCardSkeleton } from '../../components/SkeletonLoader';
import { useAuth } from '../../src/context/AuthContext';
import * as api from '../../src/api';
import { useScrollToTop } from './_layout';

export default function RanksPage() {
  const router = useRouter();
  const { user } = useAuth();
  const flatListRef = useRef(null);
  const { registerScrollRef } = useScrollToTop();
  const [ranks, setRanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRanks();
  }, []);

  // Register scroll ref for tab navigation
  useEffect(() => {
    if (registerScrollRef) {
      registerScrollRef('ranks', flatListRef);
    }
  }, [registerScrollRef]);

  const loadRanks = async () => {
    try {
      setLoading(true);
      const response = await api.fetchRanks();
      setRanks(response.data || []);
    } catch (error) {
      console.error('Failed to load ranks:', error);
      setRanks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRanks();
    setRefreshing(false);
  };

  const handleLike = async (rankId) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to like this ranking');
      return;
    }

    // Optimistic update
    const originalRanks = [...ranks];
    setRanks(prevRanks => prevRanks.map(rank => {
      if (rank._id === rankId) {
        const userId = user._id || user.id;
        const hasLiked = rank.likes.includes(userId);
        return {
          ...rank,
          likes: hasLiked 
            ? rank.likes.filter(id => id !== userId) 
            : [...rank.likes, userId]
        };
      }
      return rank;
    }));

    try {
      await api.likeRank(rankId);
    } catch (error) {
      console.error('Failed to like rank:', error);
      Alert.alert('Error', 'Failed to like ranking');
      // Revert on error
      setRanks(originalRanks);
    }
  };

  const renderRank = ({ item, index }) => (
    <View style={{ paddingHorizontal: 16, marginTop: index === 0 ? 16 : 0 }}>
      <RankCard rank={item} onLike={handleLike} />
    </View>
  );

  const renderEmpty = () => (
    <EmptyState
      icon="trophy"
      title="No Rankings Yet"
      message="Be the first to create a movie ranking list!"
    />
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#18181b', paddingTop: 100 }}>
        <ScrollView
          contentContainerStyle={{ paddingTop: 0, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Title Skeleton */}
          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
            <SkeletonLoader width={180} height={24} borderRadius={6} style={{ marginBottom: 8 }} />
            <SkeletonLoader width={250} height={14} borderRadius={4} />
          </View>
          
          {/* Rank Cards Skeleton */}
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            {[1, 2, 3, 4].map(i => (
              <RankCardSkeleton key={i} />
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#18181b', paddingTop: 100 }}>
      <FlatList
        ref={flatListRef}
        data={ranks}
        renderItem={renderRank}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingTop: 0, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#10b981"
          />
        }
      />
    </View>
  );
}
