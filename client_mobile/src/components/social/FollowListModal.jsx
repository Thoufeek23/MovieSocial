import React, { useState, useContext } from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, Pressable, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Avatar from '../Avatar';
import * as api from '../../api';
import { AuthContext } from '../../context/AuthContext';

const FollowListModal = ({ isOpen, onClose, title = 'Users', users = [], currentUser = null }) => {
  const router = useRouter();
  const { setUser } = useContext(AuthContext);

  // Helper to build a Set of IDs/Usernames the current user is already following
  const buildFollowingKeys = (following = []) => {
    const keys = [];
    (following || []).forEach(f => {
      if (!f) return;
      if (typeof f === 'string') {
        keys.push(String(f));
      } else {
        if (f._id) keys.push(String(f._id));
        if (f.username) keys.push(f.username);
      }
    });
    return keys.filter(Boolean);
  };

  const [localFollowing, setLocalFollowing] = useState(() => new Set(buildFollowingKeys((currentUser && currentUser.following) || [])));

  const handleFollow = async (u) => {
    if (!currentUser) {
        Alert.alert("Login Required", "Please log in to follow users.");
        onClose();
        router.push('/login');
        return;
    }

    try {
        await api.followUser(u.username);
        
        // Optimistic Update: Hide the button immediately
        setLocalFollowing(prev => {
            const nxt = new Set(prev);
            if (u.username) nxt.add(u.username);
            if (u._id) nxt.add(String(u._id));
            return nxt;
        });

        // Update global Auth Context so the change persists
        if (setUser && currentUser) {
            const updated = { ...currentUser };
            updated.following = updated.following ? [...updated.following] : [];
            const idKey = u._id ? String(u._id) : null;
            if (idKey && !updated.following.map(String).includes(idKey)) {
                updated.following.push(idKey);
            }
            setUser(updated);
        }
    } catch (err) {
        Alert.alert("Error", "Failed to follow user");
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/60 justify-center items-center p-4" onPress={onClose}>
        <Pressable className="bg-card w-full max-w-sm rounded-xl border border-border p-4 shadow-lg h-96" onPress={(e) => e.stopPropagation()}>
          
          {/* Header */}
          <View className="flex-row items-center justify-between mb-2 border-b border-border pb-3">
            <View>
                <Text className="text-lg font-bold text-white">{title}</Text>
                <Text className="text-xs text-gray-400">{users.length} {users.length === 1 ? 'user' : 'users'}</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Feather name="x" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* List */}
          {users.length === 0 ? (
            <View className="flex-1 justify-center items-center">
              <Text className="text-gray-500">No users to show.</Text>
            </View>
          ) : (
            <FlatList
              data={users}
              keyExtractor={(item) => item._id || item.username}
              renderItem={({ item }) => (
                <Link href={`/profile/${item.username}`} asChild>
                  <TouchableOpacity onPress={onClose} className="flex-row items-center justify-between p-3 border-b border-white/5 active:bg-zinc-800 rounded-lg">
                    <View className="flex-row items-center gap-3 flex-1">
                        <Avatar username={item.username} avatar={item.avatar} sizeClass="w-10 h-10" />
                        <View>
                            <Text className="text-base font-bold text-gray-200">{item.username}</Text>
                            <Text className="text-xs text-gray-500">@{item.username}</Text>
                        </View>
                    </View>

                    {/* Follow Button (Only in Followers list and if not already following) */}
                    {title === 'Followers' && !localFollowing.has(item.username) && !localFollowing.has(String(item._id)) && (
                        <TouchableOpacity 
                            onPress={(e) => {
                                e.stopPropagation(); // Prevent navigation
                                handleFollow(item);
                            }}
                            className="bg-zinc-800 border border-primary px-3 py-1.5 rounded-full"
                        >
                            <Text className="text-primary text-xs font-bold">Follow</Text>
                        </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                </Link>
              )}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default FollowListModal;