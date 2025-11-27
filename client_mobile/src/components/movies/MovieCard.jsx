import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, Pressable } from 'react-native';
import { Link, useRouter } from 'expo-router';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import * as api from '../api';
import { Ionicons } from '@expo/vector-icons'; // Using Expo built-in icons

const MovieCard = ({ movie, showDelete = false, onDelete, onClick, disabledLink = false }) => {
  const router = useRouter();
  const IMG_BASE_URL = 'https://image.tmdb.org/t/p/w500';
  
  // State to handle image loading errors
  const [imgSrc, setImgSrc] = useState(
    movie.poster_path ? { uri: `${IMG_BASE_URL}${movie.poster_path}` } : require('../../assets/images/default_dp.png')
  );

  const SocialRating = ({ movieId }) => {
    const [avg, setAvg] = useState(null);
    const [count, setCount] = useState(0);

    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const strokeWidth = 3;

    useEffect(() => {
      let mounted = true;
      (async () => {
        try {
          const res = await api.getMovieStats(movieId);
          const data = res.data || {};
          if (!mounted) return;
          if (typeof data.movieSocialRating === 'undefined' || data.movieSocialRating === null) {
            setAvg(null);
            setCount(data.reviewCount || 0);
          } else {
            setAvg(Number(data.movieSocialRating).toFixed(1));
            setCount(data.reviewCount || 0);
          }
        } catch (err) {
          console.error('Failed to load social rating', err);
        }
      })();
      return () => { mounted = false; };
    }, [movieId]);

    const progressOffset = circumference - (avg / 10) * circumference;

    return (
      <View className="mt-2 h-[44px] flex-row items-center">
        {count > 0 ? (
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 relative">
              <Svg height="40" width="40" viewBox="0 0 40 40">
                {/* Background Circle */}
                <Circle
                  cx="20"
                  cy="20"
                  r={radius}
                  fill="none"
                  stroke="#374151" // gray-700
                  strokeOpacity={0.5}
                  strokeWidth={strokeWidth}
                />
                {/* Progress Circle */}
                <Circle
                  cx="20"
                  cy="20"
                  r={radius}
                  fill="none"
                  stroke="#16a34a" // text-primary (green-600)
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={progressOffset}
                  rotation="-90"
                  origin="20, 20"
                />
                <SvgText
                  x="20"
                  y="22" // Adjusted slightly for vertical centering
                  fill="white"
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {avg}
                </SvgText>
              </Svg>
            </View>
            
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="person" size={14} color="#9ca3af" />
              <Text className="text-gray-400 text-xs font-medium">
                {count}
              </Text>
            </View>
          </View>
        ) : (
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="star-outline" size={14} color="#16a34a" />
            <Text className="text-primary text-xs font-medium italic">
              Be the first to rate
            </Text>
          </View>
        )}
      </View>
    );
  };

  const CardContent = (
    <View className="flex-1 bg-card rounded-lg overflow-hidden border border-border">
      <Image
        source={imgSrc}
        className="w-full aspect-[2/3]"
        resizeMode="cover"
        onError={() => setImgSrc(require('../../assets/images/default_dp.png'))}
      />
      
      <View className="p-3 flex-1 flex-col">
        <Text 
          numberOfLines={1} 
          className="text-foreground font-bold text-base mb-1"
        >
          {movie.title}
        </Text>
        <Text className="text-muted-foreground text-xs mb-1">
          {movie.release_date?.substring(0, 4) || '—'}
        </Text>
        
        <View className="flex-1" />
        
        {typeof movie.id !== 'undefined' && (
          <SocialRating movieId={movie.id} />
        )}
      </View>
    </View>
  );

  // If interactive (for selection modes like "Pick a Movie")
  if (onClick || disabledLink) {
    return (
      <TouchableOpacity 
        className="flex-1 m-1 relative"
        onPress={() => onClick && onClick(movie)}
        activeOpacity={0.7}
      >
        {showDelete && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              if (onDelete) onDelete();
            }}
            className="absolute top-2 right-2 z-20 bg-red-600 p-1.5 rounded-full"
          >
            <Ionicons name="close" size={16} color="white" />
          </TouchableOpacity>
        )}
        {CardContent}
      </TouchableOpacity>
    );
  }

  // Standard Link Mode
  return (
    <View className="flex-1 m-1 relative">
      {showDelete && (
        <TouchableOpacity
          onPress={(e) => {
            // e.stopPropagation() doesn't exist on all View events in RN, 
            // but since this is outside the Link, it's safe.
            if (onDelete) onDelete();
          }}
          className="absolute top-2 right-2 z-20 bg-red-600 p-1.5 rounded-full elevation-5"
        >
          <Ionicons name="close" size={16} color="white" />
        </TouchableOpacity>
      )}

      {/* asChild allows the Link to wrap the TouchableOpacity correctly */}
      <Link href={`/movie/${movie.id}`} asChild>
        <TouchableOpacity activeOpacity={0.8} className="flex-1">
          {CardContent}
        </TouchableOpacity>
      </Link>
    </View>
  );
};

export default MovieCard;