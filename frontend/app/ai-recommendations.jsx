import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  RotateCcw, 
  Calendar,
} from 'lucide-react-native';
import { useAuth } from '../src/context/AuthContext';
import * as api from '../src/api';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

const AIMovieRecommendationPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
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

  // Load stored recommendations on component mount
  useEffect(() => {
    loadStoredRecommendations();
  }, []);

  const loadStoredRecommendations = async () => {
    try {
      const storedRecommendations = await AsyncStorage.getItem('aiMovieRecommendations');
      const storedPreferences = await AsyncStorage.getItem('aiMoviePreferences');
      
      if (storedRecommendations && storedPreferences) {
        const parsedRecommendations = JSON.parse(storedRecommendations);
        const parsedPreferences = JSON.parse(storedPreferences);
        
        setRecommendations(parsedRecommendations);
        setPreferences(parsedPreferences);
        setShowResults(true);
      }
    } catch (error) {
      // Clear corrupted data
      await AsyncStorage.removeItem('aiMovieRecommendations');
      await AsyncStorage.removeItem('aiMoviePreferences');
    }
  };

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
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
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
    
    // Clear stored data from AsyncStorage
    await AsyncStorage.removeItem('aiMovieRecommendations');
    await AsyncStorage.removeItem('aiMoviePreferences');
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Validate preferences before sending
      const requiredFields = ['genres', 'mood', 'languages'];
      const missingFields = requiredFields.filter(field => {
        const value = preferences[field];
        return !value || (Array.isArray(value) && value.length === 0);
      });
      
      if (missingFields.length > 0) {
        Alert.alert('Incomplete Form', `Please complete: ${missingFields.join(', ')}`);
        setLoading(false);
        return;
      }
      
      const response = await api.getAIMovieRecommendations(preferences);
      
      setRecommendations(response.data.recommendations);
      setShowResults(true);
      
      // Store recommendations and preferences in AsyncStorage
      await AsyncStorage.setItem('aiMovieRecommendations', JSON.stringify(response.data.recommendations));
      await AsyncStorage.setItem('aiMoviePreferences', JSON.stringify(preferences));
    } catch (error) {
      // More detailed error handling
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.msg || error.response.data?.details || 'Unknown error';
        
        if (status === 400) {
          Alert.alert('Invalid Request', message);
        } else if (status === 401) {
          Alert.alert('Authentication Error', 'Please log in again');
        } else if (status === 429) {
          Alert.alert('Rate Limited', 'Too many requests. Please try again later.');
        } else {
          Alert.alert('Server Error', message);
        }
      } else if (error.request) {
        Alert.alert('Network Error', 'Please check your connection.');
      } else {
        Alert.alert('Error', 'Failed to get recommendations. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    const stepData = [
      {
        title: 'What genres do you usually enjoy?',
        subtitle: 'Choose any number that appeal to you',
        options: ['Romance / Rom-com', 'Action', 'Thriller / Mystery', 'Horror', 'Drama', 'Comedy', 
                 'Sci-fi / Fantasy', 'Adventure', 'Animated', 'Crime / Gangster', 'Slice-of-life', 'Feel-good movies'],
        field: 'genres',
        multiSelect: true
      },
      {
        title: 'What kind of mood do you prefer in movies?',
        subtitle: 'Choose the mood that resonates with you',
        options: ['Light-hearted & fun', 'Deep & emotional', 'Intense & gripping', 'Slow & realistic',
                 'Fast-paced & exciting', 'Inspirational / uplifting', 'A mix of emotional + entertaining'],
        field: 'mood',
        multiSelect: false
      },
      {
        title: 'What languages do you prefer?',
        subtitle: 'Select all languages you\'re comfortable with',
        options: ['English', 'Tamil', 'Telugu', 'Malayalam', 'Hindi', 'Kannada', 'Korean', 'Japanese', 'Any language is fine'],
        field: 'languages',
        multiSelect: true
      },
      {
        title: 'What type of endings do you prefer?',
        subtitle: 'Choose your preferred story conclusion style',
        options: ['Happy ending', 'Bittersweet ending', 'Open ending', 'Tragic ending', "Doesn't matter if the movie is good"],
        field: 'endings',
        multiSelect: false
      },
      {
        title: 'What story themes attract you the most?',
        subtitle: 'Select themes that interest you',
        options: ['Love & relationships', 'Friendship', 'Coming-of-age', 'Family drama', 'Crime & investigation',
                 'Revenge', 'Social issues', 'Psychological themes', 'Survival / adventure', 'Historical / period films', 'Fantasy / world-building'],
        field: 'themes',
        multiSelect: true
      },
      {
        title: 'Do you enjoy movies with:',
        subtitle: 'Select what you value most in films',
        options: ['Strong emotional depth', 'Strong comedy', 'Strong action', 'Strong plot twists',
                 'Strong character development', 'Music-driven storytelling', 'Realistic slice-of-life vibes',
                 'Larger-than-life moments'],
        field: 'enjoys',
        multiSelect: true
      },
      {
        title: 'What kind of pace do you prefer?',
        subtitle: 'Choose your preferred movie pacing',
        options: ['Slow-burn', 'Medium paced', 'Fast paced', 'Depends on the genre'],
        field: 'pace',
        multiSelect: false
      },
      {
        title: 'What kind of characters do you connect with?',
        subtitle: 'Select character types that resonate with you',
        options: ['Boy-next-door / girl-next-door', 'Flawed but relatable characters', 'Strong, confident leads',
                 'Quirky, funny characters', 'Dark, mysterious characters', 'Underdogs',
                 'Characters with deep emotional arcs'],
        field: 'characters',
        multiSelect: true
      },
      {
        title: 'What kind of movie experience do you enjoy most?',
        subtitle: 'Choose your ideal movie experience',
        options: ['Feel-good & relaxing', 'Emotional rollercoaster', 'Thought-provoking', 'Adrenaline/high-energy', 'Escapist entertainment',
                 'Realistic & grounded', 'Beautiful visuals & cinematography', 'Strong writing & performances'],
        field: 'experience',
        multiSelect: false
      },
      {
        title: 'How do you usually watch movies?',
        subtitle: 'Select your typical movie-watching situation',
        options: ['Alone', 'With friends', 'With partner', 'With family', 'Depends on the mood'],
        field: 'watchWith',
        multiSelect: false
      },
      {
        title: 'What release period do you prefer?',
        subtitle: 'Choose your preferred era of films',
        options: ['1970s & earlier', '1980s', '1990s', '2000 to 2010',
                 '2010 to 2020', '2020 to present', 'No preference'],
        field: 'releasePeriod',
        multiSelect: false
      }
    ];

    const step = stepData[currentStep - 1];
    if (!step) return null;

    return (
      <View style={styles.stepContainer}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
        </View>
        
        <View style={styles.optionsContainer}>
          {step.options.map((option) => {
            const isSelected = step.multiSelect 
              ? preferences[step.field].includes(option)
              : preferences[step.field] === option;
              
            return (
              <TouchableOpacity
                key={option}
                onPress={() => step.multiSelect 
                  ? handleMultiSelect(step.field, option)
                  : handleSingleSelect(step.field, option)
                }
                style={[
                  styles.optionButton,
                  isSelected && styles.optionButtonSelected
                ]}
              >
                <Text style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const MovieCard = ({ movie, index }) => (
    <TouchableOpacity
      style={styles.movieCard}
      onPress={() => router.push(`/movie/${movie.id}`)}
    >
      {movie.poster_path && (
        <Image
          source={{ uri: `https://image.tmdb.org/t/p/w500${movie.poster_path}` }}
          style={styles.moviePoster}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>#{index + 1}</Text>
      </View>
      
      <View style={styles.movieInfo}>
        <Text style={styles.movieTitle} numberOfLines={2}>{movie.title}</Text>
        
        <View style={styles.movieMeta}>
          <Calendar color="#9ca3af" size={12} />
          <Text style={styles.movieYear}>
            {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
          </Text>
        </View>
        
        {movie.ai_reason && (
          <Text style={styles.aiReason} numberOfLines={3}>
            <Text style={styles.aiReasonLabel}>Why this fits: </Text>
            {movie.ai_reason}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
        <View style={styles.centerContent}>
          <Text style={styles.loginTitle}>Please log in to get personalized movie recommendations</Text>
          <TouchableOpacity
            onPress={() => router.push('/login')}
            style={styles.loginButton}
          >
            <Text style={styles.loginButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingTitle}>Finding perfect movies for you...</Text>
          <Text style={styles.loadingSubtitle}>Our AI is analyzing your preferences</Text>
        </View>
      </View>
    );
  }

  if (showResults) {
    const topRecommendations = recommendations.slice(0, 6);
    const moreRecommendations = recommendations.slice(6);

    return (
      <ScrollView 
        style={[styles.container, { paddingTop: insets.top + 60 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <TouchableOpacity 
          style={styles.logoContainer}
          onPress={() => router.push('/(tabs)')}
        >
          <Image 
            source={require('../assets/images/MS_icon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.resultsHeader}>
          <View style={styles.headerIconContainer}>
            <Sparkles color="#10b981" size={32} />
            <Text style={styles.resultsTitle}>Your Personalized Recommendations</Text>
          </View>
          <Text style={styles.resultsSubtitle}>Based on your preferences, here are movies we think you'll love</Text>
        </View>

        {/* Top Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Top Picks for You</Text>
          <View style={styles.moviesGrid}>
            {topRecommendations.map((movie, index) => (
              <MovieCard key={movie.id} movie={movie} index={index} />
            ))}
          </View>
        </View>

        {/* More Suggestions */}
        {moreRecommendations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>✨ More Great Options</Text>
              <TouchableOpacity onPress={() => setShowMoreSuggestions(!showMoreSuggestions)}>
                <Text style={styles.showMoreText}>
                  {showMoreSuggestions ? 'Show Less' : 'Show More'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {showMoreSuggestions && (
              <View style={styles.moviesGrid}>
                {moreRecommendations.map((movie, index) => (
                  <MovieCard key={movie.id} movie={movie} index={index + 6} />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            onPress={async () => {
              setShowResults(false);
              setCurrentStep(1);
              // Clear stored data when modifying preferences
              await AsyncStorage.removeItem('aiMovieRecommendations');
              await AsyncStorage.removeItem('aiMoviePreferences');
            }}
            style={styles.actionButton}
          >
            <ArrowLeft color="#ffffff" size={20} />
            <Text style={styles.actionButtonText}>Modify Preferences</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            style={[styles.actionButton, loading && styles.actionButtonDisabled]}
          >
            <RotateCcw color="#ffffff" size={20} />
            <Text style={styles.actionButtonText}>Get New Suggestions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
      {/* Logo */}
      <TouchableOpacity 
        style={styles.logoContainer}
        onPress={() => router.push('/(tabs)')}
      >
        <Image 
          source={require('../assets/images/MS_icon.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconContainer}>
          <Sparkles color="#10b981" size={32} />
          <Text style={styles.title}>AI Movie Picker</Text>
        </View>
        <Text style={styles.subtitle}>Answer a few questions and let AI find the perfect movie for you</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>Step {currentStep} of {totalSteps}</Text>
          <Text style={styles.progressText}>{Math.round((currentStep / totalSteps) * 100)}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(currentStep / totalSteps) * 100}%` }
            ]} 
          />
        </View>
      </View>

      {/* Step Content */}
      <ScrollView 
        style={styles.stepScrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderStepContent()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <View style={styles.leftNavButtons}>
          {currentStep > 1 && (
            <TouchableOpacity onPress={prevStep} style={styles.navButton}>
              <ArrowLeft color="#d1d5db" size={16} />
              <Text style={styles.navButtonText}>Previous</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity onPress={resetPreferences} style={styles.navButton}>
            <RotateCcw color="#d1d5db" size={16} />
            <Text style={styles.navButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={nextStep}
          disabled={loading}
          style={[styles.nextButton, loading && styles.nextButtonDisabled]}
        >
          {currentStep === totalSteps ? (
            loading ? (
              <>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.nextButtonText}>Getting Recommendations...</Text>
              </>
            ) : (
              <>
                <Sparkles color="#ffffff" size={16} />
                <Text style={styles.nextButtonText}>Get My Movies!</Text>
              </>
            )
          ) : (
            <>
              <Text style={styles.nextButtonText}>Next</Text>
              <ArrowRight color="#ffffff" size={16} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingTop: 8,
  },
  logo: {
    width: 50,
    height: 50,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#9ca3af',
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  stepScrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContainer: {
    paddingBottom: 20,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionButton: {
    backgroundColor: '#1f2937',
    borderWidth: 2,
    borderColor: '#4b5563',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    minWidth: '48%',
    alignItems: 'center',
  },
  optionButtonSelected: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  optionText: {
    color: '#d1d5db',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 18,
  },
  optionTextSelected: {
    color: '#34d399',
  },
  navigationContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 120, // Increased padding for better Samsung navigation compatibility
  },
  leftNavButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#4b5563',
    borderRadius: 8,
    marginRight: 8,
  },
  navButtonText: {
    color: '#d1d5db',
    fontSize: 14,
    marginLeft: 8,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    width: '100%',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  resultsHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  resultsTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 8,
  },
  resultsSubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  showMoreText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '500',
  },
  moviesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  movieCard: {
    width: cardWidth,
    backgroundColor: '#1f2937',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#374151',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  moviePoster: {
    width: '100%',
    height: cardWidth * 1.4,
    backgroundColor: '#374151',
  },
  rankBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  rankText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  movieInfo: {
    padding: 16,
  },
  movieTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 10,
    lineHeight: 22,
  },
  movieMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  movieYear: {
    color: '#9ca3af',
    fontSize: 13,
    marginLeft: 6,
    fontWeight: '500',
  },
  aiReason: {
    color: '#d1d5db',
    fontSize: 13,
    lineHeight: 18,
  },
  aiReasonLabel: {
    color: '#10b981',
    fontWeight: '600',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120, // Increased padding for better Samsung navigation compatibility
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4b5563',
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#d1d5db',
    fontSize: 16,
  },
};

export default AIMovieRecommendationPage;