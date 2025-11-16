// frontend/app/_layout.jsx

import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ModleProvider } from '../src/context/ModleContext';
import { View, ActivityIndicator } from 'react-native';

// This component checks auth state and redirects
const MainLayout = () => {
  const { user, loading, isNewUser, setNewUser } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // If the auth state changes, ensure we land on the correct route.
    if (!loading) {
      const first = segments[0];
      
      // Handle unauthenticated users
      if (!user) {
        if (first !== 'login' && first !== 'signup' && first !== 'forgot-password') {
          router.replace('/login');
        }
        return;
      }
      
      // Handle authenticated users
      if (user) {
        if (first === 'login' || first === 'signup') {
          // Check if this is a new user who needs to see interests
          if (isNewUser) {
            router.replace('/interests');
          } else {
            router.replace('/(tabs)/');
          }
        }
        // If we're on interests page and user completes it, go to tabs
        if (first === 'interests' && !isNewUser) {
          router.replace('/(tabs)/');
        }
        // If first is undefined, let it naturally go to default route
      }
    }
  }, [user, loading, segments, isNewUser]);

  // Show a loading spinner
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} /> 
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="interests" options={{ headerShown: false }} />
        <Stack.Screen name="create-review" options={{ headerShown: false }} />
        <Stack.Screen name="create-discussion" options={{ headerShown: false }} />
        <Stack.Screen name="profile/[username]" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
};

// This is the root layout
export default function RootLayout() {
  return (
    // Wrap the entire app in the AuthProvider and ModleProvider
    <AuthProvider>
      <ModleProvider>
        <MainLayout />
      </ModleProvider>
    </AuthProvider>
  );
}