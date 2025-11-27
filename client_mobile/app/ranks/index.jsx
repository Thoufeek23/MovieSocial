import React, { useEffect, useState, useContext, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  RefreshControl, 
  ActivityIndicator,
  Share,
  Alert
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../src/context/AuthContext';
import * as api from '../../src/api';
import Avatar from '../../components/Avatar';
import LoadingSpinner from '../../components/LoadingSpinner';

// Component for individual Rank Card
const RankCard = ({ rank, user, onLike }) => {
  const isLiked = user && rank.likes.includes(user._id || user.id);
  const previewMovies = rank.movies.slice(0, 6);
  const remainingCount = Math.max(0, rank.movies.length - 6);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this ranking list: "${rank.title}" on MovieSocial!`,
        title: rank.title,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View className="bg-gray-900 border border-gray-800 rounded-xl mb-4 overflow-hidden">
      {/* Card Header */}
      <View className="p-4 pb-2">
        <View className="flex-row justify-between items-start mb-2">
          <Link href={`/rank/${rank._id}`} asChild>
            <TouchableOpacity>
              <Text className="text-white font-bold text-lg leading-6 mb-1">{rank.title}</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {rank.description ? (
          <Text className="text-gray-400 text-sm mb-3 line-clamp-2" numberOfLines={2}>
            {rank.description}
          </Text>
        ) : null}

        <View className="flex-row items-center gap-2 mb-3">
          <Avatar user={rank.user} size={24} />
          <Link href={`/profile/${rank.user?.username}`} asChild>
            <TouchableOpacity>
              <Text className="text-gray-300 text-xs font-medium">{rank.user?.username}</Text>
            </TouchableOpacity>
          </Link>
          <Text className="text-gray-600 text-xs">•</Text>
          <Text className="text-gray-500 text-xs">{new Date(rank.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>

      {/* Movie Strip */}
      <View className="pl-4 pb-4">
        <FlatList
          horizontal
          data={previewMovies}
          keyExtractor={(item, index) => item._id || index.toString()}
          showsHorizontalScrollIndicator={false}
          ItemSeparatorComponent={() => <View className="w-2" />}
          renderItem={({ item }) => (
            <Link href={`/movie/${item.movieId}`} asChild>
              <TouchableOpacity className="relative w-20 h-32 bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                <Image
                  source={item.posterPath ? { uri: `https://image.tmdb.org/t/p/w200${item.posterPath}` } : require('../../assets/images/default_dp.png')}
                  className="w-full h-full"
                  resizeMode="cover"
                />
                <View className="absolute top-0 left-0 bg-black/60 px-1.5 py-0.5 rounded-br-lg">
                  <Text className="text-white text-[10px] font-bold">#{item.rank}</Text>
                </View>
              </TouchableOpacity>
            </Link>
          )}
          ListFooterComponent={
            remainingCount > 0 ? (
              <Link href={`/rank/${rank._id}`} asChild>
                <TouchableOpacity className="w-20 h-32 bg-gray-800 rounded-lg border border-gray-700 border-dashed items-center justify-center ml-2 mr-4">
                  <Text className="text-gray-400 text-lg font-bold">+{remainingCount}</Text>
                  <Text className="text-gray-500 text-[10px]">more</Text>
                </TouchableOpacity>
              </Link>
            ) : <View className="w-4" />
          }
        />
      </View>

      {/* Card Footer (Actions) */}
      <View className="flex-row border-t border-gray-800 px-4 py-3 gap-4">
        <TouchableOpacity 
          onPress={() => onLike(rank._id)}
          className={`flex-row items-center gap-1.5 ${isLiked ? 'opacity-100' : 'opacity-70'}`}
        >
          <Ionicons name={isLiked ? "heart" : "heart-outline"} size={20} color={isLiked ? "#ef4444" : "#9ca3af"} />
          <Text className={isLiked ? "text-red-500 font-bold text-xs" : "text-gray-400 text-xs"}>
            {rank.likes.length}
          </Text>
        </TouchableOpacity>

        <Link href={`/rank/${rank._id}`} asChild>
          <TouchableOpacity className="flex-row items-center gap-1.5 opacity-70">
            <Ionicons name="chatbubble-outline" size={19} color="#9ca3af" />
            <Text className="text-gray-400 text-xs">{rank.comments?.length || 0}</Text>
          </TouchableOpacity>
        </Link>

        <TouchableOpacity onPress={handleShare} className="flex-row items-center gap-1.5 opacity-70 ml-auto">
          <Ionicons name="share-social-outline" size={19} color="#9ca3af" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function RanksIndexPage() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  
  const [ranks, setRanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRanks = useCallback(async () => {
    try {
      const { data } = await api.fetchRanks();
      setRanks(data);
    } catch (error) {
      console.error("Failed to load ranks:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRanks();
  }, [loadRanks]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRanks();
  };

  const handleLike = async (rankId) => {
    if (!user) return Alert.alert('Login Required', 'Please login to like this list');

    // Optimistic update
    setRanks(prevRanks => prevRanks.map(rank => {
      if (rank._id === rankId) {
        const userId = user._id || user.id;
        const hasLiked = rank.likes.includes(userId);
        return {
          ...rank,
          likes: hasLiked ? rank.likes.filter(id => id !== userId) : [...rank.likes, userId]
        };
      }
      return rank;
    }));

    try {
      await api.likeRank(rankId);
    } catch (error) {
      console.error(error);
      // Revert if failed (simple reload for now)
      loadRanks(); 
    }
  };

  // Navigate to create rank flow (assuming route exists or alert for now)
  const handleCreateRank = () => {
    if (!user) return router.push('/login');
    // Since we don't have a dedicated create-rank page in the context yet, 
    // we'll assume one might be created or show a placeholder.
    // For now, let's point to a placeholder route or alert.
    Alert.alert('Coming Soon', 'Rank creation is coming soon to mobile!');
    // router.push('/rank/create'); 
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-800">
        <View>
          <Text className="text-white text-2xl font-bold">Community Ranks</Text>
          <Text className="text-gray-400 text-xs">Discover custom lists</Text>
        </View>
        <TouchableOpacity 
          onPress={handleCreateRank}
          className="bg-emerald-600 p-2.5 rounded-full shadow-lg shadow-emerald-900/20"
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <LoadingSpinner />
        </View>
      ) : (
        <FlatList
          data={ranks}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <RankCard rank={item} user={user} onLike={handleLike} />
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
          }
          ListEmptyComponent={
            <View className="items-center py-10">
              <Ionicons name="list" size={48} color="#4b5563" />
              <Text className="text-gray-500 mt-4 text-center">No ranking lists found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}