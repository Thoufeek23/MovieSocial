import React, { useState, useEffect, useRef } from 'react';
import { View, Text, SafeAreaView, ScrollView, Pressable, TouchableOpacity } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { ModleContext } from '../../src/context/ModleContext';
import { Link } from 'expo-router';
import MovieCarousel from '../../components/MovieCarousel';
import ReviewCard from '../../components/ReviewCard';
import DiscussionCard from '../../components/DiscussionCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import * as api from '../../src/api';
import { useScrollToTop } from './_layout';

export default function HomePage() {
  const { user } = useAuth();
  const { global } = React.useContext(ModleContext);
  const scrollViewRef = useRef(null);
  const { registerScrollRef } = useScrollToTop();
  const [popularMovies, setPopularMovies] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (registerScrollRef) {
      registerScrollRef('index', scrollViewRef);
    }
  }, [registerScrollRef]);
  
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [moviesRes, reviewsRes, discussionsRes] = await Promise.allSettled([
        user ? api.getPersonalizedMovies().catch(() => api.getPopularMovies()) : api.getPopularMovies(),
        user ? api.fetchPersonalizedFeed().catch(() => api.fetchFeed()) : api.fetchFeed(),
        api.fetchDiscussions({ sortBy: 'comments' })
      ]);

      if (moviesRes.status === 'fulfilled') {
        setPopularMovies(moviesRes.value.data.results || []);
      }
      if (reviewsRes.status === 'fulfilled') {
        setRecentReviews(reviewsRes.value.data.slice(0, 5) || []);
      }
      if (discussionsRes.status === 'fulfilled') {
        const discs = discussionsRes.value.data || [];
        const top = discs.slice(0, 12);
        const withPosters = await Promise.all(top.map(async d => {
          try {
            const movieRes = await api.getMovieDetails(d.movieId);
            return { ...d, poster_path: movieRes.data.poster_path };
          } catch (err) {
            return { ...d, poster_path: null };
          }
        }));
        setDiscussions(withPosters.concat(discs.slice(12)));
      }
    } catch (error) {
      console.error('Failed to load home data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950">
        <LoadingSpinner text="Loading your feed..." animationType="float" />
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-zinc-950">
      <ScrollView 
        ref={scrollViewRef} 
        className="flex-1" 
        contentContainerStyle={{ paddingTop: 120, paddingBottom: 120 }} 
        showsVerticalScrollIndicator={false}
      >
        {/* Popular Movies Carousel */}
        <MovieCarousel
          title={user ? "Recommended For You" : "Popular Movies"}
          movies={popularMovies}
          loading={loading}
        />

        {/* Quick Actions */}
        <View className="px-5 mb-6">
          <Text className="text-xl font-semibold text-white mb-4">Quick Actions</Text>
          <View className="flex-row flex-wrap gap-3">
            <Link href="/(tabs)/search" asChild>
              <Pressable className="bg-gray-800 p-4 rounded-xl flex-1 min-w-[140px]">
                <Text className="text-emerald-500 font-semibold text-base mb-1">
                  Explore Movies
                </Text>
                <Text className="text-gray-400 text-xs">Discover new films</Text>
              </Pressable>
            </Link>
            
            <Link href="/(tabs)/discussions" asChild>
              <Pressable className="bg-gray-800 p-4 rounded-xl flex-1 min-w-[140px]">
                <Text className="text-emerald-500 font-semibold text-base mb-1">
                  Join Discussion
                </Text>
                <Text className="text-gray-400 text-xs">Share your thoughts</Text>
              </Pressable>
            </Link>
          </View>
        </View>

        {/* Recent Reviews */}
        <View className="px-5 mb-6">
          <Text className="text-xl font-semibold text-white mb-4">
            Recent Reviews
          </Text>
          {recentReviews.length > 0 ? (
            recentReviews.map((review) => (
              <ReviewCard key={review._id} review={review} />
            ))
          ) : (
            <EmptyState 
              icon="chatbubble-outline"
              title="No reviews yet"
              subtitle="Reviews from the community will appear here"
              style={{ paddingVertical: 32 }}
            />
          )}
        </View>

        {/* Discussions Section */}
        <View className="px-5 mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-semibold text-white">Discussions</Text>
            <Link href="/(tabs)/discussions" asChild>
              <TouchableOpacity>
                <Text className="text-emerald-500 text-sm font-medium">View All</Text>
              </TouchableOpacity>
            </Link>
          </View>
          {discussions.length > 0 ? (
            discussions.slice(0, 6).map((discussion) => (
              <DiscussionCard key={discussion._id} discussion={discussion} />
            ))
          ) : (
            <EmptyState 
              icon="chatbubbles-outline"
              title="No discussions yet"
              subtitle="Start a conversation about your favorite movies"
              style={{ paddingVertical: 32 }}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}