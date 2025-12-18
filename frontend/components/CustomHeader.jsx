import React, { useContext, useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  Dimensions,
  Animated
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Sparkles } from 'lucide-react-native';
import { useAuth } from '../src/context/AuthContext';
import { ModleContext } from '../src/context/ModleContext';
import Avatar from './Avatar';

const { width } = Dimensions.get('window');

const CustomHeader = ({ title, showLogo = false }) => {
  const { user } = useAuth();
  const { global } = useContext(ModleContext);
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [navbarStreak, setNavbarStreak] = useState(0);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [rotateAnim] = useState(new Animated.Value(0));

  // Update streak from global context
  useEffect(() => {
    if (global && typeof global.streak === 'number') {
      setNavbarStreak(global.streak || 0);
    }
  }, [global]);

  // Don't show + button on login, signup, interests pages
  const shouldHideCreateButton = () => {
    return pathname.includes('/login') || 
           pathname.includes('/signup') || 
           pathname.includes('/interests') ||
           pathname.includes('/create-');
  };

  const toggleMenu = () => {
    const newExpanded = !isMenuExpanded;
    setIsMenuExpanded(newExpanded);
    
    Animated.timing(rotateAnim, {
      toValue: newExpanded ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleReviewPress = () => {
    setIsMenuExpanded(false);
    Animated.timing(rotateAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
    router.push('/create-review');
  };

  const handleDiscussionPress = () => {
    setIsMenuExpanded(false);
    Animated.timing(rotateAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
    router.push('/create-discussion');
  };



  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });



  return (
    <>
      {/* Extended blur overlay covering entire top area */}
      <BlurView
        intensity={95}
        tint="dark"
        style={[styles.extendedBlurOverlay, { height: insets.top + 65 }]}
      />
      
      {/* Invisible backdrop when menu is expanded */}
      {isMenuExpanded && (
        <TouchableOpacity 
          style={styles.invisibleBackdrop}
          onPress={() => {
            setIsMenuExpanded(false);
            Animated.timing(rotateAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }).start();
          }}
          activeOpacity={1}
        />
      )}
      
      <View style={[styles.headerContainer, { paddingTop: insets.top + 12 }]}>
        <View style={styles.glassBackground}>
          <View style={styles.headerContent}>
            {/* Left Side - User Avatar & Create Button */}
            <View style={styles.leftSection}>
              <TouchableOpacity 
                onPress={() => {
                  if (user?.username) {
                    router.push(`/profile/${user.username}`);
                  }
                }}
                style={styles.avatarContainer}
              >
                <Avatar user={user} size={38} />
              </TouchableOpacity>
              
              {/* Create Button */}
              {!shouldHideCreateButton() && (
                <TouchableOpacity 
                  onPress={toggleMenu}
                  style={styles.createButton}
                  activeOpacity={0.7}
                >
                  <Animated.View style={[styles.createIcon, { transform: [{ rotate: rotation }] }]}>
                    <Ionicons name="add" size={24} color="#10b981" />
                  </Animated.View>
                </TouchableOpacity>
              )}
            </View>

            {/* Center - Title or Logo */}
            <View style={styles.centerContainer}>
              {showLogo ? (
                <Image 
                  source={require('../assets/images/MS_logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              ) : (
                <Text 
                  style={styles.title}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {title}
                </Text>
              )}
            </View>

            {/* Right Side - AI Movie Picker & Modle Streak */}
            <View style={styles.rightSection}>
              {/* AI Movie Picker Icon */}
              {user && (
                <TouchableOpacity 
                  onPress={() => router.push('/ai-recommendations')}
                  style={styles.aiPickerButton}
                >
                  <Sparkles color="#10b981" size={20} />
                </TouchableOpacity>
              )}
              
              {/* Modle Streak */}
              <TouchableOpacity 
                onPress={() => router.push('/(tabs)/modle')}
                style={styles.streakContainer}
              >
                <View style={styles.streakBadge}>
                  <Text style={styles.streakText}>{navbarStreak}</Text>
                  <Text style={styles.fireEmoji}>🔥</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Options Menu */}
        {isMenuExpanded && (
          <View style={styles.optionsMenu}>
            <TouchableOpacity
              style={[styles.optionButton, styles.reviewButton]}
              onPress={handleReviewPress}
              activeOpacity={0.8}
            >
              <Ionicons name="star" size={18} color="#fff" />
              <Text style={styles.optionText}>Review</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, styles.discussionButton]}
              onPress={handleDiscussionPress}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubbles" size={18} color="#fff" />
              <Text style={styles.optionText}>Discussion</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  extendedBlurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9998,
    width: width,
  },
  headerContainer: {
    width: width,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    // Make it truly sticky to the screen
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  glassBackground: {
    width: '100%',
    backgroundColor: 'transparent',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 90,
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  createButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    padding: 6,
  },
  createIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginHorizontal: -10,
  },
  logo: {
    width: 45,
    height: 45,
  },
  title: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  rightSection: {
    width: 90,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  aiPickerButton: {
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  streakContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  streakText: {
    color: '#10b981',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 4,
  },
  fireEmoji: {
    fontSize: 16,
  },
  invisibleBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9998,
  },
  optionsMenu: {
    position: 'absolute',
    top: '100%',
    left: 70,
    backgroundColor: 'transparent',
    paddingTop: 8,
    zIndex: 10001,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    minWidth: 120,
  },
  reviewButton: {
    backgroundColor: '#10b981',
  },
  discussionButton: {
    backgroundColor: '#059669',
  },
  optionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default CustomHeader;