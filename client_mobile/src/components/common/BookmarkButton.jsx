import React, { useEffect, useState } from 'react';
import { TouchableOpacity, DeviceEventEmitter, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons'; 

const STORAGE_KEY = 'bookmarked_discussions_v1';

export default function BookmarkButton({ id }) {
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    checkBookmarkStatus();
  }, [id]);

  const checkBookmarkStatus = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const bm = raw ? JSON.parse(raw) : {};
      setBookmarked(!!bm[id]);
    } catch (e) {
      console.error('Error reading bookmarks', e);
    }
  };

  const toggle = async (e) => {
    // e.stopPropagation() is not always needed on RN TouchableOpacity unless nested
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const bm = raw ? JSON.parse(raw) : {};
      
      let nowBookmarked = false;
      
      if (bm[id]) {
        delete bm[id];
        setBookmarked(false);
        nowBookmarked = false;
        // Optional: Simple feedback
        // Alert.alert('Bookmark removed'); 
      } else {
        bm[id] = Date.now();
        setBookmarked(true);
        nowBookmarked = true;
        // Alert.alert('Discussion bookmarked');
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bm));
      
      // Notify other listeners
      DeviceEventEmitter.emit('bookmarksUpdated', { id, bookmarked: nowBookmarked });
      
    } catch (err) {
      console.error('Failed to toggle bookmark', err);
    }
  };

  return (
    <TouchableOpacity 
      onPress={toggle} 
      className="p-2 rounded bg-black/30 active:bg-black/50"
      accessibilityLabel={bookmarked ? 'Remove bookmark' : 'Bookmark'}
    >
      {bookmarked ? (
        <Feather name="bookmark" size={18} color="#f59e0b" />
      ) : (
        <Feather name="book-open" size={18} color="#ffffff" />
      )}
    </TouchableOpacity>
  );
}