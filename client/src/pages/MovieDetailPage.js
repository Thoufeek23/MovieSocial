import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as api from '../api';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import ReviewModal from '../components/ReviewModal'; // Import the new modal
import ReviewCard from '../components/ReviewCard';
import { PlusCircle, CheckCircle } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';

const MovieDetailPage = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchMovieData = async () => {
    setLoading(true);
    try {
      const { data: movieData } = await api.getMovieDetails(id);
      const { data: reviewData } = await api.getReviewsForMovie(id);
      setMovie(movieData);
      setReviews(reviewData);
    } catch (error) {
      console.error("Failed to fetch movie data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovieData();
  }, [id]);

  const handleAddToWatchlist = async () => {
    try {
      await api.addToWatchlist(movie.id);
      toast.success(`${movie.title} added to your watchlist!`);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Could not add to watchlist.');
    }
  };

  const handleAddToWatched = async () => {
    try {
      await api.addToWatched(movie.id);
      toast.success(`${movie.title} marked as watched!`);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Could not mark as watched.');
    }
  };


  if (loading) return <MovieDetailSkeleton />;
  if (!movie) return <p className="text-center text-2xl">Movie not found.</p>;
  
  const IMG_BASE_URL = 'https://image.tmdb.org/t/p/';

  return (
    <>
      <ReviewModal 
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        movie={movie}
        onReviewPosted={() => fetchMovieData()}
      />
      <div className="relative h-96 -mt-6 -mx-6">
        <img src={`${IMG_BASE_URL}original${movie.backdrop_path}`} alt="" className="w-full h-full object-cover"/>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <div className="relative -mt-32 space-y-12">
        <div className="md:flex gap-8">
          <img src={`${IMG_BASE_URL}w500${movie.poster_path}`} alt={movie.title} className="w-64 rounded-lg shadow-2xl mx-auto md:mx-0 mb-4 md:mb-0"/>
          <div className="flex-1 pt-24">
            <h1 className="text-4xl lg:text-5xl font-bold">{movie.title}</h1>
            <p className="text-xl text-gray-400 mt-1">{movie.release_date?.substring(0,4)}</p>
            <p className="my-6 text-gray-300 leading-relaxed">{movie.overview}</p>
            {user && (
              <div className="flex flex-wrap gap-4">
                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-primary hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                  <PlusCircle size={20} /> Add a Review
                </button>
                <button onClick={handleAddToWatched} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                  <CheckCircle size={20} /> Mark as Watched
                </button>
                 <button onClick={handleAddToWatchlist} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                  <PlusCircle size={20} /> Add to Watchlist
                </button>
              </div>
            )}
          </div>
        </div>
      
        <div>
          <h2 className="text-3xl font-bold mb-4">Reviews</h2>
          <div className="space-y-4">
              {reviews.length > 0 ? reviews.map(r => (
                  <ReviewCard key={r._id} review={r} />
              )) : <p className="text-gray-400">No reviews yet. Be the first!</p>}
          </div>
        </div>
      </div>
    </>
  );
};

// Skeleton component for a better loading experience
const MovieDetailSkeleton = () => (
  <>
    <Skeleton height={384} className="-mt-6 -mx-6" />
    <div className="relative -mt-32">
      <div className="md:flex gap-8">
        <Skeleton height={384} width={256} />
        <div className="flex-1 pt-24">
          <Skeleton height={48} width={400} />
          <Skeleton height={28} width={100} className="mt-2" />
          <Skeleton count={4} className="my-6" />
        </div>
      </div>
    </div>
  </>
);


export default MovieDetailPage;