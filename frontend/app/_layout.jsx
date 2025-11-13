// frontend/app/_layout.jsx

import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { View, ActivityIndicator } from 'react-native';

// This component checks auth state and redirects
const MainLayout = () => {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // If the auth state changes, ensure we land on the correct route.
    // When loading finishes and there's no user, send the user to `/login`.
    // When there's a user, and we're at an auth route, send them to the app tabs.
    if (!loading) {
      const first = segments[0];
      if (!user && first !== 'login' && first !== 'signup') {
        router.replace('/login');
      }
      if (user && (first === 'login' || first === 'signup' || first === undefined)) {
        router.replace('/(tabs)');
      }
    }
  }, [user, loading, segments, router]);

  // Show a loading spinner
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  // THIS IS THE PART TO UPDATE:
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      {/* These are your main app screens, nested in a tab navigator */}
      <Stack.Screen name="(tabs)" /> 
      {/* These are your auth screens */}
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      
      {/* Dynamic routes (e.g. `movie/[id]`, `profile/[username]`) are file-based
          and automatically registered by expo-router. Removing manual
          `Stack.Screen` declarations avoids duplicate/"extraneous" warnings. */}

    </Stack>
  );
};

// This is the root layout
export default function RootLayout() {
  return (
    // Wrap the entire app in the AuthProvider
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}