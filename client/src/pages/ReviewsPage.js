import React, { useEffect, useState } from 'react';
import * as api from '../api';
import ReviewCard from '../components/ReviewCard';
import ReviewModal from '../components/ReviewModal';
import toast from 'react-hot-toast';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const ReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewToEdit, setReviewToEdit] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.fetchFeed();
        setReviews(res.data || []);
      } catch (err) {
        console.error('Failed to load feed reviews', err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

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
      <h1 className="text-3xl font-bold mb-4">Latest Reviews</h1>

      {loading ? (
        <div className="space-y-4">
          <Skeleton height={150} count={3} />
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
          // refresh feed
          try {
            const res = await api.fetchFeed();
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
