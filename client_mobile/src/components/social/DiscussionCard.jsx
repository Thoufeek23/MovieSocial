import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import Avatar from '../Avatar';

const DiscussionCard = ({ discussion, onEdit, onDelete, showActions = false }) => {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  
  if (!discussion || !discussion.starter) {
    return null;
  }
  
  const isAuthor = !!user && (
    String(user.id) === String(discussion.starter._id) ||
    String(user._id) === String(discussion.starter._id)
  );

  const canModify = showActions && isAuthor && (typeof onEdit === 'function' || typeof onDelete === 'function');
  const IMG_BASE_URL = 'https://image.tmdb.org/t/p/w185';

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

  const handleDelete = () => {
    Alert.alert(
      "Delete Discussion",
      "Are you sure you want to delete this discussion?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => onDelete(discussion._id) }
      ]
    );
  };

  return (
    <Link href={`/discussion/${discussion._id}`} asChild>
      <TouchableOpacity 
        className="bg-card rounded-xl mb-4 shadow-sm border border-border overflow-hidden" 
        activeOpacity={0.7}
      >
        <View className="flex-row p-4 gap-4">
          {/* Movie Poster */}
          <Link href={`/movie/${discussion.movieId}`} asChild>
            <TouchableOpacity>
              <Image
                source={{ 
                  uri: discussion.poster_path 
                    ? `${IMG_BASE_URL}${discussion.poster_path}` 
                    : 'https://via.placeholder.com/185x278/374151/9ca3af?text=No+Poster'
                }}
                className="w-20 h-28 rounded-lg bg-zinc-800"
                resizeMode="cover"
              />
            </TouchableOpacity>
          </Link>
          
          {/* Content Area */}
          <View className="flex-1">
            {/* Discussion Title */}
            <Text className="text-base font-semibold text-white mb-1.5 leading-5" numberOfLines={2}>
              {discussion.title || 'Untitled Discussion'}
            </Text>
            
            {/* Movie Title */}
            {discussion.movieTitle && (
              <Link href={`/movie/${discussion.movieId}`} asChild>
                <TouchableOpacity>
                  <Text className="text-xs text-primary mb-3 font-medium">
                    {discussion.movieTitle}
                  </Text>
                </TouchableOpacity>
              </Link>
            )}

            {/* Header / User Info */}
            <View className="flex-row items-start justify-between mb-3">
              <Link href={`/profile/${discussion.starter?.username}`} asChild>
                <TouchableOpacity className="flex-row items-center gap-2 flex-1">
                  <Avatar username={discussion.starter?.username} avatar={discussion.starter?.avatar} sizeClass="w-8 h-8" />
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-white" numberOfLines={1}>
                      {discussion.starter?.username || 'Unknown User'}
                    </Text>
                    <Text className="text-xs text-gray-400 mt-0.5">
                      {discussion.createdAt ? formatDate(discussion.createdAt) : 'Unknown time'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Link>
              
              {canModify && (
                <View className="flex-row gap-2 ml-2">
                  {onEdit && (
                    <TouchableOpacity onPress={() => onEdit(discussion)} className="p-1">
                      <Ionicons name="pencil" size={16} color="#9ca3af" />
                    </TouchableOpacity>
                  )}
                  {onDelete && (
                    <TouchableOpacity onPress={handleDelete} className="p-1">
                      <Ionicons name="trash" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
            
            {/* Footer Stats */}
            <View className="flex-row items-center gap-1 mt-auto">
              <Ionicons name="chatbubble-outline" size={14} color="#9ca3af" />
              <Text className="text-xs text-gray-400">
                {discussion.comments?.length || 0} comments
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
};

export default DiscussionCard;