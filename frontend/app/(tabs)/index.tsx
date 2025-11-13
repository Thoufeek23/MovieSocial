// frontend/app/(tabs)/index.js
import React from 'react';
import { View, Text, SafeAreaView, Button } from 'react-native';
import { useAuth } from '../../src/context/AuthContext'; // <-- Note path is ../../

export default function HomePage() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-background">
      <Text className="text-2xl font-bold text-foreground">Home Page</Text>
      <Text className="text-lg text-foreground mb-4">
        Welcome, {user?.username}!
      </Text>
      <Button title="Log Out" onPress={logout} />
    </SafeAreaView>
  );
}