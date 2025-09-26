import React from 'react';
import MovieCard from './MovieCard';

const MovieCarousel = ({ title, movies, showRating = false }) => {
  return (
    <section>
      <h2 className="text-3xl font-bold mb-4">{title}</h2>
      <div className="flex overflow-x-auto space-x-4 pb-4 -mx-4 px-4">
        {movies.map(movie => (
          <div key={movie.id} className="flex-shrink-0 w-48">
             <MovieCard movie={movie} showRating={showRating} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default MovieCarousel;