import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../src/context/AuthContext';
import * as api from '../../src/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import Avatar from '../../components/Avatar';
import SkeletonLoader, { ProfileHeaderSkeleton } from '../../components/SkeletonLoader';

const DiscussionDetailPage = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useContext(AuthContext);
  
  const [discussion, setDiscussion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [comment, setComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const fetchDiscussion = useCallback(async () => {
    try {
      const response = await api.getDiscussionById(id);
      setDiscussion(response.data);
    } catch (error) {
      console.error("Failed to fetch discussion", error);
      Alert.alert('Error', 'Failed to load discussion');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    fetchDiscussion();
  }, [fetchDiscussion]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDiscussion();
  }, [fetchDiscussion]);

  const handleSubmitComment = async () => {
    if (!comment.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    setIsSubmittingComment(true);
    try {
      await api.addCommentToDiscussion(id, { text: comment.trim() });
      setComment('');
      Alert.alert('Success', 'Comment added successfully!');
      fetchDiscussion();
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', error.response?.data?.msg || 'Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
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
              await api.deleteCommentFromDiscussion(id, commentId);
              Alert.alert('Success', 'Comment deleted.');
              fetchDiscussion();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete comment.');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Discussion</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView style={styles.content} scrollEnabled={false}>
          {/* Title Skeleton */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
            <SkeletonLoader width="100%" height={24} borderRadius={4} style={{ marginBottom: 12 }} />
            
            {/* Starter Skeleton */}
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              <SkeletonLoader width={32} height={32} borderRadius={16} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <SkeletonLoader width={100} height={14} borderRadius={4} style={{ marginBottom: 4 }} />
                <SkeletonLoader width={80} height={12} borderRadius={4} />
              </View>
            </View>

            {/* Content Skeleton */}
            <SkeletonLoader width="100%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
            <SkeletonLoader width="95%" height={14} borderRadius={4} style={{ marginBottom: 20 }} />

            {/* Comments Section */}
            <SkeletonLoader width={150} height={18} borderRadius={4} style={{ marginBottom: 12 }} />
            
            {/* Comment Skeletons */}
            {[1, 2, 3].map((i) => (
              <View key={i} style={{ flexDirection: 'row', marginBottom: 12 }}>
                <SkeletonLoader width={36} height={36} borderRadius={18} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <SkeletonLoader width={120} height={12} borderRadius={4} style={{ marginBottom: 6 }} />
                  <SkeletonLoader width="100%" height={12} borderRadius={4} style={{ marginBottom: 6 }} />
                  <SkeletonLoader width="80%" height={12} borderRadius={4} />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!discussion) {
    return (
      <View style={styles.errorContainer}>
        <EmptyState
          title="Discussion not found"
          subtitle="The discussion you're looking for doesn't exist"
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Discussion</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Discussion Header */}
        <View style={styles.discussionHeader}>
          <Text style={styles.discussionTitle}>{discussion.title}</Text>
          {discussion.starter && (
            <View style={styles.discussionMeta}>
              <Avatar user={discussion.starter} size={32} />
              <View style={styles.discussionMetaText}>
                <Text style={styles.starterName}>{discussion.starter.username}</Text>
                <Text style={styles.discussionDate}>
                  {formatDate(discussion.createdAt)}
                </Text>
              </View>
            </View>
          )}
          {discussion.content && (
            <Text style={styles.discussionContent}>{discussion.content}</Text>
          )}
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>
            Comments ({discussion.comments?.length || 0})
          </Text>
          
          {discussion.comments && discussion.comments.length > 0 ? (
            <View style={styles.commentsList}>
              {discussion.comments
                .filter(c => c && c.user) // Filter out comments with null user
                .map((comment) => (
                <View key={comment._id} style={styles.commentCard}>
                  <Avatar user={comment.user} size={36} />
                  <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentUserName}>
                        {comment.user.username}
                      </Text>
                      <Text style={styles.commentDate}>
                        {formatDate(comment.createdAt)}
                      </Text>
                      {user && comment.user && String(comment.user._id) === String(user.id) && (
                        <TouchableOpacity
                          onPress={() => handleDeleteComment(comment._id)}
                          style={styles.deleteCommentButton}
                        >
                          <Ionicons name="trash-outline" size={16} color="#dc2626" />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.commentText}>{comment.text}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              title="No comments yet"
              subtitle="Be the first to comment on this discussion!"
              icon="chatbubbles-outline"
            />
          )}
        </View>
      </ScrollView>

      {/* Comment Input */}
      {user && (
        <View style={styles.commentInputContainer}>
          <View style={styles.commentInputRow}>
            <Avatar user={user} size={36} />
            <TextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
              placeholder="Add a comment..."
              placeholderTextColor="#6b7280"
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              onPress={handleSubmitComment}
              disabled={isSubmittingComment || !comment.trim()}
              style={[
                styles.submitCommentButton,
                (!comment.trim() || isSubmittingComment) && styles.submitCommentButtonDisabled
              ]}
            >
              <Ionicons 
                name={isSubmittingComment ? "hourglass-outline" : "send"} 
                size={20} 
                color="white" 
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#09090b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#09090b',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  discussionHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  discussionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    lineHeight: 28,
  },
  discussionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  discussionMetaText: {
    flex: 1,
  },
  starterName: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  discussionDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  discussionContent: {
    fontSize: 15,
    color: '#d1d5db',
    lineHeight: 22,
  },
  commentsSection: {
    padding: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  commentsList: {
    gap: 16,
  },
  commentCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  commentContent: {
    flex: 1,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  commentDate: {
    fontSize: 12,
    color: '#9ca3af',
    flex: 1,
  },
  deleteCommentButton: {
    padding: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
  },
  commentInputContainer: {
    backgroundColor: '#1f2937',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: 'white',
    fontSize: 14,
    maxHeight: 100,
  },
  submitCommentButton: {
    backgroundColor: '#10b981',
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitCommentButtonDisabled: {
    backgroundColor: '#6b7280',
  },
});

export default DiscussionDetailPage;