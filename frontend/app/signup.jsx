import React, { useState } from 'react';
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
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { MotiView } from 'moti';

import { useAuth } from '../src/context/AuthContext';
import * as api from '../src/api';
import { FloatingLabelInput } from '../components/FloatingLabelInput';
import { OTPInput } from '../components/OTPInput';

import COUNTRIES from '../src/data/countries';

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
  const [signupStep, setSignupStep] = useState(1); // 1: enter details, 2: enter otp, 3: complete
  const [otp, setOtp] = useState('');
  const [signupToken, setSignupToken] = useState('');
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

    if (formData.username.trim().length > 10) {
      setError('Username cannot be more than 10 characters.');
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
      // Start signup OTP flow
      const payload = {
        name: formData.name.trim(),
        age: ageNum,
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        country: formData.country || '',
        state: formData.state || '',
      };

      await api.sendSignupOtp(payload);
      setSignupStep(2);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to start signup.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    setIsLoading(true);
    try {
      const { data } = await api.verifySignupOtp({ email: formData.email.trim(), otp });
      setSignupToken(data.signupToken);
      setSignupStep(3);
    } catch (err) {
      setError(err.response?.data?.msg || 'Invalid OTP');
      console.error(err);
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleCompleteSignup = async () => {
    setError('');
    setIsLoading(true);
    try {
      const { data } = await api.completeSignup({ email: formData.email.trim(), signupToken });
      await login(data, true); // Pass true to indicate this is a new user signup
      // Navigation will be handled by _layout.jsx
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to complete signup');
      console.error(err);
    } finally { 
      setIsLoading(false); 
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={signupStyles.container}
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
                {signupStep === 1 && (
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
                          {isLoading ? 'Sending OTP...' : 'Sign Up'}
                        </Text>
                      </Pressable>
                    </MotiView>
                  </View>
                )}

                {/* Step 2: OTP Verification */}
                {signupStep === 2 && (
                  <View style={signupStyles.otpContainer}>
                    <Text style={signupStyles.otpText}>
                      We've sent an OTP to <Text style={signupStyles.emailText}>{formData.email}</Text>. Enter it below to verify your email.
                    </Text>
                    <OTPInput
                      length={6}
                      value={otp}
                      onChangeText={setOtp}
                      onComplete={(code) => {
                        setOtp(code);
                        // Auto-submit when OTP is complete
                        if (code.length === 6) {
                          setTimeout(() => handleVerifyOtp(), 500);
                        }
                      }}
                    />
                    <View style={signupStyles.otpButtons}>
                      <Pressable
                        onPress={() => setSignupStep(1)}
                        style={signupStyles.backButton}
                      >
                        <Text style={signupStyles.backButtonText}>Back</Text>
                      </Pressable>
                      <Pressable
                        onPress={handleVerifyOtp}
                        disabled={isLoading || otp.trim().length === 0}
                        style={[
                          signupStyles.verifyButton,
                          { 
                            backgroundColor: (isLoading || otp.trim().length === 0) ? '#6b7280' : '#10b981',
                            opacity: (isLoading || otp.trim().length === 0) ? 0.7 : 1
                          }
                        ]}
                      >
                        <Text style={signupStyles.verifyButtonText}>
                          {isLoading ? 'Verifying...' : 'Verify'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}

                {/* Step 3: Complete Signup */}
                {signupStep === 3 && (
                  <View style={signupStyles.completeContainer}>
                    <Text style={signupStyles.completeText}>
                      Verification successful. Click below to complete account creation.
                    </Text>
                    <View style={signupStyles.otpButtons}>
                      <Pressable
                        onPress={() => setSignupStep(2)}
                        style={signupStyles.backButton}
                      >
                        <Text style={signupStyles.backButtonText}>Back</Text>
                      </Pressable>
                      <Pressable
                        onPress={handleCompleteSignup}
                        disabled={isLoading}
                        style={[
                          signupStyles.completeButton,
                          { backgroundColor: isLoading ? '#6b7280' : '#10b981' }
                        ]}
                      >
                        <Text style={signupStyles.completeButtonText}>
                          {isLoading ? 'Completing...' : 'Complete Signup'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}

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
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.75)' },
  safeArea: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 20 },
  logoContainer: { alignItems: 'center', marginBottom: 20 },
  logoImage: { width: 100, height: 100 },
  formCard: { backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#d1d5db', textAlign: 'center', marginBottom: 20 },
  errorContainer: { backgroundColor: 'rgba(220, 38, 38, 0.2)', borderWidth: 1, borderColor: '#dc2626', padding: 12, borderRadius: 10, marginBottom: 15 },
  errorText: { color: '#fecaca', textAlign: 'center', fontWeight: '500' },
  inputWrapper: { marginBottom: 15 },
  inputRow: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { width: '48%' },
  passwordRequirements: { marginTop: 8 },
  requirementRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  requirementText: { marginLeft: 6, fontSize: 12 },
  submitButton: { width: '100%', paddingVertical: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10, shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  submitButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  loginContainer: { alignItems: 'center', marginTop: 20 },
  loginBox: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 15, padding: 15, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  loginText: { flexDirection: 'row', alignItems: 'center' },
  loginLink: { color: '#10b981', fontWeight: 'bold' },
  otpContainer: { alignItems: 'center', marginBottom: 20 },
  otpTitle: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 8 },
  otpSubtitle: { fontSize: 16, color: '#d1d5db', textAlign: 'center', marginBottom: 20 },

  resendContainer: { marginTop: 15, alignItems: 'center' },
  resendText: { color: '#d1d5db' },
  resendButton: { color: '#10b981', fontWeight: 'bold' },
  successContainer: { alignItems: 'center' },
  successIcon: { fontSize: 60, marginBottom: 20 },
  successTitle: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 10 },
  successSubtitle: { fontSize: 16, color: '#d1d5db', textAlign: 'center', marginBottom: 30 },
  continueButton: { width: '100%', paddingVertical: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }
});