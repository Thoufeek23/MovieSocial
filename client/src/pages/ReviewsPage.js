import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import * as api from '../api';
import ReviewCard from '../components/ReviewCard';
import ReviewModal from '../components/ReviewModal';
import toast from 'react-hot-toast';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const ReviewsPage = () => {
  const { user } = useContext(AuthContext);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewToEdit, setReviewToEdit] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        // Use personalized feed if user is logged in, otherwise regular feed
        const res = user ? await api.fetchPersonalizedFeed().catch(() => api.fetchFeed()) : await api.fetchFeed();
        setReviews(res.data || []);
      } catch (err) {
        // Fallback to regular feed if anything fails
        try {
          const res = await api.fetchFeed();
          setReviews(res.data || []);
        } catch (fallbackErr) {
          console.error('Failed to load feed reviews', fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [user]);

  const handleEditReview = (review, event) => {
    setReviewToEdit(review);
    setIsModalOpen(true);
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await api.deleteReview(reviewId);
      toast.success('Review deleted.');
      setReviews(current => current.filter(r => r._id !== reviewId));
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete review.');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">{user ? 'Reviews For You' : 'Latest Reviews'}</h1>

      {loading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, index) => (
            <div key={index} className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-4">
              <div className="flex gap-4">
                {/* Movie poster skeleton */}
                <Skeleton 
                  width={80} 
                  height={120}
                  baseColor="rgba(255,255,255,0.05)"
                  highlightColor="rgba(255,255,255,0.15)"
                />
                <div className="flex-1">
                  {/* User info skeleton */}
                  <div className="flex items-center gap-2 mb-3">
                    <Skeleton 
                      circle 
                      width={32} 
                      height={32}
                      baseColor="rgba(255,255,255,0.05)"
                      highlightColor="rgba(255,255,255,0.15)"
                    />
                    <Skeleton 
                      width={120}
                      height={16}
                      baseColor="rgba(255,255,255,0.05)"
                      highlightColor="rgba(255,255,255,0.15)"
                    />
                  </div>
                  {/* Movie title skeleton */}
                  <Skeleton 
                    width="70%"
                    height={20}
                    baseColor="rgba(255,255,255,0.05)"
                    highlightColor="rgba(255,255,255,0.15)"
                    className="mb-2"
                  />
                  {/* Stars skeleton */}
                  <Skeleton 
                    width={100}
                    height={18}
                    baseColor="rgba(255,255,255,0.05)"
                    highlightColor="rgba(255,255,255,0.15)"
                    className="mb-3"
                  />
                  {/* Review text skeleton */}
                  <Skeleton 
                    count={2}
                    height={14}
                    baseColor="rgba(255,255,255,0.05)"
                    highlightColor="rgba(255,255,255,0.15)"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="text-gray-400">No reviews found.</div>
          ) : (
            reviews.map(r => (
              <ReviewCard key={r._1 || r._id} review={r} onEdit={handleEditReview} onDelete={handleDeleteReview} />
            ))
          )}
        </div>
      )}
      <ReviewModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        existingReview={reviewToEdit}
        onReviewPosted={async () => {
          // refresh feed with personalized logic
          try {
            const res = user ? await api.fetchPersonalizedFeed().catch(() => api.fetchFeed()) : await api.fetchFeed();
            setReviews(res.data || []);
          } catch (err) {
            console.error('Failed to refresh feed after edit', err);
          }
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

export default ReviewsPage;
