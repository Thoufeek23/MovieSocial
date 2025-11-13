import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

// This is the component that handles the auth logic
const AuthGuard = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments(); // Gets the current route path

  useEffect(() => {
    if (loading) {
      return; // Wait until we're done checking for a token
    }

    // Cast to string to avoid TypeScript literal union mismatch when comparing
    const seg0 = String(segments[0] ?? '');
    const inAuthGroup = seg0 === '(auth)';
    const inAppGroup = seg0 === '(tabs)';

    if (user && !inAppGroup) {
      // User is signed in but not in the main app.
      // Redirect them to the home screen.
      router.replace('/(tabs)');
    } else if (!user && !inAuthGroup) {
      // User is not signed in and not in the auth flow.
      // Redirect them to the login screen.
      router.replace('/login');
    }
  }, [user, loading, segments, router]);

  // Show a loading spinner while we check for the token
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-background">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  // Show the correct stack of screens
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="(tabs)" />
      {/* Add other top-level screens like movie/[id] here */}
      <Stack.Screen name="movie/[id]" />
      <Stack.Screen name="profile/[username]" />
    </Stack>
  );
};

// This is the main layout component
export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGuard />
    </AuthProvider>
  );
}