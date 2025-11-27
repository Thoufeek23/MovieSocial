import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { AuthContext } from '../../src/context/AuthContext';
import PickMovieModal from '../../src/components/movies/PickMovieModal';

export default function PostPage() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  
  const [pickOpen, setPickOpen] = useState(false);
  const [mode, setMode] = useState(null); // 'review' or 'discussion'

  // Redirect if not logged in
  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950 justify-center items-center px-6">
        <Ionicons name="lock-closed-outline" size={64} color="#4b5563" />
        <Text className="text-white text-xl font-bold mt-4 text-center">Login Required</Text>
        <Text className="text-gray-400 mt-2 text-center mb-6">
          You need to be logged in to create posts.
        </Text>
        <TouchableOpacity 
          onPress={() => router.push('/login')}
          className="bg-emerald-500 px-6 py-3 rounded-xl w-full items-center"
        >
          <Text className="text-white font-bold text-lg">Go to Login</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleChoose = (choice) => {
    setMode(choice);
    setPickOpen(true);
  };

  const handleMoviePicked = (movie) => {
    setPickOpen(false);
    
    if (mode === 'review') {
      router.push({
        pathname: '/create-review',
        params: { 
          movieId: movie.id, 
          movieTitle: movie.title, 
          moviePoster: movie.poster_path 
        }
      });
    } else if (mode === 'discussion') {
      router.push({
        pathname: '/create-discussion',
        params: { 
          movieId: movie.id, 
          movieTitle: movie.title 
        }
      });
    }
    
    setMode(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      {/* Header */}
      <View className="px-5 pt-4 pb-2 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">Create</Text>
        <View className="w-8" />
      </View>

      <View className="flex-1 px-5 pt-10">
        <MotiView 
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
        >
          <Text className="text-3xl font-bold text-white mb-2">
            What would you like to share?
          </Text>
          <Text className="text-gray-400 text-base mb-8">
            Choose a format to start your post.
          </Text>

          <View className="gap-4">
            {/* Review Option */}
            <TouchableOpacity 
              onPress={() => handleChoose('review')}
              activeOpacity={0.8}
              className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex-row items-center gap-5"
            >
              <View className="w-14 h-14 rounded-full bg-emerald-500/10 items-center justify-center">
                <Ionicons name="star" size={28} color="#10b981" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-xl font-bold mb-1">Write a Review</Text>
                <Text className="text-gray-400 text-sm">
                  Rate and review a movie you've watched recently.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#4b5563" />
            </TouchableOpacity>

            {/* Discussion Option */}
            <TouchableOpacity 
              onPress={() => handleChoose('discussion')}
              activeOpacity={0.8}
              className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex-row items-center gap-5"
            >
              <View className="w-14 h-14 rounded-full bg-blue-500/10 items-center justify-center">
                <Ionicons name="chatbubbles" size={28} color="#3b82f6" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-xl font-bold mb-1">Start a Discussion</Text>
                <Text className="text-gray-400 text-sm">
                  Ask a question or start a conversation about a film.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#4b5563" />
            </TouchableOpacity>
          </View>
        </MotiView>
      </View>

      {/* Movie Picker Modal */}
      <PickMovieModal 
        isOpen={pickOpen} 
        setIsOpen={setPickOpen} 
        onMoviePicked={handleMoviePicked} 
      />
    </SafeAreaView>
  );
}