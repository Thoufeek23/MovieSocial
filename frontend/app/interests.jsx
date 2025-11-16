// frontend/app/interests.jsx

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ImageBackground, 
  TouchableOpacity,
  Pressable,
  ScrollView,
  Dimensions,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Check } from 'lucide-react-native';
import { useAuth } from '../src/context/AuthContext';
import { saveInterests } from '../src/api';



const { width } = Dimensions.get('window');

export default function InterestsSelectionPage() {
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [currentBackdrop, setCurrentBackdrop] = useState(0);
  const router = useRouter();
  const { setNewUser } = useAuth();

  const languages = [
    { name: 'English', flag: '🇺🇸' },
    { name: 'Hindi', flag: '🇮🇳' },
    { name: 'Tamil', flag: '🇮🇳' },
    { name: 'Malayalam', flag: '🇮🇳' },
    { name: 'Telugu', flag: '🇮🇳' },
    { name: 'Kannada', flag: '🇮🇳' },
    { name: 'Korean', flag: '🇰🇷' },
    { name: 'French', flag: '🇫🇷' },
    { name: 'Spanish', flag: '🇪🇸' }
  ];

  // Background images from login page
  const posterImages = [
    require('../assets/images/poster1.png'),
    require('../assets/images/poster2.png'),
    require('../assets/images/poster3.png'),
    require('../assets/images/poster4.png'),
    require('../assets/images/poster5.png'),
  ];

  // Auto-rotate backgrounds
  useEffect(() => {
    setCurrentBackdrop(0);
    
    const interval = setInterval(() => {
      setCurrentBackdrop(prev => (prev + 1) % posterImages.length);
    }, 6000);
    
    return () => clearInterval(interval);
  }, [posterImages.length]);

  const handleInterestToggle = (language) => {
    if (selectedInterests.includes(language)) {
      setSelectedInterests(selectedInterests.filter(interest => interest !== language));
    } else {
      if (selectedInterests.length < 3) {
        setSelectedInterests([...selectedInterests, language]);
      }
    }
  };

  const handleContinue = async () => {
    try {
      // Save top 3 interests to user profile
      if (selectedInterests.length > 0) {
        const topThreeInterests = selectedInterests.slice(0, 3);
        await saveInterests(topThreeInterests);
      }
      // Clear the new user flag since they've completed interests
      setNewUser(false);
      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      // Still navigate even if saving fails
      setNewUser(false);
      router.replace('/(tabs)');
    }
  };

  const handleSkip = () => {
    // Clear the new user flag even when skipping
    setNewUser(false);
    router.replace('/(tabs)');
  };

  return (
    <ImageBackground
      source={posterImages[currentBackdrop]}
      resizeMode="cover"
      style={interestsStyles.backgroundImage}
    >
      <View style={interestsStyles.overlay}>
        <SafeAreaView style={interestsStyles.safeArea}>
          <ScrollView 
            contentContainerStyle={interestsStyles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Section */}
            <MotiView
              from={{ opacity: 0, translateY: 30 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 800, delay: 300 }}
              style={interestsStyles.headerSection}
            >
              <Text style={interestsStyles.title}>
                Choose Your Interests
              </Text>
              <Text style={interestsStyles.subtitle}>
                Select up to 3 languages that interest you most. This will help us personalize your movie experience.
              </Text>
            </MotiView>

            {/* Languages Grid */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 800, delay: 500 }}
              style={interestsStyles.languagesContainer}
            >
              <View style={interestsStyles.languagesGrid}>
                {languages.map((language, index) => (
                  <MotiView
                    key={language.name}
                    from={{ opacity: 0, scale: 0.8, translateY: 20 }}
                    animate={{ opacity: 1, scale: 1, translateY: 0 }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 100, 
                      delay: 600 + (index * 100) 
                    }}
                    style={interestsStyles.languageCardContainer}
                  >
                    <Pressable
                      onPress={() => handleInterestToggle(language.name)}
                      style={[
                        interestsStyles.languageCard,
                        selectedInterests.includes(language.name) && interestsStyles.languageCardSelected
                      ]}
                    >
                      <View style={interestsStyles.languageContent}>
                        <Text style={interestsStyles.languageFlag}>
                          {language.flag}
                        </Text>
                        <Text style={[
                          interestsStyles.languageName,
                          selectedInterests.includes(language.name) && interestsStyles.languageNameSelected
                        ]}>
                          {language.name}
                        </Text>
                      </View>
                      
                      {selectedInterests.includes(language.name) && (
                        <MotiView
                          from={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          style={interestsStyles.checkIcon}
                        >
                          <Check size={16} color="white" />
                        </MotiView>
                      )}
                    </Pressable>
                  </MotiView>
                ))}
              </View>
            </MotiView>

            {/* Selection Counter */}
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500, delay: 1200 }}
              style={interestsStyles.counterContainer}
            >
              <Text style={interestsStyles.counterText}>
                {selectedInterests.length}/3 selected
              </Text>
              {selectedInterests.length === 3 && (
                <MotiView
                  from={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Text style={interestsStyles.maxReachedText}>
                    Maximum selections reached
                  </Text>
                </MotiView>
              )}
            </MotiView>

            {/* Action Buttons */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500, delay: 1400 }}
              style={interestsStyles.actionsContainer}
            >
              <Pressable
                onPress={handleContinue}
                disabled={selectedInterests.length === 0}
                style={[
                  interestsStyles.continueButton,
                  { 
                    backgroundColor: selectedInterests.length > 0 ? '#10b981' : '#6b7280',
                    opacity: selectedInterests.length > 0 ? 1 : 0.7
                  }
                ]}
              >
                <Text style={interestsStyles.continueButtonText}>
                  {selectedInterests.length === 0 ? 'Select at least 1 interest' : 'Continue to MovieSocial'}
                </Text>
              </Pressable>

              <TouchableOpacity
                onPress={handleSkip}
                style={interestsStyles.skipButton}
              >
                <Text style={interestsStyles.skipButtonText}>
                  Skip for now
                </Text>
              </TouchableOpacity>
            </MotiView>
          </ScrollView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const interestsStyles = StyleSheet.create({
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)' },
  safeArea: { flex: 1 },
  scrollContent: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    paddingHorizontal: 20,
    paddingVertical: 40 
  },
  headerSection: { 
    alignItems: 'center', 
    marginBottom: 48 
  },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: 'white', 
    textAlign: 'center', 
    marginBottom: 16 
  },
  subtitle: { 
    fontSize: 18, 
    color: '#d1d5db', 
    textAlign: 'center', 
    lineHeight: 26,
    maxWidth: 320,
    marginHorizontal: 'auto'
  },
  languagesContainer: { 
    marginBottom: 32 
  },
  languagesGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'center',
    gap: 12 
  },
  languageCardContainer: { 
    width: (width - 60) / 3,
    marginBottom: 12 
  },
  languageCard: { 
    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
    borderRadius: 16, 
    padding: 16, 
    borderWidth: 2, 
    borderColor: 'transparent', 
    alignItems: 'center',
    position: 'relative',
    minHeight: 100
  },
  languageCardSelected: { 
    backgroundColor: 'rgba(16, 185, 129, 0.3)', 
    borderColor: '#10b981' 
  },
  languageContent: { 
    alignItems: 'center' 
  },
  languageFlag: { 
    fontSize: 32, 
    marginBottom: 8 
  },
  languageName: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#e5e7eb',
    textAlign: 'center' 
  },
  languageNameSelected: { 
    color: 'white' 
  },
  checkIcon: { 
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#10b981',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  counterContainer: { 
    alignItems: 'center', 
    marginBottom: 32 
  },
  counterText: { 
    fontSize: 18, 
    color: '#d1d5db',
    fontWeight: '500' 
  },
  maxReachedText: { 
    color: '#10b981', 
    fontWeight: '600',
    marginTop: 8 
  },
  actionsContainer: { 
    alignItems: 'center',
    gap: 16 
  },
  continueButton: { 
    paddingVertical: 16, 
    paddingHorizontal: 32,
    borderRadius: 16, 
    alignItems: 'center',
    minWidth: 280,
    shadowColor: '#10b981', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 8, 
    elevation: 8 
  },
  continueButtonText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  skipButton: { 
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center' 
  },
  skipButtonText: { 
    color: '#9ca3af', 
    fontSize: 16, 
    fontWeight: '500',
    textDecorationLine: 'underline' 
  }
});