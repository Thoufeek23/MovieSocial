import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Send } from 'lucide-react';
import * as api from '../api';
import toast from 'react-hot-toast';
import Avatar from './Avatar';

// 1. Added 'rank' to the destructured props
const ShareModal = ({ isOpen, onClose, defaultMessage, title, review, discussion, rank }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState(defaultMessage);
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const searchTimeout = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedUser(null);
      // 2. Update check to include 'rank'
      if ((review || discussion || rank) && defaultMessage && defaultMessage.includes('http')) {
          setMessage(''); 
      } else {
          setMessage(defaultMessage || '');
      }
    }
  }, [isOpen, defaultMessage, review, discussion, rank]); // 3. Add rank to dependency array

  const handleSearch = (text) => {
    setQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    if (!text.trim()) {
      setResults([]);
      return;
    }

    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const { data } = await api.searchUsers(text);
        setResults(data || []);
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleSend = async () => {
    // 4. Allow empty message if rank is present
    if (!selectedUser || (!message.trim() && !review && !discussion && !rank)) return;
    
    setSending(true);
    try {
      const attachments = {};
      if (review) attachments.reviewId = review._id;
      if (discussion) attachments.discussionId = discussion._id;
      // 5. CRITICAL: Attach rankId here so backend receives it
      if (rank) attachments.rankId = rank._id;

      await api.sendMessage(selectedUser.username, message, attachments);
      toast.success(`Shared with ${selectedUser.username}`);
      onClose();
    } catch (error) {
      toast.error('Failed to send message');
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 w-full max-w-md rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
          <h3 className="font-bold text-lg text-white">{title || 'Share via DM'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* User Search */}
          {!selectedUser ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-500" size={18} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search for a user..."
                  className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              
              <div className="h-48 overflow-y-auto custom-scrollbar space-y-1">
                {searching ? (
                  <div className="text-center py-4 text-gray-500 text-sm">Searching...</div>
                ) : results.length > 0 ? (
                  results.map(user => (
                    <button
                      key={user._id}
                      onClick={() => { setSelectedUser(user); setQuery(''); }}
                      className="w-full flex items-center gap-3 p-2 hover:bg-gray-800 rounded-lg transition-colors group text-left"
                    >
                      <Avatar username={user.username} avatar={user.avatar} sizeClass="w-8 h-8" />
                      <span className="text-gray-200 font-medium group-hover:text-white">{user.username}</span>
                    </button>
                  ))
                ) : query ? (
                  <div className="text-center py-4 text-gray-500 text-sm">No users found</div>
                ) : (
                  <div className="text-center py-4 text-gray-600 text-sm italic">Type to find friends</div>
                )}
              </div>
            </div>
          ) : (
            /* Selected User View */
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3">
                  <Avatar username={selectedUser.username} avatar={selectedUser.avatar} sizeClass="w-10 h-10" />
                  <div>
                    <div className="text-sm text-gray-400">Sending to</div>
                    <div className="font-bold text-white">{selectedUser.username}</div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="text-xs text-green-400 hover:text-green-300 hover:underline"
                >
                  Change
                </button>
              </div>

              {/* Content Preview */}
              {(review || discussion || rank) && (
                <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1 uppercase font-semibold">
                        Sharing {review ? 'Review' : (discussion ? 'Discussion' : 'Rank List')}
                    </div>
                    <div className="flex gap-3 items-center">
                        <img 
                            src={
                                review ? `https://image.tmdb.org/t/p/w92${review.moviePoster}` : 
                                discussion ? (discussion.poster_path ? `https://image.tmdb.org/t/p/w92${discussion.poster_path}` : '/default_dp.png') :
                                rank ? (rank.movies?.[0]?.posterPath ? `https://image.tmdb.org/t/p/w92${rank.movies[0].posterPath}` : '/default_dp.png') : 
                                '/default_dp.png'
                            } 
                            alt="poster" 
                            className="w-10 h-14 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-white truncate">
                                {review ? review.movieTitle : (discussion ? discussion.title : rank?.title)}
                            </div>
                            {/* Subtitle for Rank */}
                            {rank && <div className="text-xs text-gray-400 italic truncate">{rank.movies.length} movies</div>}
                            {review && <div className="text-xs text-gray-400 italic truncate">"{review.text}"</div>}
                        </div>
                    </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm text-gray-400 font-medium">Message (Optional)</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write something..."
                  className="w-full h-24 bg-gray-950 border border-gray-700 rounded-lg p-3 text-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-green-500 resize-none"
                />
              </div>

              <button
                onClick={handleSend}
                disabled={sending || (!message.trim() && !review && !discussion && !rank)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={18} /> Send Message
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;