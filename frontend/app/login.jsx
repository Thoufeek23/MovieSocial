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
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

import { useAuth } from '../src/context/AuthContext';
import * as api from '../src/api';
import { FloatingLabelInput } from '../components/FloatingLabelInput';

WebBrowser.maybeCompleteAuthSession();

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentBackdrop, setCurrentBackdrop] = useState(0);
  
  const { login } = useAuth();
  const router = useRouter();

  // Google Sign In configuration
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  // Handle Google Sign In response
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleSignIn(id_token);
    }
  }, [response]);

  const handleGoogleSignIn = async (idToken) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.googleSignIn(idToken);
      await login(data, data.isNewUser);
      // AuthGuard will handle the redirect
    } catch (err) {
      console.error('Google Sign In error:', err);
      const errorMsg = err?.response?.data?.msg || 'Google Sign In failed. Please try again.';
      const accountNotFound = err?.response?.data?.accountNotFound;
      
      setError(errorMsg);
      
      // Redirect to signup if account doesn't exist
      if (accountNotFound) {
        setTimeout(() => {
          router.push('/signup');
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

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
      const errorMsg = err?.response?.data?.msg || err?.response?.data?.message || err?.message || 'Invalid credentials. Please try again.';
      const accountNotFound = err?.response?.data?.accountNotFound;
      
      setError(errorMsg);
      
      // Redirect to signup if account doesn't exist
      if (accountNotFound) {
        setTimeout(() => {
          router.push('/signup');
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={loginStyles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ImageBackground
        source={posterImages[currentBackdrop]}
        resizeMode="cover"
        style={loginStyles.backgroundImage}
      >
        {/* Enhanced gradient overlay for better text readability */}
        <View style={loginStyles.overlay}>
          <SafeAreaView style={loginStyles.safeArea}>
            <ScrollView 
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
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
                    >Divider */}
                  <View style={loginStyles.dividerContainer}>
                    <View style={loginStyles.dividerLine} />
                    <Text style={loginStyles.dividerText}>OR</Text>
                    <View style={loginStyles.dividerLine} />
                  </View>

                  {/* Google Sign In Button */}
                  <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 500, delay: 950 }}
                  >
                    <Pressable
                      onPress={() => promptAsync()}
                      disabled={!request || loading}
                      style={[
                        loginStyles.googleButton,
                        { opacity: (!request || loading) ? 0.5 : 1 }
                      ]}
                    >
                      <Image
                        source={{ uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' }}
                        style={loginStyles.googleIcon}
                      />
                      <Text style={loginStyles.googleButtonText}>
                        Continue with Google
                      </Text>
                    </Pressable>
                  </MotiView>

                  {/* 
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
            </ScrollView>
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#4b5563' },
  dividerText: { color: '#9ca3af', paddingHorizontal: 15, fontSize: 14, fontWeight: '600' },
  googleButton: { 
    width: '100%', 
    paddingVertical: 14, 
    borderRadius: 15, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: 'white',
    flexDirection: 'row',
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 8, 
    elevation: 5 
  },
  googleIcon: { width: 20, height: 20, marginRight: 12 },
  googleButtonText: { color: '#1f2937', fontSize: 16, fontWeight: '600' },
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

