import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as api from '../api';
import toast from 'react-hot-toast';
import StarRating from './StarRating';
import { X } from 'lucide-react';

const ReviewModal = ({ isOpen, setIsOpen, movie, existingReview, onReviewPosted, origin }) => {
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);

  useEffect(() => {
    if (existingReview) {
      setReviewText(existingReview.text);
      setRating(existingReview.rating);
    } else {
      setReviewText('');
      setRating(0);
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
        await api.postReview(reviewData);
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
  const title = existingReview ? `Edit your review for ${movieTitle}` : `Your review for ${movieTitle}`;

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 20,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: 'spring', damping: 25, stiffness: 250 },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: 20,
      transition: { duration: 0.2 },
    },
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
            className="bg-card w-full max-w-lg rounded-lg shadow-xl p-6 relative"
            style={{
              transformOrigin: hasOrigin ? `${origin.left - (window.innerWidth / 2 - 256)}px ${origin.top - (window.innerHeight / 2 - 200)}px` : 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
              <X size={24} />
            </button>
            <h3 className="text-2xl font-bold mb-4">{title}</h3>
            <form onSubmit={handleReviewSubmit}>
              <StarRating rating={rating} setRating={setRating} />
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full p-3 mt-4 bg-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                rows="6"
                placeholder="What did you think?"
              ></textarea>
              <button type="submit" className="mt-4 w-full bg-primary hover:bg-green-700 text-primary-foreground font-bold py-3 rounded-lg transition-colors">
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