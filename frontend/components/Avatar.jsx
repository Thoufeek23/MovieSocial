import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Avatar = ({ 
  user, 
  size = 40, 
  showOnline = false, 
  style = {} 
}) => {
  const hasProfilePicture = user?.profilePicture;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {hasProfilePicture ? (
        <Image 
          source={{ uri: user.profilePicture }} 
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
          resizeMode="cover"
        />
      ) : (
        <Image 
          source={require('../assets/images/default_dp.png')} 
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
          resizeMode="cover"
        />
      )}
      
      {showOnline && (
        <View style={[styles.onlineIndicator, { 
          width: size * 0.25, 
          height: size * 0.25, 
          borderRadius: size * 0.125,
          bottom: -2,
          right: -2,
        }]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    backgroundColor: '#374151',
  },
  onlineIndicator: {
    position: 'absolute',
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: 'white',
  },
});

export default Avatar;