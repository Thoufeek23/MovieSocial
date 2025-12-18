import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ChevronLeft, Plus } from 'lucide-react-native';
import DiscussionCard from '../components/DiscussionCard';
import EmptyState from '../components/EmptyState';
import SkeletonLoader from '../components/SkeletonLoader';
import * as api from '../src/api';

export default function DiscussionsListPage() {
  const router = useRouter();
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    loadDiscussions();
  }, [sortBy]);

  const loadDiscussions = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (sortBy === 'recent') {
        params.sortBy = 'createdAt';
      } else if (sortBy === 'popular') {
        params.sortBy = 'comments';
      }

      const res = await api.fetchDiscussions(params);
      const discussionsData = res.data || [];
      
      // Fetch posters for first 12 discussions for better performance
      const top = discussionsData.slice(0, 12);
      const withPosters = await Promise.all(
        top.map(async (d) => {
          try {
            const movieRes = await api.getMovieDetails(d.movieId);
            return { ...d, poster_path: movieRes.data.poster_path };
          } catch (err) {
            return { ...d, poster_path: null };
          }
        })
      );
      
      setDiscussions(withPosters.concat(discussionsData.slice(12)));
    } catch (error) {
      console.error('Error loading discussions:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDiscussions();
    setRefreshing(false);
  };

  const renderDiscussion = ({ item }) => (
    <View style={{ marginBottom: 8, paddingHorizontal: 12 }}>
      <DiscussionCard discussion={item} />
    </View>
  );

  const ListHeaderComponent = () => (
    <View className="bg-background">
      <View className="px-4 pt-2 pb-3">
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-1">
            <Text className="text-white font-bold text-2xl">Discussions</Text>
            <Text className="text-gray-400 text-sm mt-0.5">Join movie conversations</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/create-discussion')}
            className="bg-primary rounded-full p-2.5 shadow-lg"
            activeOpacity={0.8}
          >
            <Plus color="#fff" size={22} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Bar */}
      <View className="flex-row gap-2 px-4 pb-3">
        <TouchableOpacity
          className={`flex-1 py-2 px-4 rounded-lg ${sortBy === 'recent' ? 'bg-primary' : 'bg-card'}`}
          onPress={() => setSortBy('recent')}
          activeOpacity={0.7}
        >
          <Text className={`text-center font-semibold text-sm ${sortBy === 'recent' ? 'text-white' : 'text-gray-400'}`}>
            Recent
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-2 px-4 rounded-lg ${sortBy === 'popular' ? 'bg-primary' : 'bg-card'}`}
          onPress={() => setSortBy('popular')}
          activeOpacity={0.7}
        >
          <Text className={`text-center font-semibold text-sm ${sortBy === 'popular' ? 'text-white' : 'text-gray-400'}`}>
            Popular
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: '#1f2937' },
          headerTintColor: '#fafafa',
          headerTitle: '',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
              <ChevronLeft color="#fafafa" size={28} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView className="flex-1 bg-background">
        {loading ? (
          <>
            <ListHeaderComponent />
            <View className="px-4">
              <SkeletonLoader type="discussion" count={3} />
            </View>
          </>
        ) : discussions.length === 0 ? (
          <>
            <ListHeaderComponent />
            <EmptyState
              icon="book-open"
              title="No Discussions Yet"
              message="Be the first to start a conversation!"
            />
          </>
        ) : (
          <FlatList
            data={discussions}
            renderItem={renderDiscussion}
            keyExtractor={(item) => item._id}
            ListHeaderComponent={ListHeaderComponent}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#10b981"
              />
            }
          />
        )}
      </SafeAreaView>
    </>
  );
}
