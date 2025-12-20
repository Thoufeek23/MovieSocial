import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text,
  ScrollView, 
  StyleSheet, 
  Alert, 
  RefreshControl,
  TouchableOpacity,
  Image
} from 'react-native';
import { useLocalSearchParams, useRouter, usePathname } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Search, BookOpen, Puzzle, FileText, MessageSquare, Star, Calendar, Bookmark, List } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import * as api from '../../src/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import CustomHeader from '../../components/CustomHeader';
import ProfileHeader from '../../components/ProfileHeader';
import MovieListSection from '../../components/MovieListSection';
import DiscussionListSection from '../../components/DiscussionListSection';
import ReviewCard from '../../components/ReviewCard';
import ProfileReviewCard from '../../components/ProfileReviewCard';
import EditProfileModal from '../../components/EditProfileModal';
import FollowListModal from '../../components/FollowListModal';
import SkeletonLoader, { ProfileHeaderSkeleton } from '../../components/SkeletonLoader';
import MSLogoModal from '../../components/MSLogoModal';
import LetterboxdImportModal from '../../components/LetterboxdImportModal';

// Bottom navigation component matching the tabs layout with MS logo
const StandardBottomNavigation = ({ currentUser }) => {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  const tabs = [
    { name: 'index', icon: Home, route: '/(tabs)/', title: 'Home' },
    { name: 'search', icon: Search, route: '/(tabs)/search', title: 'Search' },
    { name: 'ms-menu', icon: null, route: null, title: 'Menu', isLogo: true },
    { name: 'modle', icon: Puzzle, route: '/(tabs)/modle', title: 'Modle' },
    { name: 'messages', icon: MessageSquare, route: '/(tabs)/messages', title: 'Messages' },
  ];

  return (
    <>
      <View style={[styles.bottomNavigation, { bottom: Math.max(20, insets.bottom + 10) }]}>
        {tabs.map((tab) => {
          const isActive = pathname === tab.route || (tab.name === 'index' && pathname === '/(tabs)/');
          const IconComponent = tab.icon;
          
          // MS Logo Button
          if (tab.isLogo) {
            return (
              <TouchableOpacity
                key={tab.name}
                style={styles.tabItem}
                onPress={() => setIsModalVisible(true)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.tabIconContainer,
                  { width: 50, height: 40, backgroundColor: 'rgba(16, 185, 129, 0.15)' }
                ]}>
                  <Image 
                    source={require('../../assets/images/MS_logo.png')} 
                    style={{ width: 36, height: 36 }}
                    resizeMode="contain"
                  />
                </View>
              </TouchableOpacity>
            );
          }
          
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabItem}
              onPress={() => {
                router.push(tab.route);
              }}
              activeOpacity={0.7}
            >
              <View style={[
                styles.tabIconContainer,
                isActive && styles.tabIconContainerActive
              ]}>
                <IconComponent
                  color={isActive ? '#10b981' : '#6b7280'}
                  size={isActive ? 26 : 24}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      
      {/* MS Logo Modal */}
      <MSLogoModal 
        visible={isModalVisible} 
        onClose={() => setIsModalVisible(false)} 
      />
    </>
  );
};

const ProfilePage = () => {
  const { username } = useLocalSearchParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  
  // Profile state
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  
  // Content state
  const [userReviews, setUserReviews] = useState([]);
  const [timelineMovies, setTimelineMovies] = useState([]);
  const [watchedMovies, setWatchedMovies] = useState([]);
  const [watchlistMovies, setWatchlistMovies] = useState([]);
  const [userDiscussions, setUserDiscussions] = useState([]);
  const [bookmarkedDiscussions, setBookmarkedDiscussions] = useState([]);
  
  // Modal state
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [followListOpen, setFollowListOpen] = useState(false);
  const [followListTitle, setFollowListTitle] = useState('');
  const [followListUsers, setFollowListUsers] = useState([]);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const isOwnProfile = currentUser && profile && currentUser.username === profile.username;

  // Fetch profile data
  const fetchProfile = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) setRefreshing(true);
      else setLoading(true);
      
      // Validate username parameter
      if (!username || typeof username !== 'string') {
        throw new Error('Invalid username parameter');
      }

      const { data } = await api.getUserProfile(username);
      setProfile(data);
      setIsFollowing(!!data.isFollowedByCurrentUser);

      // 1. Fetch Reviews
      try {
        const reviewsRes = await api.getReviewsByUser(username);
        const sortedReviews = (reviewsRes.data || []).sort((a, b) => {
          const votesA = a.agreementVotes ? a.agreementVotes.length : 0;
          const votesB = b.agreementVotes ? b.agreementVotes.length : 0;
          return votesB - votesA;
        });
        setUserReviews(sortedReviews);
      } catch (err) {
        console.error('Failed to load reviews', err);
        setUserReviews([]);
      }

      // 2. Timeline - Fetch ALL watched entries with dates (including rewatches)
      try {
        const normalizedWatched = (data.watched || []).map(entry => {
          if (typeof entry === 'string') return { movieId: entry, watchedAt: null };
          return entry;
        });
        
        const watchedDetailsForTimeline = normalizedWatched.length > 0 ? await Promise.all(
          normalizedWatched.map(e => api.getMovieDetails(e.movieId))
        ) : [];
        
        const fullWatchedList = watchedDetailsForTimeline.map((res, i) => ({
          ...res.data,
          watchedAt: normalizedWatched[i].watchedAt
        }));
        
        // Sort timeline by date (most recent first)
        const sortedTimeline = [...fullWatchedList].sort((a, b) => {
          const dateA = a.watchedAt ? new Date(a.watchedAt) : new Date(0);
          const dateB = b.watchedAt ? new Date(b.watchedAt) : new Date(0);
          return dateB - dateA;
        });
        setTimelineMovies(sortedTimeline);
      } catch (err) {
        console.error('Failed to load timeline', err);
        setTimelineMovies([]);
      }

      // 3. Unique Watched Movies (for count display)
      try {
        const watchedIds = (data.watched || []).map(entry => 
          typeof entry === 'string' ? entry : entry.movieId
        ).filter(id => id);
        
        // Get unique movie IDs only (to handle rewatches)
        const uniqueWatchedIds = [...new Set(watchedIds)];
        
        const uniqueWatchedDetails = uniqueWatchedIds.length > 0 ? await Promise.all(
          uniqueWatchedIds.map(id => api.getMovieDetails(id))
        ) : [];
        
        setWatchedMovies(uniqueWatchedDetails.map(res => res.data));
      } catch (err) {
        console.error('Failed to load watched movies', err);
        setWatchedMovies([]);
      }

      // 4. Watchlist
      try {
        const watchlistIds = (data.watchlist || []).filter(id => id);
        
        const watchlistDetails = watchlistIds.length > 0 ? await Promise.all(
          watchlistIds.map(id => api.getMovieDetails(id))
        ) : [];
        
        setWatchlistMovies(watchlistDetails.map(res => res.data));
      } catch (err) {
        console.error('Failed to load watchlist', err);
        setWatchlistMovies([]);
      }

      // 5. Fetch user discussions
      try {
        const discRes = await api.fetchDiscussionsByUser(username);
        const withPosters = await Promise.all(
          discRes.data.map(async (d) => {
            if (d && !d.poster_path && d.movieId) {
              try {
                const m = await api.getMovieDetails(d.movieId);
                d.poster_path = m.data.poster_path;
              } catch (e) {
                console.error('Failed to fetch movie poster:', e);
              }
            }
            return d;
          })
        );
        setUserDiscussions(withPosters);
      } catch (err) {
        console.error('Failed to load user discussions', err);
        setUserDiscussions([]);
      }

      // Fetch bookmarked discussions (only for own profile)
      if (currentUser && currentUser.username === username) {
        try {
          // Note: AsyncStorage bookmarks would need to be implemented in mobile
          // For now, we'll leave this empty - can be implemented later
          setBookmarkedDiscussions([]);
        } catch (err) {
          console.error('Failed to load bookmarked discussions', err);
          setBookmarkedDiscussions([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (username && typeof username === 'string' && username.trim()) {
      fetchProfile();
    }
  }, [username, currentUser]);

  // Follow/unfollow handler
  const handleFollowToggle = async () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    
    try {
      if (isFollowing) {
        await api.unfollowUser(profile.username);
        setIsFollowing(false);
        Alert.alert('Success', 'Unfollowed user');
      } else {
        await api.followUser(profile.username);
        setIsFollowing(true);
        Alert.alert('Success', 'Following user');
      }
      
      // Refresh profile to update follower count
      const { data } = await api.getUserProfile(profile.username);
      setProfile(data);
    } catch (err) {
      console.error('Follow toggle failed:', err);
      Alert.alert('Error', isFollowing ? 'Failed to unfollow' : 'Failed to follow');
    }
  };

  // Remove from watched handler
  const handleRemoveFromWatched = async (movie) => {
    if (!currentUser || currentUser.username !== profile.username) return;
    
    try {
      // Check if user has a review for this movie
      const { data: movieReviews } = await api.getReviewsForMovie(movie.id);
      const userReview = movieReviews.find(r => 
        String(r.user._id) === String(currentUser.id) || 
        String(r.user._id) === String(currentUser._id)
      );

      if (userReview) {
        Alert.alert(
          'Confirm Removal',
          'This will also delete your review for this movie. Continue?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Continue',
              style: 'destructive',
              onPress: async () => {
                try {
                  await api.deleteReview(userReview._id);
                  await api.removeFromWatched(movie.id);
                  setWatchedMovies(current => current.filter(m => m.id !== movie.id));
                  Alert.alert('Success', `${movie.title} removed`);
                } catch (err) {
                  Alert.alert('Error', 'Failed to remove movie');
                }
              }
            }
          ]
        );
        return;
      }

      await api.removeFromWatched(movie.id);
      setWatchedMovies(current => current.filter(m => m.id !== movie.id));
      Alert.alert('Success', `${movie.title} removed`);
    } catch (err) {
      console.error('Remove from watched failed:', err);
      Alert.alert('Error', 'Failed to remove movie');
    }
  };

  // Delete discussion handler
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
              setUserDiscussions(current => current.filter(d => d._id !== discussionId));
              Alert.alert('Success', 'Discussion deleted');
            } catch (err) {
              console.error('Delete discussion failed:', err);
              Alert.alert('Error', 'Failed to delete discussion');
            }
          }
        }
      ]
    );
  };

  // Show user list modal
  const showUserList = (title, users) => {
    setFollowListTitle(title);
    setFollowListUsers(users || []);
    setFollowListOpen(true);
  };

  const handleRefresh = () => {
    fetchProfile(true);
  };

  const formatDate = (watchedAt) => {
    if (!watchedAt) return 'Unknown';
    const date = new Date(watchedAt);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  const handleEditReview = (review) => {
    // Navigate to review edit - could open a modal or navigate
    router.push(`/create-review?movieId=${review.movieId}&edit=${review._id}`);
  };

  const handleDeleteReview = async (reviewId) => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteReview(reviewId);
              Alert.alert('Success', 'Review deleted.');
              fetchProfile(true);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete review.');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <CustomHeader title="Profile" />
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Profile Header Skeleton */}
          <ProfileHeaderSkeleton />
          
          {/* Movies Section Skeleton */}
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <SkeletonLoader width={200} height={20} borderRadius={4} style={{ marginBottom: 12 }} />
            {[1, 2].map((i) => (
              <View key={i} style={{ marginBottom: 12 }}>
                <SkeletonLoader width={160} height={240} borderRadius={12} />
              </View>
            ))}
          </View>

          {/* Discussions Section Skeleton */}
          <View style={{ paddingHorizontal: 20 }}>
            <SkeletonLoader width={200} height={20} borderRadius={4} style={{ marginBottom: 12 }} />
            {[1, 2].map((i) => (
              <View key={i} style={{ paddingHorizontal: 12, paddingVertical: 12, marginBottom: 12, backgroundColor: '#1f2937', borderRadius: 12 }}>
                <View style={{ flexDirection: 'row', marginBottom: 8 }}>
                  <SkeletonLoader width={36} height={36} borderRadius={18} style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <SkeletonLoader width={120} height={14} borderRadius={4} />
                  </View>
                </View>
                <SkeletonLoader width="100%" height={14} borderRadius={4} />
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <CustomHeader title="Profile" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>User not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader title={profile?.username || 'Profile'} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            tintColor="#10b981"
          />
        }
      >
        <ProfileHeader
          user={profile}
          isOwnProfile={isOwnProfile}
          isFollowing={isFollowing}
          onFollowPress={handleFollowToggle}
          onEditPress={() => setEditProfileOpen(true)}
          onImportPress={() => setImportModalOpen(true)}
          onSettingsPress={() => {
            // Settings functionality can be added later
          }}
          stats={{
            reviewCount: userReviews.length,
            followersCount: profile.followersCount || 0,
            followingCount: profile.followingCount || 0,
            watchedCount: watchedMovies.length,
            discussionsStarted: profile.discussionsStarted || 0,
            discussionsParticipated: profile.discussionsParticipated || 0
          }}
          onFollowersPress={() => showUserList('Followers', profile.followers)}
          onFollowingPress={() => showUserList('Following', profile.following)}
        />

        {/* Popular Reviews Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Star color="#eab308" size={20} />
            <Text style={styles.sectionTitle}>Popular Reviews</Text>
            <Text style={styles.sectionCount}>({userReviews.length})</Text>
          </View>
          
          {userReviews.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No reviews yet.</Text>
            </View>
          ) : (
            <View style={styles.reviewsList}>
              {userReviews.slice(0, 5).map(review => (
                <ProfileReviewCard
                  key={review._id}
                  review={review}
                  onEdit={handleEditReview}
                  onDelete={handleDeleteReview}
                />
              ))}
            </View>
          )}
        </View>

        {/* Timeline Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar color="#10b981" size={20} />
            <Text style={styles.sectionTitle}>Timeline</Text>
            <Text style={styles.sectionCount}>({timelineMovies.length})</Text>
          </View>
          
          {timelineMovies.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No movies in timeline yet.</Text>
            </View>
          ) : (
            <View style={styles.timelineContainer}>
              {/* Timeline vertical line */}
              <View style={styles.timelineLine} />
              
              {timelineMovies.map((movie, idx) => (
                <TouchableOpacity
                  key={`${movie.id}-${idx}`}
                  style={styles.timelineItem}
                  onPress={() => router.push(`/movie/${movie.id}`)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.timelineDate}>{formatDate(movie.watchedAt)}</Text>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineCard}>
                    <Image
                      source={{ uri: `https://image.tmdb.org/t/p/w92${movie.poster_path}` }}
                      style={styles.timelinePoster}
                      resizeMode="cover"
                    />
                    <View style={styles.timelineInfo}>
                      <Text style={styles.timelineTitle} numberOfLines={2}>{movie.title}</Text>
                      <Text style={styles.timelineYear}>{movie.release_date?.substring(0, 4) || '—'}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Bookmarks Section (only for own profile) */}
        {isOwnProfile && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Bookmark color="#3b82f6" size={20} />
              <Text style={styles.sectionTitle}>Bookmarks</Text>
              <Text style={styles.sectionCount}>({bookmarkedDiscussions.length})</Text>
            </View>
            
            {bookmarkedDiscussions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No bookmarks yet.</Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {bookmarkedDiscussions.map(d => (
                  <TouchableOpacity
                    key={d._id}
                    style={styles.discussionCard}
                    onPress={() => router.push(`/discussion/${d._id}`)}
                  >
                    <Image
                      source={{ uri: d.poster_path ? `https://image.tmdb.org/t/p/w154${d.poster_path}` : 'https://via.placeholder.com/154x231' }}
                      style={styles.discussionPoster}
                      resizeMode="cover"
                    />
                    <View style={styles.discussionInfo}>
                      <Text style={styles.discussionTitle} numberOfLines={2}>{d.title}</Text>
                      <Text style={styles.discussionMeta}>{d.comments?.length || 0} comments</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* Watchlist Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <List color="#a855f7" size={20} />
            <Text style={styles.sectionTitle}>Watchlist</Text>
            <Text style={styles.sectionCount}>({watchlistMovies.length})</Text>
          </View>
          
          {watchlistMovies.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Watchlist is empty.</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {watchlistMovies.map(m => (
                <TouchableOpacity
                  key={m.id}
                  style={styles.movieCard}
                  onPress={() => router.push(`/movie/${m.id}`)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: `https://image.tmdb.org/t/p/w342${m.poster_path}` }}
                    style={styles.moviePoster}
                    resizeMode="cover"
                  />
                  <Text style={styles.movieTitle} numberOfLines={2}>{m.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Discussions Started Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MessageSquare color="#ec4899" size={20} />
            <Text style={styles.sectionTitle}>Discussions Started</Text>
            <Text style={styles.sectionCount}>({userDiscussions.length})</Text>
          </View>
          
          {userDiscussions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No discussions started.</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {userDiscussions.map(d => (
                <TouchableOpacity
                  key={d._id}
                  style={styles.discussionCard}
                  onPress={() => router.push(`/discussion/${d._id}`)}
                >
                  <Image
                    source={{ uri: d.poster_path ? `https://image.tmdb.org/t/p/w154${d.poster_path}` : 'https://via.placeholder.com/154x231' }}
                    style={styles.discussionPoster}
                    resizeMode="cover"
                  />
                  <View style={styles.discussionInfo}>
                    <Text style={styles.discussionTitle} numberOfLines={2}>{d.title}</Text>
                    <Text style={styles.discussionMeta}>{d.comments?.length || 0} comments</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>

      {/* Modals */}
      <EditProfileModal
        visible={editProfileOpen}
        profile={profile}
        onClose={() => setEditProfileOpen(false)}
        onUpdated={(updatedProfile) => {
          setProfile(updatedProfile);
          setEditProfileOpen(false);
        }}
      />

      <FollowListModal
        visible={followListOpen}
        title={followListTitle}
        users={followListUsers}
        onClose={() => setFollowListOpen(false)}
        currentUser={currentUser}
      />

      <LetterboxdImportModal
        visible={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportComplete={fetchProfile}
      />

      {/* Standard Bottom Navigation */}
      <StandardBottomNavigation currentUser={currentUser} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 120, // Account for CustomHeader height
    paddingHorizontal: 16,
    paddingBottom: 120, // Increased padding for better Samsung navigation compatibility
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    paddingTop: 120,
  },
  errorText: {
    fontSize: 18,
    color: '#9ca3af',
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
    flex: 1,
  },
  sectionCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyState: {
    backgroundColor: 'rgba(31, 41, 55, 0.3)',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  reviewsList: {
    gap: 12,
  },
  timelineContainer: {
    position: 'relative',
    paddingLeft: 8,
  },
  timelineLine: {
    position: 'absolute',
    left: 92,
    top: 16,
    bottom: 16,
    width: 2,
    backgroundColor: '#374151',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    position: 'relative',
  },
  timelineDate: {
    width: 80,
    paddingTop: 16,
    paddingRight: 12,
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'right',
    fontFamily: 'monospace',
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6b7280',
    marginLeft: -4,
    marginTop: 20,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#09090b',
    zIndex: 10,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  timelinePoster: {
    width: 40,
    height: 56,
    borderRadius: 6,
  },
  timelineInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 4,
  },
  timelineYear: {
    fontSize: 12,
    color: '#6b7280',
  },
  horizontalScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  movieCard: {
    width: 128,
    marginRight: 12,
  },
  moviePoster: {
    width: 128,
    height: 192,
    borderRadius: 12,
    backgroundColor: '#1f2937',
  },
  movieTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d1d5db',
    marginTop: 8,
  },
  discussionCard: {
    width: 200,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#374151',
  },
  discussionPoster: {
    width: '100%',
    height: 80,
    backgroundColor: '#374151',
  },
  discussionInfo: {
    padding: 12,
  },
  discussionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: 4,
  },
  discussionMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
  bottomNavigation: {
    position: 'absolute',
    left: 15,
    right: 15,
    height: 65,
    backgroundColor: '#1f2937',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 8,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 25,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 15,
    marginHorizontal: 2,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 45,
    height: 35,
    backgroundColor: 'transparent',
    borderRadius: 12,
  },
  tabIconContainerActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
});

export default ProfilePage;