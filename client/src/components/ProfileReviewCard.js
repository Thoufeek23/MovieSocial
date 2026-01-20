import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, ThumbsUp, Edit2, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const ProfileReviewCard = ({ review, onEdit, onDelete }) => {
    const { user } = useContext(AuthContext);
    
    // State matching ReviewCard.js structure
    const [agreement, setAgreement] = useState({ average: null, totalVotes: 0 });
    const [isExpanded, setIsExpanded] = useState(false);

    // Derived state
    const isOwnReview = user && (review.user?._id === user.id || review.user?._id === user._id);

    // --- LOGIC COPIED FROM ReviewCard.js ---
    // This ensures calculations are identical (handling 0.5/Partial votes correctly)
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
    // ---------------------------------------

    // Helper to render stars
    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <Star
                key={i}
                size={14}
                className={`${i < Math.round(rating) ? 'text-yellow-500 fill-current' : 'text-gray-600'}`}
            />
        ));
    };

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 mb-3 shadow-sm hover:border-gray-600 transition-all">
            {/* Compact Header: Movie Info & Rating */}
            <div className="flex gap-3">
                {/* Movie Poster */}
                <Link to={`/movie/${review.movieId}`} className="flex-shrink-0">
                    <img
                        src={review.moviePoster ? `https://image.tmdb.org/t/p/w92${review.moviePoster}` : '/default_poster.png'}
                        alt={review.movieTitle}
                        className="w-12 h-18 object-cover rounded shadow-md"
                    />
                </Link>

                {/* Right Side: Title, Stats, Actions */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">

                    {/* Top Row: Title & Actions */}
                    <div className="flex justify-between items-start">
                        <Link to={`/movie/${review.movieId}`} className="font-bold text-gray-200 hover:text-green-400 truncate pr-2 text-sm">
                            {review.movieTitle}
                        </Link>
                        
                        {/* Edit/Delete Buttons (Only visible if it's your review) */}
                        {isOwnReview && (
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={(e) => onEdit(review, e)} 
                                    className="text-gray-400 hover:text-white transition-colors"
                                    title="Edit Review"
                                >
                                    <Edit2 size={12} />
                                </button>
                                <button 
                                    onClick={() => onDelete(review._id)} 
                                    className="text-gray-400 hover:text-red-400 transition-colors"
                                    title="Delete Review"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Stats Row: Stars & Agreement */}
                    <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-0.5">
                            {renderStars(review.rating)}
                        </div>

                        {/* Community Agreement Badge */}
                        <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-700/50 px-2 py-0.5 rounded-full" title="Community Agreement">
                            <ThumbsUp size={10} className={agreement.totalVotes > 0 ? "text-blue-400" : "text-gray-500"} />
                            <span>
                                {agreement.average === null ? '0%' : `${agreement.average}%`} ({agreement.totalVotes})
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toggle Arrow */}
            <div className="flex justify-center -mb-2 mt-1">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-1 text-gray-500 hover:text-green-400 transition-colors w-full flex justify-center active:scale-95"
                >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
            </div>

            {/* Collapsible Review Text */}
            {isExpanded && (
                <div className="mt-2 pt-2 border-t border-gray-700 text-gray-300 text-sm leading-relaxed animate-in fade-in slide-in-from-top-2 duration-200">
                    {review.text}
                </div>
            )}
        </div>
    );
};

export default ProfileReviewCard;