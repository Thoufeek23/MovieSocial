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
  RefreshControl
} from 'react-native';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../src/context/AuthContext';
import * as api from '../../src/api';

// CHANGED: Corrected import paths to point to src/components/common/...
import Avatar from '../../src/components/common/Avatar';
import LoadingSpinner from '../../src/components/common/LoadingSpinner';

export default function DiscussionPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useContext(AuthContext);
  
  const [discussion, setDiscussion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [moviePoster, setMoviePoster] = useState(null);
  
  // Comment Input State
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // { commentId, username }
  const inputRef = useRef(null);

  useEffect(() => {
    loadDiscussion();
  }, [id]);

  const loadDiscussion = async () => {
    try {
      const { data } = await api.getDiscussion(id);
      setDiscussion(data);
      
      // Try to fetch poster if we have a movieId
      if (data.movieId) {
        try {
          const movieRes = await api.getMovieDetails(data.movieId);
          setMoviePoster(movieRes.data.poster_path);
        } catch (err) {
          console.log('Failed to fetch poster');
        }
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load discussion');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDiscussion();
  };

  const handleShare = async () => {
    try {
      // Assuming a deep link scheme or just sharing the title for now
      const message = `Check out this discussion: "${discussion.title}" on MovieSocial!`;
      await Share.share({
        message,
        title: discussion.title,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handlePostComment = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to post a comment.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/login') }
      ]);
      return;
    }

    if (!commentText.trim()) return;

    setSubmitting(true);
    try {
      let res;
      if (replyingTo) {
        // Post Reply
        res = await api.postDiscussionReply(id, replyingTo.commentId, { text: commentText });
      } else {
        // Post Top-level Comment
        res = await api.postDiscussionComment(id, { text: commentText });
      }
      
      // Update local state with new data
      setDiscussion(res.data);
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
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await api.deleteDiscussionComment(id, commentId);
            setDiscussion(res.data);
          } catch (err) {
            Alert.alert('Error', 'Failed to delete comment');
          }
        }
      }
    ]);
  };

  const handleDeleteReply = (commentId, replyId) => {
    Alert.alert('Delete Reply', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await api.deleteDiscussionReply(id, commentId, replyId);
            setDiscussion(res.data);
          } catch (err) {
            Alert.alert('Error', 'Failed to delete reply');
          }
        }
      }
    ]);
  };

  // Helper to format time
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

  // Helper to parse mentions in text
  const renderCommentText = (text) => {
    const parts = text.split(/(@[a-zA-Z0-9_]+)/g);
    return (
      <Text className="text-gray-300 text-sm leading-5">
        {parts.map((part, index) => {
          if (part.startsWith('@')) {
            const username = part.substring(1);
            return (
              <Text 
                key={index} 
                className="text-indigo-400 font-bold"
                onPress={() => router.push(`/profile/${username}`)}
              >
                {part}
              </Text>
            );
          }
          return <Text key={index}>{part}</Text>;
        })}
      </Text>
    );
  };

  if (loading) return <LoadingSpinner />;

  if (!discussion) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950 justify-center items-center">
        <Text className="text-white">Discussion not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-emerald-500">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800 bg-zinc-950">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white font-bold text-lg max-w-[70%]" numberOfLines={1}>Discussion</Text>
          <TouchableOpacity onPress={handleShare} className="p-2">
            <Ionicons name="share-social-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#10b981" />
          }
        >
          {/* Discussion Info */}
          <View className="p-4 border-b border-gray-800">
            <View className="flex-row gap-4">
              {/* Poster (Left) */}
              {moviePoster ? (
                <Image 
                  source={{ uri: `https://image.tmdb.org/t/p/w300${moviePoster}` }} 
                  className="w-24 h-36 rounded-lg bg-gray-800"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-24 h-36 rounded-lg bg-gray-800 justify-center items-center">
                  <Ionicons name="film-outline" size={32} color="#4b5563" />
                </View>
              )}

              {/* Details (Right) */}
              <View className="flex-1 justify-center">
                <Text className="text-2xl font-bold text-white mb-2 leading-tight">
                  {discussion.title}
                </Text>
                <Text className="text-gray-400 text-sm mb-1">
                  Movie: <Text className="text-white font-semibold">{discussion.movieTitle}</Text>
                </Text>
                <View className="flex-row items-center mt-2">
                  <Avatar user={discussion.starter} size={24} />
                  <Text className="text-gray-400 text-xs ml-2">
                    Started by <Text className="text-white font-medium">{discussion.starter?.username}</Text>
                  </Text>
                  <Text className="text-gray-500 text-xs ml-2">• {timeAgo(discussion.createdAt)} ago</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Comments Section */}
          <View className="p-4">
            <Text className="text-white font-bold text-lg mb-4">
              Comments ({discussion.comments.length})
            </Text>

            {discussion.comments.length === 0 ? (
              <View className="py-8 items-center">
                <Text className="text-gray-500">No comments yet. Start the conversation!</Text>
              </View>
            ) : (
              <View className="gap-6">
                {discussion.comments.map((comment) => (
                  <View key={comment._id} className="flex-row gap-3">
                    <Avatar user={comment.user} size={40} />
                    
                    <View className="flex-1">
                      {/* Comment Header */}
                      <View className="flex-row justify-between items-start">
                        <View>
                          <Text className="text-white font-semibold text-sm">
                            {comment.user?.username}
                          </Text>
                          <Text className="text-gray-500 text-xs">
                            {timeAgo(comment.createdAt)} ago
                          </Text>
                        </View>
                        
                        {/* Actions */}
                        <View className="flex-row gap-3">
                          <TouchableOpacity onPress={() => initiateReply(comment._id, comment.user?.username)}>
                            <Text className="text-gray-400 text-xs font-medium">Reply</Text>
                          </TouchableOpacity>
                          {user && (user._id === comment.user?._id || user._id === discussion.starter?._id) && (
                            <TouchableOpacity onPress={() => handleDeleteComment(comment._id)}>
                              <Ionicons name="trash-outline" size={14} color="#ef4444" />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>

                      {/* Comment Body */}
                      <View className="mt-1">
                        {renderCommentText(comment.text)}
                      </View>

                      {/* Nested Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <View className="mt-3 pl-3 border-l-2 border-gray-800 gap-3">
                          {comment.replies.map((reply) => (
                            <View key={reply._id} className="flex-row gap-2 mt-2">
                              <Avatar user={reply.user} size={28} />
                              <View className="flex-1">
                                <View className="flex-row justify-between items-center">
                                  <View className="flex-row items-center gap-2">
                                    <Text className="text-white font-semibold text-xs">
                                      {reply.user?.username}
                                    </Text>
                                    <Text className="text-gray-500 text-[10px]">
                                      {timeAgo(reply.createdAt)}
                                    </Text>
                                  </View>
                                  {user && (user._id === reply.user?._id || user._id === discussion.starter?._id) && (
                                    <TouchableOpacity onPress={() => handleDeleteReply(comment._id, reply._id)}>
                                      <Ionicons name="trash-outline" size={12} color="#ef4444" />
                                    </TouchableOpacity>
                                  )}
                                </View>
                                <View className="mt-0.5">
                                  {renderCommentText(reply.text)}
                                </View>
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

        {/* Comment Input Bar */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          className="border-t border-gray-800 bg-zinc-950"
        >
          {replyingTo && (
            <View className="flex-row justify-between items-center px-4 py-2 bg-gray-800/50">
              <Text className="text-gray-300 text-xs">
                Replying to <Text className="font-bold text-indigo-400">@{replyingTo.username}</Text>
              </Text>
              <TouchableOpacity onPress={cancelReply}>
                <Ionicons name="close" size={16} color="#9ca3af" />
              </TouchableOpacity>
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
              className={`w-11 h-11 rounded-full justify-center items-center ${
                !commentText.trim() ? 'bg-gray-800' : 'bg-emerald-500'
              }`}
            >
              {submitting ? (
                <LoadingSpinner size="small" color="white" />
              ) : (
                <Ionicons 
                  name="send" 
                  size={20} 
                  color={!commentText.trim() ? '#4b5563' : 'white'} 
                  style={{ marginLeft: 2 }}
                />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}