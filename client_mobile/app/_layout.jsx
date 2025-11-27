import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ModleProvider } from '../src/context/ModleContext';
import '../global.css'; // Import NativeWind styles

const MainLayout = () => {
  const { user, loading, isNewUser } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    
    if (!user && !inAuthGroup) {
      // Redirect to login if not authenticated and not already in auth group
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Redirect authenticated users away from auth screens
      if (isNewUser) {
        router.replace('/interests');
      } else {
        router.replace('/(tabs)/');
      }
    } else if (user && segments[0] === 'interests' && !isNewUser) {
      // If interests are already set, go to home
      router.replace('/(tabs)/');
    }
  }, [user, loading, segments, isNewUser]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-zinc-950">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
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
        name="post/index" 
        options={{ 
          presentation: 'modal', 
          animation: 'slide_from_bottom',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="create-review" 
        options={{ 
          presentation: 'modal', 
          animation: 'slide_from_bottom',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="create-discussion" 
        options={{ 
          presentation: 'modal', 
          animation: 'slide_from_bottom',
          headerShown: false 
        }} 
      />

      {/* Detail Pages */}
      <Stack.Screen name="movie/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="discussion/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="profile/[username]" options={{ headerShown: false }} />
      <Stack.Screen name="rank/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="badge/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="chat/[username]" options={{ headerShown: false }} />
      
      {/* Modle Game */}
      <Stack.Screen name="modle/play" options={{ headerShown: false }} />

      {/* 404 */}
      <Stack.Screen name="+not-found" options={{ headerShown: false }} />
    </Stack>
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