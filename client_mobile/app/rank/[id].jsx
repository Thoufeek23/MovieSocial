import React, { useEffect, useState, useContext, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  KeyboardAvoidingView, 
  Platform, 
  Share, 
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../src/context/AuthContext';
import * as api from '../../src/api';

// CHANGED: Corrected import paths to point to src/components/common/...
import Avatar from '../../src/components/common/Avatar';
import LoadingSpinner from '../../src/components/common/LoadingSpinner';

export default function RankDetailPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useContext(AuthContext);
  
  const [rank, setRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Comment Input State
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // { commentId, username }
  const inputRef = useRef(null);

  useEffect(() => {
    loadRank();
  }, [id]);

  const loadRank = async () => {
    try {
      const { data } = await api.getRank(id);
      setRank(data);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load rank');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRank();
  };

  const handleLike = async () => {
    if (!user) {
      return Alert.alert('Login Required', 'Please log in to like this list.');
    }

    // Optimistic update
    setRank(prev => {
      const userId = user._id || user.id;
      const hasLiked = prev.likes.includes(userId);
      return {
        ...prev,
        likes: hasLiked ? prev.likes.filter(id => id !== userId) : [...prev.likes, userId]
      };
    });

    try {
      await api.likeRank(rank._id);
    } catch (error) {
      console.error(error);
      // Revert on error (could implement more robust revert here)
      loadRank();
    }
  };

  const handleShare = async () => {
    try {
      const message = `Check out this ranking list: "${rank.title}" on MovieSocial!`;
      await Share.share({
        message,
        title: rank.title,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteRank = () => {
    Alert.alert(
      'Delete Rank',
      'Are you sure you want to delete this list? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await api.deleteRank(id);
              router.replace('/(tabs)/index'); // Or navigate to a Ranks list page if it existed
            } catch (error) {
              Alert.alert('Error', 'Failed to delete rank');
            }
          }
        }
      ]
    );
  };

  // --- Comment Logic (Reused from DiscussionPage) ---

  const handlePostComment = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to comment.');
      return;
    }
    if (!commentText.trim()) return;

    setSubmitting(true);
    try {
      let res;
      if (replyingTo) {
        res = await api.postRankReply(id, replyingTo.commentId, { text: commentText });
      } else {
        res = await api.postRankComment(id, { text: commentText });
      }
      
      setRank(res.data);
      setCommentText('');
      setReplyingTo(null);
      inputRef.current?.blur();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const initiateReply = (commentId, username) => {
    setReplyingTo({ commentId, username });
    inputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setCommentText('');
    inputRef.current?.blur();
  };

  const handleDeleteComment = (commentId) => {
    Alert.alert('Delete Comment', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            const res = await api.deleteRankComment(id, commentId);
            setRank(res.data);
          } catch (err) { Alert.alert('Error', 'Failed to delete comment'); }
        }
      }
    ]);
  };

  const handleDeleteReply = (commentId, replyId) => {
    Alert.alert('Delete Reply', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            const res = await api.deleteRankReply(id, commentId, replyId);
            setRank(res.data);
          } catch (err) { Alert.alert('Error', 'Failed to delete reply'); }
        }
      }
    ]);
  };

  // Helpers
  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  const renderCommentText = (text) => {
    const parts = text.split(/(@[a-zA-Z0-9_]+)/g);
    return (
      <Text className="text-gray-300 text-sm leading-5">
        {parts.map((part, index) => {
          if (part.startsWith('@')) {
            const username = part.substring(1);
            return <Text key={index} className="text-indigo-400 font-bold" onPress={() => router.push(`/profile/${username}`)}>{part}</Text>;
          }
          return <Text key={index}>{part}</Text>;
        })}
      </Text>
    );
  };

  if (loading) return <LoadingSpinner />;
  if (!rank) return <View className="flex-1 bg-zinc-950 justify-center items-center"><Text className="text-white">Rank not found</Text></View>;

  const isLiked = user && rank.likes.includes(user._id || user.id);
  const isOwner = user && (user._id === rank.user?._id || user.id === rank.user?._id);

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800 bg-zinc-950">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white font-bold text-lg" numberOfLines={1}>Rank Details</Text>
        <TouchableOpacity onPress={handleShare} className="p-2">
          <Ionicons name="share-social-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#10b981" />}
      >
        {/* Info Section */}
        <View className="p-5 border-b border-gray-800">
          <Text className="text-3xl font-extrabold text-white mb-2">{rank.title}</Text>
          {rank.description ? (
            <Text className="text-gray-400 text-base mb-4 leading-6">{rank.description}</Text>
          ) : null}

          <View className="flex-row items-center justify-between mt-2">
            <Link href={`/profile/${rank.user?.username}`} asChild>
              <TouchableOpacity className="flex-row items-center gap-3">
                <Avatar user={rank.user} size={40} />
                <View>
                  <Text className="text-white font-semibold">{rank.user?.username}</Text>
                  <Text className="text-gray-500 text-xs">{timeAgo(rank.createdAt)} ago</Text>
                </View>
              </TouchableOpacity>
            </Link>

            <View className="flex-row items-center gap-3">
              <TouchableOpacity 
                onPress={handleLike}
                className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full ${isLiked ? 'bg-red-500/10' : 'bg-gray-800'}`}
              >
                <Ionicons name={isLiked ? "heart" : "heart-outline"} size={20} color={isLiked ? "#ef4444" : "#9ca3af"} />
                <Text className={isLiked ? "text-red-500 font-bold" : "text-gray-400"}>{rank.likes.length}</Text>
              </TouchableOpacity>
              
              {isOwner && (
                <TouchableOpacity onPress={handleDeleteRank} className="p-2 bg-gray-800 rounded-full">
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Movies List */}
        <View className="p-5">
          <Text className="text-white font-bold text-lg mb-4">Movies ({rank.movies.length})</Text>
          <View className="gap-3">
            {rank.movies.map((movie, index) => (
              <Link key={movie._id || index} href={`/movie/${movie.movieId}`} asChild>
                <TouchableOpacity className="flex-row bg-gray-900 p-3 rounded-xl border border-gray-800 items-center gap-4">
                  <View className="relative">
                    <Image 
                      source={movie.posterPath ? { uri: `https://image.tmdb.org/t/p/w200${movie.posterPath}` } : require('../../assets/images/poster1.png')} 
                      className="w-12 h-16 rounded object-cover bg-gray-800"
                    />
                    <View className="absolute -top-2 -left-2 bg-emerald-500 w-6 h-6 rounded-full items-center justify-center border border-gray-900">
                      <Text className="text-white text-xs font-bold">{movie.rank}</Text>
                    </View>
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-bold text-base mb-0.5" numberOfLines={1}>{movie.title}</Text>
                    <Text className="text-gray-500 text-xs">{movie.year || 'Unknown Year'}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#4b5563" />
                </TouchableOpacity>
              </Link>
            ))}
          </View>
        </View>

        {/* Comments Section */}
        <View className="p-5 pt-0">
          <Text className="text-white font-bold text-lg mb-4">Comments ({rank.comments.length})</Text>
          
          {rank.comments.length === 0 ? (
            <View className="py-6 items-center bg-gray-900/50 rounded-xl border border-gray-800 border-dashed">
              <Text className="text-gray-500">No comments yet. Be the first!</Text>
            </View>
          ) : (
            <View className="gap-5">
              {rank.comments.map((comment) => (
                <View key={comment._id} className="flex-row gap-3">
                  <Avatar user={comment.user} size={36} />
                  <View className="flex-1">
                    <View className="bg-gray-900 p-3 rounded-xl rounded-tl-none border border-gray-800">
                      <View className="flex-row justify-between items-start mb-1">
                        <Text className="text-white font-semibold text-sm">{comment.user?.username}</Text>
                        <Text className="text-gray-500 text-[10px]">{timeAgo(comment.createdAt)}</Text>
                      </View>
                      <View>{renderCommentText(comment.text)}</View>
                    </View>

                    {/* Comment Actions */}
                    <View className="flex-row gap-4 mt-1 ml-1">
                      <TouchableOpacity onPress={() => initiateReply(comment._id, comment.user?.username)}>
                        <Text className="text-gray-500 text-xs font-medium">Reply</Text>
                      </TouchableOpacity>
                      {user && (user._id === comment.user?._id || isOwner) && (
                        <TouchableOpacity onPress={() => handleDeleteComment(comment._id)}>
                          <Text className="text-red-500/70 text-xs">Delete</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Nested Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <View className="mt-2 gap-3 pl-3 border-l border-gray-800">
                        {comment.replies.map(reply => (
                          <View key={reply._id} className="flex-row gap-2">
                            <Avatar user={reply.user} size={24} />
                            <View className="flex-1 bg-gray-900/50 p-2 rounded-lg border border-gray-800/50">
                              <View className="flex-row justify-between items-center mb-0.5">
                                <Text className="text-gray-300 font-semibold text-xs">{reply.user?.username}</Text>
                                {user && (user._id === reply.user?._id || isOwner) && (
                                  <TouchableOpacity onPress={() => handleDeleteReply(comment._id, reply._id)}>
                                    <Ionicons name="trash-outline" size={12} color="#ef4444" />
                                  </TouchableOpacity>
                                )}
                              </View>
                              <View>{renderCommentText(reply.text)}</View>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="bg-zinc-950 border-t border-gray-800"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {replyingTo && (
          <View className="flex-row justify-between items-center px-4 py-2 bg-gray-800/50">
            <Text className="text-gray-300 text-xs">Replying to <Text className="font-bold text-emerald-400">@{replyingTo.username}</Text></Text>
            <TouchableOpacity onPress={cancelReply}><Ionicons name="close" size={16} color="#9ca3af" /></TouchableOpacity>
          </View>
        )}
        <View className="p-3 flex-row items-end gap-2">
          <TextInput
            ref={inputRef}
            value={commentText}
            onChangeText={setCommentText}
            placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
            placeholderTextColor="#6b7280"
            multiline
            maxLength={1000}
            className="flex-1 bg-gray-900 text-white rounded-2xl px-4 py-3 min-h-[44px] max-h-[100px]"
            style={{ textAlignVertical: 'top' }}
          />
          <TouchableOpacity
            onPress={handlePostComment}
            disabled={submitting || !commentText.trim()}
            className={`w-11 h-11 rounded-full justify-center items-center ${!commentText.trim() ? 'bg-gray-800' : 'bg-emerald-500'}`}
          >
            {submitting ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="send" size={20} color={!commentText.trim() ? '#4b5563' : 'white'} style={{ marginLeft: 2 }} />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}