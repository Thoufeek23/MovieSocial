import React from 'react';
import { View, Text, TouchableOpacity, Image, Pressable } from 'react-native';
import { Link, useRouter } from 'expo-router';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
// CHANGED: Corrected import path from '../api' to '../../api'
import * as api from '../../api';
import { Ionicons } from '@expo/vector-icons'; 

const MovieCard = ({ movie, showDelete = false, onDelete, onClick, disabledLink = false }) => {
  const router = useRouter();
  const IMG_BASE_URL = 'https://image.tmdb.org/t/p/w342';

  const getRatingColor = (rating) => {
    if (rating >= 7) return '#10b981'; // emerald-500
    if (rating >= 5) return '#eab308'; // yellow-500
    return '#ef4444'; // red-500
  };

  const handlePress = () => {
    if (onClick) {
      onClick(movie);
    } else if (!disabledLink) {
      router.push(`/movie/${movie.id}`);
    }
  };

  const RatingCircle = ({ rating }) => {
    const radius = 14;
    const strokeWidth = 2.5;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (rating / 10) * circumference;
    const color = getRatingColor(rating);

    return (
      <View className="absolute top-1 right-1 bg-black/60 rounded-full w-9 h-9 items-center justify-center">
        <Svg height="36" width="36" viewBox="0 0 36 36">
          <Circle
            cx="18"
            cy="18"
            r={radius}
            stroke="#374151"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <Circle
            cx="18"
            cy="18"
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin="18, 18"
          />
          <SvgText
            x="18"
            y="22" // Adjusted for vertical centering
            fontSize="10"
            fontWeight="bold"
            fill="white"
            textAnchor="middle"
          >
            {rating.toFixed(1)}
          </SvgText>
        </Svg>
      </View>
    );
  };

  return (
    <Pressable 
      onPress={handlePress}
      className="w-[160px] bg-card rounded-xl overflow-hidden shadow-sm border border-white/5 mb-4"
    >
      <View className="relative">
        <Image
          source={{ 
            uri: movie.poster_path 
              ? `${IMG_BASE_URL}${movie.poster_path}` 
              : 'https://via.placeholder.com/342x513?text=No+Poster'
          }}
          className="w-full h-[240px] bg-zinc-800"
          resizeMode="cover"
        />
        
        {/* Rating Badge */}
        {movie.vote_average > 0 && <RatingCircle rating={movie.vote_average} />}

        {/* Delete Button (Optional) */}
        {showDelete && (
          <TouchableOpacity 
            onPress={(e) => {
              e.stopPropagation(); // Prevent card click
              onDelete(movie.id);
            }}
            className="absolute top-1 left-1 bg-red-500/90 w-8 h-8 rounded-full items-center justify-center z-10"
          >
            <Ionicons name="trash-outline" size={18} color="white" />
          </TouchableOpacity>
        )}
      </View>

      <View className="p-3">
        <Text 
          className="text-white font-bold text-sm leading-5" 
          numberOfLines={2}
        >
          {movie.title}
        </Text>
        {movie.release_date && (
          <Text className="text-gray-400 text-xs mt-1">
            {new Date(movie.release_date).getFullYear()}
          </Text>
        )}
      </View>
    </Pressable>
  );
};

export default MovieCard;