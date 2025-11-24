import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as api from '../api';
import toast from 'react-hot-toast';
import StarRating from './StarRating';
import { X, Calendar } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const ReviewModal = ({ isOpen, setIsOpen, movie, existingReview, onReviewPosted, origin }) => {
  const { user, setUser } = useContext(AuthContext);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);
  
  // New Date State
  const [watchedDate, setWatchedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (existingReview) {
      setReviewText(existingReview.text);
      setRating(existingReview.rating);
    } else {
      setReviewText('');
      setRating(0);
      // Reset date to today for new reviews
      setWatchedDate(new Date().toISOString().split('T')[0]);
    }
  }, [existingReview, isOpen]);

  const isEditing = !!existingReview;
  const hasOrigin = !isEditing && origin;

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewText) {
      toast.error('Please write something in your review.');
      return;
    }
    const reviewData = {
      text: reviewText,
      rating: rating,
      ...(!existingReview && {
        movieId: movie.id,
        movieTitle: movie.title,
        moviePoster: movie.poster_path,
      }),
    };
    
    const toastId = toast.loading(isEditing ? 'Updating your review...' : 'Posting your review...');
    
    try {
      if (isEditing) {
        await api.updateReview(existingReview._id, reviewData);
      } else {
        // 1. Post the Review
        await api.postReview(reviewData);
        
        // 2. Add to Watched with the selected date (also removes from watchlist)
        try {
            const { data: updatedWatched } = await api.addToWatched(movie.id, watchedDate);
            // Update user context to reflect changes immediately
            if (user) {
                setUser({ ...user, watched: updatedWatched });
            }
        } catch (watchErr) {
            console.error("Failed to log watch date", watchErr);
        }
      }
      
      toast.success(isEditing ? 'Review updated!' : 'Review posted!', { id: toastId });
      if (typeof onReviewPosted === 'function') onReviewPosted();
      setIsOpen(false);
    } catch (err) {
      toast.error(isEditing ? 'Failed to update.' : 'Failed to post.', { id: toastId });
      console.error(err);
    }
  };

  const movieTitle = movie?.title || existingReview?.movieTitle || 'this movie';
  const title = existingReview ? `Edit your review for ${movieTitle}` : `Review ${movieTitle}`;

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 250 } },
    exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            key={isEditing ? 'edit' : 'new'}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-gray-900 border border-gray-700 w-full max-w-lg rounded-xl shadow-2xl p-6 relative"
            style={{
              transformOrigin: hasOrigin ? `${origin.left - (window.innerWidth / 2 - 256)}px ${origin.top - (window.innerHeight / 2 - 200)}px` : 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
              <X size={24} />
            </button>
            <h3 className="text-2xl font-bold mb-6 text-white pr-8">{title}</h3>
            
            <form onSubmit={handleReviewSubmit}>
              <div className="flex justify-center mb-6">
                <StarRating rating={rating} setRating={setRating} size={32} />
              </div>

              {/* Date Picker (Only show for new reviews) */}
              {!isEditing && (
                  <div className="mb-4 flex flex-col gap-2">
                      <label className="text-sm text-gray-400 font-medium flex items-center gap-2">
                          <Calendar size={14} /> When did you watch this?
                      </label>
                      <input 
                          type="date" 
                          value={watchedDate}
                          onChange={(e) => setWatchedDate(e.target.value)}
                          max={new Date().toISOString().split('T')[0]}
                          className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg block w-full p-2.5 focus:ring-green-500 focus:border-green-500 outline-none"
                      />
                  </div>
              )}

              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full p-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none transition-all"
                rows="5"
                placeholder="Write your thoughts here..."
              ></textarea>
              
              <button 
                type="submit" 
                className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-all transform active:scale-[0.98]"
              >
                {isEditing ? 'Update Review' : 'Post Review'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReviewModal;