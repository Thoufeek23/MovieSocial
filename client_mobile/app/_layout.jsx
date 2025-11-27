import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css'; 

// ✅ CORRECT PATHS for _layout.jsx (Single dot: ../)
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ModleProvider } from '../src/context/ModleContext';

const MainLayout = () => {
  const { user, loading, isNewUser } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    // 1. Wait for navigation to be ready
    if (!rootNavigationState?.key) return;

    // 2. Wait for auth loading to finish
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    
    // 3. Use setTimeout(0) to defer navigation, resolving the race condition
    setTimeout(() => {
        if (!user && !inAuthGroup) {
          router.replace('/(auth)/login');
        } else if (user && inAuthGroup) {
          if (isNewUser) {
            router.replace('/interests');
          } else {
            router.replace('/(tabs)/');
          }
        } else if (user && segments[0] === 'interests' && !isNewUser) {
          // If interests are already set, go to home
          router.replace('/(tabs)/');
        }
    }, 0); 
  }, [user, loading, segments, isNewUser, rootNavigationState?.key]);

  return (
    <View style={{ flex: 1, backgroundColor: '#09090b' }}>
      {/* CRITICAL FIX: Always render the Stack. 
        The loading indicator is shown as an overlay below.
      */}
      <Stack 
        screenOptions={{ 
          headerShown: false, 
          animation: 'fade',
          contentStyle: { backgroundColor: '#09090b' } 
        }}
      >
        {/* Main App Groups */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        
        {/* Onboarding */}
        <Stack.Screen name="interests" options={{ headerShown: false }} />
        
        {/* Creation Flows (Modals) */}
        <Stack.Screen 
          name="create-review" 
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }} 
        />
        <Stack.Screen 
          name="create-discussion" 
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }} 
        />
        <Stack.Screen 
          name="post/index" 
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }} 
        />

        {/* Detail Pages - Including all explicitly named screens */}
        <Stack.Screen name="movie/[id]" />
        <Stack.Screen name="discussion/[id]" />
        <Stack.Screen name="profile/[username]" />
        <Stack.Screen name="rank/[id]" />
        <Stack.Screen name="badge/[id]" />
        <Stack.Screen name="chat/[username]" />
        
        {/* Modle Game */}
        <Stack.Screen name="modle/play" />

        {/* 404 */}
        <Stack.Screen name="+not-found" options={{ headerShown: false }} />
      </Stack>

      {/* Loading Overlay: Only show the spinner while authentication is being checked */}
      {loading && (
        <View className="absolute inset-0 bg-zinc-950 items-center justify-center z-50">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      )}
    </View>
  );
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ModleProvider>
          <MainLayout />
        </ModleProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}