import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as api from '../api';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import FollowListModal from '../components/FollowListModal';
import EditProfileModal from '../components/EditProfileModal';
import LetterboxdImportModal from '../components/LetterboxdImportModal';
import ProfilePageSkeleton from '../components/ProfilePageSkeleton';
import ProfileHeader from '../components/ProfileHeader';
import ProfileReviewCard from '../components/ProfileReviewCard';
import { Calendar, Star, Bookmark, List, MessageSquare } from 'lucide-react';

const ProfilePage = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    // Data State
    const [profile, setProfile] = useState(null);
    const [userReviews, setUserReviews] = useState([]);
    const [watchlistMovies, setWatchlistMovies] = useState([]);
    const [timelineMovies, setTimelineMovies] = useState([]);
    const [userDiscussions, setUserDiscussions] = useState([]);
    const [bookmarkedDiscussions, setBookmarkedDiscussions] = useState([]);

    // UI State
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);

    // Modals
    const [editProfileOpen, setEditProfileOpen] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [userListOpen, setUserListOpen] = useState(false);
    const [userListTitle, setUserListTitle] = useState('Users');
    const [userList, setUserList] = useState([]);

    // --- DATA FETCHING ---
    const fetchProfile = useCallback(async () => {
        if (!profile) setLoading(true);

        try {
            const { data } = await api.getUserProfile(username);
            setProfile(data);
            setIsFollowing(!!data.isFollowedByCurrentUser);

            // 1. Reviews
            try {
                const { data: reviews } = await api.getReviewsByUser(username);
                const sortedReviews = reviews.sort((a, b) => {
                    const votesA = a.agreementVotes ? a.agreementVotes.length : 0;
                    const votesB = b.agreementVotes ? b.agreementVotes.length : 0;
                    return votesB - votesA;
                });
                setUserReviews(sortedReviews);
            } catch (e) { console.error("Failed reviews", e); }

            // 2. Timeline
            const normalizedWatched = (data.watched || []).map(entry => {
                if (typeof entry === 'string') return { movieId: entry, watchedAt: null };
                return entry;
            });
            const watchedDetails = await Promise.all(normalizedWatched.map(e => api.getMovieDetails(e.movieId)));
            const fullWatchedList = watchedDetails.map((res, i) => ({ ...res.data, watchedAt: normalizedWatched[i].watchedAt }));
            
            setTimelineMovies([...fullWatchedList].sort((a, b) => {
                const dateA = a.watchedAt ? new Date(a.watchedAt) : new Date(0);
                const dateB = b.watchedAt ? new Date(b.watchedAt) : new Date(0);
                return dateB - dateA;
            }));

            // 3. Watchlist
            const watchlistDetails = await Promise.all(data.watchlist.map(id => api.getMovieDetails(id)));
            setWatchlistMovies(watchlistDetails.map(res => res.data));

            // 4. Discussions
            try {
                const discRes = await api.fetchDiscussionsByUser(username);
                const withPosters = await Promise.all(discRes.data.map(async (d) => {
                    if (d && !d.poster_path && d.movieId) {
                        try {
                            const m = await api.getMovieDetails(d.movieId);
                            d.poster_path = m.data.poster_path;
                        } catch (e) {}
                    }
                    return d;
                }));
                setUserDiscussions(withPosters);
            } catch (e) {}

            // 5. Bookmarks
            try {
                if (user && user.username === username) {
                    const raw = localStorage.getItem('bookmarked_discussions_v1');
                    const map = raw ? JSON.parse(raw) : {};
                    const ids = Object.keys(map || {});
                    if (ids.length > 0) {
                        const details = await Promise.all(ids.map(async id => {
                            try {
                                const res = await api.getDiscussion(id);
                                const d = res.data;
                                if (d && !d.poster_path && d.movieId) {
                                    try {
                                        const m = await api.getMovieDetails(d.movieId);
                                        d.poster_path = m.data.poster_path;
                                    } catch (e) {}
                                }
                                return d;
                            } catch (e) { return null; }
                        }));
                        setBookmarkedDiscussions(details.filter(Boolean));
                    } else { setBookmarkedDiscussions([]); }
                }
            } catch (e) {}

        } catch (error) {
            console.error("Failed to fetch profile", error);
        } finally {
            setLoading(false);
        }
    }, [username, user, profile]);

    useEffect(() => {
        fetchProfile();
        const onBookmarksUpdated = async () => {}; 
        window.addEventListener('bookmarksUpdated', onBookmarksUpdated);
        return () => window.removeEventListener('bookmarksUpdated', onBookmarksUpdated);
    }, [username, fetchProfile]);

    // --- HANDLERS ---
    const handleFollowToggle = async () => {
        if (!user) { navigate('/login'); return; }
        try {
            if (isFollowing) { await api.unfollowUser(profile.username); setIsFollowing(false); toast.success('Unfollowed'); }
            else { await api.followUser(profile.username); setIsFollowing(true); toast.success('Followed'); }
            const { data } = await api.getUserProfile(profile.username); setProfile(data);
        } catch (err) { toast.error('Failed to update follow status'); }
    };

    const handleEditReview = (review) => { /* ... */ };
    const handleDeleteReview = (id) => { /* ... */ };
    const openUserListModal = (title, users) => { setUserListTitle(title); setUserList(users || []); setUserListOpen(true); };
    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Legacy';

    // --- RENDER HELPER: Horizontal Discussion Card ---
    const DiscussionCardSmall = ({ d }) => (
        <Link to={`/discussions/${d._id}`} className="flex-shrink-0 w-72 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-all group">
            <div className="flex h-24">
                <img 
                    src={d.poster_path ? `https://image.tmdb.org/t/p/w154${d.poster_path}` : '/default_dp.png'} 
                    alt="poster" 
                    className="w-16 h-full object-cover"
                />
                <div className="p-3 flex-1 flex flex-col justify-between">
                    <h4 className="font-bold text-gray-200 text-sm line-clamp-2 group-hover:text-green-400 transition-colors">{d.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MessageSquare size={12} />
                        <span>{d.comments?.length || 0} comments</span>
                    </div>
                </div>
            </div>
        </Link>
    );

    // --- RENDER HELPER: Horizontal Movie Card ---
    const MovieCardSmall = ({ m }) => (
        <Link to={`/movie/${m.id}`} className="flex-shrink-0 w-32 group">
            <img 
                src={`https://image.tmdb.org/t/p/w342${m.poster_path}`} 
                alt={m.title} 
                className="w-full h-48 object-cover rounded-lg shadow-md group-hover:ring-2 ring-green-500 transition-all" 
            />
            <h4 className="mt-2 text-sm font-semibold text-gray-300 truncate group-hover:text-white">{m.title}</h4>
        </Link>
    );

    if (loading && !profile) return <ProfilePageSkeleton />;
    if (!profile) {
        navigate('/login');
        return null;
    }

    return (
        <div>
            <ProfileHeader
                profile={profile}
                user={user}
                isFollowing={isFollowing}
                onFollowToggle={handleFollowToggle}
                onEditClick={() => setEditProfileOpen(true)}
                onUserListClick={openUserListModal}
                onImportClick={() => setImportModalOpen(true)}
            />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                
                {/* --- ROW 1: Reviews & Timeline (Vertical Lists) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    
                    {/* LEFT: Popular Reviews */}
                    <div className="flex flex-col h-[600px]">
                        <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-4">
                            <Star className="text-yellow-500" size={24} />
                            <h2 className="text-2xl font-bold text-white">Popular Reviews</h2>
                            <span className="text-gray-500 text-sm">({userReviews.length})</span>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-4 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
                            {userReviews.length === 0 ? (
                                <div className="text-center py-12 bg-gray-900/50 rounded-xl text-gray-500">No reviews yet.</div>
                            ) : (
                                userReviews.map(review => (
                                    <ProfileReviewCard key={review._id} review={review} onEdit={handleEditReview} onDelete={handleDeleteReview} />
                                ))
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Timeline */}
                    <div className="flex flex-col h-[600px]">
                        <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-4">
                            <Calendar className="text-green-500" size={24} />
                            <h2 className="text-2xl font-bold text-white">Timeline</h2>
                            <span className="text-gray-500 text-sm">({timelineMovies.length})</span>
                        </div>
                        <div className="flex-1 overflow-y-auto bg-gray-900/30 rounded-xl p-4 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
                            {timelineMovies.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">No movies in timeline yet.</div>
                            ) : (
                                <div className="space-y-4 relative pl-2">
                                    <div className="absolute left-[5.5rem] top-4 bottom-4 w-0.5 bg-gray-800" />
                                    {timelineMovies.map((movie, idx) => (
                                        <div key={`${movie.id}-${idx}`} className="flex items-start relative group">
                                            <div className="w-[5rem] pt-4 text-right text-xs text-gray-500 pr-4 flex-shrink-0 font-mono">{formatDate(movie.watchedAt)}</div>
                                            <div className="absolute left-[5.5rem] top-5 w-2 h-2 bg-gray-600 rounded-full -ml-[4px] border border-gray-900 group-hover:bg-green-500 transition-colors z-10" />
                                            <div className="flex-1 ml-6 bg-gray-900 hover:bg-gray-800 p-3 rounded-lg transition-all border border-gray-800 hover:border-gray-700 flex gap-3">
                                                <Link to={`/movie/${movie.id}`} className="flex-shrink-0">
                                                    <img src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`} alt={movie.title} className="w-10 h-14 object-cover rounded shadow" />
                                                </Link>
                                                <div className="flex flex-col justify-center min-w-0">
                                                    <Link to={`/movie/${movie.id}`} className="font-bold text-gray-200 hover:text-green-400 text-sm md:text-base line-clamp-1">{movie.title}</Link>
                                                    <div className="text-xs text-gray-500 mt-0.5">{movie.release_date?.substring(0, 4)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- ROW 2: Bookmarks & Watchlist (Horizontal Carousels) --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    
                    {/* LEFT: Bookmarks */}
                    {user && user.username === profile.username ? (
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Bookmark className="text-blue-500" size={20} />
                                <h2 className="text-xl font-bold text-white">Bookmarks</h2>
                                <span className="text-gray-500 text-sm">({bookmarkedDiscussions.length})</span>
                            </div>
                            
                            {bookmarkedDiscussions.length > 0 ? (
                                <div className="flex overflow-x-auto gap-4 pb-4 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
                                    {bookmarkedDiscussions.map(d => <DiscussionCardSmall key={d._id} d={d} />)}
                                </div>
                            ) : (
                                <div className="h-32 flex items-center justify-center bg-gray-900/30 rounded-xl border border-gray-800 border-dashed text-gray-500 text-sm">
                                    No bookmarks yet.
                                </div>
                            )}
                        </div>
                    ) : <div className="hidden lg:block"></div>}

                    {/* RIGHT: Watchlist */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <List className="text-purple-500" size={20} />
                            <h2 className="text-xl font-bold text-white">Watchlist</h2>
                            <span className="text-gray-500 text-sm">({watchlistMovies.length})</span>
                        </div>

                        {watchlistMovies.length > 0 ? (
                            <div className="flex overflow-x-auto gap-4 pb-4 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
                                {watchlistMovies.map(m => <MovieCardSmall key={m.id} m={m} />)}
                            </div>
                        ) : (
                            <div className="h-32 flex items-center justify-center bg-gray-900/30 rounded-xl border border-gray-800 border-dashed text-gray-500 text-sm">
                                Watchlist is empty.
                            </div>
                        )}
                    </div>
                </div>

                {/* --- ROW 3: Discussions Started (Horizontal Carousel) --- */}
                <div className="border-t border-gray-800 pt-8">
                    <div className="flex items-center gap-2 mb-6">
                        <MessageSquare className="text-pink-500" size={20} />
                        <h2 className="text-xl font-bold text-white">Discussions Started</h2>
                        <span className="text-gray-500 text-sm">({userDiscussions.length})</span>
                    </div>

                    {userDiscussions.length > 0 ? (
                        <div className="flex overflow-x-auto gap-4 pb-4 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
                            {userDiscussions.map(d => <DiscussionCardSmall key={d._id} d={d} />)}
                        </div>
                    ) : (
                        <div className="h-32 flex items-center justify-center bg-gray-900/30 rounded-xl border border-gray-800 border-dashed text-gray-500 text-sm">
                            No discussions started.
                        </div>
                    )}
                </div>

            </div>

            {/* Modals */}
            <FollowListModal isOpen={userListOpen} onClose={() => setUserListOpen(false)} title={userListTitle} users={userList} currentUser={user} />
            <EditProfileModal isOpen={editProfileOpen} onClose={() => setEditProfileOpen(false)} profile={profile} onUpdated={setProfile} />
            <LetterboxdImportModal isOpen={importModalOpen} onClose={() => setImportModalOpen(false)} onImportComplete={fetchProfile} />
        </div>
    );
};

export default ProfilePage;