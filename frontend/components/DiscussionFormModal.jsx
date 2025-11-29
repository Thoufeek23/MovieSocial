import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as api from '../src/api';

const DiscussionFormModal = ({ visible, onClose, movie, onDiscussionCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a discussion title');
      return;
    }

    if (!content.trim()) {
      Alert.alert('Error', 'Please enter discussion content');
      return;
    }

    setIsSubmitting(true);
    try {
      const discussionData = {
        title: title.trim(),
        content: content.trim(),
        movieId: movie.id,
      };

      await api.createDiscussion(discussionData);
      Alert.alert('Success', 'Discussion started successfully!');
      
      // Reset form
      setTitle('');
      setContent('');
      
      onDiscussionCreated();
      onClose();
    } catch (error) {
      console.error('Error creating discussion:', error);
      Alert.alert('Error', error.response?.data?.msg || 'Failed to start discussion');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Start Discussion</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Creating...' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.movieInfo}>
            <Text style={styles.movieTitle}>{movie?.title}</Text>
            <Text style={styles.movieYear}>
              {movie?.release_date?.substring(0, 4)}
            </Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.fieldLabel}>Discussion Title:</Text>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="What would you like to discuss about this movie?"
              placeholderTextColor="#6b7280"
              maxLength={200}
            />
            <Text style={styles.characterCount}>
              {title.length}/200 characters
            </Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.fieldLabel}>Discussion Content:</Text>
            <TextInput
              style={styles.contentInput}
              value={content}
              onChangeText={setContent}
              placeholder="Share your thoughts, theories, or questions about this movie..."
              placeholderTextColor="#6b7280"
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              maxLength={2000}
            />
            <Text style={styles.characterCount}>
              {content.length}/2000 characters
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#6b7280',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  movieInfo: {
    marginBottom: 24,
    alignItems: 'center',
  },
  movieTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 4,
  },
  movieYear: {
    fontSize: 16,
    color: '#9ca3af',
  },
  formSection: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  titleInput: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    color: 'white',
    fontSize: 16,
    maxLength: 200,
  },
  contentInput: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    color: 'white',
    fontSize: 16,
    minHeight: 200,
    maxLength: 2000,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 8,
  },
});

export default DiscussionFormModal;