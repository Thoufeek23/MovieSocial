import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Pressable
} from 'react-native';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { io } from 'socket.io-client';
import { AuthContext } from '../../src/context/AuthContext';
import * as api from '../../src/api';
import Avatar from '../../components/common/Avatar';

// --- Helper: Get API URL for Socket ---
const getSocketUrl = () => {
  // Matches the logic in src/api/index.js usually, or defaults to local
  return "http://192.168.68.88:5001"; // Replace with your actual backend URL or env var
};

// --- Shared Content Components ---

const SharedReviewCard = ({ review }) => {
  if (!review) return null;
  return (
    <Link href={`/movie/${review.movieId}`} asChild>
      <TouchableOpacity className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden mt-2 mb-1 w-64 shadow-sm">
        <View className="flex-row p-3 gap-3">
          <Image
            source={review.moviePoster ? { uri: `https://image.tmdb.org/t/p/w154${review.moviePoster}` } : require('../../assets/images/default_dp.png')}
            className="w-10 h-16 rounded object-cover bg-gray-700"
          />
          <View className="flex-1 justify-center">
            <Text className="text-white font-bold text-sm mb-1" numberOfLines={1}>{review.movieTitle}</Text>
            <View className="flex-row items-center gap-1 mb-1">
              <Ionicons name="star" size={12} color="#eab308" />
              <Text className="text-yellow-500 text-xs font-bold">{review.rating}/5</Text>
            </View>
            <Text className="text-gray-400 text-xs italic line-clamp-2" numberOfLines={2}>"{review.text}"</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
};

const SharedDiscussionCard = ({ discussion }) => {
  if (!discussion) return null;
  return (
    <Link href={`/discussion/${discussion._id}`} asChild>
      <TouchableOpacity className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden mt-2 mb-1 w-64 shadow-sm">
        <View className="flex-row p-3 gap-3">
          <Image
            source={discussion.poster_path ? { uri: `https://image.tmdb.org/t/p/w154${discussion.poster_path}` } : require('../../assets/images/default_dp.png')}
            className="w-10 h-14 rounded object-cover bg-gray-700"
          />
          <View className="flex-1 justify-center">
            <Text className="text-white font-semibold text-sm mb-1" numberOfLines={2}>{discussion.title}</Text>
            <Text className="text-green-400 text-xs font-medium mb-1" numberOfLines={1}>{discussion.movieTitle}</Text>
            <View className="flex-row items-center gap-1">
              <Avatar user={discussion.starter} size={14} />
              <Text className="text-gray-500 text-[10px]">{discussion.starter?.username}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
};

const SharedRankCard = ({ rank }) => {
  if (!rank) return null;
  const previewMovies = rank.movies?.slice(0, 3) || [];
  
  return (
    <Link href={`/rank/${rank._id}`} asChild>
      <TouchableOpacity className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden mt-2 mb-1 w-64 shadow-sm p-3">
        <View className="flex-row justify-between items-start mb-2">
          <Text className="text-white font-bold text-sm flex-1 mr-2" numberOfLines={1}>{rank.title}</Text>
          <View className="bg-green-900/30 border border-green-800/30 px-1.5 py-0.5 rounded">
            <Text className="text-green-400 text-[10px]">{rank.movies?.length || 0} items</Text>
          </View>
        </View>
        
        <View className="flex-row gap-1">
          {previewMovies.map((movie, i) => (
            <View key={i} className="relative w-9 h-14 bg-gray-700 rounded overflow-hidden">
              <Image
                source={movie.posterPath ? { uri: `https://image.tmdb.org/t/p/w154${movie.posterPath}` } : require('../../assets/images/default_dp.png')}
                className="w-full h-full object-cover"
              />
            </View>
          ))}
          {rank.movies?.length > 3 && (
            <View className="w-9 h-14 bg-gray-800 rounded border border-gray-700 border-dashed items-center justify-center">
              <Text className="text-gray-500 text-[10px] font-bold">+{rank.movies.length - 3}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Link>
  );
};

// --- Main Component ---

export default function ChatScreen() {
  const { username } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useContext(AuthContext);
  
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  
  const flatListRef = useRef(null);
  const socketRef = useRef(null);

  // 1. Initialize Socket & Fetch Data
  useEffect(() => {
    const initChat = async () => {
      try {
        // Load Messages
        const [msgRes, userRes] = await Promise.all([
          api.getMessages(username),
          api.getUserProfile(username) // Fetch header info
        ]);
        
        setMessages(msgRes.data);
        setOtherUser(userRes.data);
        
        // Mark Read
        await api.markMessagesRead(username);

        // Connect Socket
        const socketUrl = getSocketUrl();
        socketRef.current = io(socketUrl);
        
        if (user?._id || user?.id) {
          socketRef.current.emit("join_room", user._id || user.id);
        }

        socketRef.current.on("receive_message", (incomingMsg) => {
          // Only add if it belongs to this chat
          const senderUsername = incomingMsg.sender.username;
          if (senderUsername === username) {
            setMessages(prev => [...prev, incomingMsg]);
            // Mark as read immediately if looking at screen
            api.markMessagesRead(username);
          }
        });

      } catch (error) {
        console.error("Chat init failed:", error);
      } finally {
        setLoading(false);
      }
    };

    initChat();

    return () => {
      socketRef.current?.disconnect();
    };
  }, [username, user]);

  // 2. Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || sending) return;
    
    const content = inputText.trim();
    setInputText('');
    setSending(true);

    // Optimistic Update
    const tempId = Date.now().toString();
    const optimisticMsg = {
      _id: tempId,
      content: content,
      sender: { _id: user._id || user.id, username: user.username },
      createdAt: new Date().toISOString(),
      isOptimistic: true
    };
    
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      // API Call (Updated to match backend controller expectation)
      // The backend expects { recipientId: username, content: ... }
      const { data: sentMsg } = await api.sendMessage(username, content);
      
      // Replace optimistic message
      setMessages(prev => prev.map(m => m._id === tempId ? sentMsg : m));
    } catch (error) {
      console.error("Send failed", error);
      // Remove optimistic message on failure or show error
      setMessages(prev => prev.filter(m => m._id !== tempId));
      setInputText(content); // Restore text
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = ({ item }) => {
    // Determine if message is from current user
    const myId = user?._id || user?.id;
    const senderId = typeof item.sender === 'object' ? (item.sender._id || item.sender.id) : item.sender;
    const isOwn = String(senderId) === String(myId);

    return (
      <View className={`mb-3 flex-row ${isOwn ? 'justify-end' : 'justify-start'}`}>
        {/* Avatar for other user */}
        {!isOwn && (
          <View className="mr-2 justify-end">
            <Avatar user={item.sender} size={30} />
          </View>
        )}

        <View 
          className={`px-4 py-2.5 rounded-2xl max-w-[80%] ${
            isOwn 
              ? 'bg-emerald-600 rounded-br-sm' 
              : 'bg-gray-800 rounded-bl-sm'
          } ${item.isOptimistic ? 'opacity-70' : 'opacity-100'}`}
        >
          {item.content ? (
            <Text className={`text-[15px] ${isOwn ? 'text-white' : 'text-gray-100'}`}>
              {item.content}
            </Text>
          ) : null}

          {/* Shared Content Cards */}
          {item.sharedReview && <SharedReviewCard review={item.sharedReview} />}
          {item.sharedDiscussion && <SharedDiscussionCard discussion={item.sharedDiscussion} />}
          {item.sharedRank && <SharedRankCard rank={item.sharedRank} />}

          <Text className={`text-[10px] mt-1 self-end ${isOwn ? 'text-emerald-200' : 'text-gray-500'}`}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-800 flex-row items-center gap-3 bg-zinc-950">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        {otherUser ? (
          <Link href={`/profile/${username}`} asChild>
            <TouchableOpacity className="flex-row items-center gap-3 flex-1">
              <Avatar user={otherUser} size={40} />
              <View>
                <Text className="text-white font-bold text-base">{otherUser.username}</Text>
                {/* Could add online status here if socket supports it */}
              </View>
            </TouchableOpacity>
          </Link>
        ) : (
          <View className="flex-1 ml-2">
            <Text className="text-white font-bold text-base">{username}</Text>
          </View>
        )}
      </View>

      {/* Messages List */}
      <View className="flex-1">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#10b981" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => item._id || index.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        className="bg-gray-900 border-t border-gray-800"
      >
        <View className="p-3 flex-row items-end gap-2">
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor="#6b7280"
            multiline
            className="flex-1 bg-zinc-950 text-white rounded-2xl px-4 py-3 min-h-[44px] max-h-[100px] border border-gray-800"
            style={{ textAlignVertical: 'top' }}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!inputText.trim() || sending}
            className={`w-11 h-11 rounded-full justify-center items-center ${
              !inputText.trim() ? 'bg-gray-800' : 'bg-emerald-500'
            }`}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={!inputText.trim() ? '#4b5563' : 'white'} 
              style={{ marginLeft: 2 }} 
            />
          </TouchableOpacity>
        </View>
        <SafeAreaView edges={['bottom']} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}