import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import * as api from '../src/api';
import { Eye, EyeOff, Clapperboard } from 'lucide-react-native';

const IMG_BASE_URL = 'https://image.tmdb.org/t/p/original';

// Reusable component for password validation
const PasswordCheckItem = ({ text, valid }) => (
  <Text className={valid ? 'text-green-400' : 'text-gray-500'}>
    {valid ? '✓' : '•'} {text}
  </Text>
);

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [backdrops, setBackdrops] = useState([]);
  const [currentBackdrop, setCurrentBackdrop] = useState(0);

  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotShowPassword, setForgotShowPassword] = useState(false);
  const [forgotPasswordChecks, setForgotPasswordChecks] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false,
  });
  const canForgotReset = Object.values(forgotPasswordChecks).every(Boolean);

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
    if (success) setSuccess('');
    if (error) setError('');
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data } = await api.login(formData);
      login(data);
      // AuthGuard in _layout.jsx will handle the redirect
    } catch (err) {
      setError('Invalid credentials. Please try again.');
      console.error(err);
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setForgotError('');
    setForgotLoading(true);
    try {
      await api.forgotPassword({ email: forgotEmail });
      setForgotStep(2);
    } catch (err) {
      const msg = err?.response?.data?.msg || 'Failed to send OTP. Try again.';
      setForgotError(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setForgotError('');
    setForgotLoading(true);
    try {
      const { data } = await api.verifyResetOtp({ email: forgotEmail, otp });
      setResetToken(data.resetToken);
      setForgotStep(3);
    } catch (err) {
      setForgotError(err?.response?.data?.msg || 'Invalid code');
    } finally {
      setForgotLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setForgotError('');
    if (!canForgotReset) {
      setForgotError('Password does not meet requirements.');
      return;
    }
    setForgotLoading(true);
    try {
      await api.resetPassword({ email: forgotEmail, resetToken, newPassword });
      setShowForgot(false);
      // Reset all forgot password states
      setForgotStep(1);
      setForgotEmail('');
      setOtp('');
      setResetToken('');
      setNewPassword('');
      setForgotPasswordChecks({ length: false, upper: false, lower: false, number: false, special: false });
      setSuccess('Password reset successful. You can now login.');
    } catch (err) {
      setForgotError(err?.response?.data?.msg || 'Failed to reset password');
    } finally {
      setForgotLoading(false);
    }
  };

  const onPasswordChange = (v) => {
    setNewPassword(v);
    const checks = {
      length: v.length >= 8,
      upper: /[A-Z]/.test(v),
      lower: /[a-z]/.test(v),
      number: /\d/.test(v),
      special: /[\W_]/.test(v),
    };
    setForgotPasswordChecks(checks);
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
              
              <View className="items-center mb-10">
                <Clapperboard size={48} className="text-primary" />
                <Text className="text-4xl font-bold text-white mt-3">
                  MovieSocial
                </Text>
                <Text className="text-lg text-gray-300 mt-2">
                  Discover, Discuss, Decide.
                </Text>
              </View>

              <View className="bg-card/80 p-6 rounded-2xl">
                <Text className="text-3xl font-bold text-white mb-2">
                  Welcome Back!
                </Text>
                <Text className="text-gray-300 mb-6">
                  Login to continue your movie journey.
                </Text>

                <View className="space-y-5">
                  {success ? (
                    <Text className="text-green-400 text-center p-3 bg-green-500/20 rounded-lg">
                      {success}
                    </Text>
                  ) : null}

                  {error ? (
                    <Text className="text-red-400 text-center p-3 bg-red-500/20 rounded-lg">
                      {error}
                    </Text>
                  ) : null}

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

                  <View className="items-end">
                    <TouchableOpacity onPress={() => { setShowForgot(true); setForgotStep(1); setSuccess(''); setError(''); }}>
                      <Text className="text-sm text-primary font-medium">
                        Forgot password?
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isLoading}
                    className={`w-full py-4 rounded-lg ${
                      isLoading ? 'bg-primary/50' : 'bg-primary'
                    } items-center justify-center`}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text className="text-white font-bold text-base">
                        Login
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                <View className="flex-row justify-center mt-6">
                  <Text className="text-gray-300">
                    Don't have an account?{' '}
                  </Text>
                  <Link href="/signup" asChild>
                    <TouchableOpacity>
                      <Text className="text-primary font-bold">Sign Up</Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>

          <Modal
            visible={showForgot}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowForgot(false)}
          >
            <Pressable
              onPress={() => setShowForgot(false)}
              className="flex-1 bg-black/70 items-center justify-center p-6"
            >
              <Pressable
                onPress={() => {}}
                className="bg-card p-6 rounded-lg w-full max-w-md"
              >
                <Text className="text-xl font-semibold mb-4 text-white">
                  Reset Password
                </Text>
                {forgotError && (
                  <View className="bg-red-500/20 p-3 rounded mb-3">
                    <Text className="text-red-300">{forgotError}</Text>
                  </View>
                )}

                {forgotStep === 1 && (
                  <View>
                    <Text className="text-sm text-gray-400 mb-3">
                      Enter the email associated with your account.
                    </Text>
                    <TextInput
                      placeholder="Email"
                      placeholderTextColor="#6b7280"
                      className="w-full p-3 bg-background border border-gray-700 rounded mb-4 text-white"
                      value={forgotEmail}
                      onChangeText={setForgotEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    <View className="flex-row gap-3 justify-end">
                      <TouchableOpacity
                        onPress={() => setShowForgot(false)}
                        className="px-4 py-2 bg-gray-700 rounded-lg"
                      >
                        <Text className="text-white">Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleSendOtp}
                        className="px-4 py-2 bg-primary rounded-lg"
                        disabled={forgotLoading}
                      >
                        {forgotLoading ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text className="text-white font-bold">Send OTP</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {forgotStep === 2 && (
                  <View>
                    <Text className="text-sm text-gray-400 mb-3">
                      Enter the code sent to your email.
                    </Text>
                    <TextInput
                      placeholder="123456"
                      placeholderTextColor="#6b7280"
                      className="w-full p-3 bg-background border border-gray-700 rounded mb-4 text-white"
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                    />
                    <View className="flex-row gap-3 justify-end">
                      <TouchableOpacity
                        onPress={() => setForgotStep(1)}
                        className="px-4 py-2 bg-gray-700 rounded-lg"
                      >
                        <Text className="text-white">Back</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleVerifyOtp}
                        className="px-4 py-2 bg-primary rounded-lg"
                        disabled={forgotLoading}
                      >
                        {forgotLoading ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text className="text-white font-bold">Verify</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {forgotStep === 3 && (
                  <View>
                    <Text className="text-sm text-gray-400 mb-3">
                      Enter a new password for your account.
                    </Text>
                    <View className="relative mb-2 flex-row items-center">
                      <TextInput
                        placeholder="New password"
                        placeholderTextColor="#6b7280"
                        className="flex-1 w-full p-3 bg-background border border-gray-700 rounded text-white"
                        value={newPassword}
                        onChangeText={onPasswordChange}
                        secureTextEntry={!forgotShowPassword}
                      />
                      <TouchableOpacity
                        onPress={() => setForgotShowPassword(!forgotShowPassword)}
                        className="absolute right-0 p-3"
                      >
                        {forgotShowPassword ? (
                          <EyeOff size={20} color="#9ca3af" />
                        ) : (
                          <Eye size={20} color="#9ca3af" />
                        )}
                      </TouchableOpacity>
                    </View>

                    <View className="mb-4 space-y-1 px-1">
                      <PasswordCheckItem
                        text="Minimum 8 characters"
                        valid={forgotPasswordChecks.length}
                      />
                      <PasswordCheckItem
                        text="Uppercase letter (A-Z)"
                        valid={forgotPasswordChecks.upper}
                      />
      <PasswordCheckItem
                        text="Lowercase letter (a-z)"
                        valid={forgotPasswordChecks.lower}
                      />
                      <PasswordCheckItem
                        text="A number (0-9)"
                        valid={forgotPasswordChecks.number}
                      />
                      <PasswordCheckItem
                        text="A special character (e.g. !@#$%)"
                        valid={forgotPasswordChecks.special}
                      />
                    </View>
                    <View className="flex-row gap-3 justify-end">
                      <TouchableOpacity
                        onPress={() => setForgotStep(2)}
                        className="px-4 py-2 bg-gray-700 rounded-lg"
                      >
                        <Text className="text-white">Back</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handlePasswordReset}
                        className={`px-4 py-2 rounded-lg ${
                          canForgotReset ? 'bg-primary' : 'bg-gray-500'
                        }`}
                        disabled={forgotLoading || !canForgotReset}
                      >
                        {forgotLoading ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text className="text-white font-bold">
                            Reset Password
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </Pressable>
            </Pressable>
          </Modal>
        </View>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}