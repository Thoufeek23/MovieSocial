import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../src/context/AuthContext';
import Avatar from './Avatar';

const DiscussionCard = ({ discussion, onEdit, onDelete, showActions = false }) => {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  
  // Early return if discussion is null/undefined
  if (!discussion || !discussion.starter) {
    return null;
  }
  
  const isAuthor = !!user && (
    String(user.id) === String(discussion.starter._id) ||
    String(user._id) === String(discussion.starter._id)
  );

  const canModify = showActions && isAuthor && (typeof onEdit === 'function' || typeof onDelete === 'function');
  const IMG_BASE_URL = 'https://image.tmdb.org/t/p/w185'; // Match client poster size

  const handleDiscussionPress = () => {
    if (discussion._id) {
      router.push(`/discussion/${discussion._id}`);
    }
  };

  const handleUserPress = () => {
    if (discussion.starter?.username) {
      router.push(`/profile/${discussion.starter.username}`);
    }
  };

  const handleMoviePress = () => {
    if (discussion.movieId) {
      router.push(`/movie/${discussion.movieId}`);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handleDiscussionPress} activeOpacity={0.7}>
      {/* Main Content with Poster Layout (similar to client) */}
      <View style={styles.mainContent}>
        {/* Movie Poster */}
        <Image
          source={{ 
            uri: discussion.poster_path 
              ? `${IMG_BASE_URL}${discussion.poster_path}` 
              : 'https://via.placeholder.com/185x278/374151/9ca3af?text=No+Poster'
          }}
          style={styles.poster}
          resizeMode="cover"
        />
        
        {/* Content Area */}
        <View style={styles.contentArea}>
          {/* Discussion Title */}
          <Text style={styles.title} numberOfLines={2}>{discussion.title || 'Untitled Discussion'}</Text>
          
          {/* Movie Title */}
          {discussion.movieTitle && (
            <TouchableOpacity onPress={handleMoviePress}>
              <Text style={styles.movieTitle}>{discussion.movieTitle}</Text>
            </TouchableOpacity>
          )}

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={handleUserPress}>
                <Avatar user={discussion.starter} size={32} />
              </TouchableOpacity>
              
              <View style={styles.headerContent}>
                <TouchableOpacity onPress={handleUserPress}>
                  <Text style={styles.username}>{discussion.starter?.username || 'Unknown User'}</Text>
                </TouchableOpacity>
                <Text style={styles.timestamp}>{discussion.createdAt ? formatDate(discussion.createdAt) : 'Unknown time'}</Text>
              </View>
            </View>
            
            {canModify && (
              <View style={styles.actions}>
                {onEdit && (
                  <TouchableOpacity onPress={() => onEdit(discussion)} style={styles.actionButton}>
                    <Ionicons name="pencil" size={16} color="#9ca3af" />
                  </TouchableOpacity>
                )}
                {onDelete && (
                  <TouchableOpacity onPress={() => onDelete(discussion._id)} style={styles.actionButton}>
                    <Ionicons name="trash" size={16} color="#9ca3af" />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
          
          {/* Footer Stats */}
          <View style={styles.footer}>
            <View style={styles.stat}>
              <Ionicons name="chatbubble-outline" size={14} color="#9ca3af" />
              <Text style={styles.statText}>
                {discussion.comments?.length || 0} comments
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    overflow: 'hidden',
  },
  mainContent: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  poster: {
    width: 80,
    height: 112, // 80 * 1.4 aspect ratio
    borderRadius: 8,
  },
  contentArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerContent: {
    flex: 1,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  timestamp: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 6,
    lineHeight: 20,
  },
  movieTitle: {
    fontSize: 12,
    color: '#10b981',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 'auto',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statDivider: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default DiscussionCard;