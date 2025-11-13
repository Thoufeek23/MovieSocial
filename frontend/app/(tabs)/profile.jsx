// frontend/app/(tabs)/profile.jsx

import { Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // <-- Fixed import
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext'; // <-- Import useAuth

export default function ProfilePage() {
  const { logout, user } = useAuth(); // <-- Get the logout function
  const router = useRouter();

  const handleLogout = () => {
    (async () => {
      try {
        await logout();
        // small delay to allow native/web splash to finish hiding
        await new Promise((res) => setTimeout(res, 200));
        // After logout, navigate to the login screen and replace history
        router.replace('/login');
      } catch (e) {
        console.error('Logout failed', e);
      }
    })();
  };

  return (
    // Use the correct SafeAreaView import
    <SafeAreaView className="flex-1 bg-background p-6">
      <Text className="text-foreground text-3xl font-bold mb-4">
        Profile
      </Text>
      
      {/* Show the user's email if they exist */}
      {user ? (
        <Text className="text-foreground text-lg mb-6">
          Logged in as: {user.email || user.username}
        </Text>
      ) : null}

      {/* This is the button that fixes everything */}
      <Pressable
        onPress={handleLogout}
        className="bg-red-600/20 border border-red-600 rounded-full px-4 py-3"
      >
        <Text className="text-red-500 font-bold text-center text-lg">
          Force Logout
        </Text>
      </Pressable>

    </SafeAreaView>
  );
}