import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../api';

const MovieCard = ({ movie, showRating, showDelete = false, onDelete }) => {
  const IMG_BASE_URL = 'https://image.tmdb.org/t/p/w500';

  // Small inner component to show the Movie Social rating using the server-side stats endpoint
  const SocialRating = ({ movieId }) => {
    const [avg, setAvg] = useState(null);
    const [count, setCount] = useState(0);

    useEffect(() => {
      let mounted = true;
      (async () => {
        try {
          // Use the stats endpoint which returns the weighted movieSocialRating and reviewCount
          const res = await api.getMovieStats(movieId);
          const data = res.data || {};
          if (!mounted) return;
          if (typeof data.movieSocialRating === 'undefined' || data.movieSocialRating === null) {
            setAvg(null);
            setCount(data.reviewCount || 0);
            return;
          }
          setAvg(Number(data.movieSocialRating).toFixed(1));
          setCount(data.reviewCount || 0);
        } catch (err) {
          console.error('Failed to load social rating', err);
        }
      })();
      return () => { mounted = false; };
    }, [movieId]);

    if (count === 0) return <div className="text-xs text-gray-400 mt-1">No ratings yet</div>;
    return <div className="text-sm text-green-400 mt-1">★ {avg} (Movie Social • {count})</div>;
  };

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
            src={movie.poster_path ? `${IMG_BASE_URL}${movie.poster_path}` : '/default_dp.png'}
            alt={movie.title || 'Movie poster'}
            className="w-full object-cover aspect-[2/3]"
            loading="lazy"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/default_dp.png'; }}
          />
          <div className="p-4">
            <h3 className="font-bold text-lg truncate group-hover:text-green-400 transition-colors">{movie.title}</h3>
            <p className="text-gray-400">{movie.release_date?.substring(0, 4) || '—'}</p>
            {showRating && (
              movie.imdbRating
                ? <p className="text-sm text-yellow-400 mt-1">★ {Number(movie.imdbRating).toFixed(1)} {(movie.imdbRatingSource && (movie.imdbRatingSource.toLowerCase().includes('omdb') || movie.imdbRatingSource.toLowerCase().includes('imdb'))) ? '(IMDb)' : `(${movie.imdbRatingSource || 'IMDb'})`}</p>
                : (typeof movie.vote_average !== 'undefined' && <p className="text-sm text-yellow-400 mt-1">★ {Number(movie.vote_average).toFixed(1)} (TMDb)</p>)
            )}
            {/* Movie Social rating (average of user reviews) */}
            {/** We'll fetch reviews for this movie id and compute average */}
            {typeof movie.id !== 'undefined' && (
              <SocialRating movieId={movie.id} />
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default MovieCard;