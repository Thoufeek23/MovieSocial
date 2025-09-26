import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5001/api' });

// Add the JWT to the header of every request if it exists
API.interceptors.request.use((req) => {
  if (localStorage.getItem('token')) {
    req.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
  }
  return req;
});

// Authentication
export const login = (formData) => API.post('/auth/login', formData);
export const register = (formData) => API.post('/auth/register', formData);

// Movies (Proxy)
export const searchMovies = (query) => API.get(`/movies/search?query=${query}`);
export const getMovieDetails = (id) => API.get(`/movies/${id}`);
export const getPopularMovies = () => API.get('/movies/popular');


// Reviews
export const fetchFeed = () => API.get('/reviews/feed');
export const postReview = (reviewData) => API.post('/reviews', reviewData);
export const getReviewsForMovie = (movieId) => API.get(`/reviews/movie/${movieId}`);
export const updateReview = (id, reviewData) => API.put(`/reviews/${id}`, reviewData); // <-- Add this
export const deleteReview = (id) => API.delete(`/reviews/${id}`); // <-- Add this
export const fetchMyReviews = () => API.get('/reviews/mine');

// User Actions
export const getUserProfile = (username) => API.get(`/users/${username}`);
export const addToWatchlist = (movieId) => API.post('/users/watchlist', { movieId });
export const addToWatched = (movieId) => API.post('/users/watched', { movieId });
export const removeFromWatchlist = (movieId) => API.delete('/users/watchlist', { data: { movieId } });
export const removeFromWatched = (movieId) => API.delete('/users/watched', { data: { movieId } });