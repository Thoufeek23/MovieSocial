import React, { useState, useEffect, useContext, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Alert, 
  Share,
  Linking,
  Platform,
  Dimensions,
  RefreshControl
} from 'react-native';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../../src/context/AuthContext';
import * as api from '../../src/api';
import ReviewCard from '../../components/ReviewCard';
import LoadingSpinner from '../../components/LoadingSpinner';

const { width } = Dimensions.get('window');
const IMG_BASE_URL = 'https://image.tmdb.org/t/p/';

export default function MovieDetailPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user, setUser } = useContext(AuthContext);

  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [movieDiscussions, setMovieDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Check if movie is in watched list
  const isWatched = user?.watched?.some(entry => {
    if (typeof entry === 'string') return entry === id;
    return entry.movieId === id;
  });

  // Check if movie is in watchlist
  const isWatchlisted = user?.watchlist?.some(entry => {
    if (typeof entry === 'string') return entry === id;
    return entry.movieId === id;
  });

  const fetchMovieData = useCallback(async () => {
    try {
      // 1. Fetch Basic Details
      const { data: movieData } = await api.getMovieDetails(id);
      
      // 2. Fetch Reviews & Stats
      const [reviewsRes, statsRes] = await Promise.allSettled([
        api.getReviewsForMovie(id),
        api.getMovieStats(id)
      ]);

      setMovie(movieData);

      if (reviewsRes.status === 'fulfilled') {
        setReviews(reviewsRes.value.data || []);
      } else {
        setReviews([]);
      }

      if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
        const { movieSocialRating, reviewCount } = statsRes.value.data;
        setMovie(m => ({ ...m, movieSocialRating, movieSocialCount: reviewCount }));
      }

      // 3. Fetch Discussions
      const discRes = await api.fetchDiscussions({ movieId: id });
      setMovieDiscussions(discRes.data || []);

    } catch (error) {
      console.error("Failed to fetch movie data", error);
      Alert.alert('Error', 'Could not load movie details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMovieData();
  }, [fetchMovieData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMovieData();
  };

  // --- Actions ---

  const handleToggleWatchlist = async () => {
    if (!user) return router.push('/login');
    try {
      if (isWatchlisted) {
        const { data: updatedWatchlist } = await api.removeFromWatchlist(movie.id);
        setUser({ ...user, watchlist: updatedWatchlist });
      } else {
        const { data: updatedWatchlist } = await api.addToWatchlist(movie.id);
        setUser({ ...user, watchlist: updatedWatchlist });
      }
    } catch (err) {
      Alert.alert('Error', 'Could not update watchlist.');
    }
  };

  const handleToggleWatched = async () => {
    if (!user) return router.push('/login');

    if (isWatched) {
      // Check if user has a review to warn them
      const myReview = reviews.find(r => String(r.user?._id) === String(user.id));
      
      Alert.alert(
        'Remove from Watched?',
        myReview ? 'Removing this will also delete your review. Are you sure?' : 'Remove this movie from your watch history?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Remove', 
            style: 'destructive',
            onPress: async () => {
              try {
                if (myReview) {
                  await api.deleteReview(myReview._id);
                  setReviews(prev => prev.filter(r => r._id !== myReview._id));
                }
                const { data: updatedWatched } = await api.removeFromWatched(movie.id);
                setUser({ ...user, watched: updatedWatched });
              } catch (e) {
                Alert.alert('Error', 'Failed to remove from history.');
              }
            }
          }
        ]
      );
    } else {
      // Mark as watched (default to today)
      try {
        const { data: updatedWatched } = await api.addToWatched(movie.id);
        setUser({ ...user, watched: updatedWatched });
      } catch (e) {
        Alert.alert('Error', 'Failed to mark as watched.');
      }
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out "${movie.title}" on MovieSocial!`,
        title: movie.title,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const openTrailer = () => {
    const trailer = movie.videos?.results?.find(v => v.site === 'YouTube' && v.type === 'Trailer');
    if (trailer) {
      Linking.openURL(`https://www.youtube.com/watch?v=${trailer.key}`);
    } else {
      Alert.alert('No Trailer', 'Could not find a trailer for this movie.');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!movie) return <View className="flex-1 bg-zinc-950 justify-center items-center"><Text className="text-white">Movie not found</Text></View>;

  return (
    <View className="flex-1 bg-zinc-950">
      <ScrollView 
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
      >
        {/* Backdrop Header */}
        <View className="relative w-full h-72">
          <Image 
            source={{ uri: `${IMG_BASE_URL}original${movie.backdrop_path}` }} 
            className="w-full h-full"
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(9, 9, 11, 0.9)', '#09090b']}
            className="absolute inset-0"
          />
          
          {/* Header Actions */}
          <SafeAreaView className="absolute top-0 w-full flex-row justify-between px-4">
            <TouchableOpacity onPress={() => router.back()} className="p-2 bg-black/30 rounded-full">
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} className="p-2 bg-black/30 rounded-full">
              <Ionicons name="share-social-outline" size={24} color="white" />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        {/* Movie Content */}
        <View className="px-5 -mt-20 pb-20">
          <View className="flex-row gap-4 mb-6">
            {/* Poster */}
            <Image 
              source={{ uri: `${IMG_BASE_URL}w500${movie.poster_path}` }} 
              className="w-32 h-48 rounded-xl shadow-lg border border-white/10"
              resizeMode="cover"
            />
            
            {/* Title & Metadata */}
            <View className="flex-1 justify-end pb-2">
              <Text className="text-3xl font-bold text-white leading-tight mb-1">
                {movie.title}
              </Text>
              <Text className="text-gray-400 text-base font-medium mb-3">
                {movie.release_date?.substring(0, 4)} • {movie.runtime} min
              </Text>
              
              {/* Ratings */}
              <View className="flex-row gap-2 flex-wrap">
                {movie.vote_average > 0 && (
                  <View className="bg-yellow-500/20 px-2 py-1 rounded-lg border border-yellow-500/30">
                    <Text className="text-yellow-500 font-bold text-xs">
                      ★ {movie.vote_average.toFixed(1)} TMDb
                    </Text>
                  </View>
                )}
                {movie.movieSocialRating && (
                  <View className="bg-emerald-500/20 px-2 py-1 rounded-lg border border-emerald-500/30">
                    <Text className="text-emerald-500 font-bold text-xs">
                      MS {Number(movie.movieSocialRating).toFixed(1)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          {user && (
            <View className="flex-row gap-3 mb-8 overflow-hidden">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-3">
                {/* Watched Button */}
                <TouchableOpacity 
                  onPress={handleToggleWatched}
                  className={`flex-row items-center px-4 py-3 rounded-xl gap-2 ${isWatched ? 'bg-emerald-500' : 'bg-gray-800'}`}
                >
                  <Ionicons name={isWatched ? "eye" : "eye-outline"} size={20} color="white" />
                  <Text className="text-white font-semibold">
                    {isWatched ? 'Watched' : 'Watch'}
                  </Text>
                </TouchableOpacity>

                {/* Watchlist Button */}
                <TouchableOpacity 
                  onPress={handleToggleWatchlist}
                  className={`flex-row items-center px-4 py-3 rounded-xl gap-2 ${isWatchlisted ? 'bg-blue-600' : 'bg-gray-800'}`}
                >
                  <Ionicons name={isWatchlisted ? "bookmark" : "bookmark-outline"} size={20} color="white" />
                  <Text className="text-white font-semibold">Watchlist</Text>
                </TouchableOpacity>

                {/* Add Review Button */}
                <TouchableOpacity 
                  onPress={() => router.push({ pathname: '/create-review', params: { movieId: movie.id, movieTitle: movie.title, moviePoster: movie.poster_path } })}
                  className="flex-row items-center px-4 py-3 rounded-xl gap-2 bg-gray-800"
                >
                  <Ionicons name="star-outline" size={20} color="white" />
                  <Text className="text-white font-semibold">Review</Text>
                </TouchableOpacity>

                {/* Discuss Button */}
                <TouchableOpacity 
                  onPress={() => router.push({ pathname: '/create-discussion', params: { movieId: movie.id, movieTitle: movie.title } })}
                  className="flex-row items-center px-4 py-3 rounded-xl gap-2 bg-gray-800"
                >
                  <Ionicons name="chatbubbles-outline" size={20} color="white" />
                  <Text className="text-white font-semibold">Discuss</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          {/* Overview */}
          <View className="mb-8">
            <Text className="text-xl font-bold text-white mb-3">Overview</Text>
            <Text className="text-gray-300 leading-6 text-base">
              {movie.overview}
            </Text>
            
            {movie.videos?.results?.length > 0 && (
              <TouchableOpacity onPress={openTrailer} className="mt-4 flex-row items-center">
                <Ionicons name="play-circle-outline" size={20} color="#10b981" />
                <Text className="text-emerald-500 font-semibold ml-2">Watch Trailer</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Reviews Section */}
          <View className="mb-8">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-white">
                Reviews <Text className="text-gray-500 text-base font-normal">({reviews.length})</Text>
              </Text>
              {reviews.length > 0 && (
                <TouchableOpacity onPress={() => router.push({ pathname: '/(tabs)/reviews', params: { movieId: movie.id } })}>
                  <Text className="text-emerald-500 font-medium">View All</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {reviews.length > 0 ? (
              <View className="gap-4">
                {reviews.slice(0, 3).map(review => (
                  <ReviewCard 
                    key={review._id} 
                    review={review} 
                    onEdit={(r) => router.push({ pathname: '/create-review', params: { editReviewId: r._id, movieId: movie.id, movieTitle: movie.title, moviePoster: movie.poster_path, initialContent: r.content, initialRating: r.rating } })}
                    onDelete={async (id) => {
                      try {
                        await api.deleteReview(id);
                        setReviews(prev => prev.filter(r => r._id !== id));
                      } catch(e) { Alert.alert('Error', 'Failed to delete'); }
                    }}
                  />
                ))}
              </View>
            ) : (
              <View className="bg-gray-900/50 p-6 rounded-xl items-center border border-gray-800 border-dashed">
                <Text className="text-gray-500 mb-3">No reviews yet</Text>
                <TouchableOpacity onPress={() => router.push({ pathname: '/create-review', params: { movieId: movie.id, movieTitle: movie.title, moviePoster: movie.poster_path } })}>
                  <Text className="text-emerald-500 font-semibold">Be the first to review</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Discussions Section */}
          <View className="mb-8">
            <Text className="text-xl font-bold text-white mb-4">
              Discussions <Text className="text-gray-500 text-base font-normal">({movieDiscussions.length})</Text>
            </Text>
            
            {movieDiscussions.length > 0 ? (
              <View className="gap-4">
                {movieDiscussions.map(disc => (
                  <Link href={`/discussion/${disc._id}`} key={disc._id} asChild>
                    <TouchableOpacity className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex-row gap-4">
                      <View className="flex-1">
                        <Text className="text-white font-bold text-lg mb-1" numberOfLines={2}>
                          {disc.title}
                        </Text>
                        <Text className="text-gray-400 text-xs">
                          Started by {disc.starter?.username || 'User'} • {disc.comments?.length || 0} comments
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#4b5563" style={{ alignSelf: 'center' }} />
                    </TouchableOpacity>
                  </Link>
                ))}
              </View>
            ) : (
              <View className="bg-gray-900/50 p-6 rounded-xl items-center border border-gray-800 border-dashed">
                <Text className="text-gray-500 mb-3">No discussions started</Text>
                <TouchableOpacity onPress={() => router.push({ pathname: '/create-discussion', params: { movieId: movie.id, movieTitle: movie.title } })}>
                  <Text className="text-emerald-500 font-semibold">Start a discussion</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

        </View>
      </ScrollView>
    </View>
  );
}