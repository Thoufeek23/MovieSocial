// frontend/app/(tabs)/_layout.js
import { Tabs } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome'; 

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#your_primary_color', // Use your primary color
        headerShown: false, // Hides the header title
      }}>
      <Tabs.Screen
        name="index" // This links to app/(tabs)/index.js
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="home" color={color} />,
        }}
      />
      {/* Add another tab for Profile */}
      <Tabs.Screen
        name="profile" // This links to app/(tabs)/profile.js
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}