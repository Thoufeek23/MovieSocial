import React, { useEffect, useState, useContext, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  Image,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../src/context/AuthContext';
import * as api from '../../src/api';

// CHANGED: Corrected import paths to point to src/components/common/...
import Avatar from '../../src/components/common/Avatar';
import LoadingSpinner from '../../src/components/common/LoadingSpinner';

const { width } = Dimensions.get('window');

// Component for individual Rank Card
const RankCard = ({ rank, onPress }) => {
  // Show preview of first few movies in the list
  const previewMovies = rank.movies?.slice(0, 3) || [];
  const remainingCount = Math.max(0, (rank.movies?.length || 0) - 3);

  return (
    <TouchableOpacity 
      onPress={onPress}
      className="bg-gray-900 mb-4 rounded-xl overflow-hidden border border-gray-800"
    >
      <View className="p-4">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 mr-2">
            <Text className="text-white font-bold text-lg mb-1" numberOfLines={1}>
              {rank.title}
            </Text>
            <View className="flex-row items-center">
              <Avatar user={rank.user} size={20} />
              <Text className="text-gray-400 text-xs ml-2">
                {rank.user?.username} • {rank.movies?.length || 0} items
              </Text>
            </View>
          </View>
          
          <View className="flex-row items-center gap-1 bg-gray-800 px-2 py-1 rounded-full">
            <Ionicons name="heart" size={14} color="#ef4444" />
            <Text className="text-gray-300 text-xs font-medium">
              {rank.likes?.length || 0}
            </Text>
          </View>
        </View>

        {rank.description ? (
          <Text className="text-gray-400 text-sm mb-3" numberOfLines={2}>
            {rank.description}
          </Text>
        ) : null}

        {/* Movie Preview Strip */}
        <View className="flex-row gap-2 mt-2">
          {previewMovies.map((movie, index) => (
            <View key={index} className="relative w-16 h-24 bg-gray-800 rounded-lg overflow-hidden">
              <Image 
                source={movie.posterPath ? { uri: `https://image.tmdb.org/t/p/w154${movie.posterPath}` } : require('../../assets/images/poster1.png')}
                className="w-full h-full object-cover"
              />
              <View className="absolute top-1 left-1 bg-black/60 px-1.5 rounded-md">
                <Text className="text-white text-[10px] font-bold">#{index + 1}</Text>
              </View>
            </View>
          ))}
          
          {remainingCount > 0 && (
            <View className="w-16 h-24 bg-gray-800 rounded-lg items-center justify-center border border-gray-700 border-dashed">
              <Text className="text-gray-500 font-bold">+{remainingCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function RanksListPage() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  
  const [ranks, setRanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('popular'); // 'popular' | 'recent' | 'my-lists'

  const loadRanks = useCallback(async () => {
    try {
      let response;
      // You might need to update your API to support sorting/filtering
      // For now fetching all and filtering client-side or assume endpoints exist
      if (activeTab === 'my-lists' && user) {
        response = await api.getUserRanks(user.username);
      } else {
        response = await api.getAllRanks(); // Assuming this endpoint returns lists
      }
      
      let data = response.data || [];
      
      // Client-side sorting for demo if backend doesn't support it yet
      if (activeTab === 'popular') {
        data.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
      } else if (activeTab === 'recent') {
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      setRanks(data);
    } catch (error) {
      console.error("Failed to load ranks:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, user]);

  useEffect(() => {
    loadRanks();
  }, [loadRanks]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRanks();
  };

  const handleCreateRank = () => {
    if (!user) return router.push('/login');
    // Navigate to a create rank page (needs to be created)
    // For now, maybe just show an alert or a modal if you have one
     router.push('/profile?createRank=true'); // Temporary: redirect to profile or create a dedicated route
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white font-bold text-lg">Lists & Rankings</Text>
        <TouchableOpacity onPress={handleCreateRank} className="p-2 -mr-2">
          <Ionicons name="add-circle-outline" size={28} color="#10b981" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View className="flex-row px-4 py-3 gap-2">
        {['popular', 'recent', 'my-lists'].map((tab) => {
          if (tab === 'my-lists' && !user) return null;
          const label = tab === 'my-lists' ? 'My Lists' : tab.charAt(0).toUpperCase() + tab.slice(1);
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity 
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full border ${
                isActive 
                  ? 'bg-emerald-500 border-emerald-500' 
                  : 'bg-transparent border-gray-700'
              }`}
            >
              <Text className={`${isActive ? 'text-white font-bold' : 'text-gray-400'}`}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={ranks}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <RankCard 
              rank={item} 
              onPress={() => router.push(`/rank/${item._id}`)} 
            />
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Ionicons name="list" size={48} color="#374151" />
              <Text className="text-gray-500 mt-4">No lists found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}