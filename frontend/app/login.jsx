// frontend/app/login.jsx

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
  StyleSheet,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { MotiView } from 'moti';

import { useAuth } from '../src/context/AuthContext';
import * as api from '../src/api';
import { FloatingLabelInput } from '../components/FloatingLabelInput';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentBackdrop, setCurrentBackdrop] = useState(0);
  
  const { login } = useAuth();
  const router = useRouter();

  // Local poster images
  const posterImages = [
    require('../assets/images/poster1.png'),
    require('../assets/images/poster2.png'),
    require('../assets/images/poster3.png'),
    require('../assets/images/poster4.png'),
    require('../assets/images/poster5.png'),
  ];

  // Auto-rotate backgrounds
  useEffect(() => {
    // Start with first poster immediately
    setCurrentBackdrop(0);
    
    const interval = setInterval(() => {
      setCurrentBackdrop(prev => (prev + 1) % posterImages.length);
    }, 6000);
    
    return () => clearInterval(interval);
  }, [posterImages.length]);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (error) setError(''); // Clear error when user starts typing
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
      // AuthGuard will handle the redirect
    } catch (err) {
      console.error('Login error:', err);
      setError(err?.response?.data?.message || err?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={loginStyles.container}
    >
      <ImageBackground
        source={posterImages[currentBackdrop]}
        resizeMode="cover"
        style={loginStyles.backgroundImage}
      >
        {/* Enhanced gradient overlay for better text readability */}
        <View style={loginStyles.overlay}>
          <SafeAreaView style={loginStyles.safeArea}>
            {/* Header Section */}
              <MotiView
                from={{ opacity: 0, translateY: 30 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 800, delay: 300 }}
                style={loginStyles.headerSection}
              >
                <View style={loginStyles.logoContainer}>
                  <Image 
                    source={require('../assets/images/MS_logo.png')}
                    style={loginStyles.logoImage}
                    resizeMode="contain"
                  />
                </View>
                {/*<View style={loginStyles.taglineContainer}>
                  <Text style={loginStyles.taglineText}>
                    Discover, Discuss, Decide. Your ultimate movie companion.
                  </Text>
                </View>*/}
              </MotiView>

              {/* Form Section */}
              <View style={loginStyles.formContainer}>
                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 800, delay: 500 }}
                  style={loginStyles.formCard}
                >
                  <Text style={loginStyles.welcomeTitle}>
                    Welcome!
                  </Text>
                  <Text style={loginStyles.welcomeSubtitle}>
                    Login to continue your movie journey.
                  </Text>

                  {/* Error Message */}
                  {error && (
                    <MotiView
                      from={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={loginStyles.errorContainer}
                    >
                      <Text style={loginStyles.errorText}>
                        {error}
                      </Text>
                    </MotiView>
                  )}

                  {/* Form Inputs */}
                  <View style={loginStyles.inputsContainer}>
                    <MotiView
                      from={{ opacity: 0, translateX: -20 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      transition={{ type: 'spring', stiffness: 100, delay: 700 }}
                      style={loginStyles.inputWrapper}
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
                      style={loginStyles.inputWrapper}
                    >
                      <FloatingLabelInput
                        label="Password"
                        value={formData.password}
                        onChangeText={(value) => handleChange('password', value)}
                        isPassword={true}
                      />
                    </MotiView>
                  </View>

                  {/* Login Button */}
                  <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 500, delay: 900 }}
                    style={loginStyles.buttonContainer}
                  >
                    <Pressable
                      onPress={handleSubmit}
                      disabled={loading}
                      style={[
                        loginStyles.loginButton,
                        { backgroundColor: loading ? '#6b7280' : '#10b981' }
                      ]}
                    >
                      <Text style={loginStyles.loginButtonText}>
                        {loading ? 'Logging in...' : 'Login'}
                      </Text>
                    </Pressable>
                  </MotiView>

                  {/* Forgot Password Link */}
                  <View style={loginStyles.forgotPasswordContainer}>
                    <TouchableOpacity 
                      style={loginStyles.forgotPasswordButton}
                      onPress={() => router.push('/forgot-password')}
                    >
                      <Text style={loginStyles.forgotPasswordText}>
                        Forgot password?
                      </Text>
                    </TouchableOpacity>
                  </View>
                </MotiView>

                {/* Sign Up Link */}
                <MotiView
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 500, delay: 1000 }}
                  style={loginStyles.signupContainer}
                >
                  <View style={loginStyles.signupBox}>
                    <View style={loginStyles.signupText}>
                      <Text style={{ color: '#f3f4f6', fontSize: 16, fontWeight: '500' }}>
                        Don't have an account?{' '}
                      </Text>
                      <Link href="/signup" asChild>
                        <TouchableOpacity>
                          <Text style={loginStyles.signupLink}>
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

const { width, height } = Dimensions.get('window');

const loginStyles = StyleSheet.create({
  container: { flex: 1 },
  backgroundImage: { flex: 1, width: width, height: height },
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)' },
  safeArea: { flex: 1, paddingHorizontal: 20 },
  headerSection: { alignItems: 'center', paddingTop: 15, paddingBottom: 10, flex: 0.25, justifyContent: 'center' },
  logoContainer: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', paddingHorizontal: 25, paddingVertical: 5, borderRadius: 25, marginBottom: 0 },
  logoImage: { width: 200, height: 200 },
  formContainer: { flex: 0.75, justifyContent: 'space-between', paddingHorizontal: 15, paddingBottom: 10 },
  formCard: { backgroundColor: 'transparent', padding: 16, borderRadius: 28, borderWidth: 0, borderColor: 'transparent', marginHorizontal: 5 },
  welcomeTitle: { fontSize: 26, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 6, letterSpacing: 0.5 },
  welcomeSubtitle: { fontSize: 14, color: '#d1d5db', textAlign: 'center', marginBottom: 18, lineHeight: 20 },
  errorContainer: { backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', padding: 10, borderRadius: 12, marginBottom: 12 },
  errorText: { color: '#fecaca', textAlign: 'center', fontWeight: '500', fontSize: 14 },
  inputsContainer: { marginBottom: 10 },
  inputWrapper: { backgroundColor: 'transparent', borderRadius: 15, marginBottom: 5 },
  buttonContainer: { marginTop: 10 },
  loginButton: { width: '100%', paddingVertical: 14, borderRadius: 15, alignItems: 'center', justifyContent: 'center', shadowColor: '#10b981', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10 },
  loginButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 },
  forgotPasswordContainer: { marginTop: 15, alignItems: 'center' },
  forgotPasswordButton: { padding: 8 },
  forgotPasswordText: { color: '#10b981', fontSize: 14, fontWeight: '600' },
  signupContainer: { alignItems: 'center', marginBottom: 20 },
  signupBox: { backgroundColor: 'transparent', borderRadius: 12, padding: 16, borderWidth: 0, borderColor: 'transparent', alignItems: 'center' },
  signupText: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' },
  signupLink: { color: '#10b981', fontWeight: 'bold', fontSize: 16 }
});

