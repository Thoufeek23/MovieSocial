import React, { useEffect, useState, useContext } from 'react';
import { View, Text, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../src/context/AuthContext';
import ModleGame from '../../src/components/modle/ModleGame';
import * as api from '../../src/api';

const availableLanguages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'];

export default function ModlePlayPage() {
  const { lang } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useContext(AuthContext);
  
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [canPlay, setCanPlay] = useState(false);
  
  // Default to English if lang is missing or invalid, but usually we redirect
  const language = availableLanguages.includes(lang) ? lang : 'English';

  useEffect(() => {
    // Redirect if invalid language
    if (!availableLanguages.includes(lang)) {
      router.replace('/(tabs)/modle');
      return;
    }

    const checkPlayStatus = async () => {
      if (!user) {
        // Allow non-authenticated users to play (no persistence)
        setCanPlay(true);
        setIsCheckingStatus(false);
        return;
      }

      try {
        const today = new Date().toISOString().slice(0, 10);

        // 1. Check Global Status (One puzzle per day across ALL languages)
        const globalResponse = await api.getModleStatus('global');
        if (globalResponse.data.history && globalResponse.data.history[today]) {
          Alert.alert(
            'Daily Limit Reached',
            "You have already played today's Modle in another language. One puzzle per day across all languages.",
            [{ text: 'OK', onPress: () => router.replace('/(tabs)/modle') }]
          );
          return;
        }

        // 2. Check Language Specific Status
        const response = await api.getModleStatus(language);
        const modleStatus = response.data;

        // If user already completed this specific language today successfully
        if (modleStatus.history && modleStatus.history[today] && modleStatus.history[today].correct) {
          Alert.alert(
            'Completed',
            `You already completed today's Modle in ${language}! Come back tomorrow.`,
            [{ text: 'OK', onPress: () => router.replace('/(tabs)/modle') }]
          );
          return;
        }

        // Allowed to play
        setCanPlay(true);
      } catch (error) {
        console.error('Failed to check Modle status:', error);
        // Fail gracefully and let them try to play
        setCanPlay(true);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkPlayStatus();
  }, [user, lang]);

  if (isCheckingStatus) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950 justify-center items-center">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="text-gray-400 mt-4">Checking game status...</Text>
      </SafeAreaView>
    );
  }

  if (!canPlay) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950 justify-center items-center">
        <Text className="text-gray-400">Redirecting...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-800">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View className="ml-2">
          <Text className="text-white font-bold text-lg">Modle — {language}</Text>
        </View>
      </View>

      <View className="p-4">
        <Text className="text-gray-400 mb-4 text-center text-sm">
          Playing Modle in <Text className="text-emerald-500 font-bold">{language}</Text>. Your streak continues across all languages!
        </Text>
      </View>

      {/* Game Component */}
      <ModleGame language={language} />
    </SafeAreaView>
  );
}