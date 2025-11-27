import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, FlatList, Image, ActivityIndicator, Alert } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as api from '../../api';
import Avatar from '../Avatar';

const ShareModal = ({ isOpen, onClose, defaultMessage, title, review, discussion, rank }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState(defaultMessage);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const searchTimeout = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedUser(null);
      if ((review || discussion || rank) && defaultMessage && defaultMessage.includes('http')) {
          setMessage(''); 
      } else {
          setMessage(defaultMessage || '');
      }
    }
  }, [isOpen, defaultMessage, review, discussion, rank]);

  const handleSearch = (text) => {
    setQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    if (!text.trim()) {
      setResults([]);
      return;
    }

    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const { data } = await api.searchUsers(text);
        setResults(data || []);
      } catch (error) {
        // fail silently
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleSend = async () => {
    if (!selectedUser || (!message.trim() && !review && !discussion && !rank)) return;
    
    setSending(true);
    try {
      const attachments = {};
      if (review) attachments.reviewId = review._id;
      if (discussion) attachments.discussionId = discussion._id;
      if (rank) attachments.rankId = rank._id;

      await api.sendMessage(selectedUser.username, message, attachments);
      Alert.alert("Sent", `Shared with ${selectedUser.username}`);
      onClose();
    } catch (error) {
      Alert.alert("Error", "Failed to send message");
    } finally {
      setSending(false);
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
        <View className="bg-card w-full h-[90%] sm:h-auto sm:max-w-md sm:m-auto rounded-t-2xl sm:rounded-xl border border-border overflow-hidden">
          
          {/* Header */}
          <View className="flex-row justify-between items-center p-4 border-b border-border bg-background/50">
            <Text className="text-lg font-bold text-white">{title || 'Share via DM'}</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <View className="p-4 flex-1">
            {!selectedUser ? (
              <>
                <View className="bg-input rounded-lg border border-border flex-row items-center px-3 mb-4">
                  <Feather name="search" size={18} color="#9ca3af" />
                  <TextInput 
                    value={query}
                    onChangeText={handleSearch}
                    placeholder="Search for a user..."
                    placeholderTextColor="#6b7280"
                    className="flex-1 p-3 text-white text-base"
                    autoFocus
                  />
                </View>
                
                {searching ? (
                  <ActivityIndicator color="#16a34a" />
                ) : (
                  <FlatList
                    data={results}
                    keyExtractor={item => item._id}
                    ListEmptyComponent={
                        query ? <Text className="text-center text-gray-500">No users found</Text> : <Text className="text-center text-gray-500 italic">Type to find friends</Text>
                    }
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => { setSelectedUser(item); setQuery(''); }}
                        className="flex-row items-center gap-3 p-3 border-b border-zinc-800"
                      >
                        <Avatar username={item.username} avatar={item.avatar} sizeClass="w-10 h-10" />
                        <Text className="text-white font-medium text-base">{item.username}</Text>
                      </TouchableOpacity>
                    )}
                  />
                )}
              </>
            ) : (
              <View>
                {/* Selected User Header */}
                <View className="flex-row items-center justify-between bg-zinc-800/50 p-3 rounded-lg border border-border mb-4">
                  <View className="flex-row items-center gap-3">
                    <Avatar username={selectedUser.username} avatar={selectedUser.avatar} sizeClass="w-10 h-10" />
                    <View>
                        <Text className="text-xs text-gray-400">Sending to</Text>
                        <Text className="text-white font-bold text-base">{selectedUser.username}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedUser(null)}>
                    <Text className="text-primary font-bold text-sm">Change</Text>
                  </TouchableOpacity>
                </View>

                {/* Preview Content */}
                {(review || discussion || rank) && (
                    <View className="bg-zinc-800/30 border border-zinc-700 rounded-lg p-3 mb-4 flex-row gap-3">
                         <Image 
                            source={{ uri: 
                                review ? `https://image.tmdb.org/t/p/w92${review.moviePoster}` : 
                                discussion ? (discussion.poster_path ? `https://image.tmdb.org/t/p/w92${discussion.poster_path}` : 'https://via.placeholder.com/92x138') :
                                rank ? (rank.movies?.[0]?.posterPath ? `https://image.tmdb.org/t/p/w92${rank.movies[0].posterPath}` : 'https://via.placeholder.com/92x138') : 
                                'https://via.placeholder.com/92x138'
                            }}
                            className="w-10 h-14 rounded bg-zinc-700"
                            resizeMode="cover"
                        />
                        <View className="flex-1 justify-center">
                            <Text className="text-xs text-gray-400 font-bold uppercase mb-0.5">
                                Sharing {review ? 'Review' : (discussion ? 'Discussion' : 'Rank List')}
                            </Text>
                            <Text className="text-white font-bold text-sm" numberOfLines={1}>
                                {review ? review.movieTitle : (discussion ? discussion.title : rank?.title)}
                            </Text>
                             {review && <Text className="text-xs text-gray-400 italic" numberOfLines={1}>"{review.text}"</Text>}
                        </View>
                    </View>
                )}

                {/* Message Input */}
                <Text className="text-sm text-gray-400 font-medium mb-2">Message (Optional)</Text>
                <TextInput
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Write something..."
                    placeholderTextColor="#6b7280"
                    multiline
                    className="w-full h-24 bg-input border border-border rounded-lg p-3 text-white text-base mb-4"
                    textAlignVertical="top"
                />

                <TouchableOpacity
                    onPress={handleSend}
                    disabled={sending || (!message.trim() && !review && !discussion && !rank)}
                    className="bg-primary py-3 rounded-lg flex-row justify-center items-center gap-2"
                >
                    {sending ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Feather name="send" size={18} color="white" />
                            <Text className="text-white font-bold">Send Message</Text>
                        </>
                    )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ShareModal;