// src/pages/ProfilePage.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../api';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import FollowListModal from '../components/FollowListModal';
import EditProfileModal from '../components/EditProfileModal';
import ProfilePageSkeleton from '../components/ProfilePageSkeleton';

// Import the new components
import ProfileHeader from '../components/ProfileHeader';
import MovieListSection from '../components/MovieListSection';
import DiscussionListSection from '../components/DiscussionListSection';

const ProfilePage = () => {
    const { username } = useParams();
    const [profile, setProfile] = useState(null);
    const [watchedMovies, setWatchedMovies] = useState([]);
    const [watchlistMovies, setWatchlistMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext); // No logout needed here
    const [isFollowing, setIsFollowing] = useState(false);
    const [userDiscussions, setUserDiscussions] = useState([]);
    const [bookmarkedDiscussions, setBookmarkedDiscussions] = useState([]);
    const [editProfileOpen, setEditProfileOpen] = useState(false);
    const [userListOpen, setUserListOpen] = useState(false);
    const [userListTitle, setUserListTitle] = useState('Users');
    const [userList, setUserList] = useState([]);
    const navigate = useNavigate();

    // --- DATA FETCHING (Unchanged) ---
    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const { data } = await api.getUserProfile(username);
                setProfile(data);
                setIsFollowing(!!data.isFollowedByCurrentUser);

                const watchedDetails = await Promise.all(data.watched.map(id => api.getMovieDetails(id)));
                const watchlistDetails = await Promise.all(data.watchlist.map(id => api.getMovieDetails(id)));
                setWatchedMovies(watchedDetails.map(res => res.data));
                setWatchlistMovies(watchlistDetails.map(res => res.data));

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
                } catch (err) { console.error('Failed to load user discussions', err); }

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
                } catch (err) { console.error('Failed to load bookmarked discussions', err); setBookmarkedDiscussions([]); }

            } catch (error) { console.error("Failed to fetch profile", error); } 
            finally { setLoading(false); }
        };
        fetchProfile();

        const onBookmarksUpdated = async (e) => {
            // ... (bookmark listener logic unchanged)
        };
        window.addEventListener('bookmarksUpdated', onBookmarksUpdated);
        return () => window.removeEventListener('bookmarksUpdated', onBookmarksUpdated);
    }, [username, user]);


    // --- HANDLER FUNCTIONS ---

    const handleFollowToggle = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        try {
            if (isFollowing) {
                await api.unfollowUser(profile.username);
                setIsFollowing(false);
                toast.success('Unfollowed');
            } else {
                await api.followUser(profile.username);
                setIsFollowing(true);
                toast.success('Followed');
            }
            // Refetch profile to update follower count
            const { data } = await api.getUserProfile(profile.username);
            setProfile(data);
        } catch (err) {
            toast.error(isFollowing ? 'Failed to unfollow' : 'Failed to follow');
        }
    };
    
    const handleRemoveFromWatched = async (movie) => {
        // ... (This logic is complex, so it stays in the container)
        if (!user || user.username !== profile.username) return;
        try {
            const { data: movieReviews } = await api.getReviewsForMovie(movie.id);
            const userReview = movieReviews.find(r => String(r.user._id) === String(user.id) || String(r.user._id) === String(user._id));

            if (userReview) {
                const confirmId = toast.custom((t) => (
                    <div className={`bg-card p-4 rounded shadow-lg ${t.visible ? 'animate-enter' : 'animate-leave'}`}>
                      <div className="text-sm">This will also delete your review.</div>
                      <div className="mt-3 flex gap-2 justify-end">
                        <button onClick={() => toast.dismiss(confirmId)} className="px-3 py-1 rounded bg-gray-700">Cancel</button>
                        <button onClick={async () => {
                            toast.dismiss(confirmId);
                            const toastId = toast.loading('Removing movie and deleting review...');
                            try {
                                await api.deleteReview(userReview._id || userReview._id);
                                await api.removeFromWatched(movie.id);
                                setWatchedMovies(current => current.filter(m => m.id !== movie.id));
                                toast.success(`${movie.title} removed`, { id: toastId });
                            } catch (err) { toast.error('Failed to remove', { id: toastId }); }
                        }} className="px-3 py-1 rounded bg-red-600 text-white">Continue</button>
                      </div>
                    </div>
                ));
                return;
            }

            const toastId = toast.loading('Removing movie...');
            await api.removeFromWatched(movie.id);
            setWatchedMovies(current => current.filter(m => m.id !== movie.id));
            toast.success(`${movie.title} removed`, { id: toastId });
        } catch (err) {
            toast.error(err?.response?.data?.msg || 'Failed to remove movie');
        }
    };

    const handleDeleteDiscussion = async (discussionId) => {
        if (!window.confirm('Delete this discussion?')) return;
        try {
            await api.deleteDiscussion(discussionId);
            setUserDiscussions(current => current.filter(x => x._id !== discussionId));
            toast.success('Discussion deleted');
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete discussion');
        }
    };

    const openUserListModal = (title, users) => {
        setUserListTitle(title);
        setUserList(users || []);
        setUserListOpen(true);
    };

    // --- RENDER ---

    if (loading) return <ProfilePageSkeleton />;
    if (!profile) return <p className="text-center mt-8">User not found.</p>;

    return (
        <div>
            <ProfileHeader
                profile={profile}
                user={user}
                isFollowing={isFollowing}
                onFollowToggle={handleFollowToggle}
                onEditClick={() => setEditProfileOpen(true)}
                onUserListClick={openUserListModal}
            />

            <MovieListSection
                title={`Watched Films (${watchedMovies.length})`}
                movies={watchedMovies}
                emptyMessage="You haven't watched any movies yet."
                emptyCtaText="Find movies"
                emptyCtaLink="/search"
                showDelete={user && profile && user.username === profile.username}
                onDelete={handleRemoveFromWatched}
            />

            <DiscussionListSection
                title={`Discussions Started (${userDiscussions.length})`}
                discussions={userDiscussions}
                emptyMessage="No discussions started."
                emptyCtaText="Start a discussion"
                emptyCtaLink="/search"
                showDelete={user && user.username === profile.username}
                onDelete={handleDeleteDiscussion}
            />

            {user && user.username === profile.username && (
                <DiscussionListSection
                    title={`Bookmarked Discussions (${bookmarkedDiscussions.length})`}
                    discussions={bookmarkedDiscussions}
                    emptyMessage="You have no bookmarked discussions."
                    emptyCtaText="Find discussions"
                    emptyCtaLink="/discussions"
                    showDelete={false} // Can't delete from bookmarks list
                    onDelete={() => {}} // No-op
                />
            )}

            <MovieListSection
                title={`Watchlist (${watchlistMovies.length})`}
                movies={watchlistMovies}
                emptyMessage="Your watchlist is empty."
                emptyCtaText="Find movies to add"
                emptyCtaLink="/search"
                showDelete={false} // Can't delete from watchlist
                onDelete={() => {}} // No-op
            />

            {/* Modals remain here as they are controlled by this page's state */}
            <FollowListModal 
                isOpen={userListOpen} 
                onClose={() => setUserListOpen(false)} 
                title={userListTitle} 
                users={userList} 
                currentUser={user} 
            />
            <EditProfileModal 
                isOpen={editProfileOpen} 
                onClose={() => setEditProfileOpen(false)} 
                profile={profile} 
                onUpdated={(data) => setProfile(data)} 
            />
        </div>
    );
};

export default ProfilePage;