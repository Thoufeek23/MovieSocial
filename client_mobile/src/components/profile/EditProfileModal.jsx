import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Modal, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import Avatar from '../Avatar';
import * as api from '../../api';

const EditProfileModal = ({ isOpen, onClose, profile, onUpdated }) => {
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar || '');
  const [interests, setInterests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const availableInterests = [
    { name: 'English', flag: '🇺🇸' },
    { name: 'Hindi', flag: '🇮🇳' },
    { name: 'Tamil', flag: '🇮🇳' },
    { name: 'Malayalam', flag: '🇮🇳' },
    { name: 'Telugu', flag: '🇮🇳' },
    { name: 'Kannada', flag: '🇮🇳' },
    { name: 'Korean', flag: '🇰🇷' },
    { name: 'French', flag: '🇫🇷' },
    { name: 'Spanish', flag: '🇪🇸' }
  ];

  useEffect(() => {
    if (profile) {
      setBio(profile.bio || '');
      setAvatarPreview(profile.avatar || '');
      setInterests(profile.interests || []);
    }
  }, [profile]);

  const handleInterestToggle = (languageName) => {
    if (interests.includes(languageName)) {
      setInterests(interests.filter(interest => interest !== languageName));
    } else {
      if (interests.length < 3) {
        setInterests([...interests, languageName]);
      } else {
        Alert.alert("Limit Reached", "You can only select up to 3 interests.");
      }
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        // Construct data URL for API
        const dataUrl = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setAvatarPreview(dataUrl);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const save = async () => {
    setIsLoading(true);
    try {
      const payload = {
        bio,
        interests: interests.slice(0, 3),
      };
      
      if (avatarPreview !== profile?.avatar) {
        payload.avatar = avatarPreview;
      }

      await api.updateMyProfile(payload);
      const { data } = await api.getUserProfile(profile.username);
      
      Alert.alert("Success", "Profile updated");
      if (onUpdated) onUpdated(data);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.msg || 'Failed to update profile';
      Alert.alert("Error", msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/80 justify-end sm:justify-center">
        <View className="bg-card w-full h-[90%] rounded-t-2xl sm:rounded-xl sm:h-auto sm:max-w-2xl sm:m-4 flex flex-col border border-border">
          
          {/* Header */}
          <View className="flex-row justify-between items-center p-4 border-b border-border bg-background/50">
            <Text className="text-xl font-bold text-white">Edit Profile</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Feather name="x" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <ScrollView className="p-4 flex-1">
            {/* Avatar Section */}
            <View className="flex-row items-center gap-5 mb-6">
              <Avatar 
                username={profile?.username} 
                avatar={avatarPreview} 
                sizeClass="w-20 h-20" 
                className="border-2 border-border" 
              />
              <View>
                <TouchableOpacity 
                  onPress={pickImage}
                  className="bg-primary/20 px-4 py-2 rounded-full border border-primary/30"
                >
                  <Text className="text-primary font-bold text-sm">Change Avatar</Text>
                </TouchableOpacity>
                <Text className="text-xs text-gray-500 mt-2">Max 2MB. JPG, PNG.</Text>
              </View>
            </View>

            {/* Interests Section */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-300 mb-2">Interests</Text>
              <Text className="text-xs text-gray-500 mb-3">Select up to 3 movie languages</Text>
              
              <View className="flex-row flex-wrap gap-2">
                {availableInterests.map((language) => {
                  const isSelected = interests.includes(language.name);
                  const isDisabled = !isSelected && interests.length >= 3;

                  return (
                    <TouchableOpacity
                      key={language.name}
                      onPress={() => handleInterestToggle(language.name)}
                      disabled={isDisabled}
                      className={`
                        flex-row items-center gap-2 px-3 py-2 rounded-lg border
                        ${isSelected ? 'bg-green-900/30 border-green-500' : 'bg-zinc-800 border-zinc-700'}
                        ${isDisabled ? 'opacity-50' : ''}
                      `}
                    >
                      <Text className="text-base">{language.flag}</Text>
                      <Text className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                        {language.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text className="text-xs text-gray-500 mt-2 text-right">{interests.length}/3 selected</Text>
            </View>

            {/* Bio Section */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-300 mb-2">Bio</Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                maxLength={200}
                multiline
                numberOfLines={4}
                placeholder="Tell us a bit about yourself..."
                placeholderTextColor="#6b7280"
                className="w-full bg-input border border-border rounded-lg p-3 text-white text-base h-24"
                textAlignVertical="top"
              />
              <Text className="text-xs text-gray-500 mt-1 text-right">{bio.length}/200</Text>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View className="p-4 border-t border-border flex-row justify-end gap-3 bg-background/50">
            <TouchableOpacity 
              onPress={onClose}
              className="px-5 py-3 rounded-lg bg-zinc-700"
              disabled={isLoading}
            >
              <Text className="text-white font-bold">Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={save}
              disabled={isLoading}
              className="px-5 py-3 rounded-lg bg-primary flex-row items-center"
            >
              {isLoading && <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />}
              <Text className="text-primary-foreground font-bold">
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};

export default EditProfileModal;