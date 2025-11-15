// frontend/components/FloatingLabelInput.jsx

import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Eye, EyeOff } from 'lucide-react-native';

export const FloatingLabelInput = ({ 
  label, 
  value, 
  onChangeText, 
  isPassword = false, 
  keyboardType = 'default',
  autoCapitalize = 'none',
  ...props 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isLabelFloating = isFocused || value.length > 0;

  return (
    <View style={inputStyles.container}>
      <View style={inputStyles.inputContainer}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={[
            inputStyles.textInput,
            {
              paddingTop: isLabelFloating ? 24 : 18,
              paddingBottom: isLabelFloating ? 12 : 18,
              paddingRight: isPassword ? 55 : 18,
            }
          ]}
          placeholderTextColor="rgba(255,255,255,0.5)"
          {...props}
        />
        
        {/* Floating Label */}
        <MotiView
          animate={{
            translateY: isLabelFloating ? -22 : 18,
            translateX: 18,
            scale: isLabelFloating ? 0.85 : 1,
          }}
          transition={{
            type: 'timing',
            duration: 200,
          }}
          style={[
            inputStyles.labelContainer,
            {
              backgroundColor: isLabelFloating ? 'rgba(0,0,0,0.85)' : 'transparent',
              paddingHorizontal: isLabelFloating ? 8 : 0,
              paddingVertical: isLabelFloating ? 2 : 0,
              borderRadius: isLabelFloating ? 6 : 0,
            }
          ]}
          pointerEvents="none"
        >
          <Text 
            style={[
              inputStyles.label,
              {
                color: isFocused ? '#10b981' : '#e5e7eb',
                fontSize: isLabelFloating ? 12 : 16,
                fontWeight: isLabelFloating ? '600' : '500',
              }
            ]}
          >
            {label}
          </Text>
        </MotiView>

        {/* Focus Border */}
        {isFocused && (
          <MotiView
            from={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={inputStyles.focusBorder}
            pointerEvents="none"
          />
        )}

        {/* Password Toggle */}
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={inputStyles.passwordToggle}
          >
            {showPassword ? (
              <EyeOff size={20} color="#10b981" />
            ) : (
              <Eye size={20} color="#9ca3af" />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const inputStyles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  inputContainer: {
    position: 'relative',
    backgroundColor: 'transparent',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  textInput: {
    height: 60,
    width: '100%',
    color: 'white',
    backgroundColor: 'transparent',
    paddingHorizontal: 18,
    fontSize: 16,
    fontWeight: '500',
  },
  labelContainer: {
    position: 'absolute',
    left: 0,
    pointerEvents: 'none',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  focusBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: '#10b981',
    borderRadius: 15,
    pointerEvents: 'none',
  },
  passwordToggle: {
    position: 'absolute',
    right: 18,
    top: 0,
    height: 60,
    width: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
});