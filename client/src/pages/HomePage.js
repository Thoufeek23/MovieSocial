import React, { useState, useEffect } from 'react';
import * as api from '../api';
import ReviewCard from '../components/ReviewCard';
import SearchBar from '../components/SearchBar';

const HomePage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getFeed = async () => {
      try {
        const { data } = await api.fetchFeed();
        setReviews(data);
      } catch (error) {
        console.error("Failed to fetch feed", error);
      } finally {
        setLoading(false);
      }
    };
    getFeed();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">What are people watching?</h1>
      <SearchBar />
      {loading ? (
        <p>Loading feed...</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review._id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;