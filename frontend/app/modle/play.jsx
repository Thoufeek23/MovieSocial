import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../src/context/AuthContext';
import ModleGame from '../../components/ModleGame';
import * as api from '../../src/api';

// Available languages - puzzles now come from backend
const availableLanguages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'];

const ModlePlayPage = () => {
  const { lang } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [canPlay, setCanPlay] = useState(false);
  
  const language = lang || 'English';

  // Check if user has already played today
  useEffect(() => {
    const checkPlayStatus = async () => {
      if (!user) {
        // Allow non-authenticated users to play (they won't have persistent state)
        setCanPlay(true);
        setIsCheckingStatus(false);
        return;
      }

      try {
        const response = await api.getModleStatus(language);
        const modleStatus = response.data;
        
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().slice(0, 10);
        
        // Check if user played today and got it correct
        if (modleStatus.history && modleStatus.history[today] && modleStatus.history[today].correct) {
          Alert.alert(
            'Already Completed',
            `You already completed today's Modle in ${language}! Come back tomorrow for a new puzzle.`,
            [
              {
                text: 'OK',
                onPress: () => router.replace('/modle')
              }
            ]
          );
          return;
        }
        
        // User hasn't completed today's puzzle, allow them to play
        setCanPlay(true);
      } catch (error) {
        console.error('Failed to check Modle status:', error);
        // On error, allow them to play (fail gracefully)
        setCanPlay(true);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkPlayStatus();
  }, [user, language, router]);

  // if invalid language, go back to selection
  if (!availableLanguages.includes(language)) {
    // redirect back to language selection
    router.replace('/modle');
    return null;
  }

  if (isCheckingStatus) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Modle</Text>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Checking your game status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!canPlay) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Redirecting...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modle — {language}</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>
          Playing Modle in <Text style={styles.subtitleHighlight}>{language}</Text>. 
          You can only choose one language per day.
        </Text>
        
        <ModleGame language={language} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  subtitleHighlight: {
    fontWeight: 'bold',
    color: '#10b981',
  },
});

export default ModlePlayPage;