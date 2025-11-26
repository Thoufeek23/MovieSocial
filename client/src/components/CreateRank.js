import React, { useState, useEffect } from 'react';
import * as api from '../api';
import { toast } from 'react-hot-toast';
import { Trash2, Plus, GripVertical } from 'lucide-react'; // Changed icons
import { Reorder } from 'framer-motion'; // Import Reorder from framer-motion
import PickMovieModal from './PickMovieModal';

const CreateRank = ({ onSuccess, onCancel, initialData = null, className = "" }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [movies, setMovies] = useState([]);
  const [isPickModalOpen, setIsPickModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load initial data for editing
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      if (initialData.movies) {
        setMovies(initialData.movies.map(m => ({
          ...m,
          id: m.movieId || m.id,
          poster_path: m.posterPath || m.poster_path,
          release_date: m.year || m.release_date
        })));
      }
    }
  }, [initialData]);

  const handleAddMovie = (movie) => {
    // Check if already added
    if (movies.find(m => (m.id === movie.id) || (m.movieId === movie.id))) {
      toast.error('Movie already in list');
      return;
    }
    setMovies([...movies, movie]);
  };

  const removeMovie = (index) => {
    const newMovies = [...movies];
    newMovies.splice(index, 1);
    setMovies(newMovies);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error('Please enter a title');
    if (movies.length === 0) return toast.error('Please add at least one movie');

    setLoading(true);
    try {
      let response;
      if (initialData && initialData._id) {
        response = await api.updateRank(initialData._id, { title, description, movies });
        toast.success('Rank updated successfully!');
      } else {
        response = await api.createRank({ title, description, movies });
        toast.success('Rank created successfully!');
      }
      
      if (onSuccess) onSuccess(response.data);
    } catch (error) {
      console.error(error);
      toast.error(initialData ? 'Failed to update rank' : 'Failed to create rank');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2 font-medium">List Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-card border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-primary transition-colors"
              placeholder="e.g., Top 10 Sci-Fi Movies of All Time"
            />
          </div>
          
          <div>
            <label className="block text-gray-300 mb-2 font-medium">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-card border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-primary min-h-[100px] transition-colors"
              placeholder="What is this ranking about?"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Ranked Movies</h2>
            <button
              type="button"
              onClick={() => setIsPickModalOpen(true)}
              className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
            >
              <Plus size={20} /> Add Movie
            </button>
          </div>

          {/* DRAG AND DROP LIST */}
          <Reorder.Group 
            axis="y" 
            values={movies} 
            onReorder={setMovies} 
            className="space-y-2"
          >
            {movies.map((movie, index) => (
              <Reorder.Item 
                key={movie.id} 
                value={movie}
                className="bg-card p-3 rounded-lg flex items-center gap-4 border border-gray-800 cursor-grab active:cursor-grabbing"
              >
                {/* Drag Handle (3 Dots) */}
                <div className="text-gray-500 hover:text-white transition-colors">
                  <GripVertical size={20} />
                </div>

                {/* Rank Number */}
                <span className="font-bold text-center w-6 text-white text-lg select-none">
                  {index + 1}
                </span>

                {/* Movie Poster */}
                <img 
                  src={movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : '/assets/images/poster1.png'} 
                  alt={movie.title}
                  className="w-12 h-16 object-cover rounded bg-gray-800 select-none pointer-events-none"
                />

                {/* Movie Info */}
                <div className="flex-1">
                  <h3 className="font-medium text-white line-clamp-1">{movie.title}</h3>
                  <p className="text-sm text-gray-400">
                    {movie.release_date?.split('-')[0] || movie.year || '—'}
                  </p>
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    // Prevent drag event when clicking delete
                    e.stopPropagation(); 
                    removeMovie(index);
                  }}
                  className="p-2 text-gray-500 hover:text-red-500 transition-colors cursor-pointer"
                >
                  <Trash2 size={20} />
                </button>
              </Reorder.Item>
            ))}
          </Reorder.Group>

          {movies.length === 0 && (
            <div className="text-center py-10 border-2 border-dashed border-gray-800 rounded-lg text-gray-500 bg-card/50">
              No movies added yet. Click "Add Movie" to start ranking!
            </div>
          )}
        </div>

        <div className="pt-4 flex gap-3">
          {onCancel && (
             <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !title || movies.length === 0}
            className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors"
          >
            {loading ? 'Processing...' : (initialData ? 'Update Rank' : 'Publish Rank')}
          </button>
        </div>
      </form>

      <PickMovieModal 
        isOpen={isPickModalOpen} 
        setIsOpen={setIsPickModalOpen} 
        onMoviePicked={handleAddMovie} 
      />
    </div>
  );
};

export default CreateRank;