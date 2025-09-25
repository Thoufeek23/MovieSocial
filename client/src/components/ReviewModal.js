import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as api from '../api';
import toast from 'react-hot-toast';
import StarRating from './StarRating';
import { X } from 'lucide-react';

const ReviewModal = ({ isOpen, setIsOpen, movie, onReviewPosted }) => {
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(0);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewText) {
      toast.error('Please write something in your review.');
      return;
    }

    const reviewData = {
      movieId: movie.id,
      text: reviewText,
      rating: rating,
      movieTitle: movie.title,
      moviePoster: movie.poster_path
    };

    const toastId = toast.loading('Posting your review...');
    try {
      await api.postReview(reviewData);
      toast.success('Review posted successfully!', { id: toastId });
      onReviewPosted(); // Refresh reviews on the detail page
      setIsOpen(false);
      setReviewText('');
      setRating(0);
    } catch (err) {
      toast.error('Failed to post review.', { id: toastId });
      console.error(err);
    }
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
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-card w-full max-w-lg rounded-lg shadow-xl p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
              <X size={24} />
            </button>
            <h3 className="text-2xl font-bold mb-4">Your review for {movie.title}</h3>
            <form onSubmit={handleReviewSubmit}>
                <StarRating rating={rating} setRating={setRating} />
                <textarea 
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="w-full p-3 mt-4 bg-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    rows="6"
                    placeholder="What did you think?">
                </textarea>
                <button type="submit" className="mt-4 w-full bg-primary hover:bg-green-700 text-primary-foreground font-bold py-3 rounded-lg transition-colors">
                  Post Review
                </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReviewModal;