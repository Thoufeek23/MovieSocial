import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

export const OTPInput = ({ length = 6, onComplete, value = '', onChangeText }) => {
  const [otp, setOtp] = useState(value.split(''));
  const inputRefs = useRef([]);

  // Update local state when prop changes
  useEffect(() => {
    setOtp(value.split(''));
  }, [value]);

  const handleTextChange = (text, index) => {
    const newOtp = [...otp];
    
    // Handle pasted content
    if (text.length > 1) {
      const pastedText = text.slice(0, length);
      for (let i = 0; i < length; i++) {
        newOtp[i] = pastedText[i] || '';
      }
      setOtp(newOtp);
      onChangeText?.(newOtp.join(''));
      
      // Focus the next empty field or the last field
      const nextIndex = Math.min(pastedText.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
      
      if (newOtp.join('').length === length) {
        onComplete?.(newOtp.join(''));
      }
      return;
    }

    // Handle single character input
    newOtp[index] = text;
    setOtp(newOtp);
    onChangeText?.(newOtp.join(''));

    // Auto-focus next input
    if (text && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Call onComplete when all digits are filled
    if (newOtp.join('').length === length) {
      onComplete?.(newOtp.join(''));
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length }, (_, index) => (
        <TextInput
          key={index}
          ref={(ref) => (inputRefs.current[index] = ref)}
          style={[
            styles.input,
            otp[index] ? styles.inputFilled : styles.inputEmpty
          ]}
          value={otp[index] || ''}
          onChangeText={(text) => handleTextChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          keyboardType="numeric"
          maxLength={1}
          textAlign="center"
          placeholderTextColor="#6b7280"
          selectionColor="#10b981"
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
    gap: 8, // Added gap for better spacing on wider screens
  },
  input: {
    width: 45,
    height: 55,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  inputEmpty: {
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  inputFilled: {
    borderColor: '#10b981', // Emerald-500
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
});