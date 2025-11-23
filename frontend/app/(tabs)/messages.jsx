import React, { useEffect, useState, useRef, useCallback, useContext } from 'react'; // <-- Added useContext
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  RefreshControl,
  Button // <-- Added Button for login prompt
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { AuthContext } from '../../src/context/AuthContext'; // Import AuthContext
import Avatar from '../../components/Avatar';
import * as api from '../../src/api';
import { useScrollToTop } from './_layout';
import { Ionicons } from '@expo/vector-icons';

const MessagesScreen = () => {
  const router = useRouter();
  const listRef = useRef(null);
  const { registerScrollRef } = useScrollToTop();
  const { user } = useContext(AuthContext); // <-- Get user from context
  
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    registerScrollRef('messages', listRef);
  }, [registerScrollRef]);

  const loadConversations = async () => {
    if (!user) return; // <-- Don't fetch if not logged in
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

  // Reload when screen comes into focus
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

  // ... [keep formatTime and renderItem functions exactly as they were] ...
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.chatItem, item.unreadCount > 0 && styles.unreadItem]}
      onPress={() => router.push(`/chat/${item.otherUser.username}`)}
    >
      <Avatar user={item.otherUser} size={50} />
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={[styles.username, item.unreadCount > 0 && styles.unreadText]}>
            {item.otherUser.username}
          </Text>
          <Text style={[styles.time, item.unreadCount > 0 && styles.unreadTime]}>
            {item.lastMessage && formatTime(item.lastMessage.createdAt)}
          </Text>
        </View>
        <View style={styles.messagePreviewRow}>
          <Text 
            style={[styles.messagePreview, item.unreadCount > 0 && styles.unreadPreview]} 
            numberOfLines={1}
          >
            {item.lastMessage?.sender === item.otherUser._id ? '' : 'You: '}
            {item.lastMessage?.content || 'Sent an attachment'}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // --- LOGIN GUARD ---
  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="lock-closed-outline" size={64} color="#4b5563" />
          <Text style={styles.emptyText}>Login Required</Text>
          <Text style={styles.emptySubtext}>Please log in to view your messages.</Text>
          <TouchableOpacity 
            style={{ marginTop: 20, backgroundColor: '#10b981', padding: 12, borderRadius: 8 }}
            onPress={() => router.push('/login')}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={conversations}
        keyExtractor={item => item.otherUser._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color="#4b5563" />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubtext}>Start a conversation from a user's profile</Text>
          </View>
        }
      />
    </View>
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
  listContent: {
    paddingTop: 100,
    paddingBottom: 100,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
    alignItems: 'center',
  },
  unreadItem: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  chatContent: {
    flex: 1,
    marginLeft: 12,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f3f4f6',
  },
  unreadText: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
  time: {
    fontSize: 12,
    color: '#9ca3af',
  },
  unreadTime: {
    color: '#10b981',
    fontWeight: '600',
  },
  messagePreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messagePreview: {
    fontSize: 14,
    color: '#9ca3af',
    flex: 1,
    marginRight: 8,
  },
  unreadPreview: {
    color: '#e5e7eb',
    fontWeight: '500',
  },
  badge: {
    backgroundColor: '#10b981',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#f3f4f6',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default MessagesScreen;