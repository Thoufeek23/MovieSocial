// frontend/components/AuthInput.jsx

import { View, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const AuthInput = ({ icon, placeholder, value, onChangeText, isPassword = false }) => {
  return (
    <View className="bg-card h-14 rounded-xl flex-row items-center px-4 mb-4">
      <Ionicons name={icon} size={22} color="#a1a1aa" /> 
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#a1a1aa" // zinc-400
        className="text-foreground text-base ml-3 flex-1"
        secureTextEntry={isPassword}
        autoCapitalize="none"
      />
    </View>
  );
};