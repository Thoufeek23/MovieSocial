import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Image,
  ImageBackground, 
  KeyboardAvoidingView, 
  Platform, 
  Pressable,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { MotiView } from 'moti';

// CHANGED: Fixed imports to point to correct src location
import { useAuth } from '../../src/context/AuthContext';
import * as api from '../../src/api';
import { AuthInput } from '../../src/components/auth/AuthInput'; 
import { OTPInput } from '../../src/components/auth/OTPInput';

export default function SignupPage() {
  const [formData, setFormData] = useState({ 
    name: '', age: '', username: '', email: '', password: '', confirmPassword: '', country: '', state: '' 
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [signupStep, setSignupStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [passwordChecks, setPasswordChecks] = useState({ length: false, upper: false, lower: false, number: false, special: false });
  
  const { login } = useAuth();
  const staticPoster = require('../../assets/images/poster1.png');

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (error) setError('');
    if (field === 'password') {
      setPasswordChecks({
        length: value.length >= 8,
        upper: /[A-Z]/.test(value),
        lower: /[a-z]/.test(value),
        number: /\d/.test(value),
        special: /[\W_]/.test(value),
      });
    }
  };
  
  // Logic handlers (placeholders based on your existing code)
  const handleSubmit = async () => { 
    // Add your signup API logic here
    setSignupStep(2); 
  };
  
  const handleVerifyOtp = async () => { 
    // Add your OTP verification logic here
    setSignupStep(3); 
  };
  
  const handleCompleteSignup = async () => { 
    // Add your completion logic here
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      className="flex-1"
    >
      <ImageBackground 
        source={staticPoster} 
        resizeMode="cover" 
        className="flex-1 w-full h-full"
      >
        <View className="flex-1 bg-black/75">
          <SafeAreaView className="flex-1">
            <MotiView 
              from={{ opacity: 0, translateY: 30 }} 
              animate={{ opacity: 1, translateY: 0 }} 
              transition={{ type: 'timing', duration: 800, delay: 300 }} 
              className="items-center mt-5 mb-5"
            >
              <View className="items-center">
                {/* Ensure this image exists, or remove/replace if causing errors */}
                 <Text className="text-4xl font-bold text-emerald-500 tracking-tighter">
                  MovieSocial
                </Text>
              </View>
            </MotiView>

            <ScrollView 
              className="flex-1 px-5" 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              <MotiView 
                from={{ opacity: 0, translateY: 20 }} 
                animate={{ opacity: 1, translateY: 0 }} 
                transition={{ type: 'timing', duration: 800, delay: 500 }} 
                className="bg-white/5 p-5 rounded-3xl border border-white/10 mb-10"
              >
                <Text className="text-3xl font-bold text-white text-center mb-2">
                  Create Account
                </Text>
                <Text className="text-base text-gray-300 text-center mb-5">
                  Join the community and start sharing.
                </Text>

                {error && (
                  <MotiView 
                    from={{ opacity: 0, scale: 0.9 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    className="bg-red-500/20 border border-red-500 p-3 rounded-xl mb-4"
                  >
                    <Text className="text-red-200 text-center font-medium">
                      {error}
                    </Text>
                  </MotiView>
                )}

                {signupStep === 1 && (
                  <View className="mb-2.5">
                    {/* CHANGED: Replaced FloatingLabelInput with AuthInput */}
                    
                    <AuthInput 
                      icon="person-outline" 
                      placeholder="Full Name" 
                      value={formData.name} 
                      onChangeText={(v) => handleChange('name', v)} 
                    />
                    
                    <AuthInput 
                      icon="calendar-number-outline" 
                      placeholder="Age" 
                      value={formData.age} 
                      onChangeText={(v) => handleChange('age', v)} 
                      keyboardType="numeric" 
                    />
                    
                    <AuthInput 
                      icon="at-outline" 
                      placeholder="Username" 
                      value={formData.username} 
                      onChangeText={(v) => handleChange('username', v)} 
                      autoCapitalize="none" 
                    />
                    
                    <AuthInput 
                      icon="mail-outline" 
                      placeholder="Email" 
                      value={formData.email} 
                      onChangeText={(v) => handleChange('email', v)} 
                      keyboardType="email-address"
                    />
                    
                    <AuthInput 
                      icon="lock-closed-outline" 
                      placeholder="Password" 
                      value={formData.password} 
                      onChangeText={(v) => handleChange('password', v)} 
                      isPassword={true} 
                    />
                    
                    <View className="mt-2 pl-1.5 mb-4">
                      {['length', 'upper', 'lower', 'number', 'special'].map(check => (
                         <Text 
                           key={check} 
                           className={`text-xs mb-0.5 ${passwordChecks[check] ? 'text-emerald-500' : 'text-gray-500'}`}
                         >
                           {passwordChecks[check] ? '✓' : '•'} {check === 'length' ? 'Min 8 chars' : check}
                         </Text>
                      ))}
                    </View>
                    
                    <AuthInput 
                      icon="lock-closed-outline" 
                      placeholder="Confirm Password" 
                      value={formData.confirmPassword} 
                      onChangeText={(v) => handleChange('confirmPassword', v)} 
                      isPassword={true} 
                    />

                    <Pressable 
                      onPress={handleSubmit} 
                      disabled={isLoading} 
                      className={`w-full py-4 rounded-xl items-center justify-center mt-2.5 shadow-lg shadow-emerald-500/30 ${isLoading ? 'bg-gray-500' : 'bg-emerald-500'}`}
                    >
                      <Text className="text-white text-base font-bold">
                        {isLoading ? 'Sending OTP...' : 'Sign Up'}
                      </Text>
                    </Pressable>
                  </View>
                )}

                {signupStep === 2 && (
                  <View className="items-center mb-5">
                    <Text className="text-base text-gray-300 text-center mb-5">
                      Enter OTP sent to {formData.email}
                    </Text>
                    <OTPInput 
                      length={6} 
                      value={otp} 
                      onChangeText={setOtp} 
                      onComplete={(code) => { 
                        setOtp(code); 
                        if (code.length === 6) setTimeout(handleVerifyOtp, 500); 
                      }} 
                    />
                    <View className="flex-row gap-2.5 mt-5 w-full">
                      <Pressable onPress={() => setSignupStep(1)} className="p-2.5"><Text className="text-white">Back</Text></Pressable>
                      <Pressable onPress={handleVerifyOtp} disabled={isLoading} className="flex-1 bg-emerald-500 py-3 rounded-xl items-center justify-center">
                        <Text className="text-white font-bold">Verify</Text>
                      </Pressable>
                    </View>
                  </View>
                )}

                {signupStep === 3 && (
                  <View className="items-center mb-5">
                     <Text className="text-base text-gray-300 text-center mb-5">Verification successful!</Text>
                     <Pressable onPress={handleCompleteSignup} disabled={isLoading} className="w-full bg-emerald-500 py-4 rounded-xl items-center justify-center">
                        <Text className="text-white font-bold">{isLoading ? 'Completing...' : 'Complete Signup'}</Text>
                     </Pressable>
                  </View>
                )}

                <View className="items-center mt-5">
                  <View className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <View className="flex-row items-center">
                      <Text className="text-gray-100 text-base">Already have an account? </Text>
                      <Link href="/login" asChild>
                        <TouchableOpacity><Text className="text-emerald-500 font-bold">Log In</Text></TouchableOpacity>
                      </Link>
                    </View>
                  </View>
                </View>

              </MotiView>
            </ScrollView>
          </SafeAreaView>
        </View>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}