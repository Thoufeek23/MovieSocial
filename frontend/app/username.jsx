import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Image,
  ImageBackground, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';

import { useAuth } from '../src/context/AuthContext';
import * as api from '../src/api';

export default function UsernamePage() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(null);
  const { user, setUser } = useAuth();
  const router = useRouter();

  const staticPoster = require('../assets/images/poster1.png');

  const checkUsernameAvailability = async (value) => {
    if (!value || value.trim().length < 5 || value.trim().length > 20) {
      setIsAvailable(null);
      return;
    }

    setIsChecking(true);
    try {
      const res = await api.checkUsername(value.trim());
      setIsAvailable(res.data.available);
    } catch (err) {
      console.error('Error checking username:', err);
    } finally {
      setIsChecking(false);
    }
  };

  const handleChange = (value) => {
    setUsername(value);
    setError('');
    
    // Debounce the availability check
    const timer = setTimeout(() => {
      checkUsernameAvailability(value);
    }, 500);

    return () => clearTimeout(timer);
  };

  const handleSubmit = async () => {
    setError('');

    // Validations
    if (!username.trim()) {
      setError('Please enter a username.');
      return;
    }

    if (username.trim().length < 5) {
      setError('Username must be at least 5 characters.');
      return;
    }

    if (username.trim().length > 20) {
      setError('Username cannot be more than 20 characters.');
      return;
    }

    if (isAvailable === false) {
      setError('This username is already taken.');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await api.updateUsername(username.trim());
      // Update user context with new username
      setUser({ ...user, username: data.username });
      // Navigate to interests
      router.push('/interests');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to set username.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ImageBackground
        source={staticPoster}
        resizeMode="cover"
        style={styles.backgroundImage}
      >
        <View style={styles.overlay}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.content}>
              {/* Header */}
              <MotiView
                from={{ opacity: 0, translateY: 30 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 800, delay: 300 }}
                style={styles.headerSection}
              >
                <View style={styles.logoContainer}>
                  <Image 
                    source={require('../assets/images/MS_logo.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
              </MotiView>

              {/* Form Card */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 800, delay: 500 }}
                style={styles.formCard}
              >
                <Text style={styles.title}>Choose Your Username</Text>
                <Text style={styles.subtitle}>
                  Pick a unique username to identify yourself in the community.
                </Text>

                {error && (
                  <MotiView
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={styles.errorContainer}
                  >
                    <Text style={styles.errorText}>{error}</Text>
                  </MotiView>
                )}

                {/* Username Input */}
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={handleChange}
                    placeholder="Username"
                    placeholderTextColor="#9CA3AF"
                    editable={!isLoading}
                  />
                  {isChecking && (
                    <View style={styles.iconContainer}>
                      <ActivityIndicator size="small" color="#A855F7" />
                    </View>
                  )}
                  {!isChecking && isAvailable === true && username.length >= 5 && (
                    <View style={[styles.iconContainer, styles.successIcon]}>
                      <Text style={styles.checkmark}>✓</Text>
                    </View>
                  )}
                  {!isChecking && isAvailable === false && username.length >= 5 && (
                    <View style={[styles.iconContainer, styles.errorIcon]}>
                      <Text style={styles.cross}>✕</Text>
                    </View>
                  )}
                </View>

                {/* Requirements */}
                <View style={styles.requirementsContainer}>
                  <Text style={[
                    styles.requirementText,
                    username.trim().length >= 5 && username.trim().length <= 20 && styles.requirementMet
                  ]}>
                    • Must be 5-20 characters
                  </Text>
                  <Text style={[
                    styles.requirementText,
                    isAvailable === true && styles.requirementMet,
                    isAvailable === false && styles.requirementFailed
                  ]}>
                    • Must be unique
                  </Text>
                </View>

                {/* Continue Button */}
                <TouchableOpacity
                  style={[
                    styles.button,
                    (isLoading || isChecking || isAvailable === false || username.trim().length < 5) && styles.buttonDisabled
                  ]}
                  onPress={handleSubmit}
                  disabled={isLoading || isChecking || isAvailable === false || username.trim().length < 5}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Continue</Text>
                  )}
                </TouchableOpacity>
              </MotiView>
            </View>
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
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 180,
    height: 60,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  formCard: {
    backgroundColor: 'rgba(31, 41, 55, 0.95)',
    borderRadius: 16,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 24,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#FCA5A5',
    textAlign: 'center',
    fontWeight: '600',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    paddingRight: 48,
  },
  iconContainer: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    backgroundColor: '#10B981',
  },
  errorIcon: {
    backgroundColor: '#EF4444',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cross: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  requirementsContainer: {
    marginBottom: 24,
  },
  requirementText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  requirementMet: {
    color: '#10B981',
  },
  requirementFailed: {
    color: '#EF4444',
  },
  button: {
    backgroundColor: '#A855F7',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
