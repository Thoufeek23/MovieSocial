import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as api from '../api';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import ReviewModal from '../components/ReviewModal';
import DiscussionFormModal from '../components/DiscussionFormModal';
import ReviewCard from '../components/ReviewCard';
import { PlusCircle, CheckCircle, Calendar, Trash2, Edit } from 'lucide-react';
import BookmarkButton from '../components/BookmarkButton';
import Skeleton from 'react-loading-skeleton';
import { AnimatePresence, motion } from 'framer-motion';

const MovieDetailPage = () => {
  const { id } = useParams();
  const { user, setUser } = useContext(AuthContext);
  
  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [movieDiscussions, setMovieDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDiscussionForm, setShowDiscussionForm] = useState(false);
  const [reviewToEdit, setReviewToEdit] = useState(null);
  const [modalOrigin, setModalOrigin] = useState(null);

  // Date Picker State
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [customDate, setCustomDate] = useState('');

  // Helper: Check if movie is already in watched list
  const isWatched = user?.watched?.some(entry => {
      if (typeof entry === 'string') return entry === id;
      return entry.movieId === id;
  });

  const fetchMovieData = useCallback(async () => {
    try {
      const { data: movieData } = await api.getMovieDetails(id);
      const [reviewsRes, statsRes] = await Promise.allSettled([
        api.getReviewsForMovie(id),
        api.getMovieStats(id)
      ]);

      setMovie(movieData);

      if (reviewsRes.status === 'fulfilled') {
        setReviews(reviewsRes.value.data || []);
      } else {
        setReviews([]);
      }

      if (statsRes.status === 'fulfilled' && statsRes.value && statsRes.value.data) {
        const { movieSocialRating, reviewCount } = statsRes.value.data;
        setMovie(m => ({ ...(m || movieData), movieSocialRating, movieSocialCount: reviewCount }));
      } else {
        setMovie(m => ({ ...(m || movieData), movieSocialRating: undefined, movieSocialCount: undefined }));
      }

      const discRes = await api.fetchDiscussions({ movieId: id });
      setMovieDiscussions(discRes.data || []);
    } catch (error) {
      console.error("Failed to fetch movie data", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    fetchMovieData();
  }, [fetchMovieData]);

  const handleAddToWatchlist = async () => {
    try {
      const { data: updatedWatchlist } = await api.addToWatchlist(movie.id);
      setUser({ ...user, watchlist: updatedWatchlist });
      toast.success(`${movie.title} added to your watchlist!`);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Could not add to watchlist.');
    }
  };

  const handleWatchedClick = () => {
    setIsDateModalOpen(true);
  };

  const confirmWatched = async (dateToUse) => {
    try {
      const { data: updatedWatched } = await api.addToWatched(movie.id, dateToUse);
      setUser({ ...user, watched: updatedWatched });
      toast.success(isWatched ? 'Rewatch logged!' : 'Marked as watched!');
      setIsDateModalOpen(false);
      setCustomDate('');
    } catch (err) {
      toast.error('Could not update watch status.');
    }
  };

  // --- UPDATED: Remove Review + Watch History ---
  const handleRemoveFromWatched = async () => {
      // 1. Check if user has written a review for this movie
      const myReview = reviews.find(r => 
        (r.user?._id === user.id) || (r.user === user.id) || (String(r.user._id) === String(user.id))
      );

      // 2. Prompt user
      let confirmMsg = "Remove this movie from your watch history?";
      if (myReview) {
          confirmMsg = "Removing this from history will also delete your review. Are you sure?";
      }

      if (!window.confirm(confirmMsg)) return;

      try {
          // 3. Delete review first (if exists)
          if (myReview) {
              await api.deleteReview(myReview._id);
              setReviews(prev => prev.filter(r => r._id !== myReview._id));
          }

          // 4. Remove from watched list
          const { data: updatedWatched } = await api.removeFromWatched(movie.id);
          setUser({ ...user, watched: updatedWatched });
          
          toast.success(myReview ? 'Removed from history and review deleted' : 'Removed from history');
          setIsDateModalOpen(false);
      } catch (err) {
          console.error(err);
          toast.error('Failed to remove.');
      }
  };
  // ----------------------------------------------

  const handleEditReview = (review, event) => {
    let rect = { top: 0, left: 0, width: 0, height: 0 };
    try {
      const el = event && (event.currentTarget || event.target);
      if (el && typeof el.getBoundingClientRect === 'function') {
        rect = el.getBoundingClientRect();
      }
    } catch (e) {}
    setModalOrigin({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    setReviewToEdit(review);
    setIsModalOpen(true);
  };

  const handleAddNewReview = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setModalOrigin({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    setReviewToEdit(null);
    setIsModalOpen(true);
  };

  const handleStartDiscussionClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setModalOrigin({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    setShowDiscussionForm(true);
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await api.deleteReview(reviewId);
        toast.success('Review deleted.');
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
      {/* --- Watched / Rewatch Modal --- */}
      <AnimatePresence>
        {isDateModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setIsDateModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                <Calendar className="text-green-500" size={20} />
                {isWatched ? 'Edit Watch History' : 'When did you watch this?'}
              </h3>
              
              <div className="space-y-4">
                {/* Standard "Today" Button */}
                <button 
                  onClick={() => confirmWatched(null)}
                  className="w-full p-4 bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-green-500 text-white rounded-xl font-semibold transition-all flex items-center justify-between group"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-gray-400 group-hover:text-green-500" />
                    {isWatched ? 'Log Rewatch Today' : 'I Watched it Today'}
                  </span>
                  <span className="text-xs text-gray-500 group-hover:text-gray-400">
                    {new Date().toLocaleDateString()}
                  </span>
                </button>
                
                {/* Date Picker */}
                <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-400 ml-1">
                        {isWatched ? 'Or log rewatch on past date:' : 'Or pick a past date:'}
                    </label>
                    <div className="flex gap-2">
                        <input 
                            type="date" 
                            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-green-500 outline-none"
                            value={customDate}
                            onChange={(e) => setCustomDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                        />
                        <button 
                            disabled={!customDate}
                            onClick={() => confirmWatched(customDate)}
                            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:hover:bg-green-600 text-white px-4 rounded-lg font-bold transition-colors"
                        >
                            Save
                        </button>
                    </div>
                </div>

                {/* Remove Option (Only if watched) */}
                {isWatched && (
                    <div className="pt-4 mt-4 border-t border-gray-800">
                        <button 
                            onClick={handleRemoveFromWatched}
                            className="w-full p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                            <Trash2 size={18} />
                            Remove from Watch History
                        </button>
                    </div>
                )}
              </div>
              
              <button 
                onClick={() => setIsDateModalOpen(false)}
                className="mt-6 w-full text-gray-500 hover:text-white text-sm py-2 transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ReviewModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} movie={movie} existingReview={reviewToEdit} origin={modalOrigin} onReviewPosted={fetchMovieData} />
      <DiscussionFormModal isOpen={showDiscussionForm} setIsOpen={setShowDiscussionForm} movie={movie} origin={modalOrigin} onDiscussionCreated={fetchMovieData} />
      
      <div className="relative h-96 mx-0">
        <div className="absolute inset-0 overflow-hidden">
          <img src={`${IMG_BASE_URL}original${movie.backdrop_path}`} alt="" className="w-full h-full object-cover object-top" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <div className="relative -mt-20 space-y-12">
        <div className="md:flex gap-8">
          <img src={`${IMG_BASE_URL}w500${movie.poster_path}`} alt={movie.title} className="w-64 rounded-lg shadow-2xl mx-auto md:mx-0 mb-4 md:mb-0" />
          <div className="flex-1 pt-24">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl lg:text-5xl font-bold">{movie.title}</h1>
                {(() => {
                  if (movie && typeof movie.movieSocialRating !== 'undefined' && movie.movieSocialRating !== null) {
                      return (
                        <div className="mt-0">
                          <span className="text-sm bg-gray-700 text-green-400 px-2 py-1 rounded-lg font-semibold">{Number(movie.movieSocialRating).toFixed(1)} <span className="text-xs text-gray-300">Movie Social • {movie.movieSocialCount ?? reviews.length}</span></span>
                        </div>
                      );
                    }
                  return null;
                })()}
            </div>
            <p className="text-xl text-gray-400 mt-1">{movie.release_date?.substring(0, 4)}</p>
            <p className="my-6 text-gray-300 leading-relaxed">{movie.overview}</p>
            {user && (
              <div className="flex flex-wrap gap-4">
                {reviews.some(r => String(r.user._id) === String(user.id)) ? (
                  <button onClick={(e) => {
                    const my = reviews.find(r => String(r.user._id) === String(user.id));
                    handleEditReview(my, e);
                  }} className="flex items-center gap-2 bg-primary hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    <PlusCircle size={20} /> Edit your review
                  </button>
                ) : (
                  <button onClick={handleAddNewReview} className="flex items-center gap-2 bg-primary hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    <PlusCircle size={20} /> Add a Review
                  </button>
                )}
                
                <button 
                    onClick={handleWatchedClick} 
                    className={`flex items-center gap-2 font-bold py-2 px-4 rounded-lg transition-colors ${isWatched ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
                >
                  {isWatched ? (
                      <>
                        <Edit size={20} /> Edit Watch
                      </>
                  ) : (
                      <>
                        <CheckCircle size={20} /> Mark as Watched
                      </>
                  )}
                </button>
                
                <button onClick={handleAddToWatchlist} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                  <PlusCircle size={20} /> Add to Watchlist
                </button>
                <button onClick={handleStartDiscussionClick} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                  Start Discussion
                </button>
              </div>
            )}
          </div>
        </div>
        {movie.videos?.results?.length > 0 && (
          (() => {
            const trailer = movie.videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube') || movie.videos.results[0];
            if (!trailer) return null;
            return (
              <div className="mt-6">
                <h3 className="text-2xl font-bold mb-3">Trailer</h3>
                <div className="aspect-w-16 aspect-h-9">
                  <iframe title="Trailer" src={`https://www.youtube.com/embed/${trailer.key}`} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-96 rounded-lg" />
                </div>
              </div>
            );
          })()
        )}
        <div>
          <h2 className="text-3xl font-bold mb-4">Reviews</h2>
          <div className="space-y-4">
            <AnimatePresence>
              {reviews.length > 0 ? reviews.map(r => (
                <ReviewCard
                  key={r._id}
                  review={r}
                  onEdit={handleEditReview}
                  onDelete={handleDeleteReview}
                />
              )) : <p className="text-gray-400">No reviews yet. Be the first!</p>}
            </AnimatePresence>
          </div>
        </div>
        <div className="mt-8">
          <h2 className="text-3xl font-bold mb-4">Discussions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence>
              {movieDiscussions.length === 0 ? (
                <p className="text-gray-400">No discussions yet. Start one!</p>
              ) : (
                movieDiscussions.map(d => (
                  <motion.div
                    key={d._id}
                    layout
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.2 } }}
                    className="relative group"
                  >
                    <Link to={`/discussion/${d._id}`} className="p-4 bg-card rounded-lg hover:shadow transition-shadow flex items-start gap-4">
                      <img src={`https://image.tmdb.org/t/p/w154${movie.poster_path}`} alt="poster" className="w-20 h-28 object-cover rounded shadow-sm" />
                      <div className="flex-1">
                        <div className="font-semibold text-lg text-gray-100 line-clamp-2">{d.title}</div>
                        <div className="text-sm text-gray-400 mt-1">Started by {d.starter.username} • {d.comments.length} comments</div>
                      </div>
                    </Link>
                    <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <BookmarkButton id={d._id} />
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
};

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