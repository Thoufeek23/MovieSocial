import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, Image, TouchableOpacity, Pressable } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { ModleContext } from '../../src/context/ModleContext';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MovieCarousel from '../../components/MovieCarousel';
import ReviewCard from '../../components/ReviewCard';
import DiscussionCard from '../../components/DiscussionCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import * as api from '../../src/api';

export default function HomePage() {
  const { user, logout } = useAuth();
  const { global } = React.useContext(ModleContext);
  const router = useRouter();
  const [popularMovies, setPopularMovies] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [navbarStreak, setNavbarStreak] = useState(0);

  // Update streak from global context
  useEffect(() => {
    if (global && typeof global.streak === 'number') {
      setNavbarStreak(global.streak || 0);
    }
  }, [global]);
  
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [moviesRes, reviewsRes, discussionsRes] = await Promise.allSettled([
        user ? api.getPersonalizedMovies().catch(() => api.getPopularMovies()) : api.getPopularMovies(),
        api.fetchFeed(),
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
        // Fetch posters for top discussions (limit to avoid too many API calls)
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
  
  const handleLogout = async () => {
    try {
      await logout();
      await new Promise((res) => setTimeout(res, 200));
      router.replace('/login');
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#09090b' }}>
        <LoadingSpinner text="Loading your feed..." animationType="float" />
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#09090b' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 120 }}>

        {/* Welcome Section 
        <View style={{ paddingHorizontal: 20, paddingVertical: 24 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 8 }}>
            Welcome back, {user?.username}!
          </Text>
          <Text style={{ fontSize: 16, color: '#d1d5db' }}>
            Discover, discuss, and decide on your favorite movies.
          </Text>
        </View>*/}

        {/* Popular Movies Carousel */}
        <MovieCarousel
          title={user ? "Recommended For You" : "Popular Movies"}
          movies={popularMovies}
          loading={loading}
        />

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: '600', color: 'white', marginBottom: 16 }}>Quick Actions</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <Link href="/(tabs)/search" asChild>
              <Pressable style={{ 
                backgroundColor: '#1f2937', 
                padding: 16, 
                borderRadius: 12, 
                flex: 1, 
                minWidth: 140 
              }}>
                <Text style={{ color: '#10b981', fontWeight: '600', fontSize: 16, marginBottom: 4 }}>
                  Explore Movies
                </Text>
                <Text style={{ color: '#9ca3af', fontSize: 12 }}>Discover new films</Text>
              </Pressable>
            </Link>
            
            <Link href="/(tabs)/discussions" asChild>
              <Pressable style={{ 
                backgroundColor: '#1f2937', 
                padding: 16, 
                borderRadius: 12, 
                flex: 1, 
                minWidth: 140 
              }}>
                <Text style={{ color: '#10b981', fontWeight: '600', fontSize: 16, marginBottom: 4 }}>
                  Join Discussion
                </Text>
                <Text style={{ color: '#9ca3af', fontSize: 12 }}>Share your thoughts</Text>
              </Pressable>
            </Link>
          </View>
        </View>

        {/* Recent Reviews */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: '600', color: 'white', marginBottom: 16 }}>
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
        <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 20, fontWeight: '600', color: 'white' }}>Discussions</Text>
            <Link href="/(tabs)/discussions" asChild>
              <TouchableOpacity>
                <Text style={{ color: '#10b981', fontSize: 14, fontWeight: '500' }}>View All</Text>
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