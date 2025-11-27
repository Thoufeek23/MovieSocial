import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image,
  ImageBackground, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableOpacity,
  Pressable,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { MotiView } from 'moti';

import { useAuth } from '../../src/context/AuthContext';
import * as api from '../../src/api';
import { FloatingLabelInput } from '../../components/FloatingLabelInput';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentBackdrop, setCurrentBackdrop] = useState(0);
  
  const { login } = useAuth();
  const router = useRouter();

  const posterImages = [
    require('../../assets/images/poster1.png'),
    require('../../assets/images/poster2.png'),
    require('../../assets/images/poster3.png'),
    require('../../assets/images/poster4.png'),
    require('../../assets/images/poster5.png'),
  ];

  useEffect(() => {
    setCurrentBackdrop(0);
    const interval = setInterval(() => {
      setCurrentBackdrop(prev => (prev + 1) % posterImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (error) setError('');
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const { data } = await api.login(formData);
      await login(data);
    } catch (err) {
      console.error('Login error:', err);
      setError(err?.response?.data?.message || err?.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ImageBackground
        source={posterImages[currentBackdrop]}
        resizeMode="cover"
        className="flex-1 w-full h-full"
      >
        <View className="flex-1 bg-black/70">
          <SafeAreaView className="flex-1 px-5">
            {/* Header Section */}
            <MotiView
              from={{ opacity: 0, translateY: 30 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 800, delay: 300 }}
              className="items-center pt-4 pb-2 flex-[0.25] justify-center"
            >
              <View className="items-center justify-center bg-transparent px-6 py-1 rounded-3xl">
                <Image 
                  source={require('../../assets/images/MS_logo.png')}
                  className="w-[200px] h-[200px]"
                  resizeMode="contain"
                />
              </View>
            </MotiView>

            {/* Form Section */}
            <View className="flex-[0.75] justify-between px-4 pb-2">
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 800, delay: 500 }}
                className="bg-transparent p-4 rounded-3xl mx-1"
              >
                <Text className="text-2xl font-bold text-white text-center mb-1.5 tracking-wider">
                  Welcome!
                </Text>
                <Text className="text-sm text-gray-300 text-center mb-4 leading-5">
                  Login to continue your movie journey.
                </Text>

                {error && (
                  <MotiView
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-2.5 rounded-xl mb-3"
                  >
                    <Text className="text-red-200 text-center font-medium text-sm">
                      {error}
                    </Text>
                  </MotiView>
                )}

                <View className="mb-2.5">
                  <MotiView
                    from={{ opacity: 0, translateX: -20 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{ type: 'spring', stiffness: 100, delay: 700 }}
                    className="bg-transparent rounded-2xl mb-1.5"
                  >
                    <FloatingLabelInput
                      label="Email"
                      value={formData.email}
                      onChangeText={(value) => handleChange('email', value)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </MotiView>

                  <MotiView
                    from={{ opacity: 0, translateX: -20 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{ type: 'spring', stiffness: 100, delay: 800 }}
                    className="bg-transparent rounded-2xl mb-1.5"
                  >
                    <FloatingLabelInput
                      label="Password"
                      value={formData.password}
                      onChangeText={(value) => handleChange('password', value)}
                      isPassword={true}
                    />
                  </MotiView>
                </View>

                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 500, delay: 900 }}
                  className="mt-2.5"
                >
                  <Pressable
                    onPress={handleSubmit}
                    disabled={loading}
                    className={`w-full py-3.5 rounded-2xl items-center justify-center shadow-lg shadow-emerald-500/40 ${
                      loading ? 'bg-gray-500' : 'bg-emerald-500'
                    }`}
                  >
                    <Text className="text-white text-lg font-bold tracking-wide">
                      {loading ? 'Logging in...' : 'Login'}
                    </Text>
                  </Pressable>
                </MotiView>

                <View className="mt-4 items-center">
                  <TouchableOpacity 
                    className="p-2"
                    onPress={() => router.push('/forgot-password')}
                  >
                    <Text className="text-emerald-500 text-sm font-semibold">
                      Forgot password?
                    </Text>
                  </TouchableOpacity>
                </View>
              </MotiView>

              <MotiView
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 500, delay: 1000 }}
                className="items-center mb-5"
              >
                <View className="bg-transparent rounded-xl p-4 items-center">
                  <View className="flex-row items-center flex-wrap justify-center">
                    <Text className="text-gray-100 text-base font-medium">
                      Don't have an account?{' '}
                    </Text>
                    <Link href="/signup" asChild>
                      <TouchableOpacity>
                        <Text className="text-emerald-500 font-bold text-base">
                          Sign Up
                        </Text>
                      </TouchableOpacity>
                    </Link>
                  </View>
                </View>
              </MotiView>
            </View>
          </SafeAreaView>
        </View>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}