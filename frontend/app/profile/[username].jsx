import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text,
  ScrollView, 
  StyleSheet, 
  Alert, 
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { useLocalSearchParams, useRouter, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Home, Search, BookOpen, Puzzle, FileText, User } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import * as api from '../../src/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import CustomHeader from '../../components/CustomHeader';
import ProfileHeader from '../../components/ProfileHeader';
import MovieListSection from '../../components/MovieListSection';
import DiscussionListSection from '../../components/DiscussionListSection';
import EditProfileModal from '../../components/EditProfileModal';
import FollowListModal from '../../components/FollowListModal';

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
  const [watchedMovies, setWatchedMovies] = useState([]);
  const [watchlistMovies, setWatchlistMovies] = useState([]);
  const [userDiscussions, setUserDiscussions] = useState([]);
  const [bookmarkedDiscussions, setBookmarkedDiscussions] = useState([]);
  
  // Modal state
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [followListOpen, setFollowListOpen] = useState(false);
  const [followListTitle, setFollowListTitle] = useState('');
  const [followListUsers, setFollowListUsers] = useState([]);

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

      // Fetch watched and watchlist movies
      const watchedDetails = await Promise.all(
        data.watched.map(id => api.getMovieDetails(id))
      );
      const watchlistDetails = await Promise.all(
        data.watchlist.map(id => api.getMovieDetails(id))
      );
      
      setWatchedMovies(watchedDetails.map(res => res.data));
      setWatchlistMovies(watchlistDetails.map(res => res.data));

      // Fetch user discussions
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

  // Custom bottom navigation component
  const CustomBottomNavigation = () => {
    const pathname = usePathname();
    const router = useRouter();
    
    const tabs = [
      { name: 'index', icon: Home, route: '/(tabs)/', title: 'Home' },
      { name: 'search', icon: Search, route: '/(tabs)/search', title: 'Search' },
      { name: 'discussions', icon: BookOpen, route: '/(tabs)/discussions', title: 'Discussions' },
      { name: 'modle', icon: Puzzle, route: '/(tabs)/modle', title: 'Modle' },
      { name: 'reviews', icon: FileText, route: '/(tabs)/reviews', title: 'Reviews' },
      { name: 'profile', icon: User, route: '/(tabs)/profile', title: 'Profile' },
    ];

    const isProfileActive = pathname.includes('/profile');

    return (
      <View style={styles.bottomNavigation}>
        {tabs.map((tab) => {
          const isActive = tab.name === 'profile' ? isProfileActive : pathname === tab.route;
          const IconComponent = tab.icon;
          
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabItem}
              onPress={() => {
                if (tab.name === 'profile' && currentUser?.username) {
                  // If we're already on this user's profile, don't navigate
                  if (pathname.includes(`/profile/${currentUser.username}`)) {
                    return;
                  }
                  router.push(`/profile/${currentUser.username}`);
                } else {
                  router.push(tab.route);
                }
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
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <CustomHeader title="Profile" />
        <LoadingSpinner />
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
          onSettingsPress={() => {
            // Settings functionality can be added later
          }}
          stats={{
            reviewCount: 0, // Can be calculated from API
            followersCount: profile.followersCount || 0,
            followingCount: profile.followingCount || 0,
            watchedCount: watchedMovies.length,
            discussionsStarted: profile.discussionsStarted || 0,
            discussionsParticipated: profile.discussionsParticipated || 0
          }}
          onFollowersPress={() => showUserList('Followers', profile.followers)}
          onFollowingPress={() => showUserList('Following', profile.following)}
        />

        <MovieListSection
          title={`Watched Films (${watchedMovies.length})`}
          movies={watchedMovies}
          emptyMessage="No movies watched yet"
          emptyIcon="film-outline"
          showDelete={isOwnProfile}
          onDelete={handleRemoveFromWatched}
        />

        <DiscussionListSection
          title={`Discussions Started (${userDiscussions.length})`}
          discussions={userDiscussions}
          emptyMessage="No discussions started"
          emptyIcon="chatbubble-outline"
          showDelete={isOwnProfile}
          onDelete={handleDeleteDiscussion}
          showRedirectButton={true}
          redirectButtonText="View Discussions"
          redirectButtonIcon="chatbubbles"
          redirectPath="/(tabs)/discussions"
        />

        {isOwnProfile && (
          <DiscussionListSection
            title={`Bookmarked Discussions (${bookmarkedDiscussions.length})`}
            discussions={bookmarkedDiscussions}
            emptyMessage="No bookmarked discussions"
            emptyIcon="bookmark-outline"
            showDelete={false}
            showRedirectButton={true}
            redirectButtonText="Browse Discussions"
            redirectButtonIcon="book"
            redirectPath="/(tabs)/discussions"
          />
        )}

        <MovieListSection
          title={`Watchlist (${watchlistMovies.length})`}
          movies={watchlistMovies}
          emptyMessage="Watchlist is empty"
          emptyIcon="time-outline"
          showDelete={false}
          showRedirectButton={true}
          redirectButtonText="Explore Movies"
          redirectButtonIcon="search"
          redirectPath="/(tabs)/search"
        />
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

      {/* Custom Bottom Navigation */}
      <CustomBottomNavigation />
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
    paddingBottom: 100, // Account for bottom tab bar
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
  bottomNavigation: {
    position: 'absolute',
    bottom: 20,
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