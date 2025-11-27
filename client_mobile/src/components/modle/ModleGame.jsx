import React, { useEffect, useState, useContext, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, DeviceEventEmitter, useWindowDimensions } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { MotiView, AnimatePresence } from 'moti';
import { AuthContext } from '../../context/AuthContext';
import { ModleContext } from '../../context/ModleContext';
import * as api from '../../api';

// UTC date helper
function utcYYYYMMDD(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

const ModleGame = ({ language = 'English' }) => {
  const { user } = useContext(AuthContext);
  const { updateFromServerPayload, refreshGlobal } = useContext(ModleContext);
  const { width, height } = useWindowDimensions();
  const confettiRef = useRef(null);

  const todayStr = utcYYYYMMDD();
  const effectiveDate = todayStr;

  const [puzzle, setPuzzle] = useState(null);
  const [puzzleLoading, setPuzzleLoading] = useState(true);
  const [puzzleError, setPuzzleError] = useState(null);
  const [guess, setGuess] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [todayPlayed, setTodayPlayed] = useState(null);
  const [streak, setStreak] = useState(0);
  const [revealedHints, setRevealedHints] = useState(1);
  const [feedbackMsg, setFeedbackMsg] = useState(''); // Local feedback instead of toast

  const maxReveal = puzzle ? Math.min(5, (puzzle.hints && puzzle.hints.length) || 5) : 5;

  // Load Puzzle
  useEffect(() => {
    const loadPuzzle = async () => {
      try {
        setPuzzleLoading(true);
        setPuzzleError(null);
        const res = await api.getDailyPuzzle(language, effectiveDate);
        
        if (res && res.data) {
          setPuzzle({
            answer: res.data.answer,
            hints: res.data.hints,
            date: res.data.date,
            meta: res.data.meta || {}
          });
        } else {
          throw new Error('No puzzle data received');
        }
      } catch (error) {
        console.error('Failed to load puzzle:', error);
        setPuzzleError(error.message || 'Failed to load puzzle');
        // Fallback
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

  // Load Status
  useEffect(() => {
    const load = async () => {
      try {
        if (user) {
          const res = await api.getModleStatus(language);
          if (res && res.data) {
            const data = res.data;
            const today = effectiveDate;

            if (!data.canPlay) {
              const message = data.dailyLimitReached 
                ? "Already played today's Modle! One puzzle per day across all languages."
                : (data.completedToday ? "You already solved today's puzzle." : "Cannot play today.");

              setTodayPlayed({ 
                correct: data.completedToday, 
                globalDaily: data.dailyLimitReached, 
                date: today,
                msg: message,
                guesses: data.language?.history?.[today]?.guesses || [],
                guessesStatus: data.language?.history?.[today]?.guessesStatus || []
              });
              
              setGuesses(data.language?.history?.[today]?.guesses || []);
              const prevGuesses = (data.language?.history?.[today]?.guesses || []).length;
              setRevealedHints(Math.min(maxReveal, Math.max(1, prevGuesses + 1)));
            } else {
              if (data.language?.history?.[today] && !data.language.history[today].correct) {
                setTodayPlayed(data.language.history[today]);
                setGuesses(data.language.history[today].guesses || []);
                const prevGuesses = (data.language.history[today].guesses || []).length;
                setRevealedHints(Math.min(maxReveal, Math.max(1, prevGuesses + 1)));
              } else {
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
        // Fallback or silent fail
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

  // Handle Confetti Effect
  useEffect(() => {
    if (todayPlayed && todayPlayed.correct && confettiRef.current) {
      confettiRef.current.start();
    }
  }, [todayPlayed]);

  const handleSubmitGuess = async () => {
    const normalized = (guess || '').toString().trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!normalized) return;

    if (!(revealedHints >= maxReveal || guesses.length < revealedHints)) {
      setFeedbackMsg('Submit a guess to reveal the next hint.');
      setTimeout(() => setFeedbackMsg(''), 3000);
      return;
    }

    // Optimistic Update
    const newGuesses = [...guesses, normalized];
    setGuesses(newGuesses);
    setGuess('');
    setFeedbackMsg('');

    try {
      const res = await api.postModleResult({ date: effectiveDate, language, guess: normalized });
      
      if (res && res.data) {
        const server = res.data;
        const langObj = server.language || server;
        const globalObj = server.global;

        if (langObj && langObj.history && langObj.history[effectiveDate]) {
          const serverResult = langObj.history[effectiveDate];
          setTodayPlayed(serverResult);

          if ((serverResult.guesses || []).length > newGuesses.length) {
            setGuesses(serverResult.guesses || []);
            const serverHints = Math.min(maxReveal, Math.max(1, (serverResult.guesses || []).length + 1));
            if (!serverResult.correct) {
               setRevealedHints(serverHints);
            }
          }

          if (serverResult.correct) {
            // Correct
            const answer = puzzle.answer || server.solvedAnswer;
            if (server.solvedAnswer && !puzzle.answer) {
              setPuzzle(prev => ({ ...prev, answer: server.solvedAnswer }));
            }
            setFeedbackMsg(`Correct! The movie was ${answer}.`);
            if (refreshGlobal) refreshGlobal();
            
            try {
              const eventDetail = { language: langObj, global: globalObj };
              DeviceEventEmitter.emit('modleUpdated', eventDetail);
              updateFromServerPayload(eventDetail, language);
            } catch (e) {}

          } else {
            // Incorrect
            const nextHints = Math.min(maxReveal, newGuesses.length + 1);
            setRevealedHints(nextHints);
            setFeedbackMsg('Incorrect guess. Try again!');
            setTimeout(() => setFeedbackMsg(''), 2000);
          }
        }
        const primaryStreak = server.primaryStreak || (globalObj && globalObj.streak) || 0;
        setStreak(primaryStreak);
      }
    } catch (e) {
      if (e.response && e.response.status === 409) {
        const errorMsg = e.response.data?.msg || 'You have already played today.';
        setFeedbackMsg(errorMsg);
        const responseData = e.response.data;
        if (responseData) {
           setTodayPlayed({ 
            correct: responseData.dailyLimitReached || false, 
            globalDaily: responseData.dailyLimitReached || false, 
            date: effectiveDate,
            msg: errorMsg 
          });
        }
      } else {
        Alert.alert('Error', 'Unable to submit guess. Check connection.');
      }
    }
  };

  if (puzzleLoading) {
    return (
      <View className="bg-card p-6 rounded-xl mx-4 my-2 border border-border items-center">
        <ActivityIndicator size="large" color="#16a34a" />
        <Text className="text-muted-foreground mt-4">Loading today's puzzle...</Text>
      </View>
    );
  }

  if (puzzleError && (!puzzle || puzzle.answer === 'LOADING')) {
    return (
      <View className="bg-card p-6 rounded-xl mx-4 my-2 border border-border items-center">
        <Text className="text-red-400 mb-2 font-bold">Failed to load puzzle</Text>
        <Text className="text-gray-400 text-sm mb-4 text-center">{puzzleError}</Text>
      </View>
    );
  }

  if (!puzzle) {
    return (
      <View className="bg-card p-6 rounded-xl mx-4 my-2 border border-border items-center">
        <Text className="text-gray-400">No puzzle available for today.</Text>
      </View>
    );
  }

  const isGameOver = todayPlayed && (todayPlayed.correct || todayPlayed.globalDaily);

  return (
    <View className="bg-card p-4 rounded-xl mx-2 my-2 border border-border relative">
      {/* Confetti Cannon */}
      <ConfettiCannon
        count={200}
        origin={{x: width / 2, y: -10}}
        autoStart={false}
        ref={confettiRef}
        fadeOut={true}
      />

      {/* Header Info */}
      <View className="flex-row justify-between mb-4">
        <View>
          <Text className="text-sm text-gray-400">
            Puzzle date: <Text className="font-bold text-foreground">{puzzle.date}</Text>
          </Text>
          <Text className="text-sm text-gray-400">
            Streak: <Text className="font-bold text-foreground">{streak} 🔥</Text>
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-sm text-gray-400">Guesses: {guesses.length}</Text>
          {isGameOver && (
            <Text className={`font-bold ${todayPlayed.globalDaily ? "text-yellow-400" : "text-green-400"}`}>
              {todayPlayed.globalDaily ? "Daily Limit" : "Solved"}
            </Text>
          )}
        </View>
      </View>

      {/* Feedback Message */}
      {feedbackMsg ? (
        <Text className={`text-center mb-4 font-bold ${feedbackMsg.includes('Correct') ? 'text-green-400' : 'text-yellow-400'}`}>
          {feedbackMsg}
        </Text>
      ) : null}

      {/* Win Banner */}
      {isGameOver && puzzle.answer && (
        <MotiView
          from={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring' }}
          className="mb-4 p-3 bg-green-900/40 border border-green-800 rounded-lg"
        >
          <Text className="text-green-300 text-center font-bold">
            🎉 Correct! The movie was {puzzle.answer}. 🎉
          </Text>
        </MotiView>
      )}

      {/* Hints List */}
      <View className="mb-4">
        <Text className="font-bold text-foreground mb-3 text-lg">
          Hints <Text className="text-sm text-gray-400 font-normal">({revealedHints}/{maxReveal})</Text>
        </Text>
        
        <View className="gap-2">
          {(puzzle.hints || []).slice(0, revealedHints).map((h, i) => (
            <MotiView
              key={i}
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ delay: i * 100, type: 'timing', duration: 300 }}
              className="flex-row items-center gap-3 p-3 bg-black/20 rounded-lg border border-white/5"
            >
              <View className="w-6 h-6 bg-primary/20 items-center justify-center rounded-full">
                <Text className="text-primary font-bold text-xs">{i + 1}</Text>
              </View>
              <Text className="text-gray-200 flex-1 leading-5">{h}</Text>
            </MotiView>
          ))}
        </View>

        {revealedHints < maxReveal && !isGameOver && (
          <Text className="text-xs text-gray-500 mt-2 italic">
            Submit a guess to reveal the next hint.
          </Text>
        )}
      </View>

      {/* Input Form */}
      <View className="flex-row gap-2 mb-4">
        <TextInput
          value={guess}
          onChangeText={setGuess}
          placeholder="Enter movie title"
          placeholderTextColor="#6b7280"
          editable={!isGameOver}
          className="flex-1 bg-input text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-primary"
          autoCapitalize="characters"
          onSubmitEditing={handleSubmitGuess}
        />
        <TouchableOpacity
          onPress={handleSubmitGuess}
          disabled={isGameOver}
          className={`px-5 justify-center rounded-lg ${isGameOver ? 'bg-gray-600' : 'bg-primary'}`}
        >
          <Text className="text-primary-foreground font-bold">Guess</Text>
        </TouchableOpacity>
      </View>

      {/* Previous Guesses */}
      <View className="mt-2">
        <Text className="font-bold text-foreground mb-2">Previous guesses</Text>
        {guesses.length === 0 && <Text className="text-gray-500 italic">No guesses yet.</Text>}
        
        <View className="gap-2">
          {guesses.slice().reverse().map((g, i) => {
            const guessIdx = guesses.length - 1 - i;
            const isCorrect = todayPlayed?.guessesStatus?.[guessIdx] === true;
            const isIncorrect = todayPlayed?.guessesStatus?.[guessIdx] === false;
            
            return (
              <MotiView
                key={guessIdx}
                from={{ opacity: 0, translateY: -10 }}
                animate={{ opacity: 1, translateY: 0 }}
                className="p-3 bg-black/30 rounded-lg flex-row justify-between items-center border border-white/5"
              >
                <Text className="text-gray-300 font-bold uppercase tracking-wide">{g}</Text>
                {isCorrect && <Text className="text-lg">✔️</Text>}
                {isIncorrect && <Text className="text-lg">❌</Text>}
              </MotiView>
            );
          })}
        </View>
      </View>
    </View>
  );
};

export default ModleGame;