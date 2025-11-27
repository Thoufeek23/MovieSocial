import React from 'react';
import { Text, ActivityIndicator } from 'react-native';
import { MotiPressable } from 'moti/interactions';

export const AuthButton = ({ title, onPress, isLoading = false }) => {
  return (
    <MotiPressable
      onPress={onPress}
      disabled={isLoading}
      // Add a nice press-down animation
      animate={({ pressed }) => {
        'worklet';
        return {
          scale: pressed ? 0.98 : 1,
          opacity: pressed ? 0.9 : 1,
        };
      }}
      className={`
        bg-primary h-12 rounded-full flex-row items-center justify-center
        ${isLoading ? 'opacity-70' : ''}
      `}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#fafafa" /> // foreground color
      ) : (
        <Text className="text-primary-foreground text-lg font-bold">
          {title}
        </Text>
      )}
    </MotiPressable>
  );
};