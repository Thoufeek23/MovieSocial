// frontend/app/_layout.js
import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from '../src/context/AuthContext'; // Correct path to context
import { Slot, useRouter, Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until we're done checking for a user
    if (loading) return; 

    if (!user) {
      // If no user, send them to the /login page.
      router.replace('/login');
    } else {
      // If user exists, send them to the main app (the tabs).
      router.replace('/(tabs)');
    }
  }, [user, loading, router]); // Re-run this logic when user or loading changes

  // Show a loading spinner while we check for a token
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#your_primary_color" />
      </View>
    );
  }

  // The <Slot /> renders the currently active page 
  // (either /login or /(tabs) based on our logic)
  return <Slot />;
}

// This is the true root of your app
export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}