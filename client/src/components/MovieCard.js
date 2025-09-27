import React from 'react';
import { Link } from 'react-router-dom';

const MovieCard = ({ movie, showRating, showDelete = false, onDelete }) => {
  const IMG_BASE_URL = 'https://image.tmdb.org/t/p/w500';

  return (
    <div className="relative group">
      {showDelete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (typeof onDelete === 'function') onDelete();
          }}
          className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 text-white p-2 rounded-full"
          aria-label={`Remove ${movie.title} from watched`}
        >
          {/* simple X icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      <Link to={`/movie/${movie.id}`} aria-label={`View details for ${movie.title}`}>
        <div className="card card-hover pop-on-hover">
          <img
            src={movie.poster_path ? `${IMG_BASE_URL}${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'}
            alt={movie.title || 'Movie poster'}
            className="w-full object-cover aspect-[2/3]"
            loading="lazy"
          />
          <div className="p-4">
            <h3 className="font-bold text-lg truncate group-hover:text-green-400 transition-colors">{movie.title}</h3>
            <p className="text-gray-400">{movie.release_date?.substring(0, 4) || '—'}</p>
            {showRating && typeof movie.vote_average !== 'undefined' && (
              <p className="text-sm text-yellow-400 mt-1">★ {Number(movie.vote_average).toFixed(1)}</p>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default MovieCard;