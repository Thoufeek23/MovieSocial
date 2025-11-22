import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Edit, Trash2, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import BADGE_MAP from '../data/badges';
import * as api from '../api';
import ShareModal from './ShareModal';

// Display non-interactive stars supporting fractional values (e.g. 3.5).
const DisplayStars = ({ rating = 0 }) => {
  const r = Number(rating) || 0;
  const value = Math.max(0, Math.min(5, r));

  return (
    <div className="flex items-center" aria-hidden>
      {[0, 1, 2, 3, 4].map((idx) => {
        const val = value - idx; 
        const pct = Math.max(0, Math.min(100, Math.round(val * 100))); 
        const width = pct > 100 ? 100 : pct < 0 ? 0 : pct;
        return (
          <span key={idx} className="relative text-lg md:text-xl leading-none mr-1 flex-shrink-0">
            <span className="text-gray-600">★</span>
            <span
              className="absolute left-0 top-0 overflow-hidden text-yellow-400"
              style={{ width: `${width}%`, WebkitTextFillColor: 'currentColor' }}
            >
              ★
            </span>
          </span>
        );
      })}
    </div>
  );
};


const ReviewCard = ({ review, onEdit, onDelete }) => {
  const { user } = useContext(AuthContext);
  const [agreement, setAgreement] = useState({ average: null, totalVotes: 0 });
  const [myVote, setMyVote] = useState(null);
  const [fetchedBadges, setFetchedBadges] = useState(null);
  const [showShare, setShowShare] = useState(false);

  // Compare IDs as strings to avoid type mismatches (ObjectId vs string)
  const isAuthor = !!user && (
    String(user.id) === String(review.user._id) ||
    String(user._id) === String(review.user._id)
  );

  // Show modify controls if the logged-in user is the author and at least one handler is provided.
  const canModify = isAuthor && (typeof onEdit === 'function' || typeof onDelete === 'function');

  const IMG_BASE_URL = 'https://image.tmdb.org/t/p/w200';

  useEffect(() => {
    // compute local agreement summary
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
        console.debug('Could not fetch reviewer badges', e?.message || e);
      }
    };
    ensureBadges();
    return () => { mounted = false; };
  }, [review.user]);

  const handleVote = async (value) => {
    if (!user) return; 
    try {
      const res = await (await import('../api')).voteReview(review._id, value);
      const updated = res.data || res;
      if (updated && updated.agreementVotes) {
        review.agreementVotes = updated.agreementVotes;
        const votes = updated.agreementVotes;
        const sum = votes.reduce((s, v) => s + (Number(v.value) || 0), 0);
        const avg = Math.round((sum / votes.length) * 100);
        setAgreement({ average: avg, totalVotes: votes.length });
        const mine = votes.find(v => String(v.user) === String(user.id) || String(v.user) === String(user._id));
        setMyVote(mine ? Number(mine.value) : null);
      }
    } catch (err) {
      console.error('Vote failed', err);
    }
  };

  // Construct share content
  const shareUrl = `${window.location.origin}/movie/${review.movieId}`;
  const shareText = `Check out ${review.user.username}'s review of ${review.movieTitle}:\n\n"${review.text.length > 100 ? review.text.substring(0, 100) + '...' : review.text}"\n\n${shareUrl}`;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.2 } }}
        className="w-full bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col sm:flex-row gap-5 items-start"
      >
        <Link to={`/movie/${review.movieId}`}>
          <img
            src={`${IMG_BASE_URL}${review.moviePoster}`}
            alt={review.movieTitle}
            className="w-24 rounded-md hidden sm:block hover:opacity-80 transition-opacity flex-shrink-0"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg md:text-xl font-bold">
                <Link to={`/movie/${review.movieId}`} className="hover:text-green-400">{review.movieTitle}</Link>
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                {review.rating > 0 && <DisplayStars rating={review.rating} />}
                <span className="mt-1 flex items-center gap-2">
                  Reviewed by <Link to={`/profile/${review.user.username}`} className="font-semibold hover:underline">{review.user.username}</Link>
                  
                  {/* Badge display logic */}
                  {((review.user?.badges && review.user.badges.length > 0) || (fetchedBadges && fetchedBadges.length > 0)) && (() => {
                    const source = (review.user?.badges && review.user.badges.length > 0) ? review.user.badges : fetchedBadges;
                    const b = source[0];
                    const id = (b.id || b.name || '').toUpperCase();
                    let bg = 'bg-gray-800 text-gray-100';
                    if (id.includes('DIAMOND')) { bg = 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white'; }
                    else if (id.includes('GOLD')) { bg = 'bg-yellow-500 text-black'; }
                    else if (id.includes('SILVER')) { bg = 'bg-gray-400 text-black'; }
                    else if (id.includes('BRONZE')) { bg = 'bg-amber-700 text-white'; }

                    const label = (b.name || b.id || '').replace(/_/g, ' ');
                    const badgeMeta = BADGE_MAP[b.id] || null;
                    return (
                      <Link to={`/badges/${b.id}`} title={badgeMeta ? badgeMeta.title : label} className={`inline-block ${bg} px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap` }>
                        {badgeMeta ? (badgeMeta.icon ? `${badgeMeta.icon} ${badgeMeta.short || badgeMeta.title}` : (label)) : label}
                      </Link>
                    );
                  })()}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 flex-shrink-0">
              <button 
                onClick={() => setShowShare(true)} 
                className="text-gray-400 hover:text-green-400 transition-colors" 
                title="Share review"
              >
                <Share2 size={18} />
              </button>
              
              {canModify && (
                <>
                  <button onClick={(e) => onEdit ? onEdit(review, e) : null} className="text-gray-400 hover:text-white transition-colors" title="Edit review">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => onDelete ? onDelete(review._id) : null} className="text-gray-400 hover:text-red-500 transition-colors" title="Delete review">
                    <Trash2 size={18} />
                  </button>
                </>
              )}
            </div>
          </div>
          <p className="text-gray-300 italic">"{review.text}"</p>
          <div className="mt-3 flex items-center gap-3">
            <div className="text-sm text-gray-400">Community agreement:</div>
            <div className="text-sm font-semibold text-green-400">{agreement.average === null ? 'No votes' : `${agreement.average}%`}</div>
            <div className="text-xs text-gray-500">({agreement.totalVotes} votes)</div>
          </div>
          <div className="mt-2 flex flex-col sm:flex-row gap-2 items-stretch">
            <button onClick={() => handleVote(1)} className={`w-full sm:w-auto px-3 py-2 rounded text-center ${myVote===1 ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-200'}`}>Agree (100%)</button>
            <button onClick={() => handleVote(0.5)} className={`w-full sm:w-auto px-3 py-2 rounded text-center ${myVote===0.5 ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-200'}`}>Partially (50%)</button>
            <button onClick={() => handleVote(0)} className={`w-full sm:w-auto px-3 py-2 rounded text-center ${myVote===0 ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-200'}`}>Disagree (0%)</button>
          </div>
        </div>
      </motion.div>

      <ShareModal 
        isOpen={showShare} 
        onClose={() => setShowShare(false)} 
        defaultMessage={shareText}
        title="Share Review"
      />
    </>
  );
};

export default ReviewCard;