import React, { useState, useEffect, useContext } from 'react';
import * as api from '../api';
import ReviewCard from '../components/ReviewCard';
import MovieCard from '../components/MovieCard';
import MovieCarousel from '../components/MovieCarousel'; // New component
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css' // Import skeleton styles
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ReviewModal from '../components/ReviewModal';
import toast from 'react-hot-toast';

const HomePage = () => {
  const [reviews, setReviews] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [watchedMovies, setWatchedMovies] = useState([]);
  const [watchlistMovies, setWatchlistMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // Determine if we're on the user's profile-as-home view
  const params = new URLSearchParams(location.search);
  const showMine = params.get('mine') === 'true';

  useEffect(() => {
    const getPageData = async () => {
      try {
        if (showMine) {
          // If showing the user's profile-like home, fetch profile + my reviews
          if (!user) {
            navigate('/login');
            return;
          }

          const [profileRes, myRes] = await Promise.all([
            api.getUserProfile(user.username),
            api.fetchMyReviews()
          ]);

          // profileRes contains watched and watchlist arrays of movie IDs
          const watchedIds = profileRes.data.watched || [];
          const watchlistIds = profileRes.data.watchlist || [];

          // Fetch full movie details for both lists (limit to reasonable amount)
          const watchedDetails = await Promise.all(watchedIds.slice(0, 20).map(id => api.getMovieDetails(id)));
          const watchlistDetails = await Promise.all(watchlistIds.slice(0, 20).map(id => api.getMovieDetails(id)));

          setPopularMovies([]); // hide carousel when viewing profile
          setReviews(myRes.data);
          // store movie detail objects in state for rendering
          setWatchedMovies(watchedDetails.map(r => r.data));
          setWatchlistMovies(watchlistDetails.map(r => r.data));

        } else {
          // Fetch popular movies and feed when not in mine mode
          const popularRes = await api.getPopularMovies();
          setPopularMovies(popularRes.data.results);
          const feedRes = await api.fetchFeed();
          setReviews(feedRes.data);
        }
      } catch (error) {
        console.error("Failed to fetch page data", error);
      } finally {
        setLoading(false);
      }
    };
    getPageData();
  }, [showMine, user, navigate]);

  // State for modal when editing/adding reviews from the user's view
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewToEdit, setReviewToEdit] = useState(null);

  const handleEditReview = (review) => {
    setReviewToEdit(review);
    setIsModalOpen(true);
  };

  const handleRemoveFromWatchlist = async (movieId) => {
    if (!window.confirm('Remove this movie from your watchlist?')) return;
    try {
      await api.removeFromWatchlist(movieId);
      setWatchlistMovies(current => current.filter(m => String(m.id) !== String(movieId)));
      toast.success('Removed from watchlist');
    } catch (err) {
      toast.error('Failed to remove from watchlist');
    }
  };

  const handleRemoveFromWatched = async (movieId) => {
    if (!window.confirm('Remove this movie from your watched list?')) return;
    try {
      await api.removeFromWatched(movieId);
      setWatchedMovies(current => current.filter(m => String(m.id) !== String(movieId)));
      toast.success('Removed from watched');
    } catch (err) {
      toast.error('Failed to remove from watched');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await api.deleteReview(reviewId);
      toast.success('Review deleted');
      setReviews(current => current.filter(r => r._id !== reviewId));
    } catch (err) {
      toast.error('Failed to delete review');
    }
  };

  return (
    <div className="space-y-12">
      {showMine && (
        <ReviewModal 
          isOpen={isModalOpen}
          setIsOpen={setIsModalOpen}
          movie={null} // Not used when editing existing review in this modal implementation
          existingReview={reviewToEdit}
          onReviewPosted={async () => {
            // Refresh user's reviews after posting
            const myRes = await api.fetchMyReviews();
            setReviews(myRes.data);
            setIsModalOpen(false);
          }}
        />
      )}
      {showMine ? (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">{user?.username}'s Dashboard</h1>
            <p className="text-gray-400">Manage your watchlist, watched films, and reviews</p>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-3">Watched ({watchedMovies.length})</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {watchedMovies.map(movie => (
                <div key={movie.id}>
                  <MovieCard movie={movie} showRating={true} />
                  <div className="mt-2 flex justify-center">
                    <button onClick={() => handleRemoveFromWatched(movie.id)} className="text-sm bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-3">Watchlist ({watchlistMovies.length})</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {watchlistMovies.map(movie => (
                <div key={movie.id}>
                  <MovieCard movie={movie} showRating={true} />
                  <div className="mt-2 flex justify-center">
                    <button onClick={() => handleRemoveFromWatchlist(movie.id)} className="text-sm bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        loading ? (
          <div>
            <Skeleton height={40} width={300} className="mb-4" />
            <div className="flex space-x-4">
              <Skeleton height={270} width={192} count={5}/>
            </div>
          </div>
        ) : (
          <MovieCarousel title="Popular This Week" movies={popularMovies} showRating={true} />
        )
      )}
      
      <div>
        <h2 className="text-3xl font-bold mb-4">Latest Reviews</h2>
        {loading ? (
          <div className="space-y-4">
            <Skeleton height={150} count={3}/>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard 
                key={review._id} 
                review={review} 
                {...(showMine ? { onEdit: handleEditReview, onDelete: handleDeleteReview } : {})}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;