import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../src/context/AuthContext';
import { ModleContext } from '../src/context/ModleContext';
import * as api from '../src/api';

// Helper for UTC Date (matches server logic)
function utcYYYYMMDD(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

const ModleGame = ({ language = 'English' }) => {
  const { user } = useContext(AuthContext);
  const { updateFromServerPayload, refreshGlobal } = useContext(ModleContext);
  
  // State for puzzle
  const [puzzle, setPuzzle] = useState(null);
  const [puzzleLoading, setPuzzleLoading] = useState(true);
  const [puzzleError, setPuzzleError] = useState(null);
  const [guess, setGuess] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [todayPlayed, setTodayPlayed] = useState(null);
  const [streak, setStreak] = useState(0);
  const [revealedHints, setRevealedHints] = useState(1);
  
  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0));

  // Use UTC date to match server/web daily cycles
  const effectiveDate = utcYYYYMMDD();

  // Calculate values that depend on puzzle being loaded
  const maxReveal = puzzle ? Math.min(5, (puzzle.hints && puzzle.hints.length) || 5) : 5;

  // Load puzzle from backend
  useEffect(() => {
    const loadPuzzle = async () => {
      try {
        setPuzzleLoading(true);
        setPuzzleError(null);
        
        const res = await api.getDailyPuzzle(language, effectiveDate);
        if (res && res.data) {
          const puzzleData = res.data;
          setPuzzle({
            answer: puzzleData.answer,
            hints: puzzleData.hints,
            date: puzzleData.date,
            meta: puzzleData.meta || {}
          });
        } else {
          throw new Error('No puzzle data received');
        }
      } catch (error) {
        console.error('Failed to load puzzle:', error);
        setPuzzleError(error.message || 'Failed to load puzzle');
        setPuzzle({
          answer: 'LOADING',
          hints: ['Puzzle is loading...', 'Please check your connection'],
          date: effectiveDate,
          meta: {}
        });
      } finally {
        setPuzzleLoading(false);
      }
    };

    loadPuzzle();
  }, [language, effectiveDate]);

  // Load User Status (Server-Driven Logic)
  useEffect(() => {
    const load = async () => {
      try {
        if (user) {
          const res = await api.getModleStatus(language);
          if (res && res.data) {
            const data = res.data;
            const today = effectiveDate;
            
            // Server determines if user can play
            if (!data.canPlay) {
              const message = data.dailyLimitReached 
                ? 'Already played today\'s Modle! One puzzle per day across all languages.'
                : (data.completedToday ? 'You already solved today\'s puzzle.' : 'Cannot play today.');
                
              // Load full history including guessesStatus for coloring
              const historyItem = data.language?.history?.[today] || {};
              
              setTodayPlayed({ 
                correct: data.completedToday, 
                globalDaily: data.dailyLimitReached, 
                date: today,
                msg: message,
                guessesStatus: historyItem.guessesStatus || [], // Important for coloring
              });
              
              const serverGuesses = historyItem.guesses || [];
              setGuesses(serverGuesses);
              setRevealedHints(Math.min(maxReveal, Math.max(1, serverGuesses.length + 1)));
            } else {
              // User can play - check partial progress
              if (data.language?.history?.[today] && !data.language.history[today].correct) {
                const historyItem = data.language.history[today];
                setTodayPlayed(historyItem);
                const serverGuesses = historyItem.guesses || [];
                setGuesses(serverGuesses);
                setRevealedHints(Math.min(maxReveal, Math.max(1, serverGuesses.length + 1)));
              } else {
                // Fresh start
                setTodayPlayed(null);
                setGuesses([]);
                setRevealedHints(1);
              }
            }
            
            setStreak(data.primaryStreak || 0);
            return;
          }
        }
      } catch (e) {
        console.debug('Failed to load modle status:', e);
      }

      setTodayPlayed(null);
      setGuesses([]);
      setRevealedHints(1);
      setStreak(0);
    };

    if (puzzle && !puzzleLoading) {
      load();
    }
  }, [puzzle, user, maxReveal, language, effectiveDate, puzzleLoading]);

  // Win animation
  useEffect(() => {
    if (todayPlayed && todayPlayed.correct) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 150,
          friction: 3,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0);
    }
  }, [todayPlayed, fadeAnim, scaleAnim]);

  const handleSubmitGuess = async () => {
    const normalized = (guess || '').toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!normalized) {
      Alert.alert('Invalid Guess', 'Please enter a movie title.');
      return;
    }

    if (!(revealedHints >= maxReveal || guesses.length < revealedHints)) {
      Alert.alert('Hint Required', 'Submit a guess to reveal the next hint.');
      return;
    }

    // 1. Update guesses list immediately (Optimistic UI)
    const newGuesses = [...guesses, normalized];
    setGuesses(newGuesses);
    
    const today = effectiveDate;

    if (user) {
      try {
        // 2. Send to server
        const res = await api.postModleResult({ 
          date: today, 
          language, 
          guess: normalized 
        });
        
        if (res && res.data) {
          const server = res.data;
          const langObj = server.language || server;
          const globalObj = server.global;
          
          if (langObj && langObj.history && langObj.history[today]) {
            const serverResult = langObj.history[today];
            setTodayPlayed(serverResult);
            
            // Sync guesses if server has more
            if ((serverResult.guesses || []).length > newGuesses.length) {
              setGuesses(serverResult.guesses || []);
            }

            // 3. Handle Correct vs Incorrect
            if (serverResult.correct) {
              // --- CASE 1: Correct ---
              if (server.solvedAnswer && puzzle.answer === 'LOADING') {
                 setPuzzle(prev => ({ ...prev, answer: server.solvedAnswer }));
              }

              Alert.alert('Correct!', `The movie was ${server.solvedAnswer || puzzle.answer}.`);
              
              updateFromServerPayload({ language: langObj, global: globalObj });
              try { await refreshGlobal(); } catch (e) {}

            } else {
              // --- CASE 2: Incorrect ---
              const nextHints = Math.min(maxReveal, newGuesses.length + 1);
              setRevealedHints(nextHints);
              
              Alert.alert('Incorrect', 'Try again!');
            }
          }
          
          const primaryStreak = server.primaryStreak || (globalObj && globalObj.streak) || 0;
          setStreak(primaryStreak);
        }
      } catch (e) {
        if (e.response && e.response.status === 409) {
          const errorMsg = e.response.data?.msg || 'You have already played today.';
          Alert.alert('Daily Limit', errorMsg);
          
          const responseData = e.response.data;
          if (responseData) {
            setTodayPlayed({ 
              correct: responseData.dailyLimitReached || false, 
              globalDaily: responseData.dailyLimitReached || false, 
              date: today,
              msg: errorMsg 
            });
          }
        } else {
          Alert.alert('Error', 'Unable to submit guess. Please check your connection.');
        }
      }
    } else {
      Alert.alert('Error', 'Please log in to play Modle.');
    }

    setGuess('');
  };

  if (puzzleLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading today's puzzle...</Text>
        </View>
      </View>
    );
  }

  if (puzzleError && (!puzzle || puzzle.answer === 'LOADING')) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#dc2626" />
          <Text style={styles.errorTitle}>Failed to load puzzle</Text>
          <Text style={styles.errorText}>{puzzleError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => { /* Reload logic */ }}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!puzzle) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No puzzle available for today.</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.fixedHeader}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Date</Text>
            <Text style={styles.statValue}>{puzzle.date}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Streak</Text>
            <Text style={styles.statValue}>{streak} 🔥</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Guesses</Text>
            <Text style={styles.statValue}>{guesses.length}</Text>
          </View>
        </View>
        {todayPlayed && (todayPlayed.correct || todayPlayed.globalDaily) ? (
          <View style={styles.solvedBadge}>
            <Ionicons 
              name={todayPlayed.globalDaily ? "alert-circle" : "checkmark-circle"} 
              size={16} 
              color={todayPlayed.globalDaily ? "#f59e0b" : "#10b981"} 
            />
            <Text style={styles.solvedText}>
              {todayPlayed.globalDaily 
                ? "Daily limit reached!" 
                : "Solved! Come back tomorrow"}
            </Text>
          </View>
        ) : (
          <View style={styles.playingBadge}>
            <Ionicons name="game-controller" size={16} color="#f59e0b" />
            <Text style={styles.playingText}>Hints: {revealedHints}/{maxReveal}</Text>
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.mainContent} 
        contentContainerStyle={styles.mainContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {todayPlayed && (todayPlayed.correct || todayPlayed.globalDaily) && (
          <Animated.View 
            style={[
              styles.winContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <Text style={styles.winText}>🎉 Correct! 🎉</Text>
            <Text style={styles.winSubtext}>The movie was {puzzle.answer}</Text>
          </Animated.View>
        )}

        <View style={styles.hintsSection}>
          <Text style={styles.sectionTitle}>Movie Clues</Text>
          <View style={styles.hintsList}>
            {(puzzle.hints || []).slice(0, revealedHints).reverse().map((hint, index) => {
              const actualIndex = revealedHints - index - 1;
              return (
                <View key={actualIndex} style={styles.hintCard}>
                  <View style={styles.hintNumber}>
                    <Text style={styles.hintNumberText}>{actualIndex + 1}</Text>
                  </View>
                  <Text style={styles.hintText}>{hint}</Text>
                </View>
              );
            })}
          </View>
          {revealedHints < maxReveal && !(todayPlayed && (todayPlayed.correct || todayPlayed.globalDaily)) && (
            <View style={styles.hintNote}>
              <Ionicons name="bulb" size={14} color="#f59e0b" />
              <Text style={styles.hintNoteText}>Submit a guess to reveal the next clue</Text>
            </View>
          )}
        </View>

        <View style={styles.guessesSection}>
          <Text style={styles.sectionTitle}>Your Guesses</Text>
          {guesses.length === 0 ? (
            <View style={styles.emptyGuesses}>
              <Ionicons name="help-circle-outline" size={40} color="#6b7280" />
              <Text style={styles.noGuessesText}>No guesses yet</Text>
              <Text style={styles.noGuessesSubtext}>Start typing your guess below</Text>
            </View>
          ) : (
            <View style={styles.guessesList}>
              {guesses.slice().reverse().map((g, index) => {
                const guessIdx = guesses.length - 1 - index;
                // USE SERVER STATUS for correctness (similar to client)
                // If status not available yet (optimistic), default to null/neutral
                const isCorrect = todayPlayed && todayPlayed.guessesStatus && todayPlayed.guessesStatus[guessIdx] === true;
                const isIncorrect = todayPlayed && todayPlayed.guessesStatus && todayPlayed.guessesStatus[guessIdx] === false;
                
                return (
                  <View key={guessIdx} style={styles.guessCard}>
                    <View style={styles.guessContent}>
                      <Text style={styles.guessText}>{g}</Text>
                      <View style={styles.guessResult}>
                        {isCorrect && <Ionicons name="checkmark-circle" size={18} color="#10b981" />}
                        {isIncorrect && <Ionicons name="close-circle" size={18} color="#dc2626" />}
                        
                        {(isCorrect || isIncorrect) && (
                          <Text style={[
                            styles.guessResultText,
                            { color: isCorrect ? "#10b981" : "#dc2626" }
                          ]}>
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.fixedInputSection}>
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={[
                styles.input,
                (todayPlayed && (todayPlayed.correct || todayPlayed.globalDaily)) && styles.inputDisabled
              ]}
              value={guess}
              onChangeText={setGuess}
              placeholder="Type your movie guess..."
              placeholderTextColor="#6b7280"
              autoCapitalize="words"
              autoCorrect={false}
              editable={!(todayPlayed && (todayPlayed.correct || todayPlayed.globalDaily))}
              returnKeyType="send"
              onSubmitEditing={handleSubmitGuess}
            />
            <TouchableOpacity
              style={[
                styles.guessButton,
                (todayPlayed && (todayPlayed.correct || todayPlayed.globalDaily)) && styles.guessButtonDisabled
              ]}
              onPress={handleSubmitGuess}
              disabled={todayPlayed && (todayPlayed.correct || todayPlayed.globalDaily)}
            >
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  contentContainer: {
    padding: 16,
  },
  fixedHeader: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: Platform.OS === 'ios' ? 55 : 25,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  mainContentContainer: {
    padding: 20,
    paddingBottom: 20,
  },
  fixedInputSection: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  inputContainer: {
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9ca3af',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc2626',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 6,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  solvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    gap: 8,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  solvedText: {
    color: '#10b981',
    fontWeight: '600',
    fontSize: 13,
  },
  playingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    gap: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  playingText: {
    color: '#f59e0b',
    fontWeight: '600',
    fontSize: 13,
  },
  winContainer: {
    backgroundColor: '#10b981/20',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  winText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 4,
  },
  winSubtext: {
    fontSize: 14,
    color: '#10b981',
  },
  hintsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  hintsList: {
    gap: 12,
  },
  hintCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  hintNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10b981',
  },
  hintText: {
    flex: 1,
    fontSize: 15,
    color: '#10b981',
    lineHeight: 22,
    fontWeight: '500',
  },
  hintNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    gap: 8,
  },
  hintNoteText: {
    fontSize: 13,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  emptyGuesses: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 30,
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
  },
  noGuessesSubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  guessContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 16,
    color: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputDisabled: {
    backgroundColor: '#111827',
    borderColor: '#1f2937',
    color: '#6b7280',
  },
  guessButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  guessButtonDisabled: {
    backgroundColor: '#475569',
    shadowOpacity: 0.1,
  },
  guessesSection: {
    marginBottom: 24,
  },
  noGuessesText: {
    fontSize: 18,
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 12,
  },
  guessesList: {
    gap: 8,
  },
  guessCard: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  guessText: {
    fontSize: 16,
    color: '#f1f5f9',
    fontWeight: '500',
  },
  guessResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  guessResultText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ModleGame;