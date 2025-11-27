import React, { useState, useContext, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  Image, 
  Dimensions 
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import { Sparkles, ArrowLeft, ArrowRight, RotateCcw, Calendar, Loader } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../src/context/AuthContext';
import * as api from '../src/api';

const { width } = Dimensions.get('window');

export default function AIMovieRecommendationPage() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const scrollViewRef = useRef(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    genres: [],
    mood: '',
    languages: [],
    endings: '',
    themes: [],
    enjoys: [],
    pace: '',
    characters: [],
    experience: '',
    watchWith: '',
    releasePeriod: ''
  });
  const [recommendations, setRecommendations] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [showMoreSuggestions, setShowMoreSuggestions] = useState(false);

  const totalSteps = 11;

  // Load stored state
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const storedRecs = await AsyncStorage.getItem('aiMovieRecommendations');
        const storedPrefs = await AsyncStorage.getItem('aiMoviePreferences');
        
        if (storedRecs && storedPrefs) {
          setRecommendations(JSON.parse(storedRecs));
          setPreferences(JSON.parse(storedPrefs));
          setShowResults(true);
        }
      } catch (error) {
        console.error('Error loading stored recommendations:', error);
        await AsyncStorage.multiRemove(['aiMovieRecommendations', 'aiMoviePreferences']);
      }
    };
    loadStoredData();
  }, []);

  const handleMultiSelect = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleSingleSelect = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const resetPreferences = async () => {
    setPreferences({
      genres: [],
      mood: '',
      languages: [],
      endings: '',
      themes: [],
      enjoys: [],
      pace: '',
      characters: [],
      experience: '',
      watchWith: '',
      releasePeriod: ''
    });
    setCurrentStep(1);
    setShowResults(false);
    setRecommendations([]);
    await AsyncStorage.multiRemove(['aiMovieRecommendations', 'aiMoviePreferences']);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Basic validation
      const requiredFields = ['genres', 'mood', 'languages'];
      const missingFields = requiredFields.filter(field => {
        const value = preferences[field];
        return !value || (Array.isArray(value) && value.length === 0);
      });

      if (missingFields.length > 0) {
        Alert.alert('Missing Information', `Please complete: ${missingFields.join(', ')}`);
        setLoading(false);
        return;
      }

      const response = await api.getAIMovieRecommendations(preferences);
      
      setRecommendations(response.data.recommendations);
      setShowResults(true);
      
      await AsyncStorage.setItem('aiMovieRecommendations', JSON.stringify(response.data.recommendations));
      await AsyncStorage.setItem('aiMoviePreferences', JSON.stringify(preferences));
      
    } catch (error) {
      console.error('Error getting recommendations:', error);
      Alert.alert('Error', error.response?.data?.msg || 'Failed to get recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const SelectionButton = ({ label, selected, onPress, multi = false }) => (
    <TouchableOpacity
      onPress={onPress}
      className={`p-4 rounded-xl border-2 mb-3 ${
        selected 
          ? 'border-emerald-500 bg-emerald-500/20' 
          : 'border-gray-700 bg-gray-800'
      }`}
    >
      <Text className={`text-center font-medium ${selected ? 'text-emerald-400' : 'text-gray-300'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View>
            <Text className="text-2xl font-bold text-white text-center mb-2">Genres</Text>
            <Text className="text-gray-400 text-center mb-6">What genres do you usually enjoy?</Text>
            <View className="flex-row flex-wrap justify-between">
              {['Romance / Rom-com', 'Action', 'Thriller / Mystery', 'Horror', 'Drama', 'Comedy', 
                'Sci-fi / Fantasy', 'Adventure', 'Animated', 'Crime / Gangster', 'Slice-of-life', 'Feel-good movies'].map((genre) => (
                <View key={genre} style={{ width: '48%' }}>
                  <SelectionButton
                    label={genre}
                    selected={preferences.genres.includes(genre)}
                    onPress={() => handleMultiSelect('genres', genre)}
                    multi
                  />
                </View>
              ))}
            </View>
          </View>
        );
      case 2:
        return (
          <View>
            <Text className="text-2xl font-bold text-white text-center mb-2">Mood</Text>
            <Text className="text-gray-400 text-center mb-6">What kind of mood do you prefer?</Text>
            {['Light-hearted & fun', 'Deep & emotional', 'Intense & gripping', 'Slow & realistic',
              'Fast-paced & exciting', 'Inspirational / uplifting', 'A mix of emotional + entertaining'].map((mood) => (
              <SelectionButton
                key={mood}
                label={mood}
                selected={preferences.mood === mood}
                onPress={() => handleSingleSelect('mood', mood)}
              />
            ))}
          </View>
        );
      case 3:
        return (
          <View>
            <Text className="text-2xl font-bold text-white text-center mb-2">Languages</Text>
            <Text className="text-gray-400 text-center mb-6">Select languages you're comfortable with</Text>
            <View className="flex-row flex-wrap justify-between">
              {['English', 'Tamil', 'Telugu', 'Malayalam', 'Hindi', 'Kannada', 'Korean', 'Japanese', 'Any language'].map((lang) => (
                <View key={lang} style={{ width: '48%' }}>
                  <SelectionButton
                    label={lang}
                    selected={preferences.languages.includes(lang)}
                    onPress={() => handleMultiSelect('languages', lang)}
                    multi
                  />
                </View>
              ))}
            </View>
          </View>
        );
      case 4:
        return (
          <View>
            <Text className="text-2xl font-bold text-white text-center mb-2">Endings</Text>
            <Text className="text-gray-400 text-center mb-6">Choose your preferred conclusion style</Text>
            {['Happy ending', 'Bittersweet ending', 'Open ending', 'Tragic ending', "Doesn't matter"].map((ending) => (
              <SelectionButton
                key={ending}
                label={ending}
                selected={preferences.endings === ending}
                onPress={() => handleSingleSelect('endings', ending)}
              />
            ))}
          </View>
        );
      case 5: // Themes
        return (
          <View>
            <Text className="text-2xl font-bold text-white text-center mb-2">Themes</Text>
            <Text className="text-gray-400 text-center mb-6">What themes attract you most?</Text>
            <View className="flex-row flex-wrap justify-between">
              {['Love & relationships', 'Friendship', 'Coming-of-age', 'Family drama', 'Crime & investigation',
                'Revenge', 'Social issues', 'Fantasy / world-building', 'Survival / adventure', 
                'Psychological themes', 'Historical / period films'].map((theme) => (
                <View key={theme} style={{ width: '48%' }}>
                  <SelectionButton
                    label={theme}
                    selected={preferences.themes.includes(theme)}
                    onPress={() => handleMultiSelect('themes', theme)}
                    multi
                  />
                </View>
              ))}
            </View>
          </View>
        );
      case 6: // Enjoys
        return (
          <View>
            <Text className="text-2xl font-bold text-white text-center mb-2">Elements</Text>
            <Text className="text-gray-400 text-center mb-6">Do you enjoy movies with:</Text>
            <View className="flex-row flex-wrap justify-between">
              {['Strong emotional depth', 'Strong comedy', 'Strong action', 'Strong plot twists',
                'Strong character development', 'Music-driven storytelling', 'Realistic slice-of-life',
                'Larger-than-life moments'].map((enjoy) => (
                <View key={enjoy} style={{ width: '48%' }}>
                  <SelectionButton
                    label={enjoy}
                    selected={preferences.enjoys.includes(enjoy)}
                    onPress={() => handleMultiSelect('enjoys', enjoy)}
                    multi
                  />
                </View>
              ))}
            </View>
          </View>
        );
      case 7: // Pace
        return (
          <View>
            <Text className="text-2xl font-bold text-white text-center mb-2">Pacing</Text>
            <Text className="text-gray-400 text-center mb-6">What kind of pace do you prefer?</Text>
            {['Slow-burn', 'Medium paced', 'Fast paced', 'Depends on the genre'].map((pace) => (
              <SelectionButton
                key={pace}
                label={pace}
                selected={preferences.pace === pace}
                onPress={() => handleSingleSelect('pace', pace)}
              />
            ))}
          </View>
        );
      case 8: // Characters
        return (
          <View>
            <Text className="text-2xl font-bold text-white text-center mb-2">Characters</Text>
            <Text className="text-gray-400 text-center mb-6">Who do you connect with?</Text>
            {['Boy/Girl-next-door', 'Flawed but relatable', 'Strong, confident leads',
              'Quirky, funny characters', 'Dark, mysterious', 'Underdogs',
              'Deep emotional arcs'].map((char) => (
              <SelectionButton
                key={char}
                label={char}
                selected={preferences.characters.includes(char)}
                onPress={() => handleMultiSelect('characters', char)}
                multi
              />
            ))}
          </View>
        );
      case 9: // Experience
        return (
          <View>
            <Text className="text-2xl font-bold text-white text-center mb-2">Experience</Text>
            <Text className="text-gray-400 text-center mb-6">Ideal movie experience?</Text>
            <View className="flex-row flex-wrap justify-between">
              {['Feel-good & relaxing', 'Emotional rollercoaster', 'Thought-provoking', 'Adrenaline/high-energy',
                'Beautiful visuals', 'Strong writing', 'Escapist entertainment',
                'Realistic & grounded'].map((exp) => (
                <View key={exp} style={{ width: '48%' }}>
                  <SelectionButton
                    label={exp}
                    selected={preferences.experience === exp}
                    onPress={() => handleSingleSelect('experience', exp)}
                  />
                </View>
              ))}
            </View>
          </View>
        );
      case 10: // Watch With
        return (
          <View>
            <Text className="text-2xl font-bold text-white text-center mb-2">Company</Text>
            <Text className="text-gray-400 text-center mb-6">How do you usually watch?</Text>
            {['Alone', 'With friends', 'With partner', 'With family', 'Depends on the mood'].map((w) => (
              <SelectionButton
                key={w}
                label={w}
                selected={preferences.watchWith === w}
                onPress={() => handleSingleSelect('watchWith', w)}
              />
            ))}
          </View>
        );
      case 11: // Period
        return (
          <View>
            <Text className="text-2xl font-bold text-white text-center mb-2">Era</Text>
            <Text className="text-gray-400 text-center mb-6">What release period do you prefer?</Text>
            {['Classics (70s & earlier)', '1980s', '1990s', 'Early 2000s (2000-10)',
              'Recent (2010-20)', 'Very recent (2020+)', 'No preference'].map((p) => (
              <SelectionButton
                key={p}
                label={p}
                selected={preferences.releasePeriod === p}
                onPress={() => handleSingleSelect('releasePeriod', p)}
              />
            ))}
          </View>
        );
      default: return null;
    }
  };

  const MovieResultCard = ({ movie, index }) => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: index * 100 }}
      className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 mb-4"
    >
      <TouchableOpacity onPress={() => router.push(`/movie/${movie.id}`)} activeOpacity={0.9}>
        <View className="relative">
          {movie.poster_path && (
            <Image
              source={{ uri: `https://image.tmdb.org/t/p/w500${movie.poster_path}` }}
              className="w-full h-48"
              resizeMode="cover"
            />
          )}
          <View className="absolute top-2 left-2 bg-emerald-500 px-2 py-1 rounded-md">
            <Text className="text-white text-xs font-bold">#{index + 1}</Text>
          </View>
        </View>
        <View className="p-4">
          <Text className="text-white font-bold text-lg mb-2">{movie.title}</Text>
          <View className="flex-row items-center gap-2 mb-3">
            <Calendar size={14} color="#9ca3af" />
            <Text className="text-gray-400 text-sm">
              {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
            </Text>
          </View>
          {movie.ai_reason && (
            <Text className="text-gray-300 text-sm leading-5">
              <Text className="text-emerald-400 font-bold">Why: </Text>
              {movie.ai_reason}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </MotiView>
  );

  // --- Main Render ---

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950 justify-center items-center px-6">
        <Text className="text-2xl font-bold text-white text-center mb-4">Log in to get recommendations</Text>
        <TouchableOpacity
          onPress={() => router.push('/login')}
          className="bg-emerald-500 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-bold">Go to Login</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (showResults) {
    const topRecommendations = recommendations.slice(0, 5);
    const moreRecommendations = recommendations.slice(5);

    return (
      <SafeAreaView className="flex-1 bg-zinc-950">
        <ScrollView className="flex-1 px-4 py-6">
          <View className="items-center mb-6">
            <View className="flex-row items-center gap-2 mb-2">
              <Sparkles size={28} color="#34d399" />
              <Text className="text-2xl font-bold text-white">Your Picks</Text>
            </View>
            <Text className="text-gray-400 text-center">Based on your preferences</Text>
          </View>

          <Text className="text-xl font-bold text-white mb-4">🎯 Top Picks</Text>
          {topRecommendations.map((movie, index) => (
            <MovieResultCard key={movie.id} movie={movie} index={index} />
          ))}

          {moreRecommendations.length > 0 && (
            <View>
              <TouchableOpacity 
                onPress={() => setShowMoreSuggestions(!showMoreSuggestions)}
                className="flex-row justify-between items-center py-4"
              >
                <Text className="text-xl font-bold text-white">✨ More Options</Text>
                <Text className="text-emerald-400 font-medium">
                  {showMoreSuggestions ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
              
              <AnimatePresence>
                {showMoreSuggestions && (
                  <MotiView
                    from={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {moreRecommendations.map((movie, index) => (
                      <MovieResultCard key={movie.id} movie={movie} index={index + 5} />
                    ))}
                  </MotiView>
                )}
              </AnimatePresence>
            </View>
          )}

          <View className="gap-3 my-8 pb-8">
            <TouchableOpacity
              onPress={() => {
                setShowResults(false);
                setCurrentStep(1);
                AsyncStorage.multiRemove(['aiMovieRecommendations', 'aiMoviePreferences']);
              }}
              className="bg-emerald-500 flex-row justify-center items-center gap-2 py-3 rounded-xl"
            >
              <ArrowLeft size={20} color="white" />
              <Text className="text-white font-bold">Modify Preferences</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleSubmit}
              className="bg-gray-800 flex-row justify-center items-center gap-2 py-3 rounded-xl border border-gray-700"
            >
              <RotateCcw size={20} color="white" />
              <Text className="text-white font-bold">Refresh Suggestions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.replace('/')}
              className="py-3 items-center"
            >
              <Text className="text-gray-400 font-medium">Back to Home</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <View className="px-4 pt-4 pb-2 border-b border-gray-800 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white font-bold text-lg">Movie Picker</Text>
        <View className="w-8" />
      </View>

      <ScrollView 
        ref={scrollViewRef}
        className="flex-1 px-4"
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
      >
        {/* Progress */}
        <View className="mb-8">
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-400 text-xs">Step {currentStep} of {totalSteps}</Text>
            <Text className="text-gray-400 text-xs">{Math.round((currentStep / totalSteps) * 100)}%</Text>
          </View>
          <View className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <MotiView 
              from={{ width: '0%' }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ type: 'timing', duration: 500 }}
              className="h-full bg-emerald-500"
            />
          </View>
        </View>

        {/* Content */}
        <MotiView
          key={currentStep}
          from={{ opacity: 0, translateX: 20 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: 'timing', duration: 300 }}
        >
          {renderStepContent()}
        </MotiView>
      </ScrollView>

      {/* Bottom Nav */}
      <View className="absolute bottom-0 left-0 right-0 bg-zinc-950 border-t border-gray-800 p-4 flex-row justify-between items-center">
        <View className="flex-row gap-2">
          {currentStep > 1 && (
            <TouchableOpacity
              onPress={prevStep}
              className="p-3 bg-gray-800 rounded-xl border border-gray-700"
            >
              <ArrowLeft size={20} color="white" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={resetPreferences}
            className="p-3 bg-gray-800 rounded-xl border border-gray-700"
          >
            <RotateCcw size={20} color="white" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={nextStep}
          disabled={loading}
          className={`flex-row items-center gap-2 px-6 py-3 rounded-xl ${loading ? 'bg-gray-700' : 'bg-emerald-500'}`}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Text className="text-white font-bold text-base">
                {currentStep === totalSteps ? 'Get Results' : 'Next'}
              </Text>
              {currentStep !== totalSteps && <ArrowRight size={20} color="white" />}
              {currentStep === totalSteps && <Sparkles size={20} color="white" />}
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}