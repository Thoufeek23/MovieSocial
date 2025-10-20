// src/pages/ProfilePage.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import * as api from '../api';
import MovieCard from '../components/MovieCard';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';
import BookmarkButton from '../components/BookmarkButton';
import { useRef } from 'react';
import { BsThreeDotsVertical } from 'react-icons/bs';
import FollowListModal from '../components/FollowListModal';
import EditProfileModal from '../components/EditProfileModal';
import ProfilePageSkeleton from '../components/ProfilePageSkeleton';
import EmptyState from '../components/EmptyState';

const ProfilePage = () => {
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const { username } = useParams();
    const [profile, setProfile] = useState(null);
    const [watchedMovies, setWatchedMovies] = useState([]);
    const [watchlistMovies, setWatchlistMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, logout } = useContext(AuthContext);
    // Unified edit modal state replaces separate bio/avatar editing
    const [isFollowing, setIsFollowing] = useState(false);
    const [userDiscussions, setUserDiscussions] = useState([]);
    const [bookmarkedDiscussions, setBookmarkedDiscussions] = useState([]);
    const [editProfileOpen, setEditProfileOpen] = useState(false);
    const [userListOpen, setUserListOpen] = useState(false);
    const [userListTitle, setUserListTitle] = useState('Users');
    const [userList, setUserList] = useState([]);

    // applyDefaultAvatar helper removed — unused

    // no-op placeholder for any future local file refs

    const handleRemoveFromWatched = async (movie) => {
        // only allow if current user is profile owner
        if (!user || user.username !== profile.username) return;

        try {
            // fetch reviews for this movie and see if current user has one
            const { data: movieReviews } = await api.getReviewsForMovie(movie.id);
            const userReview = movieReviews.find(r => String(r.user._id) === String(user.id) || String(r.user._id) === String(user._id));

            if (userReview) {
                // show a small action toast with Continue / Cancel
                const confirmId = toast.custom((t) => (
                    <div className={`bg-card p-4 rounded shadow-lg ${t.visible ? 'animate-enter' : 'animate-leave'}`}>
                      <div className="text-sm">You have a review for this movie. Removing it will also delete your review.</div>
                      <div className="mt-3 flex gap-2 justify-end">
                        <button onClick={() => toast.dismiss(confirmId)} className="px-3 py-1 rounded bg-gray-700">Cancel</button>
                        <button onClick={async () => {
                            toast.dismiss(confirmId);
                            const toastId = toast.loading('Removing movie and deleting review...');
                            try {
                                await api.deleteReview(userReview._id || userReview._id);
                                await api.removeFromWatched(movie.id);
                                setWatchedMovies(current => current.filter(m => m.id !== movie.id));
                                toast.success(`${movie.title} removed from watched`, { id: toastId });
                            } catch (err) {
                                toast.error('Failed to remove movie or delete review', { id: toastId });
                                console.error(err);
                            }
                        }} className="px-3 py-1 rounded bg-red-600 text-white">Continue</button>
                      </div>
                    </div>
                ));
                return;
            }

            const toastId = toast.loading('Removing movie...');
            await api.removeFromWatched(movie.id);
            setWatchedMovies(current => current.filter(m => m.id !== movie.id));
            toast.success(`${movie.title} removed from watched`, { id: toastId });
        } catch (err) {
            console.error('Failed removing from watched', err);
            toast.error(err?.response?.data?.msg || 'Failed to remove movie');
        }
    };

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const { data } = await api.getUserProfile(username);
                setProfile(data);
                setIsFollowing(!!data.isFollowedByCurrentUser);

                // Fetch full movie details for watched and watchlist
                const watchedDetails = await Promise.all(data.watched.map(id => api.getMovieDetails(id)));
                const watchlistDetails = await Promise.all(data.watchlist.map(id => api.getMovieDetails(id)));

                setWatchedMovies(watchedDetails.map(res => res.data));
                setWatchlistMovies(watchlistDetails.map(res => res.data));

                // fetch discussions started by this user
                try {
                    const discRes = await api.fetchDiscussionsByUser(username);
                    // For any discussion missing a poster_path, try to fetch movie details by movieId
                    const withPosters = await Promise.all(discRes.data.map(async (d) => {
                        if (d && !d.poster_path && d.movieId) {
                            try {
                                const m = await api.getMovieDetails(d.movieId);
                                d.poster_path = m.data.poster_path;
                            } catch (e) {
                                // ignore fetch failures
                            }
                        }
                        return d;
                    }));
                    setUserDiscussions(withPosters);
                } catch (err) {
                    console.error('Failed to load user discussions', err);
                }

                // If viewing own profile, load bookmarked discussions from localStorage
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
                                    // Ensure poster_path exists by fetching movie details if missing
                                    if (d && !d.poster_path && d.movieId) {
                                        try {
                                            const m = await api.getMovieDetails(d.movieId);
                                            d.poster_path = m.data.poster_path;
                                        } catch (e) {
                                            // ignore
                                        }
                                    }
                                    return d;
                                } catch (e) { return null; }
                            }));
                            setBookmarkedDiscussions(details.filter(Boolean));
                        } else {
                            setBookmarkedDiscussions([]);
                        }
                    }
                } catch (err) {
                    console.error('Failed to load bookmarked discussions', err);
                    setBookmarkedDiscussions([]);
                }

            } catch (error) {
                console.error("Failed to fetch profile", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();

        // live update when bookmarks change elsewhere in the app
        const onBookmarksUpdated = async (e) => {
            try {
                const { id, bookmarked } = e.detail || {};
                if (!id) return;
                if (bookmarked) {
                    // fetch details and prepend if not present
                    const { data } = await api.getDiscussion(id).catch(() => ({ data: null }));
                    if (data) {
                        setBookmarkedDiscussions(current => {
                            if (current.some(x => x._id === id)) return current;
                            return [data, ...current];
                        });
                    }
                } else {
                    setBookmarkedDiscussions(current => current.filter(x => x._id !== id));
                }
            } catch (err) {
                console.error('bookmark update handler failed', err);
            }
        };
        window.addEventListener('bookmarksUpdated', onBookmarksUpdated);
        return () => window.removeEventListener('bookmarksUpdated', onBookmarksUpdated);
    }, [username, user]);

    if (loading) return <ProfilePageSkeleton />;
    if (!profile) return <p className="text-center mt-8">User not found.</p>;

    return (
        <div>
            <div className="mb-8 fade-in">
                <div className="flex items-center justify-center mb-4">
                    {/* removed banner image as requested; keep Edit Profile button next to avatar */}
                </div>
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center gap-4">
                    <div className="flex-shrink-0 text-center sm:text-left">
                        <Avatar username={profile.username} avatar={profile.avatar} sizeClass="w-28 h-28" className="shadow-inner" />
                        {/* Edit Profile is available from the kebab menu (three dots) on the right */}
                    </div>
                    <div className="flex-1 w-full">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-2">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl sm:text-4xl font-bold text-center sm:text-left">{profile.username}</h1>
                                {/* Inline badges next to username (compact) */}
                                    <div className="flex items-center gap-2">
                                    {(profile.badges || []).map(b => {
                                        // try to infer a style from badge id or name
                                        const id = (b.id || b.name || '').toUpperCase();
                                        let bg = 'bg-gray-800 text-gray-100';
                                        //let icon = null;
                                        if (id.includes('DIAMOND')) { bg = 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white'; }
                                        else if (id.includes('GOLD')) { bg = 'bg-yellow-500 text-black'; }
                                        else if (id.includes('SILVER')) { bg = 'bg-gray-400 text-black'; }
                                        else if (id.includes('BRONZE') || id.includes('BRONZE')) { bg = 'bg-amber-700 text-white'; }

                                        // Short label: prefer b.name but keep it compact
                                        const label = (b.name || b.id || '').replace(/_/g, ' ');

                                        return (
                                            <Link key={b.id} to={`/badges/${b.id}`} title={label} className={`inline-block ${bg} px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap` }>
                                                {label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                            {user && user.username === profile.username && (
                                <div className="relative" ref={dropdownRef}>
                                    <button 
                                        onClick={() => setShowDropdown(!showDropdown)}
                                        className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                                    >
                                        <BsThreeDotsVertical className="w-5 h-5" />
                                    </button>

                                    {showDropdown && (
                                        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-card ring-1 ring-black ring-opacity-5 z-50">
                                            <div className="py-1" role="menu">
                                                <button
                                                    onClick={() => { 
                                                        navigator.clipboard?.writeText(window.location.href);
                                                        toast.success('Profile link copied');
                                                        setShowDropdown(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors"
                                                >
                                                    Share Profile
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setEditProfileOpen(true);
                                                        setShowDropdown(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors"
                                                >
                                                    Edit Profile
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        if (typeof logout === 'function') {
                                                            logout();
                                                            window.location.href = '/login';
                                                        }
                                                        setShowDropdown(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors"
                                                >
                                                    Logout
                                                </button>

                                                <button
                                                    onClick={async () => {
                                                        if (!window.confirm('Are you sure you want to permanently delete your account? This cannot be undone.')) return;
                                                        try {
                                                            await api.deleteMyAccount();
                                                            try { localStorage.removeItem('token'); } catch (e) {}
                                                            if (typeof logout === 'function') logout();
                                                            toast.success('Account deleted');
                                                            window.location.href = '/signup';
                                                        } catch (err) {
                                                            console.error('Failed to delete account', err);
                                                            toast.error('Failed to delete account');
                                                        }
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-700 transition-colors"
                                                >
                                                    Delete Account
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-2 text-sm text-gray-300">
                            <button
                                onClick={() => {
                                    setUserListTitle('Followers');
                                    setUserList(profile.followers || []);
                                    setUserListOpen(true);
                                }}
                                className="inline-flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-green-400 transition-colors"
                                aria-label="Show followers"
                            >
                                <span className="font-semibold text-gray-100">{profile.followersCount || 0}</span>
                                <span className="opacity-90">Followers</span>
                            </button>

                            <button
                                onClick={() => {
                                    setUserListTitle('Following');
                                    setUserList(profile.following || []);
                                    setUserListOpen(true);
                                }}
                                className="inline-flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-green-400 transition-colors"
                                aria-label="Show following"
                            >
                                <span className="font-semibold text-gray-100">{profile.followingCount || 0}</span>
                                <span className="opacity-90">Following</span>
                            </button>

                            <span className="font-medium">{profile.discussionsStarted || 0} Discussions Started</span>
                            <span className="font-medium">{profile.discussionsParticipated || 0} Participated</span>
                        </div>
                        {/* badges are now shown inline next to the username */}
                        {/* Bio and Follow button row: stacks on small screens, aligns bio left and button right on sm+ screens */}
                        <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4">
                            <p className="text-gray-400 max-w-xl flex-1">{profile.bio || "This user has not set a bio."}</p>

                            <div className="flex-shrink-0">
                                {user ? (
                                    user.username === profile.username ? (
                                        null
                                    ) : (
                                        isFollowing ? (
                                            <button onClick={async () => {
                                                try {
                                                    await api.unfollowUser(profile.username);
                                                    setIsFollowing(false);
                                                    const { data } = await api.getUserProfile(profile.username);
                                                    setProfile(data);
                                                    toast.success('Unfollowed');
                                                } catch (err) {
                                                    toast.error('Failed to unfollow');
                                                }
                                            }} className="btn btn-ghost text-red-500 border border-gray-700">Unfollow</button>
                                        ) : (
                                            <button onClick={async () => {
                                                try {
                                                    await api.followUser(profile.username);
                                                    setIsFollowing(true);
                                                    const { data } = await api.getUserProfile(profile.username);
                                                    setProfile(data);
                                                    toast.success('Followed');
                                                } catch (err) {
                                                    toast.error('Failed to follow');
                                                }
                                            }} className="btn btn-primary">Follow</button>
                                        )
                                    )
                                ) : (
                                    <button onClick={() => window.location.href = '/login'} className="btn btn-ghost">Log in to follow</button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                

            </div>

            <div className="mb-10">
                <h2 className="text-2xl font-bold border-b-2 border-gray-700 pb-2 mb-4">Watched Films ({watchedMovies.length})</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {watchedMovies.map(movie => (
                        <MovieCard
                            key={movie.id}
                            movie={movie}
                            showDelete={user && profile && user.username === profile.username}
                            onDelete={() => handleRemoveFromWatched(movie)}
                        />
                    ))}
                </div>
                {watchedMovies.length === 0 && (
                    <EmptyState message="You haven't watched any movies yet." ctaText="Find movies" ctaLink="/search" />
                )}
            </div>

            <div className="mb-10">
                <h2 className="text-2xl font-bold border-b-2 border-gray-700 pb-2 mb-4">Discussions Started ({userDiscussions.length})</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {userDiscussions.length === 0 ? (
                                    <EmptyState message="No discussions started." ctaText="Start a discussion" ctaLink="/search" />
                        ) : (
                            userDiscussions.map(d => (
                                <div key={d._id} className="relative group bg-card p-4 rounded-lg">
                                    <div className="flex items-start gap-4">
                                        <img
                                            src={d.poster_path ? `https://image.tmdb.org/t/p/w154${d.poster_path}` : '/default_dp.png'}
                                            alt="poster"
                                            className="w-20 h-28 rounded shadow-sm object-cover"
                                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/default_dp.png'; }}
                                        />
                                        <div className="flex-1">
                                            <Link to={`/discussions/${d._id}`} className="font-semibold text-lg line-clamp-2">{d.title}</Link>
                                            <div className="text-sm text-gray-400">Movie: {d.movieTitle} • {d.comments?.length || 0} comments</div>
                                        </div>
                                    </div>
                                    <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                        <BookmarkButton id={d._id} />
                                        {user && user.username === profile.username && (
                                            <button onClick={async () => {
                                                if (!window.confirm('Delete this discussion?')) return;
                                                try {
                                                    await api.deleteDiscussion(d._id);
                                                    setUserDiscussions(current => current.filter(x => x._id !== d._id));
                                                    toast.success('Discussion deleted');
                                                } catch (err) {
                                                    console.error(err);
                                                    toast.error('Failed to delete discussion');
                                                }
                                            }} className="bg-red-600 px-3 py-1 rounded text-sm">Delete</button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
            </div>

            {user && user.username === profile.username && (
                <div className="mb-10">
                    <h2 className="text-2xl font-bold border-b-2 border-gray-700 pb-2 mb-4">Bookmarked Discussions ({bookmarkedDiscussions.length})</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {bookmarkedDiscussions.length === 0 ? (
                            <EmptyState message="You have no bookmarked discussions." ctaText="Find discussions" ctaLink="/discussions" />
                        ) : (
                            bookmarkedDiscussions.map(d => (
                                <div key={d._id} className="relative group">
                                    <Link to={`/discussions/${d._id}`} className="p-4 bg-card rounded-lg hover:shadow-lg transition-shadow flex items-start gap-4">
                                        <img
                                            src={d.poster_path ? `https://image.tmdb.org/t/p/w185${d.poster_path}` : '/default_dp.png'}
                                            alt="poster"
                                            className="w-20 h-28 object-cover rounded shadow-sm"
                                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/default_dp.png'; }}
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <div className="font-semibold text-lg text-gray-100 line-clamp-2">{d.title}</div>
                                            </div>
                                            <div className="text-sm text-gray-400 mt-1">{d.movieTitle}</div>
                                            <div className="mt-3 text-sm text-gray-400">{d.comments?.length || 0} comments{d.starter?.username ? ` • Started by ${d.starter.username}` : ''}</div>
                                        </div>
                                    </Link>
                                    <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                        <BookmarkButton id={d._id} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            <div>
                <h2 className="text-2xl font-bold border-b-2 border-gray-700 pb-2 mb-4">Watchlist ({watchlistMovies.length})</h2>
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {watchlistMovies.map(movie => <MovieCard key={movie.id} movie={movie} />)}
                </div>
            </div>
            <FollowListModal isOpen={userListOpen} onClose={() => setUserListOpen(false)} title={userListTitle} users={userList} currentUser={user} />
            <EditProfileModal isOpen={editProfileOpen} onClose={() => setEditProfileOpen(false)} profile={profile} onUpdated={(data) => setProfile(data)} />
        </div>
    );
};

export default ProfilePage;