import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ImageBackground,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import * as api from '../src/api';
import { Eye, EyeOff, Clapperboard } from 'lucide-react-native';

const IMG_BASE_URL = 'https://image.tmdb.org/t/p/original';

const PasswordCheckItem = ({ text, valid }) => (
  <Text className={valid ? 'text-green-400' : 'text-gray-500'}>
    {valid ? '✓' : '•'} {text}
  </Text>
);

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false,
  });

  const canSubmit =
    Object.values(passwordChecks).every(Boolean) &&
    formData.password === formData.confirmPassword;

  const [backdrops, setBackdrops] = useState([]);
  const [currentBackdrop, setCurrentBackdrop] = useState(0);

  useEffect(() => {
    const fetchBackdrops = async () => {
      try {
        const res = await api.getPopularMovies();
        const urls = res.data.results
          .map((m) => m.backdrop_path)
          .filter(Boolean)
          .slice(0, 10);
        setBackdrops(urls);
      } catch (error) {
        console.error('Could not fetch movie backdrops', error);
      }
    };
    fetchBackdrops();
  }, []);

  useEffect(() => {
    if (backdrops.length > 1) {
      const interval = setInterval(() => {
        setCurrentBackdrop((prev) => (prev + 1) % backdrops.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [backdrops]);

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    if (error) setError('');

    if (name === 'password') {
      const v = value;
      const checks = {
        length: v.length >= 8,
        upper: /[A-Z]/.test(v),
        lower: /[a-z]/.test(v),
        number: /\d/.test(v),
        special: /[\W_]/.test(v),
      };
      setPasswordChecks(checks);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match.');
      } else {
        setError('Password does not meet requirements.');
      }
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await api.register({ // Using simple 'register' from your API
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      // Automatically log them in after successful signup
      const { data } = await api.login({
        email: formData.email,
        password: formData.password,
      });
      login(data);
      // AuthGuard will handle the redirect
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.msg ||
        'An error occurred. Please try again.';
      setError(msg);
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ImageBackground
        source={{
          uri: backdrops.length
            ? `${IMG_BASE_URL}${backdrops[currentBackdrop]}`
            : null,
        }}
        resizeMode="cover"
        className="flex-1"
      >
        <View className="flex-1 bg-black/70 p-6 justify-center">
          <SafeAreaView className="flex-1 justify-center">
            <ScrollView showsVerticalScrollIndicator={false}>
              
              <View className="items-center mb-8">
                <Clapperboard size={48} className="text-primary" />
                <Text className="text-4xl font-bold text-white mt-3">
                  MovieSocial
                </Text>
                <Text className="text-lg text-gray-300 mt-2">
                  Join the community.
                </Text>
              </View>

              <View className="bg-card/80 p-6 rounded-2xl">
                <Text className="text-3xl font-bold text-white mb-2">
                  Create Account
                </Text>
                <Text className="text-gray-300 mb-6">
                  Start your movie journey today.
                </Text>

                <View className="space-y-5">
                  {error ? (
                    <Text className="text-red-400 text-center p-3 bg-red-500/20 rounded-lg">
                      {error}
                    </Text>
                  ) : null}

                  <View>
                    <Text className="text-sm font-medium text-gray-300 mb-2">
                      Username
                    </Text>
                    <TextInput
                      className="w-full px-4 py-3 rounded-lg bg-background text-white border border-gray-700 focus:border-primary"
                      placeholder="Your unique username"
                      placeholderTextColor="#6b7280"
                      autoCapitalize="none"
                      value={formData.username}
                      onChangeText={(value) => handleChange('username', value)}
                    />
                  </View>

                  <View>
                    <Text className="text-sm font-medium text-gray-300 mb-2">
                      Email
                    </Text>
                    <TextInput
                      className="w-full px-4 py-3 rounded-lg bg-background text-white border border-gray-700 focus:border-primary"
                      placeholder="you@example.com"
                      placeholderTextColor="#6b7280"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={formData.email}
                      onChangeText={(value) => handleChange('email', value)}
                    />
                  </View>

                  <View>
                    <Text className="text-sm font-medium text-gray-300 mb-2">
                      Password
                    </Text>
                    <View className="flex-row items-center">
                      <TextInput
                        className="flex-1 w-full px-4 py-3 rounded-lg bg-background text-white border border-gray-700 focus:border-primary"
                        placeholder="••••••••"
                        placeholderTextColor="#6b7280"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        value={formData.password}
                        onChangeText={(value) => handleChange('password', value)}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        className="absolute right-0 p-3"
                      >
                        {showPassword ? (
                          <EyeOff size={20} color="#9ca3af" />
                        ) : (
                          <Eye size={20} color="#9ca3af" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View className="space-y-1 px-1">
                    <PasswordCheckItem
                      text="Minimum 8 characters"
                      valid={passwordChecks.length}
                    />
                    <PasswordCheckItem
                      text="Uppercase letter (A-Z)"
                      valid={passwordChecks.upper}
                    />
                    <PasswordCheckItem
                      text="Lowercase letter (a-z)"
                      valid={passwordChecks.lower}
                    />
                    <PasswordCheckItem
                      text="A number (0-9)"
                      valid={passwordChecks.number}
                    />
                    <PasswordCheckItem
                      text="A special character (e.g. !@#$%)"
                      valid={passwordChecks.special}
                    />
                  </View>

                  <View>
                    <Text className="text-sm font-medium text-gray-300 mb-2">
                      Confirm Password
                    </Text>
                    <View className="flex-row items-center">
                      <TextInput
                        className="flex-1 w-full px-4 py-3 rounded-lg bg-background text-white border border-gray-700 focus:border-primary"
                        placeholder="••••••••"
                        placeholderTextColor="#6b7280"
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        value={formData.confirmPassword}
                        onChangeText={(value) =>
                          handleChange('confirmPassword', value)
                        }
                      />
                      <TouchableOpacity
                        onPress={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-0 p-3"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={20} color="#9ca3af" />
                        ) : (
                          <Eye size={20} color="#9ca3af" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isLoading || !canSubmit}
                    className={`w-full py-4 rounded-lg ${
                      isLoading || !canSubmit ? 'bg-primary/50' : 'bg-primary'
                    } items-center justify-center`}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text className="text-white font-bold text-base">
                        Sign Up
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                <View className="flex-row justify-center mt-6">
                  <Text className="text-gray-300">
                    Already have an account?{' '}
                  </Text>
                  <Link href="/login" asChild>
                    <TouchableOpacity>
                      <Text className="text-primary font-bold">Login</Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}