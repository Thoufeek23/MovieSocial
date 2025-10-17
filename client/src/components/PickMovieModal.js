import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import InstantSearchBar from './InstantSearchBar';
import MovieCard from './MovieCard';

const PickMovieModal = ({ isOpen, setIsOpen, onMoviePicked }) => {
  const [picked, setPicked] = useState(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
          <motion.div onClick={(e) => e.stopPropagation()} className="bg-card w-full max-w-3xl rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-3">Pick a movie</h3>
            <div className="mb-4">
              <InstantSearchBar className="" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {/* The InstantSearchBar will navigate to movie pages on click; but for quick pick we show a few placeholder cards from popular endpoint via MovieCard which handles click navigation */}
              <MovieCard movie={{ id: 0, title: 'Search above to pick a movie' }} />
            </div>

            <div className="flex justify-end mt-4 gap-2">
              <button onClick={() => setIsOpen(false)} className="px-4 py-2 rounded bg-gray-700">Cancel</button>
              <button onClick={() => { if (picked) { onMoviePicked(picked); setIsOpen(false); } }} disabled={!picked} className="px-4 py-2 rounded bg-primary disabled:opacity-50">Use selected</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PickMovieModal;
