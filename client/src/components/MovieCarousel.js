import React from 'react';
import MovieCard from './MovieCard';
import { motion } from 'framer-motion';

const MovieCarousel = ({ title, movies, showRating = false }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  return (
    <section className="relative">
      <h2 className="text-3xl font-bold mb-4">{title}</h2>
      <motion.div
        className="flex overflow-x-auto space-x-4 pb-4 px-2 sm:px-4 no-scrollbar"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {movies.map(movie => (
          <motion.div key={movie.id} className="flex-shrink-0 w-48" variants={itemVariants}>
            <MovieCard movie={movie} showRating={showRating} />
          </motion.div>
        ))}
      </motion.div>
      <div className="absolute top-0 right-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent pointer-events-none" />
    </section>
  );
};

export default MovieCarousel;