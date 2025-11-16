import React, { useState, useEffect, useContext } from 'react';
import * as api from '../api';
import ReviewCard from '../components/ReviewCard';
import MovieCard from '../components/MovieCard';
import MovieCarousel from '../components/MovieCarousel'; // New component
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css' // Import skeleton styles
import BookmarkButton from '../components/BookmarkButton';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ReviewModal from '../components/ReviewModal';
import toast from 'react-hot-toast';
import { fetchDiscussions } from '../api';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const [reviews, setReviews] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [watchedMovies, setWatchedMovies] = useState([]);
  const [watchlistMovies, setWatchlistMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [discussions, setDiscussions] = useState([]);
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
          // Fetch personalized or popular movies and feed when not in mine mode
          let popularRes;
          try {
            // Try to get personalized movies first if user is logged in
            if (user) {
              popularRes = await api.getPersonalizedMovies();
            } else {
              popularRes = await api.getPopularMovies();
            }
          } catch (error) {
            // Fallback to popular movies if personalized fails
            popularRes = await api.getPopularMovies();
          }
          setPopularMovies(popularRes.data.results || popularRes.data || []);
          
          // Get personalized or regular reviews based on login status
          try {
            const feedRes = user ? await api.fetchPersonalizedFeed() : await api.fetchFeed();
            setReviews(feedRes.data);
          } catch (error) {
            // Fallback to regular feed if personalized fails
            const feedRes = await api.fetchFeed();
            setReviews(feedRes.data);
          }
          // load discussions
          try {
            const discRes = await fetchDiscussions({ sortBy: 'comments' });
            const discs = discRes.data || [];
            // fetch posters for top discussions (limit)
            const top = discs.slice(0, 12);
            const withPosters = await Promise.all(top.map(async d => {
              try {
                const movieRes = await api.getMovieDetails(d.movieId);
                return { ...d, poster_path: movieRes.data.poster_path };
              } catch (err) {
                return { ...d, poster_path: null };
              }
            }));
            setDiscussions(withPosters.concat(discs.slice(12)));
          } catch (e) {
            console.error('Failed to load discussions', e);
          }
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
          <MovieCarousel title={user ? "Recommended For You" : "Popular This Week"} movies={popularMovies} showRating={true} />
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
                onEdit={handleEditReview}
                onDelete={handleDeleteReview}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-3xl font-bold mb-4">Discussions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {discussions.length === 0 ? (
            <p className="text-gray-400">No discussions yet.</p>
          ) : (
            discussions.map(d => (
              <div key={d._id} className="relative group">
                <Link to={`/discussions/${d._id}`} className="p-4 bg-card rounded-lg hover:shadow-lg transition-shadow flex items-start gap-4">
                  <img src={d.poster_path ? `https://image.tmdb.org/t/p/w185${d.poster_path}` : '/default_dp.png'} alt="poster" className="w-20 h-28 object-cover rounded shadow-sm" />
                  <div className="flex-1">
                    <div className="font-semibold text-lg text-gray-100 line-clamp-2">{d.title}</div>
                    <div className="text-sm text-gray-400 mt-1">{d.movieTitle}</div>
                    <div className="mt-3 text-sm text-gray-400">{d.comments?.length || 0} comments • Started by {d.starter?.username}</div>
                  </div>
                </Link>
                {/* Hover actions (bookmark only) */}
                <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <BookmarkButton id={d._1 || d._id} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Removed NewDiscussionForm: start-discussion UI relocated/removed from homepage

export default HomePage;