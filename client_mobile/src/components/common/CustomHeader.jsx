import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import Avatar from './Avatar'; // Assuming you want to use your existing Avatar component

export default function CustomHeader({ title, showLogo }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View 
      className="bg-zinc-950 px-5 pb-4 flex-row items-center justify-between border-b border-white/5"
      style={{ paddingTop: insets.top + 10 }}
    >
      <View>
        {showLogo ? (
          <Text className="text-2xl font-bold text-emerald-500 tracking-tighter">
            MovieSocial
          </Text>
        ) : (
          <Text className="text-3xl font-bold text-white tracking-tight">
            {title}
          </Text>
        )}
      </View>

      <View className="flex-row items-center gap-4">
        {/* Notification Bell */}
        <TouchableOpacity 
          className="w-10 h-10 rounded-full bg-zinc-900 items-center justify-center border border-zinc-800"
          onPress={() => console.log('Notifications')}
        >
          <Bell size={20} color="#e4e4e7" />
        </TouchableOpacity>

        {/* Profile Link */}
        <TouchableOpacity onPress={() => router.push('/profile')}>
           {/* Use your common Avatar component here, or a placeholder */}
           <View className="w-9 h-9 rounded-full bg-emerald-500 items-center justify-center border-2 border-zinc-950">
              <Text className="text-white font-bold text-sm">MS</Text>
           </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}