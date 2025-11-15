import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Home, Search, BookOpen, Puzzle, FileText, User } from 'lucide-react-native';
import { View, Platform } from 'react-native';
import CustomHeader from '../../components/CustomHeader';
import { usePathname } from 'expo-router';

export default function TabsLayout() {
  const pathname = usePathname();
  
  // Determine header title and logo based on current route
  const getHeaderProps = () => {
    // Handle different pathname patterns
    if (pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/' || pathname.endsWith('/index')) {
      return { showLogo: true };
    }
    
    if (pathname.includes('/search')) {
      return { title: 'Explore' };
    }
    
    if (pathname.includes('/discussions')) {
      return { title: 'Discussions' };
    }
    
    if (pathname.includes('/reviews')) {
      return { title: 'Reviews' };
    }
    
    if (pathname.includes('/modle')) {
      return { title: 'Modle' };
    }
    
    if (pathname.includes('/profile')) {
      return { title: 'Profile' };
    }
    
    // Default fallback
    return { showLogo: true };
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Global sticky header */}
      <CustomHeader {...getHeaderProps()} />
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#1f2937', // gray-800
          borderTopWidth: 0,
          shadowColor: '#000000',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 25,
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
          paddingHorizontal: 20,
          borderRadius: 25,
          position: 'absolute',
          bottom: 20, // Float above bottom
          left: 0,
          right: 0,
          marginHorizontal: 15,
        },
        tabBarShowLabel: false,
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
          borderRadius: 15,
          marginHorizontal: 2,
        },
        tabBarBackground: () => (
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 65,
            backgroundColor: '#1f2937',
            borderRadius: 25,
            shadowColor: '#000000',
            shadowOffset: {
              width: 0,
              height: 4,
            },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 25,
          }} />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 45,
              height: 35,
              backgroundColor: focused ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              borderRadius: 12,
            }}>
              <Home 
                color={focused ? '#10b981' : color} 
                size={focused ? 26 : 24} 
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 45,
              height: 35,
              backgroundColor: focused ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              borderRadius: 12,
            }}>
              <Search 
                color={focused ? '#10b981' : color} 
                size={focused ? 26 : 24} 
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="discussions"
        options={{
          title: 'Discussions',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 45,
              height: 35,
              backgroundColor: focused ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              borderRadius: 12,
            }}>
              <BookOpen 
                color={focused ? '#10b981' : color} 
                size={focused ? 26 : 24} 
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="modle"
        options={{
          title: 'Modle',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 45,
              height: 35,
              backgroundColor: focused ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              borderRadius: 12,
            }}>
              <Puzzle 
                color={focused ? '#10b981' : color} 
                size={focused ? 26 : 24} 
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="reviews"
        options={{
          title: 'Reviews',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 45,
              height: 35,
              backgroundColor: focused ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              borderRadius: 12,
            }}>
              <FileText 
                color={focused ? '#10b981' : color} 
                size={focused ? 26 : 24} 
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 45,
              height: 35,
              backgroundColor: focused ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              borderRadius: 12,
            }}>
              <User 
                color={focused ? '#10b981' : color} 
                size={focused ? 26 : 24} 
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
        />
      </Tabs>
    </View>
  );
}