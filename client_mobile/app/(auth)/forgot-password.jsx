import React, { useState } from 'react';
import { 
  View, Text, ImageBackground, KeyboardAvoidingView, Platform, TouchableOpacity, Pressable, Dimensions, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react-native';

import * as api from '../../src/api';
import { FloatingLabelInput } from '../../components/FloatingLabelInput';
import { OTPInput } from '../../components/OTPInput';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ email: '', otp: '', newPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const posterImages = [require('../../assets/images/poster1.png')];

  // Logic handlers placeholders... (assume same as previous)
  const handleEmailSubmit = async () => { /* ... */ setStep(2); setLoading(false); };
  const handleOtpSubmit = async () => { /* ... */ setStep(3); setLoading(false); };
  const handlePasswordSubmit = async () => { /* ... */ setStep(4); setLoading(false); };
  const handleChange = (field, value) => setFormData(prev => ({...prev, [field]: value}));
  const goBack = () => step > 1 ? setStep(step - 1) : router.back();

  const renderStep = () => {
    if (step === 1) return (
      <View className="w-full">
        <Text className="text-2xl font-bold text-white text-center mb-3">Reset Password</Text>
        <Text className="text-base text-gray-400 text-center mb-8">Enter your email to receive a code.</Text>
        <FloatingLabelInput label="Email" value={formData.email} onChangeText={(v) => handleChange('email', v)} keyboardType="email-address" autoCapitalize="none" />
        <Pressable onPress={handleEmailSubmit} disabled={loading} className="w-full bg-emerald-500 py-4 rounded-2xl items-center mt-5">
          {loading ? <ActivityIndicator color="white" /> : <Text className="text-white text-lg font-bold">Send Code</Text>}
        </Pressable>
      </View>
    );
    if (step === 2) return (
      <View className="w-full items-center">
        <Text className="text-2xl font-bold text-white text-center mb-3">Enter Code</Text>
        <Text className="text-base text-gray-400 text-center mb-8">Sent to {formData.email}</Text>
        <OTPInput length={6} value={formData.otp} onChangeText={(v) => handleChange('otp', v)} onComplete={(code) => { handleChange('otp', code); if (code.length === 6) setTimeout(handleOtpSubmit, 500); }} />
        <Pressable onPress={handleOtpSubmit} disabled={loading} className="w-full bg-emerald-500 py-4 rounded-2xl items-center mt-5">
           {loading ? <ActivityIndicator color="white" /> : <Text className="text-white text-lg font-bold">Verify</Text>}
        </Pressable>
      </View>
    );
    if (step === 3) return (
      <View className="w-full">
        <Text className="text-2xl font-bold text-white text-center mb-3">New Password</Text>
        <FloatingLabelInput label="New Password" value={formData.newPassword} onChangeText={(v) => handleChange('newPassword', v)} isPassword={true} />
        <Pressable onPress={handlePasswordSubmit} disabled={loading} className="w-full bg-emerald-500 py-4 rounded-2xl items-center mt-5">
           {loading ? <ActivityIndicator color="white" /> : <Text className="text-white text-lg font-bold">Reset</Text>}
        </Pressable>
      </View>
    );
    if (step === 4) return (
      <View className="w-full items-center">
        <CheckCircle size={64} color="#10b981" />
        <Text className="text-2xl font-bold text-white text-center mt-4 mb-3">Success!</Text>
        <Pressable onPress={() => router.replace('/login')} className="w-full bg-emerald-500 py-4 rounded-2xl items-center mt-5">
          <Text className="text-white text-lg font-bold">Login</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
      <ImageBackground source={posterImages[0]} resizeMode="cover" className="flex-1 w-full h-full">
        <View className="flex-1 bg-black/75">
          <SafeAreaView className="flex-1 px-5">
            <View className="flex-row items-center justify-between py-4">
              <TouchableOpacity onPress={goBack} className="w-10 h-10 rounded-full bg-white/10 items-center justify-center">
                <ArrowLeft size={24} color="white" />
              </TouchableOpacity>
              <Text className="text-lg font-semibold text-white">Forgot Password</Text>
              <View className="w-10" />
            </View>
            {error ? (
              <View className="flex-row items-center bg-red-500/10 border border-red-500 rounded-xl p-3 mb-2.5">
                <AlertCircle size={16} color="#ef4444" />
                <Text className="text-red-500 ml-2 flex-1">{error}</Text>
              </View>
            ) : null}
            <View className="flex-1 justify-center items-center">{renderStep()}</View>
          </SafeAreaView>
        </View>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}