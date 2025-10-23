// src/components/DiscussionListSection.js
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from './EmptyState';
import BookmarkButton from './BookmarkButton';
import { AuthContext } from '../context/AuthContext';

const DiscussionListSection = ({ title, discussions, emptyMessage, emptyCtaText, emptyCtaLink, showDelete, onDelete }) => {
    const { user } = useContext(AuthContext);

    return (
        <div className="mb-10">
            <h2 className="text-2xl font-bold border-b-2 border-gray-700 pb-2 mb-4">{title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {discussions.length === 0 ? (
                    <EmptyState message={emptyMessage} ctaText={emptyCtaText} ctaLink={emptyCtaLink} />
                ) : (
                    discussions.map(d => (
                        <div key={d._id} className="relative group bg-card p-4 rounded-lg">
                            <div className="flex items-start gap-4">
                                <img
                                    src={d.poster_path ? `https://image.tmdb.org/t/p/w154${d.poster_path}` : '/default_dp.png'}
                                    alt="poster"
                                    className="w-20 h-28 rounded shadow-sm object-cover"
                                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/default_dp.png'; }}
                                />
                                <div className="flex-1">
                                    <Link to={`/discussions/${d._id}`} className="font-semibold text-lg line-clamp-2 hover:text-primary transition-colors">{d.title}</Link>
                                    <div className="text-sm text-gray-400">Movie: {d.movieTitle} • {d.comments?.length || 0} comments</div>
                                    {/* Show starter for bookmarked list */}
                                    {!showDelete && d.starter?.username && (
                                         <div className="mt-2 text-sm text-gray-400">Started by {d.starter.username}</div>
                                    )}
                                </div>
                            </div>
                            <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <BookmarkButton id={d._id} />
                                {showDelete && user && (
                                    <button 
                                        onClick={() => onDelete(d._id)} // Pass ID to handler
                                        className="bg-red-600 px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DiscussionListSection;