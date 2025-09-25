import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import * as api from '../api';
import { AuthContext } from '../context/AuthContext';

const MovieDetailPage = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState('');

  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        const { data: movieData } = await api.getMovieDetails(id);
        const { data: reviewData } = await api.getReviewsForMovie(id);
        setMovie(movieData);
        setReviews(reviewData);
      } catch (error) {
        console.error("Failed to fetch movie data", error);
      }
    };
    fetchMovieData();
  }, [id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    const reviewData = {
        movieId: movie.id,
        text: reviewText,
        movieTitle: movie.title,
        moviePoster: movie.poster_path
    }
    try {
        const { data } = await api.postReview(reviewData);
        setReviews([data, ...reviews]);
        setReviewText('');
    } catch(err) {
        console.error(err);
    }
  };

  if (!movie) return <p>Loading...</p>;
  
  const IMG_BASE_URL = 'https://image.tmdb.org/t/p/w500';

  return (
    <div>
      <div className="md:flex gap-8 mb-8">
        <img src={`${IMG_BASE_URL}${movie.poster_path}`} alt={movie.title} className="w-64 rounded-lg shadow-lg mx-auto md:mx-0"/>
        <div>
          <h1 className="text-4xl font-bold">{movie.title} <span className="text-2xl text-gray-400">({movie.release_date.substring(0,4)})</span></h1>
          <p className="my-4 text-gray-300">{movie.overview}</p>
          {user && (
            <div className="flex gap-4">
              <button onClick={() => api.addToWatched(movie.id)} className="bg-green-600 px-4 py-2 rounded-lg">Log as Watched</button>
              <button onClick={() => api.addToWatchlist(movie.id)} className="bg-blue-600 px-4 py-2 rounded-lg">Add to Watchlist</button>
            </div>
          )}
        </div>
      </div>
      
      {user && (
        <div className="my-8">
            <h3 className="text-2xl font-bold mb-4">Add Your Review</h3>
            <form onSubmit={handleReviewSubmit}>
                <textarea 
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="w-full p-2 bg-gray-700 rounded"
                    rows="4"
                    placeholder="Write your thoughts...">
                </textarea>
                <button type="submit" className="mt-2 bg-green-500 px-4 py-2 rounded-lg">Post Review</button>
            </form>
        </div>
      )}

      <div>
        <h2 className="text-3xl font-bold mb-4">Reviews</h2>
        <div className="space-y-4">
            {reviews.length > 0 ? reviews.map(r => (
                <div key={r._id} className="bg-gray-800 p-4 rounded-lg">
                    <p className="font-bold">{r.user.username}</p>
                    <p>{r.text}</p>
                </div>
            )) : <p>No reviews yet. Be the first!</p>}
        </div>
      </div>
    </div>
  );
};

export default MovieDetailPage;