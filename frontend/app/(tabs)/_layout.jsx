import React, { createContext, useContext, useRef, useState } from 'react';
import { Tabs } from 'expo-router';
import { Home, Search, BookOpen, Puzzle, FileText, MessageSquare } from 'lucide-react-native';
import { View, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomHeader from '../../components/CustomHeader';
import MSLogoModal from '../../components/MSLogoModal';
import { usePathname } from 'expo-router';

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
  const [isModalVisible, setIsModalVisible] = useState(false);
  
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
    if (path.includes('/ranks')) return 'ranks';
    if (path.includes('/modle')) return 'modle';
    if (path.includes('/messages')) return 'messages';
    return 'index';
  };
  
  const getHeaderProps = () => {
    if (pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/' || pathname.endsWith('/index')) {
      return { showLogo: true };
    }
    if (pathname.includes('/search')) return { title: 'Explore' };
    if (pathname.includes('/discussions')) return { title: 'Discussions' };
    if (pathname.includes('/reviews')) return { title: 'Reviews' };
    if (pathname.includes('/ranks')) return { title: 'Ranks' };
    if (pathname.includes('/modle')) return { title: 'Modle' };
    if (pathname.includes('/messages')) return { title: 'Messages' };
    
    return { showLogo: true };
  };

  return (
    <ScrollToTopContext.Provider value={{ scrollToTop, registerScrollRef }}>
      <View style={{ flex: 1 }}>
        <CustomHeader {...getHeaderProps()} />
        <MSLogoModal visible={isModalVisible} onClose={() => setIsModalVisible(false)} />
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#10b981',
            tabBarInactiveTintColor: '#6b7280',
            tabBarStyle: {
              backgroundColor: '#1f2937',
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
              left: 0,
              right: 0,
              marginHorizontal: 15,
            },
            tabBarShowLabel: false,
            tabBarIconStyle: { marginTop: 0 },
            tabBarItemStyle: { paddingVertical: 8, borderRadius: 15, marginHorizontal: 2 },
            tabBarBackground: () => (
              <View style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: 65,
                backgroundColor: '#1f2937', borderRadius: 25,
                shadowColor: '#000000', shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3, shadowRadius: 12, elevation: 25,
              }} />
            ),
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Home',
              tabBarIcon: ({ color, focused }) => (
                <View style={{ alignItems: 'center', justifyContent: 'center', width: 45, height: 35, backgroundColor: focused ? 'rgba(16, 185, 129, 0.15)' : 'transparent', borderRadius: 12 }}>
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
                <View style={{ alignItems: 'center', justifyContent: 'center', width: 45, height: 35, backgroundColor: focused ? 'rgba(16, 185, 129, 0.15)' : 'transparent', borderRadius: 12 }}>
                  <Search color={focused ? '#10b981' : color} size={focused ? 26 : 24} strokeWidth={focused ? 2.5 : 2} />
                </View>
              ),
              tabBarButton: (props) => <TouchableOpacity {...props} onPress={(e) => handleTabPress('search', () => props.onPress?.(e))} />
            }}
          />
          {/* MS Logo - Opens Modal Menu */}
          <Tabs.Screen
            name="ms-menu"
            options={{
              title: 'Menu',
              tabBarIcon: ({ focused }) => (
                <View style={{ alignItems: 'center', justifyContent: 'center', width: 50, height: 40, backgroundColor: focused ? 'rgba(16, 185, 129, 0.15)' : 'transparent', borderRadius: 12 }}>
                  <Image 
                    source={require('../../assets/images/MS_icon.png')} 
                    style={{ width: 36, height: 36 }}
                    resizeMode="contain"
                  />
                </View>
              ),
              tabBarButton: (props) => (
                <TouchableOpacity 
                  {...props}
                  style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                  onPress={() => setIsModalVisible(true)}
                >
                  <View style={{ alignItems: 'center', justifyContent: 'center', width: 50, height: 40, backgroundColor: 'rgba(16, 185, 129, 0.15)', borderRadius: 12 }}>
                    <Image 
                      source={require('../../assets/images/MS_icon.png')} 
                      style={{ width: 36, height: 36 }}
                      resizeMode="contain"
                    />
                  </View>
                </TouchableOpacity>
              ),
            }}
          />
          <Tabs.Screen
            name="modle"
            options={{
              title: 'Modle',
              tabBarIcon: ({ color, focused }) => (
                <View style={{ alignItems: 'center', justifyContent: 'center', width: 45, height: 35, backgroundColor: focused ? 'rgba(16, 185, 129, 0.15)' : 'transparent', borderRadius: 12 }}>
                  <Puzzle color={focused ? '#10b981' : color} size={focused ? 26 : 24} strokeWidth={focused ? 2.5 : 2} />
                </View>
              ),
              tabBarButton: (props) => <TouchableOpacity {...props} onPress={(e) => handleTabPress('modle', () => props.onPress?.(e))} />
            }}
          />
          <Tabs.Screen
            name="messages"
            options={{
              title: 'Messages',
              tabBarIcon: ({ color, focused }) => (
                <View style={{ alignItems: 'center', justifyContent: 'center', width: 45, height: 35, backgroundColor: focused ? 'rgba(16, 185, 129, 0.15)' : 'transparent', borderRadius: 12 }}>
                  <MessageSquare color={focused ? '#10b981' : color} size={focused ? 26 : 24} strokeWidth={focused ? 2.5 : 2} />
                </View>
              ),
              tabBarButton: (props) => <TouchableOpacity {...props} onPress={(e) => handleTabPress('messages', () => props.onPress?.(e))} />
            }}
          />
          {/* Hide these from tab bar but keep them accessible as routes */}
          <Tabs.Screen 
            name="discussions" 
            options={{ href: null }} 
          />
          <Tabs.Screen 
            name="reviews" 
            options={{ href: null }} 
          />
          <Tabs.Screen 
            name="ranks" 
            options={{ href: null }} 
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