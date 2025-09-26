import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as api from '../api';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import ReviewModal from '../components/ReviewModal';
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
  const [reviewToEdit, setReviewToEdit] = useState(null); // State for editing

  const fetchMovieData = async () => {
    // No need to set loading true here if it's just a refresh
    try {
      const { data: movieData } = await api.getMovieDetails(id);
      const { data: reviewData } = await api.getReviewsForMovie(id);
      setMovie(movieData);
      setReviews(reviewData);
    } catch (error) {
      console.error("Failed to fetch movie data", error);
    } finally {
      setLoading(false); // Only set loading false after initial fetch
    }
  };

  useEffect(() => {
    setLoading(true);
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

  // Function to open the modal for editing
  const handleEditReview = (review) => {
    setReviewToEdit(review);
    setIsModalOpen(true);
  };
  
  // Function to open the modal for creating a new review
  const handleAddNewReview = () => {
    setReviewToEdit(null); // Make sure we're not in edit mode
    setIsModalOpen(true);
  };
  
  // Function to handle deleting a review
  const handleDeleteReview = async (reviewId) => {
    // A simple confirmation dialog
    if (window.confirm('Are you sure you want to delete this review? This cannot be undone.')) {
      try {
        await api.deleteReview(reviewId);
        toast.success('Review deleted.');
        // Update the UI by removing the deleted review from the state
        setReviews(currentReviews => currentReviews.filter(r => r._id !== reviewId));
      } catch (error) {
        toast.error('Failed to delete review.');
      }
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
        existingReview={reviewToEdit} // Pass the review to be edited
        onReviewPosted={() => fetchMovieData()} // This will refresh the reviews list
      />
      {/* Banner: avoid negative margins so it's not clipped by the sticky navbar */}
      <div className="relative h-96 mx-0"> 
        <div className="absolute inset-0 overflow-hidden">
          <img src={`${IMG_BASE_URL}original${movie.backdrop_path}`} alt="" className="w-full h-full object-cover object-top"/>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

  {/* Add top padding so content doesn't sit under the banner/navbar */}
  <div className="relative -mt-20 space-y-12">
        <div className="md:flex gap-8">
          <img src={`${IMG_BASE_URL}w500${movie.poster_path}`} alt={movie.title} className="w-64 rounded-lg shadow-2xl mx-auto md:mx-0 mb-4 md:mb-0"/>
          <div className="flex-1 pt-24">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl lg:text-5xl font-bold">{movie.title}</h1>
              {(movie.imdbRating !== null && typeof movie.imdbRating !== 'undefined' && Number(movie.imdbRating) > 0) && (
                  <span className="text-sm bg-gray-700 text-yellow-300 px-2 py-1 rounded-lg font-semibold">{movie.imdbRating} <span className="text-xs text-gray-300">{movie.imdbRatingSource}</span></span>
                )}
            </div>
            <p className="text-xl text-gray-400 mt-1">{movie.release_date?.substring(0,4)}</p>
            <p className="my-6 text-gray-300 leading-relaxed">{movie.overview}</p>
            {user && (
              <div className="flex flex-wrap gap-4">
                {/** If the user already has a review for this movie, offer edit instead of add */}
                {reviews.some(r => String(r.user._id) === String(user.id) || String(r.user._id) === String(user._id)) ? (
                  <button onClick={() => {
                      const my = reviews.find(r => String(r.user._id) === String(user.id) || String(r.user._id) === String(user._id));
                      setReviewToEdit(my);
                      setIsModalOpen(true);
                    }} className="flex items-center gap-2 bg-primary hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    <PlusCircle size={20} /> Edit your review
                  </button>
                ) : (
                  <button onClick={handleAddNewReview} className="flex items-center gap-2 bg-primary hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    <PlusCircle size={20} /> Add a Review
                  </button>
                )}
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
        {/* Trailer embed (if available) */}
        {movie.videos && movie.videos.results && movie.videos.results.length > 0 && (
          (() => {
            const trailer = movie.videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube') || movie.videos.results[0];
            if (!trailer) return null;
            const ytKey = trailer.key;
            return (
              <div className="mt-6">
                <h3 className="text-2xl font-bold mb-3">Trailer</h3>
                <div className="aspect-w-16 aspect-h-9">
                  <iframe
                    title="Trailer"
                    src={`https://www.youtube.com/embed/${ytKey}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-96 rounded-lg"
                  />
                </div>
              </div>
            );
          })()
        )}
      
        <div>
          <h2 className="text-3xl font-bold mb-4">Reviews</h2>
          <div className="space-y-4">
              {reviews.length > 0 ? reviews.map(r => (
                  <ReviewCard 
                    key={r._id} 
                    review={r}
                    onEdit={handleEditReview}      // Pass edit handler
                    onDelete={handleDeleteReview}  // Pass delete handler
                  />
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
