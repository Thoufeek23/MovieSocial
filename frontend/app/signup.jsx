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
// import { OTPInput } from '../components/OTPInput'; // Commented out: OTP flow disabled

import COUNTRIES from '../src/data/countries';

WebBrowser.maybeCompleteAuthSession();

export default function SignupPage() {
  const [formData, setFormData] = useState({ 
    name: '', 
    age: '', 
    username: '', 
    email: '', 
    password: '', 
    confirmPassword: '', 
    country: '', 
    state: '' 
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordChecks, setPasswordChecks] = useState({ 
    length: false, 
    upper: false, 
    lower: false, 
    number: false, 
    special: false 
  });
  
  const { login } = useAuth();
  const router = useRouter();

  // Use static poster image instead of dynamic background
  const staticPoster = require('../assets/images/poster1.png');

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
    setIsLoading(true);
    setError('');
    try {
      const { data } = await api.googleSignUp(idToken);
      await login(data, true); // Mark as new user
      // Redirect to username selection for Google users
      router.push('/username');
    } catch (err) {
      const errorMsg = err?.response?.data?.msg || 'Google Sign Up failed. Please try again.';
      const accountExists = err?.response?.data?.accountExists;
      
      setError(errorMsg);
      console.error('Google Sign Up error:', err);
      
      // Redirect to login if account already exists
      if (accountExists) {
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (error) setError(''); // Clear error when user starts typing

    if (field === 'password') {
      const checks = {
        length: value.length >= 8,
        upper: /[A-Z]/.test(value),
        lower: /[a-z]/.test(value),
        number: /\d/.test(value),
        special: /[\W_]/.test(value),
      };
      setPasswordChecks(checks);
    }
  };

  const handleSubmit = async () => {
    setError('');

    // Basic validations
    if (!formData.name.trim() || !formData.age.trim() || !formData.username.trim() || !formData.email.trim() || !formData.password) {
      setError('Please fill out all fields.');
      return;
    }

    // Validate username length (5-20 characters)
    if (formData.username.trim().length < 5) {
      setError('Username must be at least 5 characters.');
      return;
    }
    if (formData.username.trim().length > 20) {
      setError('Username cannot be more than 20 characters.');
      return;
    }

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    const ageNum = Number(formData.age);
    if (!Number.isInteger(ageNum) || ageNum < 8 || ageNum > 120) {
      setError('Please enter a valid age (must be at least 8).');
      return;
    }

    // Password policy validation
    const pwd = formData.password;
    const pwdPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!pwdPolicy.test(pwd)) {
      setError('Password must be at least 8 characters and include uppercase, lowercase, number and special character.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please retype your password.');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        age: ageNum,
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        country: formData.country || '',
        state: formData.state || '',
      };

      const { data } = await api.register(payload);
      await login(data, true); // Mark as new user
      // Navigation will be handled by _layout.jsx
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to sign up.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={signupStyles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ImageBackground
        source={staticPoster}
        resizeMode="cover"
        style={signupStyles.backgroundImage}
      >
        <View style={signupStyles.overlay}>
          <SafeAreaView style={signupStyles.safeArea}>
            {/* Header Section */}
            <MotiView
              from={{ opacity: 0, translateY: 30 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 800, delay: 300 }}
              style={signupStyles.headerSection}
            >
              <View style={signupStyles.logoContainer}>
                <Image 
                  source={require('../assets/images/MS_logo.png')}
                  style={signupStyles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </MotiView>

            {/* Form Section */}
            <ScrollView 
              style={signupStyles.formContainer}
              showsVerticalScrollIndicator={false}
            >
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 800, delay: 500 }}
                style={signupStyles.formCard}
              >
                <Text style={signupStyles.welcomeTitle}>
                  Create Account
                </Text>
                <Text style={signupStyles.welcomeSubtitle}>
                  Join the community and start sharing your thoughts on film.
                </Text>

                {/* Error Message */}
                {error && (
                  <MotiView
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={signupStyles.errorContainer}
                  >
                    <Text style={signupStyles.errorText}>
                      {error}
                    </Text>
                  </MotiView>
                )}

                {/* Step 1: Registration Form */}
                  <View style={signupStyles.inputsContainer}>
                    <MotiView
                      from={{ opacity: 0, translateX: -20 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      transition={{ type: 'spring', stiffness: 100, delay: 700 }}
                      style={signupStyles.inputWrapper}
                    >
                      <FloatingLabelInput
                        label="Full Name"
                        value={formData.name}
                        onChangeText={(value) => handleChange('name', value)}
                      />
                    </MotiView>

                    <MotiView
                      from={{ opacity: 0, translateX: -20 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      transition={{ type: 'spring', stiffness: 100, delay: 750 }}
                      style={signupStyles.inputWrapper}
                    >
                      <FloatingLabelInput
                        label="Age"
                        value={formData.age}
                        onChangeText={(value) => handleChange('age', value)}
                        keyboardType="numeric"
                      />
                    </MotiView>

                    <MotiView
                      from={{ opacity: 0, translateX: -20 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      transition={{ type: 'spring', stiffness: 100, delay: 800 }}
                      style={signupStyles.inputWrapper}
                    >
                      <FloatingLabelInput
                        label="Username"
                        value={formData.username}
                        onChangeText={(value) => handleChange('username', value)}
                        autoCapitalize="none"
                        maxLength={10}
                      />
                    </MotiView>

                    <MotiView
                      from={{ opacity: 0, translateX: -20 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      transition={{ type: 'spring', stiffness: 100, delay: 850 }}
                      style={signupStyles.inputWrapper}
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
                      transition={{ type: 'spring', stiffness: 100, delay: 900 }}
                      style={signupStyles.inputWrapper}
                    >
                      <FloatingLabelInput
                        label="Password"
                        value={formData.password}
                        onChangeText={(value) => handleChange('password', value)}
                        isPassword={true}
                      />
                    </MotiView>

                    {/* Password Requirements */}
                    <View style={signupStyles.passwordChecks}>
                      <Text style={[signupStyles.passwordCheckText, { color: passwordChecks.length ? '#10b981' : '#6b7280' }]}>
                        {passwordChecks.length ? '✓' : '•'} Minimum 8 characters
                      </Text>
                      <Text style={[signupStyles.passwordCheckText, { color: passwordChecks.upper ? '#10b981' : '#6b7280' }]}>
                        {passwordChecks.upper ? '✓' : '•'} Uppercase letter (A-Z)
                      </Text>
                      <Text style={[signupStyles.passwordCheckText, { color: passwordChecks.lower ? '#10b981' : '#6b7280' }]}>
                        {passwordChecks.lower ? '✓' : '•'} Lowercase letter (a-z)
                      </Text>
                      <Text style={[signupStyles.passwordCheckText, { color: passwordChecks.number ? '#10b981' : '#6b7280' }]}>
                        {passwordChecks.number ? '✓' : '•'} A number (0-9)
                      </Text>
                      <Text style={[signupStyles.passwordCheckText, { color: passwordChecks.special ? '#10b981' : '#6b7280' }]}>
                        {passwordChecks.special ? '✓' : '•'} A special character (e.g. !@#$%)
                      </Text>
                    </View>

                    <MotiView
                      from={{ opacity: 0, translateX: -20 }}
                      animate={{ opacity: 1, translateX: 0 }}
                      transition={{ type: 'spring', stiffness: 100, delay: 950 }}
                      style={signupStyles.inputWrapper}
                    >
                      <FloatingLabelInput
                        label="Confirm Password"
                        value={formData.confirmPassword}
                        onChangeText={(value) => handleChange('confirmPassword', value)}
                        isPassword={true}
                      />
                    </MotiView>

                    <MotiView
                      from={{ opacity: 0, translateY: 20 }}
                      animate={{ opacity: 1, translateY: 0 }}
                      transition={{ type: 'timing', duration: 500, delay: 1000 }}
                      style={signupStyles.buttonContainer}
                    >
                      <Pressable
                        onPress={handleSubmit}
                        disabled={isLoading}
                        style={[
                          signupStyles.signupButton,
                          { backgroundColor: isLoading ? '#6b7280' : '#10b981' }
                        ]}
                      >
                        <Text style={signupStyles.signupButtonText}>
                          {isLoading ? 'Signing Up...' : 'Sign Up'}
                        </Text>
                      </Pressable>
                    </MotiView>

                    {/* Divider */}
                    <View style={signupStyles.dividerContainer}>
                      <View style={signupStyles.dividerLine} />
                      <Text style={signupStyles.dividerText}>OR</Text>
                      <View style={signupStyles.dividerLine} />
                    </View>

                    {/* Google Sign In Button */}
                    <MotiView
                      from={{ opacity: 0, translateY: 20 }}
                      animate={{ opacity: 1, translateY: 0 }}
                      transition={{ type: 'timing', duration: 500, delay: 1050 }}
                    >
                      <Pressable
                        onPress={() => promptAsync()}
                        disabled={!request || isLoading}
                        style={[
                          signupStyles.googleButton,
                          { opacity: (!request || isLoading) ? 0.5 : 1 }
                        ]}
                      >
                        <Image
                          source={{ uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' }}
                          style={signupStyles.googleIcon}
                        />
                        <Text style={signupStyles.googleButtonText}>
                          Continue with Google
                        </Text>
                      </Pressable>
                    </MotiView>
                  </View>

                {/* Login Link */}
                <MotiView
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 500, delay: 1100 }}
                  style={signupStyles.loginContainer}
                >
                  <View style={signupStyles.loginBox}>
                    <View style={signupStyles.loginText}>
                      <Text style={{ color: '#f3f4f6', fontSize: 16, fontWeight: '500' }}>
                        Already have an account?{' '}
                      </Text>
                      <Link href="/login" asChild>
                        <TouchableOpacity>
                          <Text style={signupStyles.loginLink}>
                            Log In
                          </Text>
                        </TouchableOpacity>
                      </Link>
                    </View>
                  </View>
                </MotiView>
              </MotiView>
            </ScrollView>
          </SafeAreaView>
        </View>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const { width, height } = Dimensions.get('window');

const signupStyles = StyleSheet.create({
  container: { flex: 1 },
  backgroundImage: { flex: 1, width: width, height: height },
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)' },
  safeArea: { flex: 1, paddingHorizontal: 20 },
  headerSection: { alignItems: 'center', paddingTop: 15, paddingBottom: 10 },
  logoContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  logoImage: { width: 120, height: 120 },
  formContainer: { flex: 1, paddingBottom: 20 },
  formCard: { backgroundColor: 'transparent', padding: 16, borderRadius: 20 },
  welcomeTitle: { fontSize: 26, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 6, letterSpacing: 0.5 },
  welcomeSubtitle: { fontSize: 14, color: '#d1d5db', textAlign: 'center', marginBottom: 18, lineHeight: 20 },
  errorContainer: { backgroundColor: 'transparent', borderWidth: 0, padding: 10, borderRadius: 12, marginBottom: 12 },
  errorText: { color: '#fecaca', textAlign: 'center', fontWeight: '500', fontSize: 14 },
  inputsContainer: { marginBottom: 10 },
  inputWrapper: { backgroundColor: 'transparent', borderRadius: 15, marginBottom: 10 },
  passwordChecks: { marginTop: 10, marginBottom: 15, paddingHorizontal: 4 },
  passwordCheckText: { fontSize: 12, fontWeight: '500', marginBottom: 6, lineHeight: 18 },
  buttonContainer: { marginTop: 15, marginBottom: 10 },
  signupButton: { width: '100%', paddingVertical: 14, borderRadius: 15, alignItems: 'center', justifyContent: 'center', shadowColor: '#10b981', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10 },
  signupButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 },
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
    elevation: 5,
    marginBottom: 10
  },
  googleIcon: { width: 20, height: 20, marginRight: 12 },
  googleButtonText: { color: '#1f2937', fontSize: 16, fontWeight: '600' },
  loginContainer: { alignItems: 'center', marginTop: 20, marginBottom: 20 },
  loginBox: { backgroundColor: 'transparent', borderRadius: 12, padding: 16, alignItems: 'center' },
  loginText: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' },
  loginLink: { color: '#10b981', fontWeight: 'bold', fontSize: 16 },
  otpContainer: { alignItems: 'center', marginTop: 20, marginBottom: 30 },
  otpText: { fontSize: 15, color: '#d1d5db', textAlign: 'center', marginBottom: 25, lineHeight: 22, paddingHorizontal: 10 },
  emailText: { color: '#10b981', fontWeight: '600' },
  otpButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 25, width: '100%' },
  backButton: { flex: 1, paddingVertical: 14, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  backButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  verifyButton: { flex: 1, paddingVertical: 14, borderRadius: 15, alignItems: 'center', justifyContent: 'center', shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  verifyButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  completeContainer: { alignItems: 'center', marginTop: 20, marginBottom: 30 },
  completeText: { fontSize: 15, color: '#d1d5db', textAlign: 'center', marginBottom: 25, lineHeight: 22, paddingHorizontal: 10 },
  completeButton: { flex: 1, paddingVertical: 14, borderRadius: 15, alignItems: 'center', justifyContent: 'center', shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  completeButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});