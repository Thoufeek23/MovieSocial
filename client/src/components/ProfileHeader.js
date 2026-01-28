import React, { useState, useRef, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { MessageCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import Avatar from './Avatar';
import ModleSummary from './ModleSummary';
import * as api from '../api';

const ProfileHeader = ({ profile, isFollowing, onFollowToggle, onEditClick, onUserListClick, onImportClick }) => {
    const { user, logout } = useContext(AuthContext);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="mb-8 fade-in">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 relative">
                
                {/* Avatar */}
                <div className="flex-shrink-0 text-center sm:text-left">
                    <Avatar username={profile.username} avatar={profile.avatar} sizeClass="w-24 h-24 sm:w-28 sm:h-28" className="shadow-inner" />
                </div>

                {/* User Info Block */}
                <div className="flex-1 w-full flex flex-col items-center sm:items-start">
                    
                    {/* Row 1: Username and Badges centered on mobile, left on desktop */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between w-full mb-3">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2">
                            <h1 className="text-2xl sm:text-3xl font-bold text-center sm:text-left">{profile.username}</h1>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                                {(profile.badges || []).map(b => {
                                    const id = (b.id || b.name || '').toUpperCase();
                                    let bg = 'bg-gray-700 text-gray-100';
                                    if (id.includes('DIAMOND')) { bg = 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white'; }
                                    else if (id.includes('GOLD')) { bg = 'bg-yellow-500 text-black'; }
                                    else if (id.includes('SILVER')) { bg = 'bg-gray-400 text-black'; }
                                    else if (id.includes('BRONZE')) { bg = 'bg-amber-700 text-white'; }
                                    const label = (b.name || b.id || '').replace(/_/g, ' ');
                                    return (
                                        <Link key={b.id} to={`/badges/${b.id}`} title={label} className={`inline-block ${bg} px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap`}>
                                            {label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                        
                        {/* Dropdown Button - Positioned top-right on mobile, inline on desktop */}
                        {user && user.username === profile.username && (
                            <div className="absolute top-2 right-2 sm:relative sm:top-0 sm:right-0 z-10" ref={dropdownRef}>
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className="p-1.5 hover:bg-gray-700 rounded-full transition-colors text-gray-300 hover:text-white"
                                    aria-label="Profile options"
                                >
                                    <BsThreeDotsVertical className="w-5 h-5" />
                                </button>
                                
                                {showDropdown && (
                                    <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-card ring-1 ring-black ring-opacity-5 z-50">
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
                                                    onEditClick(); 
                                                    setShowDropdown(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors"
                                            >
                                                Edit Profile
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (onImportClick) onImportClick();
                                                    setShowDropdown(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors"
                                            >
                                                Import from Letterboxd
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (typeof logout === 'function') {
                                                        logout();
                                                        window.location.href = '/login';
                                                    }
                                                    setShowDropdown(false);
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors border-t border-gray-700"
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

                    {/* Row 2: Bio (Full width) */}
                    <div className="w-full mb-4 text-center sm:text-left">
                        <p className="text-gray-400 text-sm">{profile.bio || "This user has not set a bio."}</p>
                    </div>

                    {/* Row 3: Stats */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 text-sm text-gray-300 mb-4">
                        <button 
                            onClick={() => onUserListClick('Followers', profile.followers || [])} 
                            className="inline-flex items-center gap-1 hover:text-green-400 transition-colors"
                        >
                            <span className="font-semibold text-gray-100">{profile.followersCount || 0}</span>
                            <span className="opacity-90">Followers</span>
                        </button>
                        <button 
                            onClick={() => onUserListClick('Following', profile.following || [])} 
                            className="inline-flex items-center gap-1 hover:text-green-400 transition-colors"
                        >
                            <span className="font-semibold text-gray-100">{profile.followingCount || 0}</span>
                            <span className="opacity-90">Following</span>
                        </button>
                        <span className="inline-flex items-center gap-1">
                            <span className="font-semibold text-gray-100">{profile.discussionsStarted || 0}</span> Discussions Started
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <span className="font-semibold text-gray-100">{profile.discussionsParticipated || 0}</span> Participated
                        </span>
                        {user && user.username === profile.username && (
                            <ModleSummary username={profile.username} />
                        )}
                    </div>

                    {/* Row 4: Action Buttons (Under stats) */}
                    <div className="w-full flex justify-center sm:justify-start">
                        {user ? (
                            user.username === profile.username ? null : (
                                <div className="flex items-center gap-2">
                                    {/* Message Button */}
                                    <button 
                                        onClick={() => navigate(`/messages?user=${profile.username}`)}
                                        className="btn btn-ghost border border-gray-600 px-4 py-1.5 text-sm flex items-center gap-2 hover:bg-gray-700 transition-colors"
                                        title={`Message ${profile.username}`}
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        <span>Message</span>
                                    </button>

                                    {/* Follow/Unfollow Button */}
                                    <button 
                                        onClick={onFollowToggle} 
                                        className={`btn ${isFollowing ? 'btn-ghost text-red-500 border border-gray-700' : 'btn-primary'} px-6 py-1.5 text-sm`}
                                    >
                                        {isFollowing ? 'Unfollow' : 'Follow'}
                                    </button>
                                </div>
                            )
                        ) : (
                            <button onClick={() => navigate('/login')} className="btn btn-ghost px-3 py-1 text-sm">Log in to follow</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileHeader;