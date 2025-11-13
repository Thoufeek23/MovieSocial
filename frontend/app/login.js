// frontend/app/login.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Image,
} from 'react-native';
import { useRouter } from 'expo-router'; // <-- Expo Router's hook
import { useAuth } from '../src/context/AuthContext';
import * as api from '../src/api';

export default function LoginPage() {
  const router = useRouter(); // <-- Get the router
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.login(formData);
      login(data);
      // On success, the _layout.js file will see the 'user' change
      // and automatically redirect us to the '/(tabs)' route.
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background p-6 justify-center">
      {/* Logo */}
      <View className="items-center mb-8">
        <Text className="text-3xl font-bold text-primary mt-4">MovieSocial</Text>
      </View>

      <View className="space-y-4">
        {/* Email Input */}
        <View>
          <Text className="text-sm font-medium text-gray-400 mb-2">Email</Text>
          <TextInput
            className="w-full px-4 py-3 rounded-lg bg-card text-foreground border border-gray-700 focus:border-primary"
            placeholder="you@example.com"
            placeholderTextColor="#6b7280"
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={(value) => handleChange('email', value)}
          />
        </View>

        {/* Password Input */}
        <View>
          <Text className="text-sm font-medium text-gray-400 mb-2">Password</Text>
          <TextInput
            className="w-full px-4 py-3 rounded-lg bg-card text-foreground border border-gray-700 focus:border-primary"
            placeholder="••••••••"
            placeholderTextColor="#6b7280"
            secureTextEntry
            autoCapitalize="none"
            value={formData.password}
            onChangeText={(value) => handleChange('password', value)}
          />
        </View>

        {/* Error Message */}
        {error ? (
          <Text className="text-red-500 text-center">{error}</Text>
        ) : null}

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          className={`w-full py-3 rounded-lg ${loading ? 'bg-primary/50' : 'bg-primary'} items-center justify-center`}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white font-bold text-base">Login</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Sign Up Link */}
      <View className="flex-row justify-center mt-6">
        <Text className="text-gray-400">Don't have an account? </Text>
        <TouchableOpacity onPress={() => router.push('/signup')}>
          <Text className="text-primary font-bold">Sign up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}