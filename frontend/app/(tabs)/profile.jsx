import React, { useEffect } from 'react';
import { View, Text, SafeAreaView, ActivityIndicator } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useRouter } from 'expo-router';

export default function ProfileTabPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // This component is just a redirector.
    // It redirects to the user's actual profile page.
    if (loading) {
      return; // Wait for user to be loaded
    }
    if (user) {
      router.replace(`/profile/${user.username}`);
    } else {
      // Should be handled by AuthGuard, but as a fallback
      router.replace('/login');
    }
  }, [user, loading, router]);

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" color="#10b981" />
      <Text className="text-foreground mt-4">Loading profile...</Text>
    </SafeAreaView>
  );
}