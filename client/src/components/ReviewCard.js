import React from 'react';
import { Link } from 'react-router-dom';

const ReviewCard = ({ review }) => {
  const IMG_BASE_URL = 'https://image.tmdb.org/t/p/w200';

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex gap-4">
      <Link to={`/movie/${review.movieId}`}>
        <img
          src={`${IMG_BASE_URL}${review.moviePoster}`}
          alt={review.movieTitle}
          className="w-24 rounded-md hidden sm:block"
        />
      </Link>
      <div className="flex-1">
        <h3 className="text-xl font-bold">
          <Link to={`/movie/${review.movieId}`} className="hover:text-green-400">{review.movieTitle}</Link>
        </h3>
        <p className="text-sm text-gray-400 mb-2">
          Reviewed by <Link to={`/profile/${review.user.username}`} className="font-semibold hover:underline">{review.user.username}</Link>
        </p>
        <p className="text-gray-300">"{review.text}"</p>
        {/* Optional: Add Likes and Comments count here */}
      </div>
    </div>
  );
};

export default ReviewCard;