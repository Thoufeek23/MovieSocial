import React from 'react';
import { Link } from 'react-router-dom';

const MovieCard = ({ movie }) => {
  const IMG_BASE_URL = 'https://image.tmdb.org/t/p/w500';

  return (
    <Link to={`/movie/${movie.id}`}>
      <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
        <img
          src={movie.poster_path ? `${IMG_BASE_URL}${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'}
          alt={movie.title}
          className="w-full"
        />
        <div className="p-4">
          <h3 className="font-bold text-lg truncate">{movie.title}</h3>
          <p className="text-gray-400">{movie.release_date?.substring(0, 4)}</p>
        </div>
      </div>
    </Link>
  );
};

export default MovieCard;