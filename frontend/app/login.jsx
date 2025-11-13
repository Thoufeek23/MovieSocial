// frontend/app/login.jsx

import { useState } from 'react';
import { View, Text, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { MotiView } from 'moti';

import { useAuth } from '../src/context/AuthContext';
import * as api from '../src/api';
import { AuthButton } from '../components/AuthButton';
import { AuthInput } from '../components/AuthInput';

// Use the logo from your web app
const logo = require('../assets/images/icon.png'); // Make sure to add your logo to this path

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth(); // Get the login function from your context
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Call the backend API, then pass the returned token object to
      // the AuthContext `login` method which expects `{ token }`.
      const { data } = await api.login({ email, password });
      await login(data);
      // If login is successful, the _layout.jsx will automatically
      // redirect to the '(tabs)' group.
    } catch (err) {
      console.error('Login error:', err);
      setError(err?.response?.data?.message || err?.message || 'Login failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    // SafeAreaView ensures content isn't hidden by the notch or home bar
    <SafeAreaView className="flex-1 bg-background">
      {/* KeyboardAvoidingView moves content up when keyboard appears */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-center p-6"
      >
        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          className="items-center"
        >
          <Image 
            source={logo}
            style={{ width: 96, height: 96 }}
            className="mb-4"
            resizeMode="contain"
          />
          <Text className="text-foreground text-3xl font-bold mb-2">
            Welcome Back!
          </Text>
          <Text className="text-gray-400 text-lg mb-8">
            Sign in to your account
          </Text>
        </MotiView>
        
        {/* Form Inputs */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 200 }}
        >
          <AuthInput
            icon="mail-outline"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
          />
          <AuthInput
            icon="lock-closed-outline"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            isPassword={true}
          />
          
          {/* Error Message */}
          {error && (
            <Text className="text-red-500 text-center my-2">{error}</Text>
          )}

          {/* Login Button */}
          <AuthButton
            title="Login"
            onPress={handleLogin}
            isLoading={loading}
          />
        </MotiView>

        {/* Navigation Links */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 400 }}
          className="flex-row justify-between mt-6"
        >
          <Link href="/signup" asChild>
            <Text className="text-primary font-bold text-base">
              Create an account
            </Text>
          </Link>
          <Link href="/forgot-password" asChild>
            <Text className="text-gray-400 text-base">
              Forgot Password?
            </Text>
          </Link>
        </MotiView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}