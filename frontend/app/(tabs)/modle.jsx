import React, { useContext, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

import { AuthContext } from '../../src/context/AuthContext';
import * as api from '../../src/api';
import { useScrollToTop } from './_layout';

// Available languages - no longer need puzzle imports since they come from backend
const availableLanguages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'];

export default function ModlePage() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const scrollViewRef = useRef(null);
  const { registerScrollRef } = useScrollToTop();
  const [completedToday, setCompletedToday] = useState({});
  const [loading, setLoading] = useState(true);
  const [globalDailyLimitReached, setGlobalDailyLimitReached] = useState(false);
  const [playedLanguage, setPlayedLanguage] = useState(null);

  // Register scroll ref for tab navigation
  useEffect(() => {
    if (registerScrollRef) {
      registerScrollRef('modle', scrollViewRef);
    }
  }, [registerScrollRef]);

  // Check completion status for all languages
  useEffect(() => {
    const checkCompletionStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const today = new Date().toISOString().slice(0, 10);
        
        // First check global status to see if user has played ANY language today
        try {
          const globalResponse = await api.getModleStatus('global');
          if (globalResponse.data.history && globalResponse.data.history[today]) {
            // User has already played today - set global daily limit reached
            setGlobalDailyLimitReached(true);
            // Find which language they played
            for (const lang of availableLanguages) {
              try {
                const langResponse = await api.getModleStatus(lang);
                if (langResponse.data.history && 
                    langResponse.data.history[today] && 
                    langResponse.data.history[today].correct) {
                  setPlayedLanguage(lang);
                  break;
                }
              } catch (e) { /* ignore */ }
            }
            setLoading(false);
            return;
          }
        } catch (error) {
          console.debug('Failed to check global status:', error);
        }
        
        // If no global daily limit, check individual language completion status
        const statusPromises = availableLanguages.map(async (lang) => {
          try {
            const response = await api.getModleStatus(lang);
            const isCompleted = response.data.history && 
                               response.data.history[today] && 
                               response.data.history[today].correct;
            return { lang, completed: isCompleted };
          } catch (error) {
            return { lang, completed: false };
          }
        });

        const results = await Promise.all(statusPromises);
        const completionMap = {};
        results.forEach(({ lang, completed }) => {
          completionMap[lang] = completed;
        });
        setCompletedToday(completionMap);
      } catch (error) {
        console.error('Failed to check completion status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkCompletionStatus();
  }, [user]);

  const handleChoose = async (chosen) => {
    // Check if global daily limit is reached
    if (globalDailyLimitReached) {
      Alert.alert(
        'Daily Limit Reached',
        'One Modle per day across all languages. Come back tomorrow!'
      );
      return;
    }
    
    // Check if user has already completed this language today
    if (user && completedToday[chosen]) {
      Alert.alert(
        'Already Completed',
        `You already completed today's Modle in ${chosen}! Come back tomorrow for a new puzzle.`
      );
      return;
    }

    // Navigate to the selected language (global validation prevents multiple plays per day)
    router.push(`/modle/play?lang=${encodeURIComponent(chosen)}`);
  };

  return (
    <View style={styles.container}>
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Gradient Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Modle — Movie Wordle</Text>
          <Text style={styles.subtitle}>Guess the movie of the day!</Text>
        </View>

        {/* How to Play Card */}
        <View style={styles.instructionsCard}>
          <View style={styles.instructionsHeader}>
            <Ionicons name="information-circle" size={20} color="#60a5fa" />
            <Text style={styles.instructionsTitle}>How to Play</Text>
          </View>
          <View style={styles.instructionsList}>
            <Text style={styles.instructionItem}>
              • Choose one language to play per day. Your streak is tracked per language.
            </Text>
            <Text style={styles.instructionItem}>
              • Guess the movie title based on the hints provided.
            </Text>
            <Text style={styles.instructionItem}>
              • Each incorrect guess reveals another hint, up to a maximum number of hints.
            </Text>
            <Text style={styles.instructionItem}>
              • You can only guess once per revealed hint until all hints are shown.
            </Text>
          </View>
        </View>

        {/* Language Selection */}
        <Text style={styles.selectionTitle}>
          {globalDailyLimitReached ? "Today's Modle Complete!" : "Choose Your Language for Today"}
        </Text>

        {loading && user ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={styles.loadingText}>Loading your progress...</Text>
          </View>
        ) : globalDailyLimitReached ? (
          <View style={styles.dailyLimitCard}>
            <Ionicons name="checkmark-circle" size={48} color="#10b981" />
            <Text style={styles.dailyLimitTitle}>Daily Limit Reached!</Text>
            <Text style={styles.dailyLimitMessage}>
              You've already completed today's Modle{playedLanguage ? ` in ${playedLanguage}` : ''}.
            </Text>
            <Text style={styles.dailyLimitSubtext}>
              Come back tomorrow for a new puzzle in any language!
            </Text>
            <View style={styles.dailyLimitInfo}>
              <Ionicons name="information-circle" size={16} color="#6b7280" />
              <Text style={styles.dailyLimitInfoText}>
                One Modle per day across all languages
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.languageGrid}>
            {availableLanguages.map(lang => {
              const isCompleted = user && completedToday[lang];
              return (
                <TouchableOpacity
                  key={lang}
                  onPress={() => handleChoose(lang)}
                  disabled={isCompleted}
                  style={[
                    styles.languageCard,
                    isCompleted && styles.languageCardCompleted
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.languageHeader}>
                    <Text style={[
                      styles.languageName,
                      isCompleted && styles.languageNameCompleted
                    ]}>
                      {lang}
                    </Text>
                    {isCompleted ? (
                      <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                    ) : (
                      <Ionicons name="play-circle" size={24} color="#6b7280" />
                    )}
                  </View>
                  <Text style={[
                    styles.languageDescription,
                    isCompleted && styles.languageDescriptionCompleted
                  ]}>
                    {isCompleted ? '✅ Completed today!' : `Play Modle in ${lang}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
    paddingTop: 120,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120, // Increased padding for Samsung navigation compatibility
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#10b981',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 12,
    textShadowColor: 'rgba(16, 185, 129, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#d1d5db',
    textAlign: 'center',
    fontWeight: '500',
  },
  instructionsCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#374151',
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  instructionsList: {
    gap: 8,
  },
  instructionItem: {
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
  },
  selectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9ca3af',
  },
  languageGrid: {
    gap: 16,
  },
  languageCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  languageCardCompleted: {
    backgroundColor: '#10b981/10',
    borderColor: '#10b981/30',
  },
  languageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  languageName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  languageNameCompleted: {
    color: '#10b981',
  },
  languageDescription: {
    fontSize: 14,
    color: '#9ca3af',
  },
  languageDescriptionCompleted: {
    color: '#10b981',
  },
  dailyLimitCard: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10b981',
    marginHorizontal: 16,
  },
  dailyLimitTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
    marginTop: 12,
    marginBottom: 8,
  },
  dailyLimitMessage: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  dailyLimitSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 16,
  },
  dailyLimitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#374151',
    borderRadius: 8,
  },
  dailyLimitInfoText: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});