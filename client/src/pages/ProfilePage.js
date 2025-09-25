// src/pages/ProfilePage.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import * as api from '../api';
import MovieCard from '../components/MovieCard';

const ProfilePage = () => {
    const { username } = useParams();
    const [profile, setProfile] = useState(null);
    const [watchedMovies, setWatchedMovies] = useState([]);
    const [watchlistMovies, setWatchlistMovies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await api.getUserProfile(username);
                setProfile(data);

                // Fetch full movie details for watched and watchlist
                const watchedDetails = await Promise.all(data.watched.map(id => api.getMovieDetails(id)));
                const watchlistDetails = await Promise.all(data.watchlist.map(id => api.getMovieDetails(id)));

                setWatchedMovies(watchedDetails.map(res => res.data));
                setWatchlistMovies(watchlistDetails.map(res => res.data));

            } catch (error) {
                console.error("Failed to fetch profile", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [username]);

    if (loading) return <p>Loading profile...</p>;
    if (!profile) return <p>User not found.</p>;

    return (
        <div>
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold">{profile.username}</h1>
                <p className="text-gray-400 mt-2">{profile.bio || "This user has not set a bio."}</p>
            </div>

            <div className="mb-10">
                <h2 className="text-2xl font-bold border-b-2 border-gray-700 pb-2 mb-4">Watched Films ({watchedMovies.length})</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {watchedMovies.map(movie => <MovieCard key={movie.id} movie={movie} />)}
                </div>
            </div>

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