import React from 'react';
import { Link } from 'react-router-dom';

const MovieCard = ({ movie, showRating }) => {
  const IMG_BASE_URL = 'https://image.tmdb.org/t/p/w500';

  return (
    <Link to={`/movie/${movie.id}`} aria-label={`View details for ${movie.title}`}>
      <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-transform duration-300 transform hover:scale-105 group">
        <img
          src={movie.poster_path ? `${IMG_BASE_URL}${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'}
          alt={movie.title || 'Movie poster'}
          className="w-full object-cover"
          loading="lazy"
        />
        <div className="p-4">
          <h3 className="font-bold text-lg truncate group-hover:text-green-400 transition-colors">{movie.title}</h3>
          <p className="text-gray-400">{movie.release_date?.substring(0, 4) || '—'}</p>
          {showRating && typeof movie.vote_average !== 'undefined' && (
            <p className="text-sm text-yellow-400 mt-1">Rating: {Number(movie.vote_average).toFixed(1)}</p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default MovieCard;