import React, { useEffect, useState } from 'react';
import * as api from '../api';
import ReviewCard from '../components/ReviewCard';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const ReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

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
            reviews.map(r => <ReviewCard key={r._id} review={r} />)
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewsPage;
