import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  ScrollView
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ChevronLeft, Heart, User, Trophy, Plus, MessageCircle, Share2, Calendar } from 'lucide-react-native';
import { useAuth } from '../src/context/AuthContext';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import SkeletonLoader from '../components/SkeletonLoader';
import * as api from '../src/api';

export default function RanksListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [ranks, setRanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRanks();
  }, []);

  const loadRanks = async () => {
    try {
      setLoading(true);
      const res = await api.fetchRanks();
      setRanks(res.data || []);
    } catch (error) {
      console.error('Error loading ranks:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRanks();
    setRefreshing(false);
  };

  const handleLike = async (rankId) => {
    try {
      await api.likeRank(rankId);
      // Refresh the list to get updated likes
      await loadRanks();
    } catch (error) {
      console.error('Error liking rank:', error);
    }
  };

  const renderRankItem = ({ item }) => {
    const userHasLiked = user && item.likes?.includes(user._id || user.id);
    
    return (
      <View className="bg-card mx-3 mb-3 rounded-2xl border border-white/5 overflow-hidden">
        {/* Header Section */}
        <View className="p-5">
          <View className="flex-row items-start justify-between mb-3">
            <TouchableOpacity 
              className="flex-1 pr-2"
              onPress={() => router.push(`/rank/${item._id}`)}
              activeOpacity={0.7}
            >
              <Text className="text-white font-bold text-xl mb-2">
                {item.title}
              </Text>
            </TouchableOpacity>
            
            {/* Action Buttons */}
            <View className="flex-row items-center gap-1">
              {/* Like Button */}
              <TouchableOpacity
                className={`flex-row items-center px-3 py-1.5 rounded-full ${
                  userHasLiked ? 'bg-red-500/10' : 'bg-white/5'
                }`}
                onPress={() => handleLike(item._id)}
                activeOpacity={0.7}
              >
                <Heart
                  color={userHasLiked ? '#ef4444' : '#9ca3af'}
                  fill={userHasLiked ? '#ef4444' : 'none'}
                  size={16}
                />
                <Text className={`ml-1.5 text-sm font-medium ${
                  userHasLiked ? 'text-red-500' : 'text-gray-400'
                }`}>
                  {item.likes?.length || 0}
                </Text>
              </TouchableOpacity>

              {/* Comment Count */}
              <TouchableOpacity
                className="flex-row items-center px-3 py-1.5 rounded-full bg-white/5"
                onPress={() => router.push(`/rank/${item._id}`)}
                activeOpacity={0.7}
              >
                <MessageCircle color="#9ca3af" size={16} />
                <Text className="ml-1.5 text-sm font-medium text-gray-400">
                  {item.comments?.length || 0}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          {item.description && (
            <Text className="text-gray-400 text-sm mb-4 leading-5" numberOfLines={2}>
              {item.description}
            </Text>
          )}

          {/* User Info */}
          <TouchableOpacity
            className="flex-row items-center mb-4"
            onPress={() => router.push(`/profile/${item.user?.username}`)}
            activeOpacity={0.7}
          >
            <Avatar user={item.user} size={28} />
            <Text className="text-gray-300 font-medium text-sm ml-2">
              {item.user?.username || 'Unknown'}
            </Text>
            <Text className="text-gray-600 text-xs mx-1.5">•</Text>
            <Text className="text-gray-500 text-xs">
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </TouchableOpacity>

          {/* Movie Strip Preview */}
          <View className="flex-row items-center mb-2">
            <Text className="text-gray-500 text-xs uppercase tracking-wide font-semibold">
              {item.movies?.length || 0} Movies
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
            {item.movies?.slice(0, 6).map((movie, index) => (
              <TouchableOpacity
                key={`${item._id}-${index}`}
                className="mr-3 first:ml-0"
                onPress={() => router.push(`/movie/${movie.movieId || movie.id}`)}
                activeOpacity={0.8}
              >
                <View className="relative">
                  <Image
                    source={{ 
                      uri: movie.posterPath || movie.poster_path
                        ? `https://image.tmdb.org/t/p/w200${movie.posterPath || movie.poster_path}`
                        : 'https://via.placeholder.com/200x300/374151/9ca3af?text=No+Image'
                    }}
                    className="w-20 h-28 rounded-lg bg-gray-800"
                    resizeMode="cover"
                  />
                  {/* Rank Badge */}
                  <View className="absolute -top-1 -left-1 bg-black/80 backdrop-blur rounded-br-lg px-2 py-0.5">
                    <Text className="text-white font-bold text-xs">
                      #{movie.rank || index + 1}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            {item.movies?.length > 6 && (
              <TouchableOpacity
                className="w-20 h-28 bg-card border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center"
                onPress={() => router.push(`/rank/${item._id}`)}
                activeOpacity={0.7}
              >
                <Text className="text-gray-400 font-bold text-lg">+{item.movies.length - 6}</Text>
                <Text className="text-gray-500 text-xs">more</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    );
  };

  const ListHeaderComponent = () => (
    <View className="bg-background">
      <View className="px-4 pt-2 pb-4">
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <Text className="text-white font-bold text-2xl">Community Ranks</Text>
            <Text className="text-gray-400 text-sm mt-0.5">Discover and create custom movie lists</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              // TODO: Navigate to create rank page when implemented
              console.log('Create rank - to be implemented');
            }}
            className="bg-primary rounded-full p-2.5 shadow-lg ml-2"
            activeOpacity={0.8}
          >
            <Plus color="#fff" size={22} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderSkeletonItem = () => (
    <View className="bg-card mx-3 mb-3 rounded-2xl p-5 border border-white/5">
      <View className="bg-gray-700 h-6 w-3/4 rounded mb-3" />
      <View className="bg-gray-700 h-4 w-1/2 rounded mb-4" />
      <View className="flex-row gap-3">
        {[1, 2, 3, 4].map(i => (
          <View key={i} className="bg-gray-700 w-20 h-28 rounded-lg" />
        ))}
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
            {[1, 2, 3].map(i => (
              <View key={i}>{renderSkeletonItem()}</View>
            ))}
          </>
        ) : ranks.length === 0 ? (
          <>
            <ListHeaderComponent />
            <EmptyState
              icon="trophy"
              title="No Rankings Yet"
              message="Create the first movie ranking list!"
            />
          </>
        ) : (
          <FlatList
            data={ranks}
            renderItem={renderRankItem}
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
