import React from 'react';
import { View, Text, Pressable } from 'react-native';

// Supports selecting ratings in 0.5 increments
const StarRating = ({ rating = 0, setRating }) => {
  const displayValue = rating || 0;

  const handlePress = (evt, index, width) => {
    if (!setRating) return;
    
    // Get X position of the touch relative to the star component
    const locationX = evt.nativeEvent.locationX;
    
    // If touched on the left half (less than 50% width), it's a half star
    const isHalf = locationX < (width / 2);
    const value = index + (isHalf ? 0.5 : 1);
    
    setRating(value);
  };

  return (
    <View className="flex-row items-center gap-1">
      {[0, 1, 2, 3, 4].map((index) => {
        const val = displayValue - index;
        const pct = Math.max(0, Math.min(100, val * 100)); // 0..100
        
        return (
          <Pressable
            key={index}
            onPress={(e) => {
              // We estimate the star width to be around 30px based on text-3xl
              // For precision, one might use onLayout, but this is usually sufficient for icons
              handlePress(e, index, 30); 
            }}
            className="relative justify-center items-center h-8 w-8"
            accessibilityLabel={`Rate ${index + 1} stars`}
          >
            {/* Background Gray Star */}
            <Text className="text-3xl text-gray-500 font-bold leading-none">
              ★
            </Text>
            
            {/* Foreground Yellow Star (Clipped) */}
            <View 
              className="absolute top-0 left-0 h-full overflow-hidden justify-center"
              style={{ width: `${pct}%` }}
              pointerEvents="none" // Pass touches through to the parent Pressable
            >
               <Text className="text-3xl text-yellow-400 font-bold leading-none">
                ★
               </Text>
            </View>
          </Pressable>
        );
      })}
      
      <Text className="ml-2 text-sm font-semibold text-gray-100">
        {(Number(displayValue) || 0).toFixed(1)}
      </Text>
    </View>
  );
};

export default StarRating;