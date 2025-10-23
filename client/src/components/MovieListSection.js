// src/components/MovieListSection.js
import React from 'react';
import MovieCard from './MovieCard';
import EmptyState from './EmptyState';

const MovieListSection = ({ title, movies, emptyMessage, emptyCtaText, emptyCtaLink, showDelete, onDelete }) => {
    return (
        <div className="mb-10">
            <h2 className="text-2xl font-bold border-b-2 border-gray-700 pb-2 mb-4">{title}</h2>
            {movies.length === 0 ? (
                <EmptyState message={emptyMessage} ctaText={emptyCtaText} ctaLink={emptyCtaLink} />
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {movies.map(movie => (
                        <MovieCard
                            key={movie.id}
                            movie={movie}
                            showDelete={showDelete}
                            onDelete={() => onDelete(movie)} // Pass the movie object to the handler
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default MovieListSection;