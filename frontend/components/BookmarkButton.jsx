import React, { useState, useContext, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../src/context/AuthContext';
import * as api from '../src/api';
import WatchedDateModal from './WatchedDateModal';

const BookmarkButton = ({ 
  movieId, 
  initialWatchlisted = false, 
  initialWatched = false,
  onWatchlistChange,
  onWatchedChange,
  size = 24,
  style = {},
  movieTitle = ''
}) => {
  const { user } = useContext(AuthContext);
  const [isWatchlisted, setIsWatchlisted] = useState(initialWatchlisted);
  const [isWatched, setIsWatched] = useState(initialWatched);
  const [loading, setLoading] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);

  useEffect(() => {
    setIsWatchlisted(initialWatchlisted);
    setIsWatched(initialWatched);
  }, [initialWatchlisted, initialWatched]);

  const handleWatchlistToggle = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to add movies to your watchlist.');
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      if (isWatchlisted) {
        await api.removeFromWatchlist(movieId);
        setIsWatchlisted(false);
        onWatchlistChange && onWatchlistChange(false);
      } else {
        await api.addToWatchlist(movieId);
        setIsWatchlisted(true);
        onWatchlistChange && onWatchlistChange(true);
      }
    } catch (error) {
      console.error('Failed to update watchlist:', error);
      Alert.alert('Error', 'Failed to update watchlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWatchedClick = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to mark movies as watched.');
      return;
    }
    setShowDateModal(true);
  };

  const confirmWatched = async (dateToUse) => {
    if (loading) return;
    setLoading(true);

    try {
      await api.addToWatched(movieId, dateToUse);
      setIsWatched(true);
      onWatchedChange && onWatchedChange(true);
      
      // If marked as watched, remove from watchlist
      if (isWatchlisted) {
        await api.removeFromWatchlist(movieId);
        setIsWatchlisted(false);
        onWatchlistChange && onWatchlistChange(false);
      }
      
      setShowDateModal(false);
      Alert.alert('Success', isWatched ? 'Rewatch logged!' : 'Marked as watched!');
    } catch (error) {
      console.error('Failed to update watched status:', error);
      Alert.alert('Error', 'Failed to update watched status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWatched = async () => {
    Alert.alert(
      'Remove from Watch History',
      'Remove this movie from your watch history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (loading) return;
            setLoading(true);

            try {
              await api.removeFromWatched(movieId);
              setIsWatched(false);
              onWatchedChange && onWatchedChange(false);
              setShowDateModal(false);
              Alert.alert('Success', 'Removed from watch history');
            } catch (error) {
              console.error('Failed to remove from watched:', error);
              Alert.alert('Error', 'Failed to remove from watched. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const getIcon = () => {
    if (isWatched) return 'checkmark-circle';
    if (isWatchlisted) return 'bookmark';
    return 'bookmark-outline';
  };

  const getColor = () => {
    if (isWatched) return '#10b981';
    if (isWatchlisted) return '#f59e0b';
    return '#9ca3af';
  };

  const handlePress = () => {
    if (isWatched) {
      // If watched, show date modal for rewatch or remove
      handleWatchedClick();
    } else {
      // If not watched, show options
      Alert.alert(
        'Movie Status',
        'What would you like to do with this movie?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist',
            onPress: handleWatchlistToggle,
          },
          {
            text: 'Mark as Watched',
            onPress: handleWatchedClick,
          },
        ]
      );
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.button, style]}
        onPress={handlePress}
        disabled={loading}
        activeOpacity={0.7}
      >
        <Ionicons 
          name={getIcon()} 
          size={size} 
          color={getColor()} 
        />
      </TouchableOpacity>

      <WatchedDateModal
        visible={showDateModal}
        onClose={() => setShowDateModal(false)}
        onConfirm={confirmWatched}
        onRemove={isWatched ? handleRemoveFromWatched : null}
        isWatched={isWatched}
        movieTitle={movieTitle}
      />
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 8,
  },
});

export default BookmarkButton;