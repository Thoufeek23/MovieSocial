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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../src/context/AuthContext';
import { ModleContext } from '../src/context/ModleContext';
import { normalizeTitle, levenshtein, localYYYYMMDD } from '../src/utils/fuzzy';
import * as api from '../src/api';

const ModleGame = ({ language = 'English' }) => {
  const { user } = useContext(AuthContext);
  const { updateFromServerPayload, refreshGlobal } = useContext(ModleContext);
  
  // State for puzzle - now loaded from backend
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

  // determine today's date string in YYYY-MM-DD
  const todayStr = localYYYYMMDD();
  const effectiveDate = todayStr;

  // Calculate values that depend on puzzle being loaded
  const normAnswer = puzzle ? normalizeTitle(puzzle.answer || '') : '';
  const fuzzyThreshold = Math.max(2, Math.ceil((normAnswer.length || 0) * 0.2));
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
        // Fallback to a default puzzle structure
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

  useEffect(() => {
    // If user is signed in, prefer server as the source-of-truth.
    const load = async () => {
      try {
        if (user) {
          const res = await api.getModleStatus(language);
          if (res && res.data) {
            const server = res.data;
            const today = effectiveDate;
            if (server.history && server.history[today]) {
              setTodayPlayed(server.history[today]);
              setGuesses(server.history[today].guesses || []);
              const prevGuesses = (server.history[today].guesses || []).length;
              setRevealedHints(Math.min(maxReveal, Math.max(1, prevGuesses + 1)));
            } else {
              setTodayPlayed(null);
              setGuesses([]);
              setRevealedHints(1);
            }
            setStreak(server.streak || 0);
            return;
          }
        }
      } catch (e) {
        // server fetch failed; fall back to defaults
        console.debug('Failed to load modle status:', e);
      }

      // No persistent localStorage fallback: for unauthenticated users or if server fetch fails
      // we keep in-memory defaults so the UI remains functional but not persisted across reloads.
      setTodayPlayed(null);
      setGuesses([]);
      setRevealedHints(1);
      setStreak(0);
    };

    // Only load modle status if puzzle is loaded
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
    if (!normalized) return;
    
    if (todayPlayed && todayPlayed.correct) {
      Alert.alert('Already Solved', 'You already solved today\'s puzzle.');
      return;
    }

    // Enforce one guess per revealed hint until the player has seen maxReveal hints.
    if (!(revealedHints >= maxReveal || guesses.length < revealedHints)) {
      Alert.alert('Hint Required', 'Submit a guess to reveal the next hint.');
      return;
    }

    const newGuesses = [...guesses, normalized];
    setGuesses(newGuesses);

    // Reveal another hint after each submitted guess, up to the configured cap (maxReveal)
    setRevealedHints(prev => Math.min(maxReveal, prev + 1));

    // Fuzzy matching: allow small typos. Normalize and compute Levenshtein distance.
    const normAnswer = normalizeTitle(puzzle.answer);
    const guessNorm = normalized;
    const dist = levenshtein(guessNorm, normAnswer);
    // threshold rules: allow distance up to 2 or 20% of answer length (whichever is larger)
    const threshold = Math.max(2, Math.ceil(normAnswer.length * 0.2));
    const isCorrect = dist <= threshold;
    const today = effectiveDate;

    // Build an in-memory history entry for the UI
    const newHistory = {};
    newHistory[today] = { date: today, correct: isCorrect, guesses: newGuesses };

    // Update UI immediately (in-memory) - streak will be updated from server response
    setTodayPlayed(newHistory[today]);
    setGuesses(newGuesses);

    if (isCorrect) {
      const note = dist > 0 ? ' (accepted with minor typo)' : '';
      Alert.alert('Correct!', `The movie was ${puzzle.answer}.${note}`);
      
      // Sync result to server if user is authenticated
      if (user) {
        try {
          const res = await api.postModleResult({ 
            date: today, 
            language, 
            correct: true, 
            guesses: newGuesses 
          });
          
          if (res && res.data) {
            const server = res.data;
            const langObj = server.language || server;
            const globalObj = server.global;
            
            if (langObj && langObj.history && langObj.history[today]) {
              setTodayPlayed(langObj.history[today]);
              setGuesses(langObj.history[today].guesses || []);
              setRevealedHints(Math.min(maxReveal, Math.max(1, (langObj.history[today].guesses || []).length + 1)));
            }
            
            if (globalObj && typeof globalObj.streak === 'number') {
              setStreak(globalObj.streak || 0);
            } else {
              setStreak((langObj && langObj.streak) || 0);
            }

            // Update context
            updateFromServerPayload({ language: langObj, global: globalObj });
            
            // Refresh global state
            try {
              await refreshGlobal();
            } catch (e) {
              console.debug('Failed to refresh global state:', e);
            }
          }
        } catch (e) {
          console.debug('POST /api/users/modle/result error:', e);
        }
      }
    } else {
      // For incorrect guesses, also send to server to keep history
      if (user) {
        try {
          const res = await api.postModleResult({ 
            date: today, 
            language, 
            correct: false, 
            guesses: newGuesses 
          });
          
          if (res && res.data) {
            const server = res.data;
            const langObj = server.language || server;
            const globalObj = server.global;
            
            if (langObj && langObj.history && langObj.history[today]) {
              setTodayPlayed(langObj.history[today]);
              setGuesses(langObj.history[today].guesses || []);
              setRevealedHints(Math.min(maxReveal, Math.max(1, (langObj.history[today].guesses || []).length + 1)));
            }
            
            if (globalObj && typeof globalObj.streak === 'number') {
              setStreak(globalObj.streak || 0);
            } else {
              setStreak((langObj && langObj.streak) || 0);
            }
          }
        } catch (e) {
          console.debug('POST incorrect guess error:', e);
        }
      }
      Alert.alert('Incorrect', 'Not correct. Try again!');
    }

    setGuess('');
  };

  // Show loading state
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

  // Show error state
  if (puzzleError && (!puzzle || puzzle.answer === 'LOADING')) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#dc2626" />
          <Text style={styles.errorTitle}>Failed to load puzzle</Text>
          <Text style={styles.errorText}>{puzzleError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => window.location.reload()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show puzzle not found state
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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header Stats */}
      <View style={styles.header}>
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
        {todayPlayed && todayPlayed.correct && (
          <View style={styles.solvedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.solvedText}>Solved</Text>
          </View>
        )}
      </View>

      {/* Win Animation */}
      {todayPlayed && todayPlayed.correct && (
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

      {/* Hints Section */}
      <View style={styles.hintsSection}>
        <Text style={styles.sectionTitle}>
          Hints ({revealedHints}/{maxReveal})
        </Text>
        <View style={styles.hintsList}>
          {(puzzle.hints || []).slice(0, revealedHints).map((hint, index) => (
            <View key={index} style={styles.hintCard}>
              <View style={styles.hintNumber}>
                <Text style={styles.hintNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.hintText}>{hint}</Text>
            </View>
          ))}
        </View>
        {revealedHints < maxReveal && !(todayPlayed && todayPlayed.correct) && (
          <Text style={styles.hintNote}>Submit a guess to reveal the next hint.</Text>
        )}
      </View>

      {/* Input Section */}
      <View style={styles.inputSection}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={guess}
            onChangeText={setGuess}
            placeholder="Enter movie title"
            placeholderTextColor="#6b7280"
            autoCapitalize="words"
            autoCorrect={false}
            editable={!(todayPlayed && todayPlayed.correct)}
          />
          <TouchableOpacity
            style={[
              styles.guessButton,
              (todayPlayed && todayPlayed.correct) && styles.guessButtonDisabled
            ]}
            onPress={handleSubmitGuess}
            disabled={todayPlayed && todayPlayed.correct}
          >
            <Text style={styles.guessButtonText}>Guess</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Previous Guesses */}
      <View style={styles.guessesSection}>
        <Text style={styles.sectionTitle}>Previous Guesses</Text>
        {guesses.length === 0 ? (
          <Text style={styles.noGuessesText}>No guesses yet.</Text>
        ) : (
          <View style={styles.guessesList}>
            {guesses.slice().reverse().map((g, index) => {
              const isCorrect = (() => {
                try {
                  const d = levenshtein(g, normAnswer);
                  return d <= fuzzyThreshold;
                } catch (e) { 
                  return false; 
                }
              })();
              
              return (
                <View key={guesses.length - 1 - index} style={styles.guessCard}>
                  <Text style={styles.guessText}>{g}</Text>
                  <View style={styles.guessResult}>
                    <Ionicons 
                      name={isCorrect ? "checkmark-circle" : "close-circle"} 
                      size={20} 
                      color={isCorrect ? "#10b981" : "#dc2626"} 
                    />
                    <Text style={[
                      styles.guessResultText,
                      { color: isCorrect ? "#10b981" : "#dc2626" }
                    ]}>
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
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
  header: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  solvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981/20',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  solvedText: {
    color: '#10b981',
    fontWeight: '600',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
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
  },
  hintNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10b981/20',
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
    fontSize: 14,
    color: '#d1d5db',
    lineHeight: 20,
  },
  hintNote: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  inputSection: {
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: 'white',
    borderWidth: 1,
    borderColor: '#374151',
  },
  guessButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  guessButtonDisabled: {
    backgroundColor: '#6b7280',
  },
  guessButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  guessesSection: {
    marginBottom: 24,
  },
  noGuessesText: {
    color: '#6b7280',
    fontStyle: 'italic',
  },
  guessesList: {
    gap: 8,
  },
  guessCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    padding: 12,
    borderRadius: 8,
  },
  guessText: {
    fontSize: 14,
    color: 'white',
    fontFamily: 'monospace',
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