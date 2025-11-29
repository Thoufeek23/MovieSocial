import React, { useState } from 'react';
import { 
  View, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Animated,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const GlobalFAB = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [rotateAnim] = useState(new Animated.Value(0));

  // Don't show FAB on login, signup, interests pages
  const shouldHideFAB = () => {
    return pathname.includes('/login') || 
           pathname.includes('/signup') || 
           pathname.includes('/interests') ||
           pathname.includes('/create-');
  };

  const toggleExpanded = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    
    Animated.timing(rotateAnim, {
      toValue: newExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleReviewPress = () => {
    setIsExpanded(false);
    Animated.timing(rotateAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
    router.push('/create-review');
  };

  const handleDiscussionPress = () => {
    setIsExpanded(false);
    Animated.timing(rotateAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
    router.push('/create-discussion');
  };

  const handleBackdropPress = () => {
    if (isExpanded) {
      setIsExpanded(false);
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  if (shouldHideFAB()) {
    return null;
  }

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <>
      {/* Backdrop Modal */}
      <Modal
        visible={isExpanded}
        transparent
        animationType="fade"
        onRequestClose={handleBackdropPress}
      >
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
      </Modal>

      {/* FAB Container */}
      <View style={[styles.fabContainer, { bottom: Math.max(insets.bottom + 100, 120) }]}>
        {/* Options Menu */}
        {isExpanded && (
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[styles.optionButton, styles.reviewButton]}
              onPress={handleReviewPress}
              activeOpacity={0.8}
            >
              <Ionicons name="star" size={22} color="#fff" />
              <Text style={styles.optionText}>Review</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, styles.discussionButton]}
              onPress={handleDiscussionPress}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubbles" size={22} color="#fff" />
              <Text style={styles.optionText}>Discussion</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Main FAB Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={toggleExpanded}
          activeOpacity={0.8}
        >
          <Animated.View style={[styles.fabIcon, { transform: [{ rotate: rotation }] }]}>
            <Ionicons name="add" size={28} color="white" />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    alignItems: 'flex-end',
    zIndex: 10000,
  },
  optionsContainer: {
    marginBottom: 20,
    alignItems: 'flex-end',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 28,
    marginBottom: 16,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    minWidth: 140,
    backgroundColor: '#10b981',
  },
  reviewButton: {
    backgroundColor: '#10b981',
  },
  discussionButton: {
    backgroundColor: '#059669', // Darker green for distinction
  },
  optionText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  fabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default GlobalFAB;