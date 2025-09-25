import React, { useState, useEffect } from 'react';
import * as api from '../api';
import ReviewCard from '../components/ReviewCard';
import MovieCarousel from '../components/MovieCarousel'; // New component
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css' // Import skeleton styles

const HomePage = () => {
  const [reviews, setReviews] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getPageData = async () => {
      try {
        const [feedRes, popularRes] = await Promise.all([
          api.fetchFeed(),
          api.getPopularMovies()
        ]);
        setReviews(feedRes.data);
        setPopularMovies(popularRes.data.results);
      } catch (error) {
        console.error("Failed to fetch page data", error);
      } finally {
        setLoading(false);
      }
    };
    getPageData();
  }, []);

  return (
    <div className="space-y-12">
      {loading ? (
        <div>
          <Skeleton height={40} width={300} className="mb-4" />
          <div className="flex space-x-4">
            <Skeleton height={270} width={192} count={5}/>
          </div>
        </div>
      ) : (
        <MovieCarousel title="Popular This Week" movies={popularMovies} />
      )}
      
      <div>
        <h2 className="text-3xl font-bold mb-4">Latest Reviews</h2>
        {loading ? (
          <div className="space-y-4">
            <Skeleton height={150} count={3}/>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard key={review._id} review={review} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;