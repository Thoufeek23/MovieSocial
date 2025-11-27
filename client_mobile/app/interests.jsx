import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  ImageBackground, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import { Check } from 'lucide-react-native';
import { AuthContext } from '../src/context/AuthContext';
import * as api from '../src/api';

const { width } = Dimensions.get('window');

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

export default function InterestsPage() {
  const router = useRouter();
  const { setNewUser } = useContext(AuthContext);
  
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [backdrops, setBackdrops] = useState([]);
  const [currentBackdrop, setCurrentBackdrop] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch backdrops
  useEffect(() => {
    const fetchBackdrops = async () => {
      try {
        const res = await api.getPopularMovies();
        const urls = res.data.results
          .map(m => m.poster_path) // Using poster_path for mobile portrait aspect ratio
          .filter(Boolean)
          .slice(0, 5);
        setBackdrops(urls);
      } catch (error) {
        // Fallback or empty
      }
    };
    fetchBackdrops();
  }, []);

  // Auto-rotate backgrounds
  useEffect(() => {
    if (backdrops.length > 1) {
      const interval = setInterval(() => {
        setCurrentBackdrop(prev => (prev + 1) % backdrops.length);
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [backdrops]);

  const handleInterestToggle = (language) => {
    if (selectedInterests.includes(language)) {
      setSelectedInterests(prev => prev.filter(i => i !== language));
    } else {
      if (selectedInterests.length < 3) {
        setSelectedInterests(prev => [...prev, language]);
      }
    }
  };

  const handleContinue = async () => {
    setLoading(true);
    try {
      if (selectedInterests.length > 0) {
        await api.saveInterests(selectedInterests.slice(0, 3));
      }
      setNewUser(false);
      router.replace('/(tabs)/');
    } catch (error) {
      console.error(error);
      // Even if save fails, let them in
      setNewUser(false);
      router.replace('/(tabs)/');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    setNewUser(false);
    router.replace('/(tabs)/');
  };

  // Image Source Logic
  const bgSource = backdrops.length > 0 && backdrops[currentBackdrop]
    ? { uri: `https://image.tmdb.org/t/p/w500${backdrops[currentBackdrop]}` }
    : require('../assets/images/poster1.png'); // Fallback local image

  return (
    <View className="flex-1 bg-zinc-950">
      {/* Background Image Layer */}
      <ImageBackground
        source={bgSource}
        className="flex-1 absolute inset-0 w-full h-full"
        resizeMode="cover"
        blurRadius={3}
      >
        <View className="flex-1 bg-black/80" />
      </ImageBackground>

      <SafeAreaView className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
          
          {/* Header */}
          <MotiView 
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 800, delay: 300 }}
            className="items-center mb-10 mt-6"
          >
            <Text className="text-4xl font-bold text-white text-center mb-3 leading-tight">
              Choose Your{'\n'}Interests
            </Text>
            <Text className="text-lg text-gray-300 text-center leading-6">
              Select up to 3 languages. This helps us personalize your feed.
            </Text>
          </MotiView>

          {/* Languages Grid */}
          <View className="flex-row flex-wrap justify-between gap-y-4">
            {languages.map((language, index) => {
              const isSelected = selectedInterests.includes(language.name);
              
              return (
                <MotiView
                  key={language.name}
                  from={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', delay: 500 + (index * 100) }}
                  style={{ width: '48%' }}
                >
                  <TouchableOpacity
                    onPress={() => handleInterestToggle(language.name)}
                    activeOpacity={0.8}
                    className={`
                      relative p-5 rounded-2xl border-2 items-center justify-center h-32
                      ${isSelected 
                        ? 'bg-emerald-600/30 border-emerald-500' 
                        : 'bg-white/5 border-transparent'
                      }
                    `}
                  >
                    <Text className="text-4xl mb-2">{language.flag}</Text>
                    <Text className={`text-base font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                      {language.name}
                    </Text>

                    {isSelected && (
                      <MotiView
                        from={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 bg-emerald-500 rounded-full p-1"
                      >
                        <Check size={12} color="white" strokeWidth={3} />
                      </MotiView>
                    )}
                  </TouchableOpacity>
                </MotiView>
              );
            })}
          </View>

          {/* Counter */}
          <MotiView 
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1200 }}
            className="mt-8 items-center"
          >
            <Text className="text-gray-300 text-lg font-medium">
              {selectedInterests.length}/3 selected
            </Text>
            {selectedInterests.length === 3 && (
              <Text className="text-emerald-400 text-sm mt-1">
                Maximum selections reached
              </Text>
            )}
          </MotiView>

        </ScrollView>

        {/* Bottom Actions */}
        <MotiView 
          from={{ opacity: 0, translateY: 50 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 1400 }}
          className="absolute bottom-0 left-0 right-0 p-6 bg-transparent"
        >
          <TouchableOpacity
            onPress={handleContinue}
            disabled={selectedInterests.length === 0 || loading}
            className={`w-full py-4 rounded-xl items-center mb-3 shadow-lg ${
              selectedInterests.length > 0 
                ? 'bg-emerald-600 shadow-emerald-900/20' 
                : 'bg-gray-700'
            }`}
          >
            <Text className={`text-lg font-bold ${selectedInterests.length > 0 ? 'text-white' : 'text-gray-400'}`}>
              {loading ? 'Saving...' : selectedInterests.length === 0 ? 'Select at least 1' : 'Continue'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkip} className="items-center py-2">
            <Text className="text-gray-400 font-medium text-base">Skip for now</Text>
          </TouchableOpacity>
        </MotiView>
      </SafeAreaView>
    </View>
  );
}