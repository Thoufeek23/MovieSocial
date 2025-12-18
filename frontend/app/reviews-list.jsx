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
import { useAuth } from '../src/context/AuthContext';
import ReviewCard from '../components/ReviewCard';
import EmptyState from '../components/EmptyState';
import { ReviewCardSkeleton } from '../components/SkeletonLoader';
import * as api from '../src/api';

export default function ReviewsListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState(user ? 'personalized' : 'all');

  useEffect(() => {
    loadReviews();
  }, [filter, user]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      let res;
      
      if (filter === 'personalized' && user) {
        res = await api.fetchPersonalizedFeed().catch(() => api.fetchFeed());
      } else if (filter === 'mine' && user) {
        res = await api.fetchMyReviews();
      } else {
        res = await api.fetchFeed();
      }
      
      const reviewsData = res.data || [];
      // Filter out reviews with null user
      const validReviews = reviewsData.filter(r => r && r.user);
      setReviews(validReviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
      // Fallback to regular feed if anything fails
      try {
        const res = await api.fetchFeed();
        const validReviews = (res.data || []).filter(r => r && r.user);
        setReviews(validReviews);
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReviews();
    setRefreshing(false);
  };

  const renderReview = ({ item }) => (
    <View style={{ marginBottom: 12, paddingHorizontal: 12 }}>
      <ReviewCard
        review={item}
        onMoviePress={(movieId) => router.push(`/movie/${movieId}`)}
      />
    </View>
  );

  const ListHeaderComponent = () => (
    <View className="bg-background">
      <View className="px-4 pt-2 pb-3">
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-1">
            <Text className="text-white font-bold text-2xl">
              {filter === 'personalized' && user ? 'Reviews For You' : filter === 'mine' ? 'My Reviews' : 'Latest Reviews'}
            </Text>
            <Text className="text-gray-400 text-sm mt-0.5">
              {filter === 'mine' ? 'Your movie critiques' : 'Community reviews and ratings'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/create-review')}
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
          className={`py-2 px-4 rounded-lg ${filter === 'all' ? 'bg-primary' : 'bg-card'}`}
          onPress={() => setFilter('all')}
          activeOpacity={0.7}
        >
          <Text className={`text-center font-semibold text-sm ${filter === 'all' ? 'text-white' : 'text-gray-400'}`}>
            All
          </Text>
        </TouchableOpacity>
        {user && (
          <>
            <TouchableOpacity
              className={`py-2 px-4 rounded-lg ${filter === 'personalized' ? 'bg-primary' : 'bg-card'}`}
              onPress={() => setFilter('personalized')}
              activeOpacity={0.7}
            >
              <Text className={`text-center font-semibold text-sm ${filter === 'personalized' ? 'text-white' : 'text-gray-400'}`}>
                For You
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`py-2 px-4 rounded-lg ${filter === 'mine' ? 'bg-primary' : 'bg-card'}`}
              onPress={() => setFilter('mine')}
              activeOpacity={0.7}
            >
              <Text className={`text-center font-semibold text-sm ${filter === 'mine' ? 'text-white' : 'text-gray-400'}`}>
                Mine
              </Text>
            </TouchableOpacity>
          </>
        )}
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
              <ReviewCardSkeleton count={3} />
            </View>
          </>
        ) : reviews.length === 0 ? (
          <>
            <ListHeaderComponent />
            <EmptyState
              icon="file-text"
              title="No Reviews Yet"
              message={filter === 'mine' ? "You haven't written any reviews yet!" : "No reviews available"}
            />
          </>
        ) : (
          <FlatList
            data={reviews}
            renderItem={renderReview}
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
