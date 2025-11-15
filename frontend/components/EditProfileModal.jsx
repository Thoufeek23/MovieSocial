import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Avatar from './Avatar';
import * as api from '../src/api';

const EditProfileModal = ({ visible, profile, onClose, onUpdated }) => {
  const [bio, setBio] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [country, setCountry] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Update local state when profile changes
  useEffect(() => {
    if (profile) {
      setBio(profile.bio || '');
      setAvatarPreview(profile.avatar || '');
      setCountry(profile.country || '');
      setStateRegion(profile.state || '');
    }
  }, [profile]);

  // Handle avatar selection
  const handleAvatarSelect = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Check file size (approximate, since we're using base64)
        const base64String = `data:${asset.type || 'image/jpeg'};base64,${asset.base64}`;
        const sizeInBytes = (base64String.length * 3) / 4;
        const maxSize = 2 * 1024 * 1024; // 2MB
        
        if (sizeInBytes > maxSize) {
          Alert.alert('Error', 'Image too large. Please select an image under 2MB.');
          return;
        }
        
        setAvatarPreview(base64String);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  // Handle saving changes
  const handleSave = async () => {
    setIsLoading(true);
    try {
      const payload = {
        bio: bio.trim(),
        country: country.trim(),
        state: stateRegion.trim(),
      };

      // Only include avatar if it's different from the original
      if (avatarPreview && avatarPreview !== profile?.avatar) {
        payload.avatar = avatarPreview;
      }

      await api.updateMyProfile(payload);
      
      // Refetch updated profile
      const { data } = await api.getUserProfile(profile.username);
      
      Alert.alert('Success', 'Profile updated successfully');
      onUpdated?.(data);
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert(
        'Error', 
        error.response?.data?.msg || 'Failed to update profile'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
          <TouchableOpacity 
            onPress={handleSave}
            disabled={isLoading}
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          >
            <Text style={[styles.saveButtonText, isLoading && styles.saveButtonTextDisabled]}>
              {isLoading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Avatar Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Picture</Text>
            <View style={styles.avatarSection}>
              <Avatar 
                user={profile} 
                avatar={avatarPreview}
                size={80} 
                style={styles.avatar} 
              />
              <TouchableOpacity 
                onPress={handleAvatarSelect}
                style={styles.avatarButton}
                disabled={isLoading}
              >
                <Ionicons name="camera" size={20} color="#10b981" />
                <Text style={styles.avatarButtonText}>Change Photo</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>Max 2MB. PNG, JPG, or GIF format.</Text>
          </View>

          {/* Bio Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bio</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textArea}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us a bit about yourself..."
                placeholderTextColor="#6b7280"
                multiline
                maxLength={200}
                textAlignVertical="top"
                editable={!isLoading}
              />
              <Text style={styles.charCount}>{bio.length}/200</Text>
            </View>
          </View>

          {/* Country Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Country</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={country}
                onChangeText={setCountry}
                placeholder="Enter your country"
                placeholderTextColor="#6b7280"
                editable={!isLoading}
              />
            </View>
          </View>

          {/* State/Region Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>State / Region</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={stateRegion}
                onChangeText={setStateRegion}
                placeholder="Enter your state or region"
                placeholderTextColor="#6b7280"
                editable={!isLoading}
              />
            </View>
            <Text style={styles.hint}>Used for regional leaderboards.</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    backgroundColor: '#111827',
  },
  closeButton: {
    padding: 8,
    width: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#10b981',
    minWidth: 90,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#374151',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  saveButtonTextDisabled: {
    color: '#6b7280',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  section: {
    marginTop: 28,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    borderWidth: 2,
    borderColor: '#374151',
  },
  avatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1.5,
    borderColor: '#10b981',
    borderRadius: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10b981',
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#1f2937',
    borderWidth: 1.5,
    borderColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    backgroundColor: '#1f2937',
    borderWidth: 1.5,
    borderColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: 'white',
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  charCount: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    fontSize: 12,
    color: '#6b7280',
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
});

export default EditProfileModal;