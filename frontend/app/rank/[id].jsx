import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { ChevronLeft, Heart, Share2, Pencil, Trash2, MessageCircle, Send } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import Avatar from '../../components/Avatar';
import { RankDetailSkeleton } from '../../components/SkeletonLoader';
import * as api from '../../src/api';

export default function RankDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [rank, setRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [replyBoxes, setReplyBoxes] = useState({});
  const scrollViewRef = useRef(null);

  useEffect(() => {
    loadRank();
  }, [id]);

  const loadRank = async () => {
    try {
      setLoading(true);
      const res = await api.getRank(id);
      setRank(res.data);
    } catch (error) {
      console.error('Error loading rank:', error);
      Alert.alert('Error', 'Failed to load rank details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to like this ranking');
      return;
    }

    // Optimistic update
    setRank(prev => {
      const userId = user._id || user.id;
      const hasLiked = prev.likes.includes(userId);
      return {
        ...prev,
        likes: hasLiked 
          ? prev.likes.filter(id => id !== userId) 
          : [...prev.likes, userId]
      };
    });

    try {
      await api.likeRank(id);
    } catch (error) {
      console.error('Error liking rank:', error);
      Alert.alert('Error', 'Failed to like ranking');
      loadRank(); // Revert on error
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Rank',
      'Are you sure you want to delete this ranking? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteRank(id);
              router.back();
            } catch (error) {
              console.error('Error deleting rank:', error);
              Alert.alert('Error', 'Failed to delete rank');
            }
          },
        },
      ]
    );
  };

  const handleComment = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to comment');
      return;
    }
    if (!commentText.trim()) return;

    try {
      const { data } = await api.postRankComment(id, { text: commentText });
      setRank(data);
      setCommentText('');
    } catch (error) {
      console.error('Error posting comment:', error);
      Alert.alert('Error', 'Failed to post comment');
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editingCommentText.trim()) {
      Alert.alert('Error', 'Comment cannot be empty');
      return;
    }

    try {
      const res = await api.editRankComment(id, commentId, { text: editingCommentText });
      setRank(res.data);
      setEditingCommentId(null);
      setEditingCommentText('');
    } catch (error) {
      console.error('Error editing comment:', error);
      Alert.alert('Error', 'Failed to edit comment');
    }
  };

  const handleDeleteComment = (commentId) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.deleteRankComment(id, commentId);
              setRank(res.data);
            } catch (error) {
              console.error('Error deleting comment:', error);
              Alert.alert('Error', 'Failed to delete comment');
            }
          },
        },
      ]
    );
  };

  const handlePostReply = async (commentId) => {
    const replyText = replyBoxes[commentId];
    if (!replyText?.trim()) return;

    try {
      const res = await api.postRankReply(id, commentId, { text: replyText });
      setRank(res.data);
      setReplyBoxes(prev => ({ ...prev, [commentId]: '' }));
    } catch (error) {
      console.error('Error posting reply:', error);
      Alert.alert('Error', 'Failed to post reply');
    }
  };

  const handleDeleteReply = (commentId, replyId) => {
    Alert.alert(
      'Delete Reply',
      'Are you sure you want to delete this reply?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.deleteRankReply(id, commentId, replyId);
              setRank(res.data);
            } catch (error) {
              console.error('Error deleting reply:', error);
              Alert.alert('Error', 'Failed to delete reply');
            }
          },
        },
      ]
    );
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#18181b' }}>
        <Stack.Screen 
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: '#27272a' },
            headerTintColor: '#fafafa',
            headerTitle: 'Loading...',
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
                <ChevronLeft color="#fafafa" size={28} />
              </TouchableOpacity>
            ),
          }}
        />
        <ScrollView>
          <RankDetailSkeleton />
        </ScrollView>
      </View>
    );
  }

  if (!rank) return null;

  const userId = user?._id || user?.id;
  const isLiked = user && rank.likes?.includes(userId);
  const isOwner = user && rank.user && (userId === rank.user._id || userId === rank.user.id);

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#18181b' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <Stack.Screen 
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: '#27272a' },
          headerTintColor: '#fafafa',
          headerTitle: 'Rank Details',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
              <ChevronLeft color="#fafafa" size={28} />
            </TouchableOpacity>
          ),
          headerRight: () => isOwner ? (
            <TouchableOpacity onPress={handleDelete} style={{ marginRight: 12 }}>
              <Trash2 color="#ef4444" size={22} />
            </TouchableOpacity>
          ) : null,
        }}
      />

      <ScrollView 
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* RANK HEADER */}
        <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: '#27272a' }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: '#fafafa', marginBottom: 12 }}>
            {rank.title}
          </Text>
          
          {rank.description && (
            <Text style={{ fontSize: 16, color: '#d1d5db', marginBottom: 20, lineHeight: 24 }}>
              {rank.description}
            </Text>
          )}

          {/* User Info */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <TouchableOpacity 
              onPress={() => router.push(`/profile/${rank.user?.username}`)}
              style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
            >
              <Avatar user={rank.user} size={36} />
              <View style={{ marginLeft: 12 }}>
                <Text style={{ color: '#fafafa', fontWeight: '600', fontSize: 14 }}>
                  {rank.user?.username || 'Unknown'}
                </Text>
                <Text style={{ color: '#6b7280', fontSize: 12 }}>
                  {timeAgo(rank.createdAt)}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={handleLike}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 20,
                backgroundColor: isLiked ? 'rgba(239, 68, 68, 0.1)' : '#27272a',
                gap: 8
              }}
            >
              <Heart
                color={isLiked ? '#ef4444' : '#9ca3af'}
                fill={isLiked ? '#ef4444' : 'none'}
                size={20}
              />
              <Text style={{ color: isLiked ? '#ef4444' : '#d1d5db', fontWeight: '600' }}>
                {rank.likes?.length || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 20,
                backgroundColor: '#27272a',
                gap: 8
              }}
            >
              <Share2 color="#9ca3af" size={20} />
              <Text style={{ color: '#d1d5db', fontWeight: '600' }}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* RANKED MOVIES LIST */}
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#fafafa', marginBottom: 16 }}>
            Ranked Movies ({rank.movies?.length || 0})
          </Text>

          <View style={{ gap: 12 }}>
            {rank.movies?.map((movie, index) => (
              <TouchableOpacity
                key={`${movie.movieId || movie.id}-${index}`}
                onPress={() => router.push(`/movie/${movie.movieId || movie.id}`)}
                style={{
                  backgroundColor: '#27272a',
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.05)'
                }}
                activeOpacity={0.7}
              >
                {/* Rank Number */}
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: '#10b981',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>
                    {movie.rank || index + 1}
                  </Text>
                </View>

                {/* Poster */}
                <Image
                  source={{
                    uri: movie.posterPath || movie.poster_path
                      ? `https://image.tmdb.org/t/p/w200${movie.posterPath || movie.poster_path}`
                      : 'https://via.placeholder.com/200x300/374151/9ca3af?text=No+Image'
                  }}
                  style={{ width: 60, height: 84, borderRadius: 8, backgroundColor: '#374151' }}
                  resizeMode="cover"
                />

                {/* Movie Info */}
                <View style={{ flex: 1 }}>
                  <Text 
                    style={{ fontSize: 16, fontWeight: '600', color: '#fafafa', marginBottom: 4 }}
                    numberOfLines={2}
                  >
                    {movie.title}
                  </Text>
                  {movie.year && (
                    <Text style={{ fontSize: 14, color: '#6b7280' }}>
                      {movie.year}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* COMMENTS SECTION */}
        <View style={{ padding: 20, paddingTop: 0 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#fafafa', marginBottom: 16 }}>
            Comments ({rank.comments?.length || 0})
          </Text>

          {rank.comments?.length === 0 ? (
            <View style={{
              padding: 32,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: '#374151',
              borderRadius: 12,
              alignItems: 'center'
            }}>
              <MessageCircle color="#6b7280" size={32} style={{ marginBottom: 8 }} />
              <Text style={{ color: '#6b7280', fontStyle: 'italic' }}>
                No comments yet. Start the discussion!
              </Text>
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              {rank.comments.map(comment => (
                <View key={comment._id} style={{ flexDirection: 'row', gap: 12 }}>
                  <Avatar user={comment.user} size={36} />
                  
                  <View style={{ flex: 1 }}>
                    {/* Comment Content */}
                    <View style={{
                      backgroundColor: '#27272a',
                      borderRadius: 12,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.05)'
                    }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <TouchableOpacity onPress={() => router.push(`/profile/${comment.user?.username}`)}>
                            <Text style={{ color: '#fafafa', fontWeight: '600', fontSize: 14 }}>
                              {comment.user?.username}
                            </Text>
                          </TouchableOpacity>
                          <Text style={{ color: '#6b7280', fontSize: 12 }}>
                            {timeAgo(comment.createdAt)}
                          </Text>
                        </View>

                        {/* Edit/Delete Actions */}
                        {(user && comment.user && (userId === comment.user._id || isOwner)) && (
                          <View style={{ flexDirection: 'row', gap: 12 }}>
                            {editingCommentId === comment._id ? (
                              <>
                                <TouchableOpacity onPress={() => handleEditComment(comment._id)}>
                                  <Text style={{ color: '#10b981', fontSize: 12, fontWeight: '600' }}>Save</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => { setEditingCommentId(null); setEditingCommentText(''); }}>
                                  <Text style={{ color: '#6b7280', fontSize: 12 }}>Cancel</Text>
                                </TouchableOpacity>
                              </>
                            ) : (
                              <>
                                {userId === comment.user._id && (
                                  <TouchableOpacity onPress={() => {
                                    setEditingCommentId(comment._id);
                                    setEditingCommentText(comment.text);
                                  }}>
                                    <Pencil color="#9ca3af" size={14} />
                                  </TouchableOpacity>
                                )}
                                <TouchableOpacity onPress={() => handleDeleteComment(comment._id)}>
                                  <Trash2 color="#ef4444" size={14} />
                                </TouchableOpacity>
                              </>
                            )}
                          </View>
                        )}
                      </View>

                      {editingCommentId === comment._id ? (
                        <TextInput
                          value={editingCommentText}
                          onChangeText={setEditingCommentText}
                          multiline
                          style={{
                            color: '#fafafa',
                            fontSize: 14,
                            backgroundColor: '#18181b',
                            padding: 8,
                            borderRadius: 8,
                            minHeight: 60
                          }}
                        />
                      ) : (
                        <Text style={{ color: '#d1d5db', fontSize: 14, lineHeight: 20 }}>
                          {comment.text}
                        </Text>
                      )}
                    </View>

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <View style={{ marginTop: 8, marginLeft: 16, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: '#374151', gap: 8 }}>
                        {comment.replies.map(reply => (
                          <View key={reply._id} style={{
                            backgroundColor: 'rgba(39, 39, 42, 0.5)',
                            borderRadius: 8,
                            padding: 10,
                            borderWidth: 1,
                            borderColor: 'rgba(255, 255, 255, 0.02)'
                          }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                                <Avatar user={reply.user} size={20} />
                                <Text style={{ color: '#d1d5db', fontWeight: '600', fontSize: 12 }}>
                                  {reply.user?.username}
                                </Text>
                                <Text style={{ color: '#6b7280', fontSize: 10 }}>
                                  {timeAgo(reply.createdAt)}
                                </Text>
                              </View>
                              {(user && reply.user && (userId === reply.user._id || isOwner)) && (
                                <TouchableOpacity onPress={() => handleDeleteReply(comment._id, reply._id)}>
                                  <Trash2 color="#ef4444" size={12} />
                                </TouchableOpacity>
                              )}
                            </View>
                            <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 4 }}>
                              {reply.text}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Reply Button & Input */}
                    <TouchableOpacity
                      onPress={() => setReplyBoxes(prev => ({
                        ...prev,
                        [comment._id]: prev[comment._id] === undefined ? '' : undefined
                      }))}
                      style={{ marginTop: 6, marginLeft: 4 }}
                    >
                      <Text style={{ color: '#6b7280', fontSize: 12, fontWeight: '600' }}>
                        Reply
                      </Text>
                    </TouchableOpacity>

                    {replyBoxes[comment._id] !== undefined && (
                      <View style={{ marginTop: 8, flexDirection: 'row', gap: 8 }}>
                        <TextInput
                          value={replyBoxes[comment._id]}
                          onChangeText={text => setReplyBoxes(prev => ({ ...prev, [comment._id]: text }))}
                          placeholder="Write a reply..."
                          placeholderTextColor="#6b7280"
                          style={{
                            flex: 1,
                            backgroundColor: '#18181b',
                            borderWidth: 1,
                            borderColor: '#374151',
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            color: '#fafafa',
                            fontSize: 14
                          }}
                        />
                        <TouchableOpacity
                          onPress={() => handlePostReply(comment._id)}
                          style={{
                            backgroundColor: '#10b981',
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            borderRadius: 8,
                            justifyContent: 'center'
                          }}
                        >
                          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>Post</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* FIXED BOTTOM COMMENT INPUT */}
      <View style={{
        backgroundColor: '#27272a',
        borderTopWidth: 1,
        borderTopColor: '#374151',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: Platform.OS === 'ios' ? 32 : 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8
      }}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <TextInput
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Add a comment..."
            placeholderTextColor="#6b7280"
            multiline
            autoCorrect
            style={{
              flex: 1,
              backgroundColor: '#18181b',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: '#374151',
              paddingHorizontal: 16,
              paddingVertical: 10,
              color: '#fafafa',
              fontSize: 14,
              maxHeight: 100,
              minHeight: 40
            }}
          />
          <TouchableOpacity
            onPress={handleComment}
            style={{
              backgroundColor: '#10b981',
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#10b981',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 4
            }}
          >
            <Send color="#fff" size={18} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
