import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getApiUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace(/\/$/, '');
  }
  // Use 10.0.2.2 for Android Emulator, or your LAN IP for physical devices
  return "http://192.168.68.88:5001"; 
};

const API = axios.create({ 
  baseURL: `${getApiUrl()}/api`,
  timeout: 10000,
});

// Request Interceptor
API.interceptors.request.use(async (req) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Response Interceptor (Handle 401 Token Expiry)
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      console.log('Session expired or unauthorized. Clearing token.');
      await AsyncStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

// --- Authentication ---
export const login = (formData) => API.post('/auth/login', formData);
export const register = (formData) => API.post('/auth/register', formData);
export const forgotPassword = (payload) => API.post('/auth/forgot-password', payload);
export const verifyResetOtp = (payload) => API.post('/auth/verify-otp', payload);
export const resetPassword = (payload) => API.post('/auth/reset-password', payload);
export const sendSignupOtp = (payload) => API.post('/auth/signup-otp', payload);
export const verifySignupOtp = (payload) => API.post('/auth/verify-signup-otp', payload);
export const completeSignup = (payload) => API.post('/auth/complete-signup', payload);

// --- Movies ---
export const searchMovies = (query) => API.get(`/movies/search?query=${query}`);
export const getMovieDetails = (id) => API.get(`/movies/${id}`);
export const getPopularMovies = () => API.get('/movies/popular');
export const getPersonalizedMovies = () => API.get('/movies/personalized');

// --- Reviews ---
export const fetchFeed = () => API.get('/reviews/feed');
export const fetchPersonalizedFeed = () => API.get('/reviews/personalized');
export const postReview = (reviewData) => API.post('/reviews', reviewData);
export const getReviewsForMovie = (movieId) => API.get(`/reviews/movie/${movieId}`);
export const getMovieStats = (movieId) => API.get(`/reviews/movie/${movieId}/stats`);
export const updateReview = (id, reviewData) => API.put(`/reviews/${id}`, reviewData);
export const deleteReview = (id) => API.delete(`/reviews/${id}`);
export const fetchMyReviews = () => API.get('/reviews/mine');
export const voteReview = (id, value) => API.post(`/reviews/${id}/vote`, { value });
export const createReview = (reviewData) => API.post('/reviews', reviewData);

// --- User Actions ---
export const getUserProfile = (username) => API.get(`/users/${username}`);
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

// --- Discussions ---
export const fetchDiscussions = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return API.get(`/discussions${qs ? `?${qs}` : ''}`);
};
export const postDiscussion = (discussionData) => API.post('/discussions', discussionData);
export const getDiscussion = (id) => API.get(`/discussions/${id}`);
export const postDiscussionComment = (id, commentData) => API.post(`/discussions/${id}/comments`, commentData);
export const postDiscussionReply = (discussionId, commentId, replyData) => API.post(`/discussions/${discussionId}/comments/${commentId}/replies`, replyData);
export const deleteDiscussionReply = (discussionId, commentId, replyId) => API.delete(`/discussions/${discussionId}/comments/${commentId}/replies/${replyId}`);
export const deleteDiscussionComment = (discussionId, commentId) => API.delete(`/discussions/${discussionId}/comments/${commentId}`);
export const fetchDiscussionsForMovie = (movieId) => fetchDiscussions({ movieId });
export const deleteDiscussion = (id) => API.delete(`/discussions/${id}`);
export const updateDiscussion = (id, data) => API.put(`/discussions/${id}`, data);
export const fetchDiscussionsByUser = (username) => API.get(`/discussions/user/${username}`);
export const getDiscussionById = (id) => API.get(`/discussions/${id}`);
export const createDiscussion = (discussionData) => API.post('/discussions', discussionData);
export const addCommentToDiscussion = (id, commentData) => API.post(`/discussions/${id}/comments`, commentData);
export const deleteCommentFromDiscussion = (discussionId, commentId) => API.delete(`/discussions/${discussionId}/comments/${commentId}`);

// --- Leaderboard ---
export const getLeaderboardGlobal = () => API.get('/stats/top-reviewers');
export const getLeaderboardRegion = (region) => API.get(`/stats/top-reviewers/region/${encodeURIComponent(region)}`);

// --- Modle (Puzzles) ---
export const getModleStatus = (language = 'English') => API.get(`/users/modle/status?language=${encodeURIComponent(language)}`);
export const postModleResult = (payload) => API.post('/users/modle/result', payload);
export const getDailyPuzzle = (language = 'English', date = null) => {
  const params = new URLSearchParams({ language });
  if (date) params.append('date', date);
  return API.get(`/puzzles/daily?${params.toString()}`);
};

// --- AI Recommendations ---
export const getAIMovieRecommendations = (preferences) => API.post('/ai/movie-recommendations', preferences);
export const testAIConnection = () => API.get('/ai/test');

// --- MESSAGING (FIXED) ---
export const getConversations = () => API.get('/messages/conversations');
export const getMessages = (username) => API.get(`/messages/${username}`);

// *** FIX: Changed path from `/messages/${username}` to `/messages`
// *** and passed username as `recipientId` in body to match backend controller
export const sendMessage = (username, content) => API.post('/messages', { recipientId: username, content });

export const markMessagesRead = (username) => API.put(`/messages/${username}/read`);
export const deleteMessage = (id) => API.delete(`/messages/${id}`);