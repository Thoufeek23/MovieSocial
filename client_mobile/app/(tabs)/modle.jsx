import React, { useContext, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../src/context/AuthContext';
import * as api from '../../src/api';
import { useScrollToTop } from './_layout';

const availableLanguages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'];

export default function ModlePage() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const scrollViewRef = useRef(null);
  const { registerScrollRef } = useScrollToTop();

  useEffect(() => {
    if (registerScrollRef) {
      registerScrollRef('modle', scrollViewRef);
    }
  }, [registerScrollRef]);

  const [completedToday, setCompletedToday] = useState({});
  const [loading, setLoading] = useState(true);
  const [globalDailyLimitReached, setGlobalDailyLimitReached] = useState(false);
  const [playedLanguage, setPlayedLanguage] = useState(null);

  useEffect(() => {
    const checkCompletionStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const today = new Date().toISOString().slice(0, 10);
        try {
          const globalResponse = await api.getModleStatus('global');
          if (globalResponse.data.history && globalResponse.data.history[today]) {
            setGlobalDailyLimitReached(true);
            for (const lang of availableLanguages) {
              try {
                const langResponse = await api.getModleStatus(lang);
                if (langResponse.data.history?.[today]?.correct) {
                  setPlayedLanguage(lang);
                  break;
                }
              } catch (e) {}
            }
            setLoading(false);
            return;
          }
        } catch (error) {
          console.debug('Failed to check global status:', error);
        }
        
        const statusPromises = availableLanguages.map(async (lang) => {
          try {
            const response = await api.getModleStatus(lang);
            const isCompleted = response.data.history?.[today]?.correct;
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

  const handleChoose = (chosen) => {
    if (globalDailyLimitReached) {
      Alert.alert('Daily Limit Reached', 'One Modle per day across all languages. Come back tomorrow!');
      return;
    }
    if (user && completedToday[chosen]) {
      Alert.alert('Already Completed', `You already completed today's Modle in ${chosen}!`);
      return;
    }
    router.push(`/modle/play?lang=${encodeURIComponent(chosen)}`);
  };

  return (
    <View className="flex-1 bg-zinc-950 pt-[60px]">
      <ScrollView 
        ref={scrollViewRef} 
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }} 
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View className="items-center mb-8">
          <Text className="text-3xl font-extrabold text-emerald-500 text-center mb-2">Modle — Movie Wordle</Text>
          <Text className="text-lg text-gray-300 text-center font-medium">Guess the movie of the day!</Text>
        </View>

        {/* How to Play Card */}
        <View className="bg-gray-800 rounded-xl p-5 mb-8 border border-gray-700">
          <View className="flex-row items-center gap-2 mb-4">
            <Ionicons name="information-circle" size={20} color="#60a5fa" />
            <Text className="text-lg font-semibold text-white">How to Play</Text>
          </View>
          <View className="gap-2">
            <Text className="text-gray-300 text-sm leading-5">• Choose one language to play per day. Your streak is tracked per language.</Text>
            <Text className="text-gray-300 text-sm leading-5">• Guess the movie title based on the hints provided.</Text>
            <Text className="text-gray-300 text-sm leading-5">• Each incorrect guess reveals another hint, up to a maximum number of hints.</Text>
            <Text className="text-gray-300 text-sm leading-5">• You can only guess once per revealed hint until all hints are shown.</Text>
          </View>
        </View>

        {/* Selection Header */}
        <Text className="text-xl font-semibold text-white text-center mb-6">
          {globalDailyLimitReached ? "Today's Modle Complete!" : "Choose Your Language for Today"}
        </Text>

        {/* Content States */}
        {loading && user ? (
          <View className="items-center py-8">
            <ActivityIndicator size="large" color="#10b981" />
            <Text className="mt-3 text-sm text-gray-400">Loading your progress...</Text>
          </View>
        ) : globalDailyLimitReached ? (
          <View className="bg-gray-800 rounded-2xl p-6 items-center border-2 border-emerald-500 mx-4">
            <Ionicons name="checkmark-circle" size={48} color="#10b981" />
            <Text className="text-xl font-bold text-emerald-500 mt-3 mb-2">Daily Limit Reached!</Text>
            <Text className="text-base text-white text-center mb-2">
              You've already completed today's Modle{playedLanguage ? ` in ${playedLanguage}` : ''}.
            </Text>
            <Text className="text-sm text-gray-400 text-center mb-4">
              Come back tomorrow for a new puzzle in any language!
            </Text>
            <View className="flex-row items-center gap-2 px-3 py-2 bg-gray-700 rounded-lg">
              <Ionicons name="information-circle" size={16} color="#9ca3af" />
              <Text className="text-xs text-gray-400 italic">One Modle per day across all languages</Text>
            </View>
          </View>
        ) : (
          <View className="gap-4">
            {availableLanguages.map(lang => {
              const isCompleted = user && completedToday[lang];
              return (
                <TouchableOpacity
                  key={lang}
                  onPress={() => handleChoose(lang)}
                  disabled={isCompleted}
                  className={`bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-sm ${isCompleted ? 'bg-emerald-500/10 border-emerald-500/30' : ''}`}
                  activeOpacity={0.7}
                >
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className={`text-xl font-bold text-white ${isCompleted ? 'text-emerald-500' : ''}`}>
                      {lang}
                    </Text>
                    {isCompleted ? (
                      <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                    ) : (
                      <Ionicons name="play-circle" size={24} color="#6b7280" />
                    )}
                  </View>
                  <Text className={`text-sm text-gray-400 ${isCompleted ? 'text-emerald-500' : ''}`}>
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