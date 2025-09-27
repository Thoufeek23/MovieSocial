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
    const [editingBio, setEditingBio] = useState(false);
    const [bioDraft, setBioDraft] = useState('');
    const [isFollowing, setIsFollowing] = useState(false);
    const [userDiscussions, setUserDiscussions] = useState([]);
    const [bookmarkedDiscussions, setBookmarkedDiscussions] = useState([]);
    const [avatarEditing, setAvatarEditing] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState('');
    const [avatarFile, setAvatarFile] = useState(null);
    const avatarInputRef = useRef(null);

    // applyDefaultAvatar helper removed — unused

    // ensure avatarFile is referenced so linters don't mark it unused (it's set when choosing a file)
    useEffect(() => {
        if (!avatarFile) return; // noop; avatarFile will be used by save handler
    }, [avatarFile]);

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
                setBioDraft(data.bio || '');

                // Fetch full movie details for watched and watchlist
                const watchedDetails = await Promise.all(data.watched.map(id => api.getMovieDetails(id)));
                const watchlistDetails = await Promise.all(data.watchlist.map(id => api.getMovieDetails(id)));

                setWatchedMovies(watchedDetails.map(res => res.data));
                setWatchlistMovies(watchlistDetails.map(res => res.data));

                // fetch discussions started by this user
                try {
                    const discRes = await api.fetchDiscussionsByUser(username);
                    setUserDiscussions(discRes.data);
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

    if (loading) return <p className="text-center mt-8">Loading profile...</p>;
    if (!profile) return <p className="text-center mt-8">User not found.</p>;

    return (
        <div>
            <div className="text-center mb-8 fade-in">
                    <div className="flex items-center justify-center gap-4">
                        <div>
                            <Avatar username={profile.username} avatar={profile.avatar} sizeClass="w-28 h-28" className="shadow-inner" />
                            {user && user.username === profile.username && (
                                <div className="mt-2 text-sm text-gray-300">
                                    <button onClick={() => { setAvatarEditing(true); setAvatarPreview(profile.avatar || ''); }} className="underline">Change Photo</button>
                                </div>
                            )}
                        </div>
                        <div className="flex-grow">
                            <div className="flex items-center justify-between">
                                <h1 className="text-4xl font-bold">{profile.username}</h1>
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
                                                            setEditingBio(true);
                                                            setShowDropdown(false);
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors"
                                                    >
                                                        Edit Bio
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
                            <div className="flex items-center justify-start space-x-4 mt-2 text-sm text-gray-300">
                                <span className="font-medium">{profile.followersCount || 0} Followers</span>
                                <span className="font-medium">{profile.followingCount || 0} Following</span>
                                <span className="font-medium">{profile.discussionsStarted || 0} Discussions Started</span>
                                <span className="font-medium">{profile.discussionsParticipated || 0} Participated</span>
                            </div>
                        </div>
                    </div>

                

                {!editingBio ? (
                    <p className="text-gray-400 mt-2">{profile.bio || "This user has not set a bio."}</p>
                ) : (
                    <textarea className="w-full max-w-lg mx-auto bg-card p-3 rounded mt-2" value={bioDraft} onChange={(e) => setBioDraft(e.target.value)} />
                )}

                {avatarEditing && (
                    <div className="mt-4 max-w-md mx-auto bg-card p-4 rounded">
                        <input ref={avatarInputRef} type="file" accept="image/*" onChange={async (e) => {
                            const f = e.target.files[0];
                            if (!f) return;
                            if (f.size > 1024 * 1024 * 2) { toast.error('Image too large (max 2MB)'); return; }
                            const reader = new FileReader();
                            reader.onload = () => { setAvatarPreview(reader.result); setAvatarFile(f); };
                            reader.onerror = () => toast.error('Failed to read image');
                            reader.readAsDataURL(f);
                        }} />
                        {avatarPreview && (
                            <div className="mt-3 flex items-center gap-3">
                                <img src={avatarPreview} alt="Avatar preview" className="w-20 h-20 rounded-full object-cover" />
                                <div>
                                    <div className="flex gap-2">
                                        <button onClick={async () => {
                                            try {
                                                await api.updateMyProfile({ avatar: avatarPreview });
                                                const { data } = await api.getUserProfile(profile.username);
                                                setProfile(data);
                                                setAvatarEditing(false);
                                                setAvatarPreview('');
                                                setAvatarFile(null);
                                                toast.success('Profile photo updated');
                                            } catch (err) {
                                                console.error(err);
                                                toast.error('Failed to update profile photo');
                                            }
                                        }} className="bg-green-600 px-3 py-1 rounded">Save</button>
                                        <button onClick={() => { setAvatarEditing(false); setAvatarPreview(''); setAvatarFile(null); }} className="bg-gray-700 px-3 py-1 rounded">Cancel</button>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-2">Max 2MB. JPG/PNG recommended.</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-4">
            {user && user.username === profile.username ? (
                        <>
                            {editingBio && (
                                <>
                                    <button onClick={async () => {
                                        try {
                                            await api.updateMyProfile({ bio: bioDraft });
                                            const { data } = await api.getUserProfile(profile.username);
                                            setProfile(data);
                                            setEditingBio(false);
                                            toast.success('Bio updated');
                                        } catch (err) {
                                            toast.error('Failed to update bio');
                                        }
                                    }} className="bg-green-600 px-4 py-2 rounded mr-2">Save</button>
                                    <button onClick={() => { setEditingBio(false); setBioDraft(profile.bio || ''); }} className="bg-gray-700 px-4 py-2 rounded">Cancel</button>
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            {user ? (
                                isFollowing ? (
                                    <button onClick={async () => {
                                        try {
                                            await api.unfollowUser(profile.username);
                                            setIsFollowing(false);
                                            // refresh profile counts
                                            const { data } = await api.getUserProfile(profile.username);
                                            setProfile(data);
                                            toast.success('Unfollowed');
                                        } catch (err) {
                                            toast.error('Failed to unfollow');
                                        }
                                    }} className="bg-red-600 px-4 py-2 rounded">Unfollow</button>
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
                                    }} className="bg-green-600 px-4 py-2 rounded">Follow</button>
                                )
                            ) : (
                                <p className="text-sm text-gray-400">Log in to follow this user</p>
                            )}
                        </>
                    )}
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
            </div>

            <div className="mb-10">
                <h2 className="text-2xl font-bold border-b-2 border-gray-700 pb-2 mb-4">Discussions Started ({userDiscussions.length})</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {userDiscussions.length === 0 ? (
                            <p className="text-gray-400">No discussions started.</p>
                        ) : (
                            userDiscussions.map(d => (
                                <div key={d._id} className="relative group bg-card p-4 rounded-lg">
                                    <div className="flex items-start gap-4">
                                        <img src={d.poster_path ? `https://image.tmdb.org/t/p/w154${d.poster_path}` : '/poster_placeholder.png'} alt="poster" className="w-20 h-28 rounded shadow-sm object-cover" />
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
                            <p className="text-gray-400">You have no bookmarked discussions.</p>
                        ) : (
                            bookmarkedDiscussions.map(d => (
                                <div key={d._id} className="relative group">
                                    <Link to={`/discussions/${d._id}`} className="p-4 bg-card rounded-lg hover:shadow-lg transition-shadow flex items-start gap-4">
                                        <img src={d.poster_path ? `https://image.tmdb.org/t/p/w185${d.poster_path}` : '/poster_placeholder.png'} alt="poster" className="w-20 h-28 object-cover rounded shadow-sm" />
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
        </div>
    );
};

export default ProfilePage;