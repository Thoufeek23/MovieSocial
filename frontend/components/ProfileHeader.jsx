import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { AuthContext } from '../src/context/AuthContext';
import * as api from '../src/api';
import Avatar from './Avatar';

const { width } = Dimensions.get('window');

const ProfileHeader = ({ 
  user, 
  isOwnProfile = false,
  isFollowing = false,
  onFollowPress,
  onEditPress,
  onSettingsPress,
  onFollowersPress,
  onFollowingPress,
  stats = {}
}) => {
  const { user: currentUser, logout } = useContext(AuthContext);
  const router = useRouter();
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const isCurrentUser = currentUser && String(currentUser._id || currentUser.id) === String(user._id || user.id);

  const renderBadge = (badge) => {
    if (!badge) return null;
    
    const id = (badge.id || badge.name || '').toUpperCase();
    let badgeStyle = styles.badgeDefault;
    
    if (id.includes('DIAMOND')) badgeStyle = styles.badgeDiamond;
    else if (id.includes('GOLD')) badgeStyle = styles.badgeGold;
    else if (id.includes('SILVER')) badgeStyle = styles.badgeSilver;
    else if (id.includes('BRONZE')) badgeStyle = styles.badgeBronze;

    const label = (badge.name || badge.id || '').replace(/_/g, ' ');
    const badgeId = badge.id || badge.name;
    
    return (
      <TouchableOpacity 
        key={badgeId} 
        style={[styles.badge, badgeStyle]}
        onPress={() => router.push(`/badge/${badgeId}`)}
        activeOpacity={0.8}
      >
        <Text style={styles.badgeText}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const handleOptionsPress = () => {
    const options = [];
    
    if (isCurrentUser) {
      options.push('Share Profile');
      options.push('Edit Profile');
      options.push('Logout');
      options.push('Delete Account');
      options.push('Cancel');
    } else {
      options.push('Share Profile');
      options.push('Cancel');
    }

    Alert.alert(
      'Profile Options',
      undefined,
      options.map((option, index) => ({
        text: option,
        style: option === 'Cancel' ? 'cancel' : 
               (option === 'Logout' || option === 'Delete Account') ? 'destructive' : 'default',
        onPress: () => {
          if (option === 'Share Profile') {
            handleShareProfile();
          } else if (option === 'Edit Profile') {
            onEditPress?.();
          } else if (option === 'Logout') {
            handleLogout();
          } else if (option === 'Delete Account') {
            handleDeleteAccount();
          }
        }
      }))
    );
  };

  const handleShareProfile = async () => {
    try {
      const profileUrl = `https://moviesocial.app/profile/${user.username}`;
      await Share.share({
        message: `Check out ${user.username}'s profile on MovieSocial: ${profileUrl}`,
        title: `${user.username}'s MovieSocial Profile`
      });
    } catch (error) {
      // Fallback to clipboard if share fails
      await Clipboard.setStringAsync(`https://moviesocial.app/profile/${user.username}`);
      Alert.alert('Profile Link Copied', 'The profile link has been copied to your clipboard.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout?.();
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your reviews, discussions, and profile data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            // Second confirmation
            Alert.alert(
              'Are you absolutely sure?',
              'Type DELETE to confirm account deletion',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'I understand, delete my account',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await api.deleteMyAccount();
                      Alert.alert(
                        'Account Deleted', 
                        'Your account has been successfully deleted.',
                        [{
                          text: 'OK',
                          onPress: () => logout?.()
                        }]
                      );
                    } catch (error) {
                      console.error('Error deleting account:', error);
                      Alert.alert(
                        'Error', 
                        error.response?.data?.msg || 'Failed to delete account. Please try again.'
                      );
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Avatar user={user} size={80} style={styles.avatar} />
        
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.displayName}>{user.displayName || user.username}</Text>
            <View style={styles.badgesContainer}>
              {(user.badges || []).slice(0, 3).map(badge => renderBadge(badge))}
            </View>
            {isCurrentUser && (
              <TouchableOpacity onPress={handleOptionsPress} style={styles.optionsButton}>
                <Ionicons name="ellipsis-vertical" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
          
          <Text style={styles.username}>@{user.username}</Text>
          
          {user.bio && (
            <Text style={styles.bio} numberOfLines={3}>{user.bio}</Text>
          )}
          
          {(user.location || user.country) && (
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color="#9ca3af" />
              <Text style={styles.location}>
                {[user.state, user.country].filter(Boolean).join(', ') || user.location}
              </Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Stats Row */}
      <View style={styles.statsRow}>
        <TouchableOpacity 
          style={styles.statItem} 
          onPress={() => onFollowersPress?.()} 
          activeOpacity={0.7}
        >
          <Text style={styles.statValue}>{stats.followersCount || 0}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.statItem} 
          onPress={() => onFollowingPress?.()} 
          activeOpacity={0.7}
        >
          <Text style={styles.statValue}>{stats.followingCount || 0}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </TouchableOpacity>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.discussionsStarted || 0}</Text>
          <Text style={styles.statLabel}>Discussions</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.watchedCount || 0}</Text>
          <Text style={styles.statLabel}>Watched</Text>
        </View>
      </View>
      
      {/* Action Buttons */}
      <View style={styles.actionRow}>
        {isCurrentUser ? (
          <TouchableOpacity style={styles.primaryButton} onPress={onEditPress}>
            <Ionicons name="pencil" size={16} color="white" />
            <Text style={styles.primaryButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity 
              style={[styles.primaryButton, isFollowing && styles.followingButton]} 
              onPress={onFollowPress}
            >
              <Ionicons 
                name={isFollowing ? "person-remove" : "person-add"} 
                size={16} 
                color={isFollowing ? "#dc2626" : "white"} 
              />
              <Text style={[styles.primaryButtonText, isFollowing && styles.followingButtonText]}>
                {isFollowing ? 'Unfollow' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1f2937',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
  },
  avatar: {
    marginTop: 4,
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    width: '100%',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    flex: 1,
    marginLeft: 8,
  },
  optionsButton: {
    padding: 4,
    borderRadius: 4,
  },
  displayName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  username: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 18,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    fontSize: 12,
    color: '#9ca3af',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeDefault: {
    backgroundColor: '#374151',
  },
  badgeDiamond: {
    backgroundColor: '#8b5cf6',
  },
  badgeGold: {
    backgroundColor: '#f59e0b',
  },
  badgeSilver: {
    backgroundColor: '#9ca3af',
  },
  badgeBronze: {
    backgroundColor: '#92400e',
  },
  badgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  followingButtonText: {
    color: '#dc2626',
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#374151',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
});

export default ProfileHeader;