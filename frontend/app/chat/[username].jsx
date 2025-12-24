import React, { useEffect, useState, useRef, useContext, useMemo } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  Image,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../src/context/AuthContext';
import * as api from '../../src/api';
import Avatar from '../../components/Avatar';
import ReviewCard from '../../components/ReviewCard';
import DiscussionCard from '../../components/DiscussionCard';
import { io } from 'socket.io-client';

const ChatScreen = () => {
  const { username } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const socketRef = useRef(null);
  const currentChatRef = useRef(username);
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  
  const flatListRef = useRef(null);

  // Initialize Socket.io
  useEffect(() => {
    if (!user) return;

    // Use the same API URL as the rest of the app
    const getApiUrl = () => {
      if (process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL.replace(/\/$/,'');
      }
      return "https://moviesocial-backend-khd2.onrender.com";
      //return "http://192.168.1.42:5001"; // Uncomment for local development
    };
    
    const apiUrl = getApiUrl();
    socketRef.current = io(apiUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    const userId = user._id || user.id;
    socketRef.current.emit('join_room', userId);

    // Listen for incoming messages in this chat
    socketRef.current.on('receive_message', (incomingMsg) => {
      const senderUsername = incomingMsg.sender?.username;
      const isFromCurrentChat = senderUsername === username;

      if (isFromCurrentChat) {
        setMessages(prev => [...prev, incomingMsg]);
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user, username]);

  useEffect(() => {
    currentChatRef.current = username;
  }, [username]);

  useEffect(() => {
    const initChat = async () => {
      try {
        const [profileRes, msgsRes] = await Promise.all([
          api.getUserProfile(username),
          api.getMessages(username)
        ]);
        
        setOtherUser(profileRes.data);
        setMessages(msgsRes.data);
        
        // Mark messages as read
        await api.markMessagesRead(username);
      } catch (error) {
        console.error('Error loading chat:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (username) initChat();
  }, [username]);

  // Format date like client (Today, Yesterday, etc)
  const formatDateHeader = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (messageDate.getTime() === today.getTime()) return 'Today';
    if (messageDate.getTime() === yesterday.getTime()) return 'Yesterday';
    return date.toLocaleDateString();
  };

  // Group messages by date for sticky headers
  const groupedMessages = useMemo(() => {
    const groups = [];
    let currentDate = null;
    
    messages.forEach(msg => {
      const msgDate = new Date(msg.createdAt).toDateString();
      if (msgDate !== currentDate) {
        groups.push({ type: 'date', date: msgDate, _id: `date-${msgDate}` });
        currentDate = msgDate;
      }
      groups.push(msg);
    });
    return groups;
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const tempId = Date.now().toString();
    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    const optimisticMsg = {
      _id: tempId,
      content: content,
      sender: { _id: user._id || user.id, username: user.username, avatar: user.avatar },
      createdAt: new Date().toISOString(),
      isOptimistic: true
    };
    
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const { data } = await api.sendMessage(username, content);
      setMessages(prev => prev.map(m => m._id === tempId ? data : m));
    } catch (error) {
      console.error('Send failed', error);
      setMessages(prev => prev.filter(m => m._id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setMessages(prev => prev.filter(m => m._id !== msgId));
              await api.deleteMessage(msgId);
            } catch (error) {
              console.error('Failed to delete message', error);
              Alert.alert('Error', 'Failed to delete message');
            }
          }
        }
      ]
    );
  };

  const renderMessage = ({ item }) => {
    if (item.type === 'date') {
      return (
        <View style={styles.dateHeader}>
          <Text style={styles.dateText}>{formatDateHeader(item.date)}</Text>
        </View>
      );
    }

    const isMe = (item.sender?._id || item.sender) === (user?._id || user?.id);
    const showAvatar = !isMe; 

    return (
      <View style={[styles.messageRow, isMe ? styles.myMessageRow : styles.theirMessageRow]}>
        {showAvatar && (
          <TouchableOpacity onPress={() => router.push(`/profile/${username}`)}>
            <Avatar user={otherUser} size={28} style={styles.messageAvatar} />
          </TouchableOpacity>
        )}
        
        <View style={[styles.bubbleContainer, isMe ? styles.myBubbleContainer : styles.theirBubbleContainer]}>
          <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble, item.isOptimistic && styles.optimisticMessage]}>
            
            {/* Shared Content Rendering */}
            {item.sharedReview && (
              <View style={styles.sharedContent}>
                <Text style={[styles.sharedLabel, isMe ? styles.mySharedLabel : styles.theirSharedLabel]}>
                  Shared a Review:
                </Text>
                <View style={{ pointerEvents: 'none' }}> 
                  <ReviewCard review={item.sharedReview} /> 
                </View>
              </View>
            )}

            {item.sharedDiscussion && (
              <View style={styles.sharedContent}>
                <Text style={[styles.sharedLabel, isMe ? styles.mySharedLabel : styles.theirSharedLabel]}>
                  Shared a Discussion:
                </Text>
                <View style={{ pointerEvents: 'none' }}>
                  <DiscussionCard discussion={item.sharedDiscussion} />
                </View>
              </View>
            )}

            {/* Text Content */}
            {item.content ? (
              <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
                {item.content}
              </Text>
            ) : null}

            {/* Metadata (Time + Delete Button) */}
            <View style={styles.metaRow}>
              <Text style={[styles.timestamp, isMe ? styles.myTimestamp : styles.theirTimestamp]}>
                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              {isMe && !item.isOptimistic && (
                <TouchableOpacity 
                  onPress={() => handleDeleteMessage(item._id)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={12} color="#dc2626" />
                </TouchableOpacity>
              )}
              {isMe && item.isOptimistic && (
                <Ionicons 
                  name="time-outline" 
                  size={14} 
                  color="rgba(255,255,255,0.7)" 
                  style={{ marginLeft: 4 }} 
                />
              )}
              {isMe && !item.isOptimistic && (
                <Ionicons 
                  name="checkmark-done" 
                  size={14} 
                  color="rgba(255,255,255,0.7)" 
                  style={{ marginLeft: 4 }} 
                />
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.headerProfile} 
          onPress={() => router.push(`/profile/${username}`)}
        >
          <Avatar user={otherUser} size={36} />
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{username}</Text>
            {otherUser && <Text style={styles.headerSubtitle}>View Profile</Text>}
          </View>
        </TouchableOpacity>
      </View>

      {/* Chat List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={groupedMessages}
          keyExtractor={item => item._id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* Input Area */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.inputContainer}>
          {/* Optional: Add Attachment button here if needed later */}
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Message..."
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]} 
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || sending}
          >
            <Ionicons name="arrow-up" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    zIndex: 10,
  },
  backButton: { marginRight: 12, padding: 4 },
  headerProfile: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerInfo: { marginLeft: 12 },
  headerTitle: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  headerSubtitle: { color: '#9ca3af', fontSize: 12 },
  
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 20 },
  
  // Message Rows
  messageRow: { 
    flexDirection: 'row', 
    marginBottom: 16, 
    width: '100%',
  },
  myMessageRow: { justifyContent: 'flex-end' },
  theirMessageRow: { justifyContent: 'flex-start' },
  
  messageAvatar: { marginRight: 8, alignSelf: 'flex-end', marginBottom: 4 },
  
  bubbleContainer: { maxWidth: '75%' },
  myBubbleContainer: { alignItems: 'flex-end' },
  theirBubbleContainer: { alignItems: 'flex-start' },

  // Bubbles
  bubble: { 
    padding: 12, 
    borderRadius: 18,
    minWidth: 80,
  },
  myBubble: { 
    backgroundColor: '#10b981', // Green
    borderBottomRightRadius: 4,
  },
  theirBubble: { 
    backgroundColor: '#374151', // Dark Gray
    borderBottomLeftRadius: 4,
  },
  optimisticMessage: {
    opacity: 0.7,
  },

  // Text
  messageText: { fontSize: 16, lineHeight: 22 },
  myMessageText: { color: 'white' },
  theirMessageText: { color: '#f3f4f6' },

  // Meta (Time + Icon + Delete)
  metaRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'flex-end', 
    marginTop: 4,
    opacity: 0.8,
    gap: 4
  },
  timestamp: { fontSize: 10 },
  myTimestamp: { color: 'rgba(255,255,255,0.9)' },
  theirTimestamp: { color: '#9ca3af' },
  deleteButton: {
    padding: 4,
  },

  // Shared Content
  sharedContent: { marginBottom: 8 },
  sharedLabel: { fontSize: 12, marginBottom: 4, fontWeight: '600' },
  mySharedLabel: { color: 'rgba(255,255,255,0.9)' },
  theirSharedLabel: { color: '#9ca3af' },

  // Date Header
  dateHeader: { alignItems: 'center', marginVertical: 16 },
  dateText: { 
    color: '#9ca3af', 
    fontSize: 12, 
    backgroundColor: '#1f2937', 
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    borderRadius: 10,
    overflow: 'hidden'
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    backgroundColor: 'rgba(31, 41, 55, 0.95)',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4b5563',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10,
    color: 'white',
    maxHeight: 100,
    minHeight: 44,
    marginRight: 10,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#10b981',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#4b5563',
    opacity: 0.5,
  },
});

export default ChatScreen;