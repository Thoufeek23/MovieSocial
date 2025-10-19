import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as api from '../api';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import ReviewModal from '../components/ReviewModal';
import DiscussionFormModal from '../components/DiscussionFormModal';
import ReviewCard from '../components/ReviewCard';
import { PlusCircle, CheckCircle } from 'lucide-react';
import BookmarkButton from '../components/BookmarkButton';
import Skeleton from 'react-loading-skeleton';
import { AnimatePresence, motion } from 'framer-motion';

const MovieDetailPage = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewToEdit, setReviewToEdit] = useState(null);
  const [showDiscussionForm, setShowDiscussionForm] = useState(false);
  const [movieDiscussions, setMovieDiscussions] = useState([]);
  const [modalOrigin, setModalOrigin] = useState(null);
  const fetchMovieData = useCallback(async () => {
    try {
      const { data: movieData } = await api.getMovieDetails(id);
      // Fetch reviews and server-side computed stats in parallel. Use Promise.allSettled so a failure in stats doesn't block reviews.
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
        // store server-side computed stats on the movie object so UI can access it
        setMovie(m => ({ ...(m || movieData), movieSocialRating, movieSocialCount: reviewCount }));
      } else {
        // ensure previous stats cleared
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

  const handleEditReview = (review, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
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
      <ReviewModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        movie={movie}
        existingReview={reviewToEdit}
        origin={modalOrigin}
        onReviewPosted={fetchMovieData}
      />
      <DiscussionFormModal
        isOpen={showDiscussionForm}
        setIsOpen={setShowDiscussionForm}
        movie={movie}
        origin={modalOrigin}
        onDiscussionCreated={fetchMovieData}
      />
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
              {(movie.imdbRating !== null && typeof movie.imdbRating !== 'undefined' && Number(movie.imdbRating) > 0) && (
                <span className="text-sm bg-gray-700 text-yellow-300 px-2 py-1 rounded-lg font-semibold">{movie.imdbRating} <span className="text-xs text-gray-300">{(movie.imdbRatingSource && (movie.imdbRatingSource.toLowerCase().includes('omdb') || movie.imdbRatingSource.toLowerCase().includes('imdb'))) ? 'IMDb' : movie.imdbRatingSource || 'IMDb'}</span></span>
              )}
                {/* Movie Social rating: average of user reviews in our app */}
                {(() => {
                  if (movie && typeof movie.movieSocialRating !== 'undefined' && movie.movieSocialRating !== null) {
                    return (
                      <span className="text-sm bg-gray-700 text-green-300 px-2 py-1 rounded-lg font-semibold">★ {movie.movieSocialRating} <span className="text-xs text-gray-300">Movie Social • {movie.movieSocialCount ?? reviews.length}</span></span>
                    );
                  }

                  if (reviews && reviews.length > 0) {
                    const adjustedSum = reviews.reduce((s, r) => {
                      const rating = Number(r.rating) || 0;
                      const votes = (r.agreementVotes || []);
                      let agreementFraction = 1;
                      if (votes.length > 0) {
                        const voteSum = votes.reduce((vs, v) => vs + (Number(v.value) || 0), 0);
                        agreementFraction = voteSum / votes.length;
                      }
                      const adjusted = rating * (0.75 + 0.25 * agreementFraction);
                      return s + adjusted;
                    }, 0);
                    const weightedAvg = (adjustedSum / reviews.length);
                    const displayAvg = weightedAvg.toFixed(1);
                    return (
                      <span className="text-sm bg-gray-700 text-green-300 px-2 py-1 rounded-lg font-semibold">★ {displayAvg} <span className="text-xs text-gray-300">Movie Social • {reviews.length}</span></span>
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
                <button onClick={handleAddToWatched} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                  <CheckCircle size={20} /> Mark as Watched
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
                    <Link to={`/discussions/${d._id}`} className="p-4 bg-card rounded-lg hover:shadow transition-shadow flex items-start gap-4">
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