import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BADGE_MAP from '../../src/data/badges';

const BadgeDetailPage = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  // Fallback if badge not found
  const badge = BADGE_MAP[id] || { 
    id: id, 
    title: id, 
    description: 'No description available.',
    color: 'bg-gray-700', // Default Tailwind class equivalent if needed, or hex
    icon: '🏅'
  };

  // Helper to handle dynamic background colors if they come as hex or tailwind strings
  // Assuming badge.color might be a hex code based on previous context, 
  // but if it's a class string, you'd handle it differently.
  // Here we apply it as a style for safety with dynamic values.
  const iconBackgroundColor = badge.color || '#374151';

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-white flex-1 text-center mx-4">
          Badge Details
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
        {/* Badge Summary Panel */}
        <View className="bg-gray-800 p-6 rounded-xl mb-4 items-center border border-gray-700">
          <View className="mb-4">
            <View 
              className="w-20 h-20 rounded-full items-center justify-center"
              style={{ backgroundColor: iconBackgroundColor }}
            >
              <Text className="text-4xl text-center">{badge.icon}</Text>
            </View>
          </View>
          
          <View className="items-center mb-5">
            <Text className="text-2xl font-bold text-white mb-1 text-center">{badge.title}</Text>
            <Text className="text-sm text-gray-400 mb-2">Badge · {badge.id}</Text>
            <Text className="text-sm text-gray-300 text-center leading-5">
              {badge.description}
            </Text>
          </View>

          <TouchableOpacity 
            className="bg-gray-700 py-3 px-6 rounded-lg w-full items-center border border-gray-600 active:bg-gray-600"
            onPress={() => router.push('/leaderboard')}
          >
            <Text className="text-white font-medium">View Leaderboards</Text>
          </TouchableOpacity>
        </View>

        {/* Rules Panel */}
        <View className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-8">
          <Text className="text-xl font-semibold text-white mb-3">
            How the monthly tier is calculated
          </Text>
          <Text className="text-sm text-gray-300 leading-5 mb-5">
            Each calendar month we compute two metrics for every contributing user: their review count for the month and the community agreement percentage on those reviews. We select a contribution level from I (highest) to IV, then select a medal based on agreement.
          </Text>

          {/* Table Header */}
          <View className="flex-row border-b border-gray-700 pb-3 mb-2">
            <Text className="text-xs font-medium text-gray-400 w-[15%]">Level</Text>
            <Text className="text-xs font-medium text-gray-400 w-[18%]">Reviews</Text>
            <Text className="text-xs font-medium text-gray-400 w-[16%]">Diam.</Text>
            <Text className="text-xs font-medium text-gray-400 w-[17%]">Gold</Text>
            <Text className="text-xs font-medium text-gray-400 w-[17%]">Silv.</Text>
            <Text className="text-xs font-medium text-gray-400 w-[17%]">Bron.</Text>
          </View>

          {/* Table Rows */}
          {[
            { level: 'I', reviews: '> 15', diamond: '> 85%', gold: '75-85', silver: '65-75', bronze: '< 65' },
            { level: 'II', reviews: '> 12', diamond: '> 85%', gold: '75-85', silver: '65-75', bronze: '< 65' },
            { level: 'III', reviews: '> 10', diamond: '> 85%', gold: '75-85', silver: '65-75', bronze: '< 65' },
            { level: 'IV', reviews: '≤ 10', diamond: '> 85%', gold: '75-85', silver: '65-75', bronze: '< 65' },
          ].map((row, index) => (
            <View key={index} className="flex-row py-3 border-b border-gray-700/50">
              <Text className="text-xs text-gray-300 w-[15%]">Lvl {row.level}</Text>
              <Text className="text-xs text-gray-300 w-[18%]">{row.reviews}</Text>
              <Text className="text-xs text-gray-300 w-[16%]">{row.diamond}</Text>
              <Text className="text-xs text-gray-300 w-[17%]">{row.gold}</Text>
              <Text className="text-xs text-gray-300 w-[17%]">{row.silver}</Text>
              <Text className="text-xs text-gray-300 w-[17%]">{row.bronze}</Text>
            </View>
          ))}

          <Text className="text-xs text-gray-400 leading-4 mt-4">
            <Text className="font-bold">Notes: </Text>
            Agreement is the average of agreement vote values on a user's reviews for the month (converted to percent). Monthly-tier badges replace previous ones so users keep only the most recent monthly badge.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default BadgeDetailPage;