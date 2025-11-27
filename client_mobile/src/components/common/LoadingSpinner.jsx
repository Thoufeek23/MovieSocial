import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Image } from 'react-native';

const LoadingSpinner = ({ 
  size = 'large',
  color = '#10b981',
  text = '',
  style = {},
  animationType = 'rotate' // 'rotate', 'pulse', 'float', 'bounce'
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  const iconSize = size === 'large' ? 60 : size === 'small' ? 30 : 45;

  useEffect(() => {
    const startAnimations = () => {
      // Rotation animation
      if (animationType === 'rotate' || animationType === 'float') {
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ).start();
      }

      // Pulse animation
      if (animationType === 'pulse') {
        Animated.loop(
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.2,
              duration: 800,
              easing: Easing.ease,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 800,
              easing: Easing.ease,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }

      // Float animation
      if (animationType === 'float') {
        Animated.loop(
          Animated.sequence([
            Animated.timing(translateAnim, {
              toValue: -10,
              duration: 1500,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(translateAnim, {
              toValue: 10,
              duration: 1500,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        ).start();
      }

      // Bounce animation
      if (animationType === 'bounce') {
        Animated.loop(
          Animated.sequence([
            Animated.timing(translateAnim, {
              toValue: -20,
              duration: 600,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(translateAnim, {
              toValue: 0,
              duration: 600,
              easing: Easing.bounce,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }

      // Opacity pulse for all animations
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.3,
            duration: 1000,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startAnimations();
  }, [animationType]);

  const getAnimatedStyle = () => {
    const rotation = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    let baseStyle = {
      opacity: opacityAnim,
    };

    switch (animationType) {
      case 'rotate':
        return {
          ...baseStyle,
          transform: [{ rotate: rotation }],
        };
      case 'pulse':
        return {
          ...baseStyle,
          transform: [{ scale: scaleAnim }],
        };
      case 'float':
        return {
          ...baseStyle,
          transform: [
            { rotate: rotation },
            { translateY: translateAnim },
          ],
        };
      case 'bounce':
        return {
          ...baseStyle,
          transform: [{ translateY: translateAnim }],
        };
      default:
        return baseStyle;
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <Animated.View style={getAnimatedStyle()}>
          <Image 
            // Fallback to the main app icon if specific asset is missing
            source={require('../../../assets/icon.png')}
            style={[
              styles.icon, 
              { 
                width: iconSize, 
                height: iconSize,
              }
            ]}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
      {text ? (
        <Animated.Text style={[styles.text, { opacity: opacityAnim }]}>
          {text}
        </Animated.Text>
      ) : null}
      
      {/* Decorative dots animation */}
      <View style={styles.dotsContainer}>
        {[0, 1, 2].map((index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                opacity: opacityAnim,
                transform: [
                  {
                    scale: scaleAnim.interpolate({
                      inputRange: [1, 1.2],
                      outputRange: [0.5 + index * 0.2, 1 + index * 0.1],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  iconContainer: {
    marginBottom: 16,
    shadowColor: '#10b981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    borderRadius: 8,
  },
  text: {
    marginTop: 12,
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontWeight: '500',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginHorizontal: 4,
  },
});

export default LoadingSpinner;