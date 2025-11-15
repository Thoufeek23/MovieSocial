import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DisplayStars = ({ rating = 0, size = 16, color = '#fbbf24' }) => {
  const r = Number(rating) || 0;
  const value = Math.max(0, Math.min(5, r));

  return (
    <View style={styles.container}>
      {[0, 1, 2, 3, 4].map((idx) => {
        const val = value - idx;
        const filled = val >= 1;
        const halfFilled = val >= 0.5 && val < 1;
        
        return (
          <View key={idx} style={styles.starContainer}>
            <Ionicons 
              name={filled ? "star" : halfFilled ? "star-half" : "star-outline"} 
              size={size} 
              color={filled || halfFilled ? color : '#6b7280'} 
            />
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starContainer: {
    marginRight: 2,
  },
});

export default DisplayStars;