import React, { useState } from 'react';
import * as api from '../api';
import { toast } from 'react-hot-toast';
import { Trash2, ArrowUp, ArrowDown, Plus } from 'lucide-react';
import PickMovieModal from './PickMovieModal';

const CreateRank = ({ onSuccess, onCancel, className = "" }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [movies, setMovies] = useState([]);
  const [isPickModalOpen, setIsPickModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAddMovie = (movie) => {
    // Check if already added
    if (movies.find(m => m.id === movie.id)) {
      toast.error('Movie already in list');
      return;
    }
    setMovies([...movies, movie]);
  };

  const moveMovie = (index, direction) => {
    const newMovies = [...movies];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newMovies.length) return;
    
    [newMovies[index], newMovies[targetIndex]] = [newMovies[targetIndex], newMovies[index]];
    setMovies(newMovies);
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
      const { data } = await api.createRank({ title, description, movies });
      toast.success('Rank created successfully!');
      if (onSuccess) onSuccess(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to create rank');
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

          <div className="space-y-2">
            {movies.map((movie, index) => (
              <div key={movie.id} className="bg-card p-3 rounded-lg flex items-center gap-4 border border-gray-800 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex flex-col gap-1 text-gray-500">
                  <button type="button" onClick={() => moveMovie(index, -1)} disabled={index === 0} className="hover:text-white disabled:opacity-30 transition-colors">
                    <ArrowUp size={16} />
                  </button>
                  <span className="font-bold text-center w-6 text-white text-lg">{index + 1}</span>
                  <button type="button" onClick={() => moveMovie(index, 1)} disabled={index === movies.length - 1} className="hover:text-white disabled:opacity-30 transition-colors">
                    <ArrowDown size={16} />
                  </button>
                </div>

                <img 
                  src={movie.poster_path ? `https://image.tmdb.org/t/p/w92${movie.poster_path}` : '/assets/images/poster1.png'} 
                  alt={movie.title}
                  className="w-12 h-16 object-cover rounded bg-gray-800"
                />

                <div className="flex-1">
                  <h3 className="font-medium text-white line-clamp-1">{movie.title}</h3>
                  <p className="text-sm text-gray-400">{movie.release_date?.split('-')[0]}</p>
                </div>

                <button
                  type="button"
                  onClick={() => removeMovie(index)}
                  className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}

            {movies.length === 0 && (
              <div className="text-center py-10 border-2 border-dashed border-gray-800 rounded-lg text-gray-500 bg-card/50">
                No movies added yet. Click "Add Movie" to start ranking!
              </div>
            )}
          </div>
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
            {loading ? 'Creating...' : 'Publish Rank'}
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