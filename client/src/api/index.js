import axios from 'axios';

// In production the client should be built with REACT_APP_API_URL set to your API root 
const apiRoot = process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace(/\/$/, '') : 'http://localhost:5001';
const API = axios.create({ baseURL: `${apiRoot}/api` });

API.interceptors.request.use((req) => {
  if (localStorage.getItem('token')) {
    req.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
  }
  return req;
});

// Authentication
export const login = (formData) => API.post('/auth/login', formData);
export const register = (formData) => API.post('/auth/register', formData);
export const forgotPassword = (payload) => API.post('/auth/forgot-password', payload);
export const verifyResetOtp = (payload) => API.post('/auth/verify-otp', payload);
export const resetPassword = (payload) => API.post('/auth/reset-password', payload);
export const sendSignupOtp = (payload) => API.post('/auth/signup-otp', payload);
export const verifySignupOtp = (payload) => API.post('/auth/verify-signup-otp', payload);
export const completeSignup = (payload) => API.post('/auth/complete-signup', payload);
export const getCurrentUser = () => API.get('/auth/me');

// Movies (Proxy)
export const searchMovies = (query) => API.get(`/movies/search?query=${query}`);
export const getMovieDetails = (id) => API.get(`/movies/${id}`);
export const getPopularMovies = () => API.get('/movies/popular');
export const getPersonalizedMovies = () => API.get('/movies/personalized');


// Reviews
export const fetchFeed = () => API.get('/reviews/feed');
export const fetchPersonalizedFeed = () => API.get('/reviews/personalized');
export const postReview = (reviewData) => API.post('/reviews', reviewData);
export const getReviewsForMovie = (movieId) => API.get(`/reviews/movie/${movieId}`);
export const getMovieStats = (movieId) => API.get(`/reviews/movie/${movieId}/stats`);
export const updateReview = (id, reviewData) => API.put(`/reviews/${id}`, reviewData);
export const deleteReview = (id) => API.delete(`/reviews/${id}`);
export const fetchMyReviews = () => API.get('/reviews/mine');
export const importLetterboxd = (username) => API.post('/reviews/import/letterboxd', { username });

// Vote on a review: { value: 1 | 0.5 | 0 }
export const voteReview = (id, value) => API.post(`/reviews/${id}/vote`, { value });

// User Actions
export const getUserProfile = (username) => API.get(`/users/${username}`);
export const getMyProfile = () => API.get('/auth/me');
export const searchUsers = (q) => API.get(`/users/search?q=${encodeURIComponent(q)}`);
export const addToWatchlist = (movieId) => API.post('/users/watchlist', { movieId });
export const addToWatched = (movieId) => API.post('/users/watched', { movieId });
export const removeFromWatchlist = (movieId) => API.delete('/users/watchlist', { data: { movieId } });
export const removeFromWatched = (movieId) => API.delete('/users/watched', { data: { movieId } });
export const updateMyProfile = (profileData) => API.patch('/users/me', profileData);
export const saveInterests = (interests) => API.patch('/users/me', { interests });
export const followUser = (username) => API.post(`/users/${username}/follow`);
export const unfollowUser = (username) => API.delete(`/users/${username}/follow`);
export const deleteMyAccount = () => API.delete('/users/me');

// Discussions
export const fetchDiscussions = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return API.get(`/discussions${qs ? `?${qs}` : ''}`);
};
export const postDiscussion = (discussionData) => API.post('/discussions', discussionData);
export const getDiscussion = (id) => API.get(`/discussions/${id}`);
export const postDiscussionComment = (id, commentData) => API.post(`/discussions/${id}/comments`, commentData);
export const postDiscussionReply = (discussionId, commentId, replyData) => API.post(`/discussions/${discussionId}/comments/${commentId}/replies`, replyData);
export const deleteDiscussionReply = (discussionId, commentId, replyId) => API.delete(`/discussions/${discussionId}/comments/${commentId}/replies/${replyId}`);
export const editDiscussionComment = (discussionId, commentId, commentData) => API.put(`/discussions/${discussionId}/comments/${commentId}`, commentData);
export const deleteDiscussionComment = (discussionId, commentId) => API.delete(`/discussions/${discussionId}/comments/${commentId}`);
export const fetchDiscussionsForMovie = (movieId) => fetchDiscussions({ movieId });
export const deleteDiscussion = (id) => API.delete(`/discussions/${id}`);
export const updateDiscussion = (id, data) => API.put(`/discussions/${id}`, data);
export const fetchDiscussionsByUser = (username) => API.get(`/discussions/user/${username}`);
// Leaderboard
export const getLeaderboardGlobal = () => API.get('/stats/top-reviewers');
export const getLeaderboardRegion = (region) => API.get(`/stats/top-reviewers/region/${encodeURIComponent(region)}`);

// Modle (daily puzzle) endpoints
export const getModleStatus = (language = 'English') => API.get(`/users/modle/status?language=${encodeURIComponent(language)}`);
export const postModleResult = (payload) => API.post('/users/modle/result', payload);

// AI Recommendations
export const getAIMovieRecommendations = (preferences) => API.post('/ai/movie-recommendations', preferences);
export const testAIConnection = () => API.get('/ai/test');

// Puzzle endpoints
export const getDailyPuzzle = (language = 'English', date = null) => {
  const params = new URLSearchParams({ language });
  if (date) params.append('date', date);
  return API.get(`/puzzles/daily?${params.toString()}`);
};
export const getPuzzleStats = () => API.get('/puzzles/stats');

// Admin puzzle management endpoints
export const getAllPuzzles = (language = 'English') => API.get(`/puzzles?language=${encodeURIComponent(language)}`);
export const createPuzzle = (puzzleData) => API.post('/puzzles', puzzleData);
export const updatePuzzle = (id, puzzleData) => API.put(`/puzzles/${id}`, puzzleData);
export const deletePuzzle = (id) => API.delete(`/puzzles/${id}`);

// Messages
export const getConversations = () => API.get('/messages/conversations');
export const getMessages = (userId) => API.get(`/messages/${userId}`);
export const sendMessage = (recipientId, content) => API.post('/messages', { recipientId, content });
export const markMessagesRead = (username) => API.put(`/messages/${username}/read`);
export const deleteMessage = (messageId) => API.delete(`/messages/${messageId}`); // New API Call