import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../api';

const MovieCard = ({ movie, showDelete = false, onDelete, onClick, disabledLink = false }) => {
  const IMG_BASE_URL = 'https://image.tmdb.org/t/p/w500';

  // Small inner component to show the Movie Social rating (New "Social" Style)
  const SocialRating = ({ movieId }) => {
    const [avg, setAvg] = useState(null);
    const [count, setCount] = useState(0);

    // SVG Circle Progress constants
    const radius = 18;
    const circumference = 2 * Math.PI * radius; // 113.097
    const strokeWidth = 3;

    useEffect(() => {
      let mounted = true;
      (async () => {
        try {
          const res = await api.getMovieStats(movieId);
          const data = res.data || {};
          if (!mounted) return;
          if (typeof data.movieSocialRating === 'undefined' || data.movieSocialRating === null) {
            setAvg(null);
            setCount(data.reviewCount || 0);
          } else {
            setAvg(Number(data.movieSocialRating).toFixed(1));
            setCount(data.reviewCount || 0);
          }
        } catch (err) {
          console.error('Failed to load social rating', err);
        }
      })();
      return () => { mounted = false; };
    }, [movieId]);

    const progressOffset = circumference - (avg / 10) * circumference;

    return (
      <div className="mt-2 min-h-[44px] flex items-center">
        {count > 0 ? (
          <div
            className="flex items-center gap-3"
            title={`${avg} average rating from ${count} ${count === 1 ? 'user' : 'users'}`}
          >
            <div className="relative h-10 w-10">
              <svg className="h-full w-full" viewBox="0 0 40 40">
                <circle
                  cx="20"
                  cy="20"
                  r={radius}
                  fill="none"
                  strokeWidth={strokeWidth}
                  className="stroke-gray-700/50"
                />
                <circle
                  cx="20"
                  cy="20"
                  r={radius}
                  fill="none"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  className="text-primary -rotate-90 origin-center transform transition-all duration-500"
                  strokeDasharray={circumference}
                  strokeDashoffset={progressOffset}
                />
                <text
                  x="50%"
                  y="50%"
                  dy=".3em"
                  textAnchor="middle"
                  className="fill-white font-semibold text-sm"
                >
                  {avg}
                </text>
              </svg>
            </div>
            
            <div className="flex items-center gap-1.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">
                {count} {count === 1 ? 'user' : 'users'}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-primary/80">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium italic">
              Be the first to rate
            </p>
          </div>
        )}
      </div>
    );
  };

  const CardContent = (
    <div className="card card-hover pop-on-hover flex flex-col flex-grow">
      <img
        src={movie.poster_path ? `${IMG_BASE_URL}${movie.poster_path}` : '/default_dp.png'}
        alt={movie.title || 'Movie poster'}
        className="w-full object-cover aspect-[2/3]"
        loading="lazy"
        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/default_dp.png'; }}
      />
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">{movie.title}</h3>
        <p className="text-gray-400 text-sm mb-1">{movie.release_date?.substring(0, 4) || '—'}</p>
        <div className="flex-grow"></div>
        {typeof movie.id !== 'undefined' && (
          <SocialRating movieId={movie.id} />
        )}
      </div>
    </div>
  );

  // Modified wrapper logic to support onClick selection mode
  const isInteractive = onClick || disabledLink;

  if (isInteractive) {
    return (
      <div 
        className="relative group flex flex-col h-full cursor-pointer"
        onClick={(e) => {
          e.preventDefault();
          if (onClick) onClick(movie);
        }}
      >
        {showDelete && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (typeof onDelete === 'function') onDelete();
            }}
            className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 text-white p-2 rounded-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {CardContent}
      </div>
    );
  }

  return (
    <div className="relative group flex flex-col h-full">
      {showDelete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (typeof onDelete === 'function') onDelete();
          }}
          className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 text-white p-2 rounded-full"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      <Link to={`/movie/${movie.id}`} aria-label={`View details for ${movie.title}`} className="flex flex-col flex-grow">
        {CardContent}
      </Link>
    </div>
  );
};

export default MovieCard;