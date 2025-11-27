import React, { useEffect, useState, useRef, useCallback, useContext } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { AuthContext } from '../../src/context/AuthContext';
// CHANGED: Corrected import path to src/components/common/Avatar
import Avatar from '../../src/components/common/Avatar';
import * as api from '../../src/api';
import { useScrollToTop } from './_layout';
import { Ionicons } from '@expo/vector-icons';

const MessagesScreen = () => {
  const router = useRouter();
  const listRef = useRef(null);
  const { registerScrollRef } = useScrollToTop();
  const { user } = useContext(AuthContext);
  
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    registerScrollRef('messages', listRef);
  }, [registerScrollRef]);

  const loadConversations = async () => {
    if (!user) return;
    try {
      const { data } = await api.getConversations();
      setConversations(data);
    } catch (error) {
      console.log('Failed to load conversations', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadConversations();
      } else {
        setLoading(false);
      }
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    return isToday ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : date.toLocaleDateString();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      className={`flex-row p-4 border-b border-gray-800 items-center ${item.unreadCount > 0 ? 'bg-emerald-500/5' : ''}`}
      onPress={() => router.push(`/chat/${item.otherUser.username}`)}
    >
      <Avatar user={item.otherUser} size={50} />
      <View className="flex-1 ml-3">
        <View className="flex-row justify-between mb-1">
          <Text className={`text-base text-gray-100 ${item.unreadCount > 0 ? 'font-bold' : 'font-semibold'}`}>
            {item.otherUser.username}
          </Text>
          <Text className={`text-xs ${item.unreadCount > 0 ? 'text-emerald-500 font-semibold' : 'text-gray-400'}`}>
            {item.lastMessage && formatTime(item.lastMessage.createdAt)}
          </Text>
        </View>
        <View className="flex-row justify-between items-center">
          <Text 
            className={`text-sm flex-1 mr-2 ${item.unreadCount > 0 ? 'text-gray-200 font-medium' : 'text-gray-400'}`} 
            numberOfLines={1}
          >
            {item.lastMessage?.sender === item.otherUser._id ? '' : 'You: '}
            {item.lastMessage?.content || 'Sent an attachment'}
          </Text>
          {item.unreadCount > 0 && (
            <View className="bg-emerald-500 rounded-full min-w-[20px] h-5 justify-center items-center px-1.5">
              <Text className="text-white text-[10px] font-bold">{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <View className="flex-1 bg-zinc-950 items-center justify-center pt-24 px-5">
        <View className="items-center">
          <Ionicons name="lock-closed-outline" size={64} color="#4b5563" />
          <Text className="text-gray-100 text-lg font-bold mt-4">Login Required</Text>
          <Text className="text-gray-400 mt-2 text-center">Please log in to view your messages.</Text>
          <TouchableOpacity 
            className="mt-5 bg-emerald-500 px-4 py-3 rounded-xl"
            onPress={() => router.push('/login')}
          >
            <Text className="text-white font-bold">Go to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 bg-zinc-950 justify-center items-center">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-zinc-950">
      <FlatList
        ref={listRef}
        data={conversations}
        keyExtractor={item => item.otherUser._id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingTop: 100, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
        }
        ListEmptyComponent={
          <View className="items-center justify-center pt-24 px-5">
            <Ionicons name="chatbubbles-outline" size={64} color="#4b5563" />
            <Text className="text-gray-100 text-lg font-bold mt-4">No messages yet</Text>
            <Text className="text-gray-400 mt-2 text-center">Start a conversation from a user's profile</Text>
          </View>
        }
      />
    </View>
  );
};

export default MessagesScreen;