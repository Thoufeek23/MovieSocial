import React from 'react';
import { Link } from 'react-router-dom';

// A simple component to display non-interactive stars
const DisplayStars = ({ rating }) => {
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, index) => (
        <span key={index} className={`text-xl ${index < rating ? 'text-yellow-400' : 'text-gray-600'}`}>
          &#9733;
        </span>
      ))}
    </div>
  );
};

const ReviewCard = ({ review }) => {
  const IMG_BASE_URL = 'https://image.tmdb.org/t/p/w200';

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex gap-5 items-start">
      <Link to={`/movie/${review.movieId}`}>
        <img
          src={`${IMG_BASE_URL}${review.moviePoster}`}
          alt={review.movieTitle}
          className="w-24 rounded-md hidden sm:block hover:opacity-80 transition-opacity"
        />
      </Link>
      <div className="flex-1">
        <h3 className="text-xl font-bold">
          <Link to={`/movie/${review.movieId}`} className="hover:text-green-400">{review.movieTitle}</Link>
        </h3>
        
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
           {review.rating && <DisplayStars rating={review.rating} />} {/* <-- Display stars if rating exists */}
           <span className="mt-1">
             Reviewed by <Link to={`/profile/${review.user.username}`} className="font-semibold hover:underline">{review.user.username}</Link>
           </span>
        </div>

        <p className="text-gray-300 italic">"{review.text}"</p>
      </div>
    </div>
  );
};

export default ReviewCard;