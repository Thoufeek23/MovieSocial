import React, { useState, useEffect, useCallback, useContext } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity, 
  ImageBackground,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// ✅ CORRECT PATHS for (tabs)/index.jsx (Double dot: ../../)
import { useAuth } from '../../src/context/AuthContext';
import * as api from '../../src/api';
import { ModleContext } from '../../src/context/ModleContext';
import MovieCarousel from '../../src/components/movies/MovieCarousel';
import ReviewCard from '../../src/components/movies/ReviewCard';
import DiscussionCard from '../../src/components/social/DiscussionCard';
import LoadingSpinner from '../../src/components/common/LoadingSpinner';
import EmptyState from '../../src/components/common/EmptyState';

const { width } = Dimensions.get('window');

export default function HomePage() {
  const { user, loading: authLoading } = useAuth(); // Destructure loading as authLoading
  const { gameStatus } = useContext(ModleContext);
  const router = useRouter();
  
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [activeDiscussions, setActiveDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    // ✅ CRITICAL FIX: Do not run API calls if the user is null (fixes 401 error)
    if (!user) return; 

    try {
      const [trendingRes, reviewsRes, discussionsRes] = await Promise.all([
        api.getPopularMovies(),
        api.getRecentReviews(),
        api.fetchDiscussions({ sort: '-createdAt', limit: 5 })
      ]);

      setTrendingMovies(trendingRes.data.results || []);
      setRecentReviews(reviewsRes.data || []);
      
      const discussions = discussionsRes.data || [];
      const discussionsWithPosters = await Promise.all(discussions.map(async (d) => {
        if (d.movieId && !d.poster_path) {
          try {
            const movieRes = await api.getMovieDetails(d.movieId);
            return { ...d, poster_path: movieRes.data.poster_path };
          } catch (e) { return d; }
        }
        return d;
      }));
      
      setActiveDiscussions(discussionsWithPosters);
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    // Only fetch if user is present
    if (user) {
      fetchData();
    }
  }, [fetchData, user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };
  
  // Guard the rendering of the component itself when authentication is loading
  if (authLoading || !user) {
    return (
      <View className="flex-1 bg-zinc-950 items-center justify-center">
        <LoadingSpinner />
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 bg-zinc-950 items-center justify-center pt-[100px]">
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-zinc-950">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 110 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Header */}
        <View className="px-5 mb-6">
          <Text className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">
            {getGreeting()},
          </Text>
          <Text className="text-white text-3xl font-bold">
            {user?.name?.split(' ')[0] || user?.username || 'Guest'}
          </Text>
        </View>

        {/* Modle Teaser Card */}
        <TouchableOpacity 
          activeOpacity={0.9}
          onPress={() => router.push('/modle')}
          className="mx-5 mb-8 rounded-2xl overflow-hidden h-40 relative border border-white/10"
        >
          <ImageBackground
            source={require('../../assets/images/poster3.png')}
            className="flex-1 justify-center px-5"
            resizeMode="cover"
          >
            <View className="absolute inset-0 bg-black/60" />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              className="absolute inset-0"
            />
            <View className="relative z-10 flex-row items-center justify-between">
              <View>
                <Text className="text-emerald-400 font-bold tracking-wider text-xs mb-1">
                  DAILY CHALLENGE
                </Text>
                <Text className="text-white text-2xl font-bold mb-1">
                  Movie Modle
                </Text>
                <Text className="text-gray-300 text-sm">
                  {gameStatus === 'won' 
                    ? 'You solved today\'s puzzle!' 
                    : gameStatus === 'lost' 
                      ? 'Better luck next time!' 
                      : 'Guess the movie from the cast'}
                </Text>
              </View>
              <View className={`w-12 h-12 rounded-full items-center justify-center ${
                gameStatus === 'won' ? 'bg-emerald-500' : 'bg-white/20 backdrop-blur-sm'
              }`}>
                <Ionicons 
                  name={gameStatus === 'won' ? "checkmark" : "play"} 
                  size={24} 
                  color="white" 
                />
              </View>
            </View>
          </ImageBackground>
        </TouchableOpacity>

        {/* Trending Movies */}
        <View className="mb-8">
          <View className="px-5 flex-row items-center justify-between mb-4">
            <Text className="text-white text-lg font-bold">Trending Now</Text>
            <TouchableOpacity onPress={() => router.push('/search')}>
              <Text className="text-emerald-500 text-sm font-medium">See All</Text>
            </TouchableOpacity>
          </View>
          {trendingMovies.length > 0 ? (
            <MovieCarousel movies={trendingMovies} />
          ) : (
            <View className="px-5">
              <LoadingSpinner size="small" />
            </View>
          )}
        </View>

        {/* Recent Reviews */}
        <View className="mb-8 px-5">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-lg font-bold">Recent Reviews</Text>
            <TouchableOpacity onPress={() => router.push('/reviews')}>
              <Text className="text-emerald-500 text-sm font-medium">See All</Text>
            </TouchableOpacity>
          </View>
          
          {recentReviews.length > 0 ? (
            recentReviews.slice(0, 3).map((review) => (
              <ReviewCard key={review._id} review={review} compact />
            ))
          ) : (
            <EmptyState 
              icon="document-text-outline" 
              title="No reviews yet" 
              subtitle="Be the first to review a movie!" 
              compact
            />
          )}
        </View>

        {/* Active Discussions */}
        <View className="px-5 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-lg font-bold">Active Discussions</Text>
            <TouchableOpacity onPress={() => router.push('/discussions')}>
              <Text className="text-emerald-500 text-sm font-medium">See All</Text>
            </TouchableOpacity>
          </View>
          
          {activeDiscussions.length > 0 ? (
            activeDiscussions.map((discussion) => (
              <DiscussionCard key={discussion._id} discussion={discussion} compact />
            ))
          ) : (
             <EmptyState 
              icon="chatbubbles-outline" 
              title="No discussions" 
              subtitle="Start a conversation!" 
              compact
            />
          )}
        </View>

      </ScrollView>
    </View>
  );
}