import React, { createContext, useContext, useRef } from 'react';
import { Tabs } from 'expo-router';
import { Home, Search, BookOpen, Puzzle, FileText, MessageSquare } from 'lucide-react-native';
import { View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname } from 'expo-router';

// CHANGED: Corrected import path
import CustomHeader from '../../src/components/common/CustomHeader';

// Create context for scroll refs
const ScrollToTopContext = createContext(null);

export const useScrollToTop = () => {
  const context = useContext(ScrollToTopContext);
  return context;
};

export default function TabsLayout() {
  const pathname = usePathname();
  const scrollRefs = useRef({});
  const insets = useSafeAreaInsets();
  
  const scrollToTop = (tabName) => {
    const scrollRef = scrollRefs.current[tabName];
    if (scrollRef && scrollRef.current) {
      if (scrollRef.current.scrollToOffset) {
        scrollRef.current.scrollToOffset({ offset: 0, animated: true });
      } else if (scrollRef.current.scrollTo) {
        scrollRef.current.scrollTo({ y: 0, animated: true });
      }
    }
  };
  
  const registerScrollRef = (tabName, ref) => {
    scrollRefs.current[tabName] = ref;
  };
  
  const handleTabPress = (tabName, onPress) => {
    const currentTab = getCurrentTabFromPath(pathname);
    if (currentTab === tabName) {
      scrollToTop(tabName);
    } else {
      onPress?.();
    }
  };
  
  const getCurrentTabFromPath = (path) => {
    if (path.includes('/search')) return 'search';
    if (path.includes('/discussions')) return 'discussions';
    if (path.includes('/reviews')) return 'reviews';
    if (path.includes('/modle')) return 'modle';
    if (path.includes('/messages')) return 'messages';
    return 'index';
  };
  
  const getHeaderProps = () => {
    // Logic to show Logo on Home and Tab root, Title elsewhere
    if (pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/' || pathname.endsWith('/index')) {
      return { showLogo: true };
    }
    if (pathname.includes('/search')) return { title: 'Explore' };
    if (pathname.includes('/discussions')) return { title: 'Discussions' };
    if (pathname.includes('/reviews')) return { title: 'Reviews' };
    if (pathname.includes('/modle')) return { title: 'Modle' };
    if (pathname.includes('/messages')) return { title: 'Messages' };
    
    return { showLogo: true };
  };

  return (
    <ScrollToTopContext.Provider value={{ scrollToTop, registerScrollRef }}>
      <View className="flex-1 bg-zinc-950">
        <CustomHeader {...getHeaderProps()} />
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#10b981', // emerald-500
            tabBarInactiveTintColor: '#6b7280', // gray-500
            tabBarStyle: {
              backgroundColor: '#1f2937', // gray-800
              borderTopWidth: 0,
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 25,
              height: 65,
              paddingBottom: 8,
              paddingTop: 8,
              paddingHorizontal: 20,
              borderRadius: 25,
              position: 'absolute',
              bottom: Math.max(20, insets.bottom + 10),
              left: 15,
              right: 15,
            },
            tabBarShowLabel: false,
            tabBarItemStyle: { paddingVertical: 8, borderRadius: 15, marginHorizontal: 2 },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Home',
              tabBarIcon: ({ color, focused }) => (
                <View className={`items-center justify-center w-[45px] h-[35px] rounded-xl ${focused ? 'bg-emerald-500/15' : 'bg-transparent'}`}>
                  <Home color={focused ? '#10b981' : color} size={focused ? 26 : 24} strokeWidth={focused ? 2.5 : 2} />
                </View>
              ),
              tabBarButton: (props) => <TouchableOpacity {...props} onPress={(e) => handleTabPress('index', () => props.onPress?.(e))} />
            }}
          />
          <Tabs.Screen
            name="search"
            options={{
              title: 'Search',
              tabBarIcon: ({ color, focused }) => (
                <View className={`items-center justify-center w-[45px] h-[35px] rounded-xl ${focused ? 'bg-emerald-500/15' : 'bg-transparent'}`}>
                  <Search color={focused ? '#10b981' : color} size={focused ? 26 : 24} strokeWidth={focused ? 2.5 : 2} />
                </View>
              ),
              tabBarButton: (props) => <TouchableOpacity {...props} onPress={(e) => handleTabPress('search', () => props.onPress?.(e))} />
            }}
          />
          <Tabs.Screen
            name="discussions"
            options={{
              title: 'Discussions',
              tabBarIcon: ({ color, focused }) => (
                <View className={`items-center justify-center w-[45px] h-[35px] rounded-xl ${focused ? 'bg-emerald-500/15' : 'bg-transparent'}`}>
                  <BookOpen color={focused ? '#10b981' : color} size={focused ? 26 : 24} strokeWidth={focused ? 2.5 : 2} />
                </View>
              ),
              tabBarButton: (props) => <TouchableOpacity {...props} onPress={(e) => handleTabPress('discussions', () => props.onPress?.(e))} />
            }}
          />
          <Tabs.Screen
            name="modle"
            options={{
              title: 'Modle',
              tabBarIcon: ({ color, focused }) => (
                <View className={`items-center justify-center w-[45px] h-[35px] rounded-xl ${focused ? 'bg-emerald-500/15' : 'bg-transparent'}`}>
                  <Puzzle color={focused ? '#10b981' : color} size={focused ? 26 : 24} strokeWidth={focused ? 2.5 : 2} />
                </View>
              ),
              tabBarButton: (props) => <TouchableOpacity {...props} onPress={(e) => handleTabPress('modle', () => props.onPress?.(e))} />
            }}
          />
          <Tabs.Screen
            name="reviews"
            options={{
              title: 'Reviews',
              tabBarIcon: ({ color, focused }) => (
                <View className={`items-center justify-center w-[45px] h-[35px] rounded-xl ${focused ? 'bg-emerald-500/15' : 'bg-transparent'}`}>
                  <FileText color={focused ? '#10b981' : color} size={focused ? 26 : 24} strokeWidth={focused ? 2.5 : 2} />
                </View>
              ),
              tabBarButton: (props) => <TouchableOpacity {...props} onPress={(e) => handleTabPress('reviews', () => props.onPress?.(e))} />
            }}
          />
          <Tabs.Screen
            name="messages"
            options={{
              title: 'Messages',
              tabBarIcon: ({ color, focused }) => (
                <View className={`items-center justify-center w-[45px] h-[35px] rounded-xl ${focused ? 'bg-emerald-500/15' : 'bg-transparent'}`}>
                  <MessageSquare color={focused ? '#10b981' : color} size={focused ? 26 : 24} strokeWidth={focused ? 2.5 : 2} />
                </View>
              ),
              tabBarButton: (props) => <TouchableOpacity {...props} onPress={(e) => handleTabPress('messages', () => props.onPress?.(e))} />
            }}
          />
          <Tabs.Screen 
             name="profile" 
             options={{ href: null }} 
          />
        </Tabs>
      </View>
    </ScrollToTopContext.Provider>
  );
}