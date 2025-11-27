import React, { useState, useContext, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Alert } from 'react-native';
import { Link } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { AuthContext } from '../../context/AuthContext';
import * as api from '../../api';

const ProfileReviewCard = ({ review, onEdit, onDelete }) => {
    const { user } = useContext(AuthContext);
    const [agreement, setAgreement] = useState({ average: null, totalVotes: 0 });
    const [isExpanded, setIsExpanded] = useState(false);

    const isOwnReview = user && (review.user?._id === user.id || review.user?._id === user._id);

    useEffect(() => {
        const votes = (review.agreementVotes || []);
        if (votes.length === 0) {
            setAgreement({ average: null, totalVotes: 0 });
            return;
        }
        const sum = votes.reduce((s, v) => s + (Number(v.value) || 0), 0);
        const avg = Math.round((sum / votes.length) * 100);
        setAgreement({ average: avg, totalVotes: votes.length });
    }, [review.agreementVotes]);

    const renderStars = (rating) => {
        return (
            <View className="flex-row">
                {[...Array(5)].map((_, i) => (
                    <Ionicons
                        key={i}
                        name="star"
                        size={12}
                        color={i < Math.round(rating) ? '#eab308' : '#4b5563'}
                    />
                ))}
            </View>
        );
    };

    return (
        <View className="bg-card border border-border rounded-xl p-3 mb-3">
            <View className="flex-row gap-3">
                {/* Poster */}
                <Link href={`/movie/${review.movieId}`} asChild>
                    <TouchableOpacity>
                        <Image
                            source={{ uri: review.moviePoster ? `https://image.tmdb.org/t/p/w92${review.moviePoster}` : 'https://via.placeholder.com/92x138' }}
                            className="w-12 h-18 rounded bg-zinc-800"
                            resizeMode="cover"
                        />
                    </TouchableOpacity>
                </Link>

                <View className="flex-1 justify-between">
                    <View className="flex-row justify-between items-start">
                        <Link href={`/movie/${review.movieId}`} asChild>
                            <TouchableOpacity className="flex-1 pr-2">
                                <Text className="font-bold text-gray-200 text-base" numberOfLines={1}>
                                    {review.movieTitle}
                                </Text>
                            </TouchableOpacity>
                        </Link>
                        
                        {isOwnReview && (
                            <View className="flex-row gap-3">
                                <TouchableOpacity onPress={(e) => onEdit(review)}>
                                    <Feather name="edit-2" size={14} color="#9ca3af" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => onDelete(review._id)}>
                                    <Feather name="trash-2" size={14} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <View className="flex-row items-center gap-3 mt-1">
                        {renderStars(review.rating)}

                        <View className="flex-row items-center gap-1 bg-zinc-800 px-2 py-0.5 rounded-full">
                            <Feather name="thumbs-up" size={10} color={agreement.totalVotes > 0 ? "#60a5fa" : "#6b7280"} />
                            <Text className="text-xs text-gray-400">
                                {agreement.average === null ? '0%' : `${agreement.average}%`}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Expand Button */}
            <TouchableOpacity
                onPress={() => setIsExpanded(!isExpanded)}
                className="items-center py-1 mt-1"
                activeOpacity={0.7}
            >
                <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color="#6b7280" />
            </TouchableOpacity>

            {/* Review Text */}
            {isExpanded && (
                <MotiView 
                    from={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ type: 'timing', duration: 200 }}
                    className="border-t border-border mt-1 pt-2"
                >
                    <Text className="text-gray-300 text-sm leading-5">
                        {review.text}
                    </Text>
                </MotiView>
            )}
        </View>
    );
};

export default ProfileReviewCard;