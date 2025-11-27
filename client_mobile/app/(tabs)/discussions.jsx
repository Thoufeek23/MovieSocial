import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  SafeAreaView, 
  FlatList, 
  RefreshControl,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';

// CHANGED: Corrected import paths to point to src/components/...
import DiscussionCard from '../../src/components/social/DiscussionCard';
import LoadingSpinner from '../../src/components/common/LoadingSpinner';
import EmptyState from '../../src/components/common/EmptyState';

import * as api from '../../src/api';
import { useScrollToTop } from './_layout';

export default function DiscussionsPage() {
  const router = useRouter();
  const flatListRef = useRef(null);
  const { registerScrollRef } = useScrollToTop();
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDiscussions();
  }, []);

  useEffect(() => {
    if (registerScrollRef) {
      registerScrollRef('discussions', flatListRef);
    }
  }, [registerScrollRef]);

  const loadDiscussions = async () => {
    try {
      const response = await api.fetchDiscussions({ sort: '-createdAt' });
      const discussionsData = response.data || [];
      const validDiscussions = discussionsData.filter(discussion => 
        discussion && discussion._id && discussion.starter
      );

      const top = validDiscussions.slice(0, 12);
      const withPosters = await Promise.all(top.map(async discussion => {
        try {
          if (discussion.movieId) {
            const movieResponse = await api.getMovieDetails(discussion.movieId);
            return { 
              ...discussion, 
              poster_path: movieResponse.data.poster_path,
              backdrop_path: movieResponse.data.backdrop_path
            };
          }
          return discussion;
        } catch (e) {
          return discussion;
        }
      }));

      const allDiscussions = withPosters.concat(validDiscussions.slice(12));
      setDiscussions(allDiscussions);
    } catch (error) {
      console.error('Failed to load discussions:', error);
      setDiscussions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDiscussions();
    setRefreshing(false);
  };

  const handleEditDiscussion = (discussion) => {
    router.push(`/edit-discussion/${discussion._id}`);
  };

  const handleDeleteDiscussion = async (discussionId) => {
    Alert.alert(
      'Delete Discussion',
      'Are you sure you want to delete this discussion?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await api.deleteDiscussion(discussionId);
              setDiscussions(prev => prev.filter(d => d._id !== discussionId));
            } catch (error) {
              console.error('Failed to delete discussion:', error);
              Alert.alert('Error', 'Failed to delete discussion');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950 pt-[120px]">
        <LoadingSpinner text="Loading discussions..." animationType="bounce" />
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-zinc-950 pt-[120px]">
      <View className="flex-1">
        {discussions.length > 0 ? (
          <FlatList
            ref={flatListRef}
            data={discussions}
            renderItem={({ item }) => (
              item?._id ? (
                <DiscussionCard 
                  discussion={item} 
                  onEdit={handleEditDiscussion}
                  onDelete={handleDeleteDiscussion}
                />
              ) : null
            )}
            keyExtractor={(item, index) => item?._id || `discussion-${index}`}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 }}
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
            icon="chatbubbles-outline"
            title="No discussions yet"
            subtitle="Be the first to start a movie discussion!"
          />
        )}
      </View>
    </View>
  );
}