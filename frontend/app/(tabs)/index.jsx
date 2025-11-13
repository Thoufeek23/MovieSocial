import React from 'react';
import { View, Text, SafeAreaView, Button } from 'react-native';
import { useAuth } from '../../src/context/AuthContext'; // Note the .js is gone
import { useRouter, Link } from 'expo-router';

export default function HomePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-background">
      <Text className="text-2xl font-bold text-foreground">Home Page</Text>
      <Text className="text-lg text-foreground mb-4">
        Welcome, {user?.username}!
      </Text>
      <Button title="Log Out" onPress={logout} color="#10b981" />

      {/* Temp links for testing */}
      <View className="mt-10">
        <Link href="/movie/550" className="text-primary text-lg p-2">Test Movie (Fight Club)</Link>
        <Link href={`/profile/${user?.username}`} className="text-primary text-lg p-2">Test My Profile</Link>
      </View>
    </SafeAreaView>
  );
}