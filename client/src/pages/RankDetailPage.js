import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import * as api from '../api';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Avatar from '../components/Avatar';
import { Edit, Trash2, Heart, Share2, Pencil, X } from 'lucide-react';
import ShareModal from '../components/ShareModal';
import CreateRank from '../components/CreateRank';
import { AnimatePresence, motion } from 'framer-motion';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const RankDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rank, setRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const { user } = useContext(AuthContext);
  
  // Comment & Mention State
  const textareaRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionRange, setMentionRange] = useState(null); 
  const debounceRef = useRef(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [commentProcessing, setCommentProcessing] = useState(false);
  const [replyBoxes, setReplyBoxes] = useState({}); 
  const [confirmState, setConfirmState] = useState({ open: false, title: '', onConfirm: null, loading: false });
  const [showShare, setShowShare] = useState(false);

  // Edit Rank State
  const [isEditOpen, setIsEditOpen] = useState(false);

  const loadRank = async () => {
    try {
      const { data } = await api.getRank(id);
      setRank(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load rank');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRank();
  }, [id]);

  const handleLike = async () => {
    if (!user) return toast.error('Please login to like this list');
    
    // Optimistic update
    setRank(prev => {
      const userId = user._id || user.id;
      const hasLiked = prev.likes.includes(userId);
      return {
        ...prev,
        likes: hasLiked ? prev.likes.filter(id => id !== userId) : [...prev.likes, userId]
      };
    });

    try {
      await api.likeRank(rank._id);
    } catch (error) {
      console.error(error);
      toast.error('Failed to like rank');
      loadRank(); // Revert on error
    }
  };

  const showConfirm = (title, onConfirm) => {
    setConfirmState({ open: true, title, onConfirm, loading: false });
  };

  const handleConfirm = async () => {
    if (!confirmState.onConfirm) return setConfirmState({ open: false, title: '', onConfirm: null, loading: false });
    try {
      setConfirmState(s => ({ ...s, loading: true }));
      await confirmState.onConfirm();
    } catch (err) {
      console.error('confirm action failed', err);
    } finally {
      setConfirmState({ open: false, title: '', onConfirm: null, loading: false });
    }
  };

  const handleDeleteRank = async () => {
    if (!window.confirm('Are you sure you want to delete this ranking list? This cannot be undone.')) return;
    
    try {
      await api.deleteRank(id);
      toast.success('Rank deleted successfully');
      navigate('/ranks'); 
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete rank');
    }
  };

  const handleEditSuccess = () => {
    setIsEditOpen(false);
    loadRank();
    toast.success('Rank updated');
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  // --- COMMENT SYSTEM ---
  const handleComment = async () => {
    if (!user) return toast.error('Log in to comment');
    if (!commentText.trim()) return;
    try {
      const { data } = await api.postRankComment(id, { text: commentText });
      setRank(data);
      setCommentText('');
      setSuggestions([]);
      setShowSuggestions(false);
      toast.success('Comment posted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to post comment');
    }
  };

  const fetchSuggestions = async (q) => {
    if (!q) { setSuggestions([]); setShowSuggestions(false); return; }
    try {
      const res = await api.searchUsers(q);
      setSuggestions(res.data || []);
      setShowSuggestions(true);
      setSelectedSuggestion(0);
    } catch (err) { setSuggestions([]); setShowSuggestions(false); }
  };

  const handleTextareaChange = (e) => {
    const val = e.target.value;
    const caret = e.target.selectionStart;
    setCommentText(val);

    const upto = val.slice(0, caret);
    const atIndex = Math.max(upto.lastIndexOf('@'));
    if (atIndex === -1) { setMentionRange(null); setSuggestions([]); setShowSuggestions(false); return; }
    if (atIndex > 0) {
      const before = upto[atIndex - 1];
      if (before !== ' ' && before !== '\n' && before !== '\t') { setMentionRange(null); setSuggestions([]); setShowSuggestions(false); return; }
    }

    const query = upto.slice(atIndex + 1);
    if (!/^[a-zA-Z0-9_]{0,30}$/.test(query)) { setMentionRange(null); setSuggestions([]); setShowSuggestions(false); return; }

    setMentionRange({ start: atIndex, end: caret });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 250);
  };

  const applySuggestion = (username) => {
    if (!mentionRange) return;
    const before = commentText.slice(0, mentionRange.start);
    const after = commentText.slice(mentionRange.end);
    const inserted = `@${username} `;
    setCommentText(before + inserted + after);
    setSuggestions([]); setShowSuggestions(false); setMentionRange(null); setSelectedSuggestion(-1);
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        const pos = before.length + inserted.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(pos, pos);
      }
    });
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedSuggestion(s => Math.min(s + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedSuggestion(s => Math.max(s - 1, 0)); }
    else if (e.key === 'Enter') { 
      if (selectedSuggestion >= 0 && suggestions[selectedSuggestion]) { e.preventDefault(); applySuggestion(suggestions[selectedSuggestion].username); }
    } else if (e.key === 'Escape') { setShowSuggestions(false); setSelectedSuggestion(-1); }
  };

  const renderCommentText = (text) => {
    const parts = [];
    let lastIndex = 0;
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      const start = match.index;
      if (start > lastIndex) parts.push(text.slice(lastIndex, start));
      parts.push({ mention: match[1] });
      lastIndex = mentionRegex.lastIndex;
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex));

    return parts.map((p, i) => {
      if (typeof p === 'string') return <span key={i}>{p}</span>;
      return <Link key={i} to={`/profile/${p.mention}`} className="text-indigo-400 hover:underline font-medium">@{p.mention}</Link>;
    });
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto p-4 pt-10">
       <Skeleton height={40} width="60%" baseColor="#202020" highlightColor="#444" />
       <Skeleton height={20} width="40%" className="mt-4" baseColor="#202020" highlightColor="#444" />
    </div>
  );

  if (!rank) return <div className="text-center py-20 text-gray-400">Rank not found</div>;

  const isLiked = user && rank.likes.includes(user._id || user.id);
  const shareText = `Check out this ranking list on MovieSocial:\n\n"${rank.title}"\n\n${window.location.origin}/rank/${id}`;

  return (
    <>
    <div className="max-w-5xl mx-auto px-4 pb-32">
        {/* RANK HEADER */}
        <div className="py-8">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4">{rank.title}</h1>
            {rank.description && <p className="text-gray-300 text-lg mb-6 leading-relaxed max-w-3xl">{rank.description}</p>}
            
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-6">
                <div className="flex items-center gap-3">
                    <Avatar user={rank.user} sizeClass="w-10 h-10" />
                    <div>
                        <div className="text-white font-medium">Created by <Link to={`/profile/${rank.user?.username}`} className="hover:underline text-primary">{rank.user?.username}</Link></div>
                        <div className="text-sm text-gray-500">{timeAgo(rank.createdAt)}</div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                     <button 
                        onClick={handleLike}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors ${
                            isLiked ? 'bg-red-500/10 text-red-500' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                     >
                        <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                        <span>{rank.likes.length}</span>
                     </button>
                     <button 
                        onClick={() => setShowShare(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-full transition-colors"
                     >
                        <Share2 size={20} /> Share
                     </button>

                     {/* --- OWNER ACTIONS (Edit & Delete) --- */}
                     {user && rank.user && (String(user._id || user.id) === String(rank.user._id || rank.user.id) || user?.isAdmin === true) && (
                        <>
                            {/* Only show edit button for owner */}
                            {String(user._id || user.id) === String(rank.user._id || rank.user.id) && (
                                <button 
                                    onClick={() => setIsEditOpen(true)}
                                    className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full transition-colors"
                                    title="Edit Rank"
                                >
                                    <Pencil size={20} />
                                </button>
                            )}
                            {/* Show delete button for owner and admin */}
                            <button 
                                onClick={handleDeleteRank}
                                className="p-2 bg-gray-800 hover:bg-red-900/20 text-gray-300 hover:text-red-500 rounded-full transition-colors"
                                title="Delete Rank"
                            >
                                <Trash2 size={20} />
                            </button>
                        </>
                     )}
                </div>
            </div>
        </div>

        {/* RANKED MOVIES LIST */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mb-12">
            {rank.movies.map((movie) => (
                <div key={movie._id} className="bg-card p-4 rounded-xl border border-gray-800 flex items-center gap-4 hover:border-gray-700 transition-colors">
                    <div className="flex-shrink-0 relative">
                        <Link to={`/movie/${movie.movieId}`}>
                            <img 
                                src={movie.posterPath ? `https://image.tmdb.org/t/p/w200${movie.posterPath}` : '/assets/images/poster1.png'} 
                                alt={movie.title}
                                className="w-16 h-24 object-cover rounded shadow-md"
                            />
                        </Link>
                        <div className="absolute -top-2 -left-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 border-background">
                            {movie.rank}
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                         <Link to={`/movie/${movie.movieId}`} className="text-lg font-bold text-white hover:text-primary transition-colors truncate block">
                            {movie.title}
                         </Link>
                         <div className="text-gray-500 text-sm mt-1">{movie.year || '—'}</div>
                    </div>
                </div>
            ))}
        </div>

        {/* COMMENTS SECTION */}
        <div className="max-w-3xl">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                Comments <span className="text-gray-500 text-lg font-normal">({rank.comments.length})</span>
            </h3>

            {rank.comments.length === 0 ? (
                <div className="text-gray-500 py-8 italic border border-dashed border-gray-800 rounded-lg text-center mb-8">
                    No comments yet. Start the discussion!
                </div>
            ) : (
                <div className="space-y-6 mb-10">
                    {rank.comments.map(c => (
                        <div key={c._id} className="flex gap-4">
                             <Avatar user={c.user} sizeClass="w-10 h-10" />
                             <div className="flex-1">
                                <div className="bg-card border border-gray-800 rounded-xl p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <Link to={`/profile/${c.user?.username}`} className="font-bold text-white hover:underline">{c.user?.username}</Link>
                                            <span className="text-xs text-gray-500">{timeAgo(c.createdAt)}</span>
                                        </div>
                                        
                                        {/* Actions */}
                                        {(user && c.user && (String(user.id || user._id) === String(c.user._id) || String(user.id || user._id) === String(rank.user._id) || user?.isAdmin === true)) && (
                                            <div className="flex gap-2">
                                                {editingCommentId === c._id ? (
                                                     <div className="flex gap-2">
                                                         <button disabled={commentProcessing} onClick={async () => {
                                                             if (!editingCommentText.trim()) return toast.error('Empty comment');
                                                             setCommentProcessing(true);
                                                             try {
                                                                 const res = await api.editRankComment(id, c._id, { text: editingCommentText });
                                                                 setRank(res.data); setEditingCommentId(null); toast.success('Updated');
                                                             } catch (e) { toast.error('Failed'); } finally { setCommentProcessing(false); }
                                                         }} className="text-xs bg-green-600 text-white px-2 py-1 rounded">Save</button>
                                                         <button onClick={() => setEditingCommentId(null)} className="text-xs bg-gray-700 text-white px-2 py-1 rounded">Cancel</button>
                                                     </div>
                                                ) : (
                                                    <>
                                                        {/* Only show edit button for comment author */}
                                                        {String(user.id || user._id) === String(c.user._id) && (
                                                            <button onClick={() => { setEditingCommentId(c._id); setEditingCommentText(c.text); }} className="text-gray-400 hover:text-white"><Edit size={14}/></button>
                                                        )}
                                                        {/* Show delete button for comment author, rank owner, and admin */}
                                                        <button onClick={() => showConfirm('Delete comment?', async () => {
                                                            setCommentProcessing(true);
                                                            try {
                                                                const res = await api.deleteRankComment(id, c._id);
                                                                setRank(res.data); toast.success('Deleted');
                                                            } catch (e) { toast.error('Failed'); } finally { setCommentProcessing(false); }
                                                        })} className="text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {editingCommentId === c._id ? (
                                        <textarea value={editingCommentText} onChange={e => setEditingCommentText(e.target.value)} className="w-full bg-gray-900 p-2 rounded text-white" />
                                    ) : (
                                        <div className="text-gray-200 text-sm leading-relaxed">{renderCommentText(c.text)}</div>
                                    )}
                                </div>

                                {/* REPLIES */}
                                {c.replies && c.replies.length > 0 && (
                                    <div className="mt-2 ml-4 space-y-2 pl-4 border-l-2 border-gray-800">
                                        {c.replies.map(r => (
                                            <div key={r._id} className="bg-gray-900/50 p-3 rounded-lg border border-gray-800/50">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Avatar user={r.user} sizeClass="w-5 h-5" />
                                                        <span className="font-semibold text-xs text-gray-300">{r.user?.username}</span>
                                                        <span className="text-[10px] text-gray-600">{timeAgo(r.createdAt)}</span>
                                                    </div>
                                                    {(user && r.user && (String(user.id || user._id) === String(r.user._id) || String(user.id || user._id) === String(rank.user._id) || user?.isAdmin === true)) && (
                                                        <button onClick={() => showConfirm('Delete reply?', async () => {
                                                            setCommentProcessing(true);
                                                            try {
                                                                const res = await api.deleteRankReply(id, c._id, r._id);
                                                                setRank(res.data); toast.success('Deleted');
                                                            } catch (e) { toast.error('Failed'); } finally { setCommentProcessing(false); }
                                                        })} className="text-gray-500 hover:text-red-500"><Trash2 size={12}/></button>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-400">{renderCommentText(r.text)}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Reply Input */}
                                <div className="mt-2 flex items-center gap-2">
                                     <button onClick={() => setReplyBoxes(p => ({ ...p, [c._id]: p[c._id] === undefined ? '' : undefined }))} className="text-xs font-semibold text-gray-500 hover:text-gray-300 ml-1">
                                         Reply
                                     </button>
                                </div>
                                {replyBoxes[c._id] !== undefined && (
                                    <div className="mt-2 flex gap-2">
                                        <input 
                                            value={replyBoxes[c._id]} 
                                            onChange={e => setReplyBoxes(p => ({ ...p, [c._id]: e.target.value }))}
                                            className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:border-primary focus:outline-none"
                                            placeholder="Write a reply..."
                                        />
                                        <button onClick={async () => {
                                            if (!replyBoxes[c._id]?.trim()) return;
                                            setCommentProcessing(true);
                                            try {
                                                const res = await api.postRankReply(id, c._id, { text: replyBoxes[c._id] });
                                                setRank(res.data); setReplyBoxes(p => ({ ...p, [c._id]: undefined }));
                                            } catch (e) { toast.error('Failed'); } finally { setCommentProcessing(false); }
                                        }} className="bg-primary text-white text-xs px-3 rounded font-bold">Post</button>
                                    </div>
                                )}
                             </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>

    {/* FIXED BOTTOM BAR */}
    <div className="fixed left-0 right-0 bottom-0 z-40 bg-background border-t border-gray-800 p-3">
        <div className="max-w-3xl mx-auto relative">
             {showSuggestions && suggestions.length > 0 && (
                <div className="absolute bottom-full left-0 w-full mb-2 bg-gray-900 border border-gray-700 rounded shadow-lg max-h-48 overflow-auto">
                    {suggestions.map((s, i) => (
                        <div key={s.username} onMouseDown={e => { e.preventDefault(); applySuggestion(s.username); }} className={`p-2 flex gap-2 cursor-pointer ${i === selectedSuggestion ? 'bg-primary/20' : 'hover:bg-white/5'}`}>
                             <Avatar user={s} sizeClass="w-6 h-6" />
                             <span className="text-sm text-gray-200">{s.username}</span>
                        </div>
                    ))}
                </div>
             )}
             <div className="flex gap-3 items-center">
                 <textarea
                    ref={textareaRef}
                    value={commentText}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Add a comment... (@ to mention)"
                    className="flex-1 bg-gray-900 text-white rounded-lg px-4 py-3 resize-none h-12 focus:outline-none focus:ring-1 focus:ring-primary border border-gray-800"
                 />
                 <button onClick={handleComment} className="bg-primary hover:bg-primary/90 text-white p-3 rounded-full transition-colors shadow-lg shadow-primary/20">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                 </button>
             </div>
        </div>
    </div>

    {/* MODALS */}
    <ShareModal 
        isOpen={showShare} 
        onClose={() => setShowShare(false)} 
        defaultMessage={shareText} 
        title="Share Rank"
        rank={rank} // Added rank prop here
    />
    
    {confirmState.open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-card border border-gray-800 rounded-lg p-6 w-full max-w-sm">
          <div className="text-lg font-semibold text-white mb-4">{confirmState.title}</div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setConfirmState({ open: false, title: '', onConfirm: null, loading: false })} className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600">Cancel</button>
            <button onClick={handleConfirm} disabled={confirmState.loading} className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700">{confirmState.loading ? '...' : 'Confirm'}</button>
          </div>
        </div>
      </div>
    )}

    {/* EDIT RANK MODAL */}
    <AnimatePresence>
        {isEditOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setIsEditOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }} 
              onClick={(e) => e.stopPropagation()} 
              className="bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-800 flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-800 sticky top-0 bg-zinc-900 z-10 rounded-t-2xl">
                <h2 className="text-2xl font-bold text-white">Edit Rank</h2>
                <button onClick={() => setIsEditOpen(false)} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <CreateRank 
                    initialData={rank} 
                    onSuccess={handleEditSuccess} 
                    onCancel={() => setIsEditOpen(false)} 
                />
              </div>
            </motion.div>
          </motion.div>
        )}
    </AnimatePresence>
    </>
  );
};

export default RankDetailPage;