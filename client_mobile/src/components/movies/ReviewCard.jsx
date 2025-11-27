import React, { useContext, useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Share, ScrollView, Alert } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { AuthContext } from '../../context/AuthContext';
import * as api from '../../api';

// Note: Ensure this file exists or mock it
// import BADGE_MAP from '../../data/badges'; 
const BADGE_MAP = {}; // Fallback mock if file is missing

const DisplayStars = ({ rating = 0 }) => {
  const r = Number(rating) || 0;
  const value = Math.max(0, Math.min(5, r));

  return (
    <View className="flex-row">
      {[0, 1, 2, 3, 4].map((idx) => {
        const val = value - idx; 
        const pct = Math.max(0, Math.min(100, Math.round(val * 100))); 
        
        return (
          <View key={idx} className="relative w-4 h-4 mr-0.5">
            <Text className="text-gray-600 text-sm absolute">★</Text>
            <View style={{ width: `${pct}%`, overflow: 'hidden', height: '100%' }}>
               <Text className="text-yellow-400 text-sm">★</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const ReviewCard = ({ review, onEdit, onDelete }) => {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const [agreement, setAgreement] = useState({ average: null, totalVotes: 0 });
  const [myVote, setMyVote] = useState(null);
  const [fetchedBadges, setFetchedBadges] = useState(null);

  const isAuthor = !!user && !!review?.user && (
    String(user.id) === String(review.user._id) ||
    String(user._id) === String(review.user._id)
  );

  const canModify = isAuthor && (typeof onEdit === 'function' || typeof onDelete === 'function');
  const IMG_BASE_URL = 'https://image.tmdb.org/t/p/w200';

  useEffect(() => {
    const votes = (review.agreementVotes || []);
    if (votes.length === 0) {
      setAgreement({ average: null, totalVotes: 0 });
      setMyVote(null);
      return;
    }
    const sum = votes.reduce((s, v) => s + (Number(v.value) || 0), 0);
    const avg = Math.round((sum / votes.length) * 100);
    setAgreement({ average: avg, totalVotes: votes.length });
    if (user) {
      const mine = votes.find(v => String(v.user) === String(user.id) || String(v.user) === String(user._id));
      setMyVote(mine ? Number(mine.value) : null);
    }
  }, [review.agreementVotes, user]);

  useEffect(() => {
    let mounted = true;
    const ensureBadges = async () => {
      try {
        if (!review?.user || (review.user.badges && review.user.badges.length > 0)) return;
        const res = await api.getUserProfile(review.user.username);
        if (!mounted) return;
        setFetchedBadges(res.data.badges || []);
      } catch (e) {
        // silent fail
      }
    };
    ensureBadges();
    return () => { mounted = false; };
  }, [review.user]);

  const handleVote = async (value) => {
    if (!user) return; 
    try {
      const res = await api.voteReview(review._id, value);
      const updated = res.data || res;
      if (updated && updated.agreementVotes) {
        // Update local state directly to reflect change
        const votes = updated.agreementVotes;
        const sum = votes.reduce((s, v) => s + (Number(v.value) || 0), 0);
        const avg = Math.round((sum / votes.length) * 100);
        setAgreement({ average: avg, totalVotes: votes.length });
        const mine = votes.find(v => String(v.user) === String(user.id) || String(v.user) === String(user._id));
        setMyVote(mine ? Number(mine.value) : null);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to vote on review");
    }
  };

  const handleShare = async () => {
    try {
      const authorName = review.user ? review.user.username : 'Unknown User';
      // Note: Deep linking URL scheme might differ in production
      const shareUrl = `https://moviesocial.com/movie/${review.movieId}`; 
      const message = `Check out ${authorName}'s review of ${review.movieTitle}:\n\n"${review.text.substring(0, 100)}..."\n\n${shareUrl}`;
      
      await Share.share({
        message,
        url: shareUrl, // iOS only
        title: `Review of ${review.movieTitle}` // Android only
      });
    } catch (error) {
      console.error(error.message);
    }
  };

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card p-4 rounded-lg border border-border mb-4 shadow-sm"
    >
      <View className="flex-row gap-4">
        <Link href={`/movie/${review.movieId}`} asChild>
          <TouchableOpacity>
            <Image
              source={{ uri: `${IMG_BASE_URL}${review.moviePoster}` }}
              className="w-20 h-28 rounded-md bg-zinc-800"
              resizeMode="cover"
            />
          </TouchableOpacity>
        </Link>
        
        <View className="flex-1">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="text-lg font-bold text-foreground mb-1" numberOfLines={1}>
                {review.movieTitle}
              </Text>
              
              <View className="flex-row items-center gap-2 mb-2 flex-wrap">
                {review.rating > 0 && <DisplayStars rating={review.rating} />}
                <Text className="text-xs text-gray-400">by</Text>
                
                {review.user ? (
                   <Link href={`/profile/${review.user.username}`} asChild>
                     <TouchableOpacity>
                       <Text className="text-xs font-bold text-primary">{review.user.username}</Text>
                     </TouchableOpacity>
                   </Link>
                ) : (
                   <Text className="text-xs italic text-gray-500">Deleted User</Text>
                )}

                {/* Badge Display */}
                {((review.user?.badges?.length > 0) || (fetchedBadges?.length > 0)) && (
                   <View className="bg-zinc-800 px-1.5 py-0.5 rounded">
                      <Text className="text-[10px] text-gray-300 font-bold uppercase">
                        {(review.user?.badges?.[0]?.name || fetchedBadges?.[0]?.name || '').replace(/_/g, ' ')}
                      </Text>
                   </View>
                )}
              </View>
            </View>

            <View className="flex-row gap-2">
              <TouchableOpacity onPress={handleShare}>
                <Feather name="share-2" size={18} color="#9ca3af" />
              </TouchableOpacity>
              
              {canModify && (
                <>
                  <TouchableOpacity onPress={(e) => onEdit && onEdit(review)}>
                    <Feather name="edit-2" size={18} color="#9ca3af" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onDelete && onDelete(review._id)}>
                    <Feather name="trash-2" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
          
          <Text className="text-gray-300 italic text-sm leading-5 mb-3">
            "{review.text}"
          </Text>

          <View className="flex-row items-center gap-2 mb-3">
            <Text className="text-xs text-gray-400">Community agreement:</Text>
            <Text className="text-xs font-bold text-green-400">
               {agreement.average === null ? 'No votes' : `${agreement.average}%`}
            </Text>
            <Text className="text-[10px] text-gray-500">({agreement.totalVotes})</Text>
          </View>

          <View className="flex-row gap-2">
            <TouchableOpacity 
              onPress={() => handleVote(1)} 
              className={`flex-1 py-1.5 rounded items-center ${myVote===1 ? 'bg-green-600' : 'bg-zinc-700'}`}
            >
              <Text className="text-xs text-white font-medium">Agree</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => handleVote(0.5)} 
              className={`flex-1 py-1.5 rounded items-center ${myVote===0.5 ? 'bg-yellow-600' : 'bg-zinc-700'}`}
            >
              <Text className="text-xs text-white font-medium">Partial</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => handleVote(0)} 
              className={`flex-1 py-1.5 rounded items-center ${myVote===0 ? 'bg-red-600' : 'bg-zinc-700'}`}
            >
              <Text className="text-xs text-white font-medium">Disagree</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </MotiView>
  );
};

export default ReviewCard;