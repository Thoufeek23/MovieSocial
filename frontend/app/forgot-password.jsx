// frontend/app/forgot-password.jsx

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ImageBackground, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableOpacity,
  Pressable,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { ArrowLeft, Mail, Lock, Shield, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react-native';

import * as api from '../src/api';
import { FloatingLabelInput } from '../components/FloatingLabelInput';
import { OTPInput } from '../components/OTPInput';

const { width, height } = Dimensions.get('window');

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false
  });
  const router = useRouter();

  // Local poster images for background rotation
  const posterImages = [
    require('../assets/images/poster1.png'),
    require('../assets/images/poster2.png'),
    require('../assets/images/poster3.png'),
    require('../assets/images/poster4.png'),
    require('../assets/images/poster5.png'),
  ];

  const handleEmailSubmit = async () => {
    if (!formData.email || !formData.email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await api.forgotPassword({ email: formData.email });
      setStep(2);
    } catch (err) {
      setError(err?.response?.data?.msg || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (!formData.otp || formData.otp.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const { data } = await api.verifyResetOtp({ 
        email: formData.email, 
        otp: formData.otp 
      });
      setResetToken(data.resetToken);
      setStep(3);
    } catch (err) {
      setError(err?.response?.data?.msg || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    const isValidPassword = Object.values(passwordChecks).every(Boolean);
    
    if (!isValidPassword) {
      setError('Password does not meet all requirements.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await api.resetPassword({
        email: formData.email,
        resetToken,
        newPassword: formData.newPassword
      });
      setStep(4);
    } catch (err) {
      setError(err?.response?.data?.msg || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (password) => {
    const checks = {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[\W_]/.test(password)
    };
    setPasswordChecks(checks);
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (error) setError('');
    
    if (field === 'newPassword') {
      validatePassword(value);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError('');
    } else {
      router.back();
    }
  };

  const getStepContent = () => {
    switch (step) {
      case 1:
        return (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', stiffness: 100 }}
            style={styles.stepContainer}
          >
            <View style={styles.iconContainer}>
              <Mail size={48} color="#10b981" />
            </View>
            
            <Text style={styles.stepTitle}>Reset Your Password</Text>
            <Text style={styles.stepSubtitle}>
              Enter your email address and we'll send you a verification code to reset your password.
            </Text>
            
            <View style={{ width: '100%', marginBottom: 10 }}>
              <FloatingLabelInput
                label="Email Address"
                value={formData.email}
                onChangeText={(value) => handleChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Enter your email"
              />
            </View>
            
            <Pressable
              onPress={handleEmailSubmit}
              disabled={loading}
              style={[styles.button, { opacity: loading ? 0.6 : 1 }]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.buttonText}>Send Reset Code</Text>
              )}
            </Pressable>
          </MotiView>
        );
        
      case 2:
        return (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', stiffness: 100 }}
            style={styles.stepContainer}
          >
            <View style={styles.iconContainer}>
              <Shield size={48} color="#10b981" />
            </View>
            
            <Text style={styles.stepTitle}>Enter Verification Code</Text>
            <Text style={styles.stepSubtitle}>
              We've sent a 6-digit code to {formData.email}. Please check your email and enter the code below.
            </Text>
            
            <View style={styles.otpContainer}>
              <OTPInput
                length={6}
                value={formData.otp}
                onChangeText={(value) => handleChange('otp', value)}
                onComplete={(code) => {
                  handleChange('otp', code);
                  // Auto-submit when OTP is complete
                  if (code.length === 6) {
                    setTimeout(() => handleOtpSubmit(), 500);
                  }
                }}
              />
            </View>
            
            <Pressable
              onPress={handleOtpSubmit}
              disabled={loading}
              style={[styles.button, { opacity: loading ? 0.6 : 1 }]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.buttonText}>Verify Code</Text>
              )}
            </Pressable>
            
            <TouchableOpacity
              onPress={() => setStep(1)}
              style={styles.resendButton}
            >
              <Text style={styles.resendText}>Resend code to different email</Text>
            </TouchableOpacity>
          </MotiView>
        );
        
      case 3:
        return (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', stiffness: 100 }}
            style={styles.stepContainer}
          >
            <View style={styles.iconContainer}>
              <Lock size={48} color="#10b981" />
            </View>
            
            <Text style={styles.stepTitle}>Create New Password</Text>
            <Text style={styles.stepSubtitle}>
              Your new password must meet all the security requirements below.
            </Text>
            
            <View style={styles.passwordInputContainer}>
              <FloatingLabelInput
                label="New Password"
                value={formData.newPassword}
                onChangeText={(value) => handleChange('newPassword', value)}
                isPassword={true}
              />
            </View>
            
            {/* Password Requirements */}
            <View style={styles.passwordRequirements}>
              <Text style={styles.requirementsTitle}>Password must contain:</Text>
              {[
                { key: 'length', text: 'At least 8 characters' },
                { key: 'upper', text: 'One uppercase letter (A-Z)' },
                { key: 'lower', text: 'One lowercase letter (a-z)' },
                { key: 'number', text: 'One number (0-9)' },
                { key: 'special', text: 'One special character (!@#$%)' }
              ].map((requirement) => (
                <View key={requirement.key} style={styles.requirementRow}>
                  <CheckCircle 
                    size={16} 
                    color={passwordChecks[requirement.key] ? '#10b981' : '#6b7280'} 
                  />
                  <Text 
                    style={[
                      styles.requirementText, 
                      { color: passwordChecks[requirement.key] ? '#10b981' : '#9ca3af' }
                    ]}
                  >
                    {requirement.text}
                  </Text>
                </View>
              ))}
            </View>
            
            <Pressable
              onPress={handlePasswordSubmit}
              disabled={loading || !Object.values(passwordChecks).every(Boolean)}
              style={[
                styles.button, 
                { 
                  opacity: (loading || !Object.values(passwordChecks).every(Boolean)) ? 0.6 : 1 
                }
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.buttonText}>Reset Password</Text>
              )}
            </Pressable>
          </MotiView>
        );
        
      case 4:
        return (
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 100 }}
            style={styles.stepContainer}
          >
            <View style={styles.iconContainer}>
              <CheckCircle size={64} color="#10b981" />
            </View>
            
            <Text style={styles.stepTitle}>Password Reset Successful!</Text>
            <Text style={styles.stepSubtitle}>
              Your password has been updated successfully. You can now log in with your new password.
            </Text>
            
            <Pressable
              onPress={() => router.replace('/login')}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Continue to Login</Text>
            </Pressable>
          </MotiView>
        );
        
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ImageBackground
        source={posterImages[0]} // Using first poster
        resizeMode="cover"
        style={styles.backgroundImage}
      >
        <View style={styles.overlay}>
          <SafeAreaView style={styles.safeArea}>
            <ScrollView 
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
            {/* Header with back button */}
            <View style={styles.header}>
              <TouchableOpacity onPress={goBack} style={styles.backButton}>
                <ArrowLeft size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Forgot Password</Text>
              <View style={styles.placeholder} />
            </View>
            
            {/* Progress indicator */}
            {step < 4 && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${(step / 3) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>Step {step} of 3</Text>
              </View>
            )}
            
            {/* Error message */}
            {error ? (
              <MotiView
                from={{ opacity: 0, translateY: -10 }}
                animate={{ opacity: 1, translateY: 0 }}
                style={styles.errorContainer}
              >
                <AlertCircle size={16} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </MotiView>
            ) : null}
            
            {/* Step content */}
            <View style={styles.content}>
              {getStepContent()}
            </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    marginVertical: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  stepContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  passwordInputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  button: {
    width: '100%',
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#10b981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resendButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  resendText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  passwordRequirements: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  otpContainer: {
    marginTop: 15,
    alignItems: 'center',
    width: '100%',
  },
});