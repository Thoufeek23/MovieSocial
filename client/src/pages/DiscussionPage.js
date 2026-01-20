import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as api from '../api';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Avatar from '../components/Avatar';
import { Edit, Trash2, Share2 } from 'lucide-react'; // Added Share2
import ShareModal from '../components/ShareModal'; // Added Import

const DiscussionPage = () => {
  const { id } = useParams();
  const [discussion, setDiscussion] = useState(null);
  const [commentText, setCommentText] = useState('');
  const { user } = useContext(AuthContext);
  const [moviePoster, setMoviePoster] = useState(null);
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
  const [confirmState, setConfirmState] = useState({ open: false, title: '', onConfirm: null, loading: false, preview: '' });
  const [editingDiscussion, setEditingDiscussion] = useState(false);
  const [editDiscussionTitle, setEditDiscussionTitle] = useState('');
  
  // New Share State
  const [showShare, setShowShare] = useState(false);

  const showConfirm = (title, onConfirm, preview = '') => {
    setConfirmState({ open: true, title, onConfirm, loading: false, preview });
  };

  const handleConfirm = async () => {
    if (!confirmState.onConfirm) return setConfirmState({ open: false, title: '', onConfirm: null, loading: false });
    try {
      setConfirmState(s => ({ ...s, loading: true }));
      await confirmState.onConfirm();
    } catch (err) {
      console.error('confirm action failed', err);
    } finally {
      setConfirmState({ open: false, title: '', onConfirm: null, loading: false, preview: '' });
    }
  };

  // close confirm on Escape
  useEffect(() => {
    if (!confirmState.open) return;
    const onKey = (e) => { if (e.key === 'Escape') setConfirmState({ open: false, title: '', onConfirm: null, loading: false, preview: '' }); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmState.open]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.getDiscussion(id);
        setDiscussion(data);
        setEditDiscussionTitle(data.title);
        // try to fetch movie poster for display (use movieId from discussion)
        try {
          const movieRes = await api.getMovieDetails(data.movieId);
          setMoviePoster(movieRes.data.poster_path || null);
        } catch (err) {
          // ignore poster fetch errors
        }
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [id]);

  const timeAgo = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(days / 365);
    return `${years}y ago`;
  };

  const handleComment = async () => {
    if (!user) return toast.error('Log in to comment');
    if (!commentText.trim()) return;
    try {
      const { data } = await api.postDiscussionComment(id, { text: commentText });
      setDiscussion(data);
      setCommentText('');
      setSuggestions([]);
      setShowSuggestions(false);
      toast.success('Comment posted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to post comment');
    }
  };

  // discussion-level edit/delete handled elsewhere (not used here)

  const fetchSuggestions = async (q) => {
    if (!q) {
      setSuggestions([]); setShowSuggestions(false); return;
    }
    try {
      const res = await api.searchUsers(q);
      setSuggestions(res.data || []);
      setShowSuggestions(true);
      setSelectedSuggestion(0);
    } catch (err) {
      console.error('searchUsers failed', err);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleTextareaChange = (e) => {
    const val = e.target.value;
    const caret = e.target.selectionStart;
    setCommentText(val);

    // find the last '@' before caret that starts a word (preceded by space or line start)
    const upto = val.slice(0, caret);
    const atIndex = Math.max(upto.lastIndexOf('@'));
    if (atIndex === -1) {
      setMentionRange(null);
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    // ensure char before @ is whitespace or start
    if (atIndex > 0) {
      const before = upto[atIndex - 1];
      if (before !== ' ' && before !== '\n' && before !== '\t') {
        setMentionRange(null);
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
    }

    const query = upto.slice(atIndex + 1);
    // only letters/numbers/_ allowed in query
    if (!/^[a-zA-Z0-9_]{0,30}$/.test(query)) {
      setMentionRange(null);
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setMentionRange({ start: atIndex, end: caret });

    // debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, 250);
  };

  const applySuggestion = (username) => {
    if (!mentionRange) return;
    const before = commentText.slice(0, mentionRange.start);
    const after = commentText.slice(mentionRange.end);
    const inserted = `@${username} `; // add trailing space
    const newText = before + inserted + after;
    setCommentText(newText);
    setSuggestions([]);
    setShowSuggestions(false);
    setMentionRange(null);
    setSelectedSuggestion(-1);
    // set caret after inserted mention
    requestAnimationFrame(() => {
      const t = textareaRef.current;
      if (t) {
        const pos = before.length + inserted.length;
        t.focus();
        t.setSelectionRange(pos, pos);
      }
    });
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestion((s) => Math.min(s + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestion((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter') {
      // if suggestions are visible and a suggestion is selected, pick it
      if (selectedSuggestion >= 0 && suggestions[selectedSuggestion]) {
        e.preventDefault();
        applySuggestion(suggestions[selectedSuggestion].username);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestion(-1);
    }
  };

  const renderCommentText = (text) => {
    // split by @mentions like @username (alphanumeric and underscore)
    const parts = [];
    let lastIndex = 0;
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      const start = match.index;
      const username = match[1];
      if (start > lastIndex) parts.push(text.slice(lastIndex, start));
      parts.push({ mention: username });
      lastIndex = mentionRegex.lastIndex;
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex));

    return parts.map((p, i) => {
      if (typeof p === 'string') return <span key={i}>{p}</span>;
      return <Link key={i} to={`/profile/${p.mention}`} className="text-indigo-400 hover:underline font-medium">@{p.mention}</Link>;
    });
  };

  if (!discussion) return <p>Loading discussion...</p>;

  // Share content construction
  const shareUrl = `${window.location.origin}/discussion/${id}`;
  const shareText = `Check out this discussion on MovieSocial:\n\n"${discussion.title}"\n\n${shareUrl}`;

  const isDiscussionOwner = user && discussion.starter && (String(user.id || user._id) === String(discussion.starter._id));
  const canModifyDiscussion = isDiscussionOwner || user?.isAdmin;

  const handleEditDiscussion = async () => {
    try {
      await api.updateDiscussion(id, { title: editDiscussionTitle });
      setDiscussion({ ...discussion, title: editDiscussionTitle });
      setEditingDiscussion(false);
      toast.success('Discussion updated');
    } catch (err) {
      toast.error('Failed to update discussion');
    }
  };

  const handleDeleteDiscussion = async () => {
    showConfirm('Delete this discussion?', async () => {
      try {
        await api.deleteDiscussion(id);
        toast.success('Discussion deleted');
        window.location.href = '/discussions';
      } catch (err) {
        toast.error('Failed to delete discussion');
      }
    });
  };

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-start gap-6">
        <div className="hidden md:block flex-shrink-0">
          {moviePoster ? (
            <img src={`https://image.tmdb.org/t/p/w300${moviePoster}`} alt="poster" className="w-36 rounded shadow-lg" />
          ) : (
            <div className="w-24 h-36 rounded bg-gray-800 flex items-center justify-center text-3xl font-bold">
              <Avatar username={discussion.starter?.username} sizeClass="w-20 h-32" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {editingDiscussion ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editDiscussionTitle}
                    onChange={(e) => setEditDiscussionTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-gray-700 rounded-md text-lg font-bold"
                    placeholder="Discussion title"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleEditDiscussion}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-md"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingDiscussion(false);
                        setEditDiscussionTitle(discussion.title);
                      }}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold rounded-md"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl md:text-4xl font-extrabold mb-2 leading-tight">{discussion.title}</h1>
                  <div className="text-sm text-gray-400">Started by <Link to={`/profile/${discussion.starter?.username}`} className="font-semibold text-gray-200 hover:underline">{discussion.starter?.username}</Link> • <span className="text-gray-400">{timeAgo(discussion.createdAt)}</span></div>
                  <div className="mt-2 text-sm text-gray-300">Movie: <span className="font-medium text-gray-100">{discussion.movieTitle}</span></div>
                </>
              )}
            </div>
            <div className="ml-4 flex flex-col items-end gap-2">
              <div className="flex gap-2">
                {canModifyDiscussion && !editingDiscussion && (
                  <>
                    <button
                      onClick={() => setEditingDiscussion(true)}
                      className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                      title="Edit discussion"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={handleDeleteDiscussion}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete discussion"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
                <button 
                  onClick={() => setShowShare(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-full transition-colors"
                >
                  <Share2 size={16} /> Share
                </button>
              </div>
              <div className="text-right text-sm text-gray-400">{discussion.comments.length} comments</div>
            </div>
          </div>

          <div className="bg-card border border-gray-800 rounded-lg p-4 mt-4 mb-6">
            <h2 className="text-lg font-semibold mb-3">Discussion</h2>
            {discussion.comments.length === 0 ? (
              <div className="text-gray-400 py-6 text-center">No comments yet. Be the first to share your thoughts.</div>
            ) : (
              <div className="space-y-4">
                {discussion.comments.map(c => (
                  <div key={c._id} className="flex gap-4 items-start bg-background border border-gray-800 rounded-lg p-4">
                    <div>
                      <Avatar username={c.user?.username || 'Unknown'} avatar={c.user?.avatar} sizeClass="w-12 h-12" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <Link to={`/profile/${c.user?.username || 'unknown'}`} className="font-semibold text-gray-100 hover:underline">{c.user?.username || 'Unknown User'}</Link>
                          <div className="text-xs text-gray-500">{timeAgo(c.createdAt)}</div>
                        </div>
                        <div className="text-sm text-gray-400 flex items-center gap-2">
                          {(user && c.user && (String(user.id || user._id) === String(c.user._id) || String(user.id || user._id) === String(discussion.starter?._id) || user.isAdmin)) && (
                            <>
                              {editingCommentId === c._id ? (
                                <div className="flex items-center gap-2">
                                  <button disabled={commentProcessing} onClick={async () => {
                                    // submit edit
                                    if (!editingCommentText.trim()) return toast.error('Comment cannot be empty');
                                    try {
                                      setCommentProcessing(true);
                                      const res = await api.editDiscussionComment(id, c._id, { text: editingCommentText });
                                      setDiscussion(res.data || res);
                                      setEditingCommentId(null);
                                      setEditingCommentText('');
                                      toast.success('Comment updated');
                                    } catch (err) {
                                      console.error(err);
                                      toast.error('Failed to update comment');
                                    } finally {
                                      setCommentProcessing(false);
                                    }
                                  }} className="text-sm bg-green-600 text-white px-2 py-1 rounded">Save</button>
                                  <button disabled={commentProcessing} onClick={() => { setEditingCommentId(null); setEditingCommentText(''); }} className="text-sm bg-gray-700 text-white px-2 py-1 rounded">Cancel</button>
                                </div>
                              ) : (
                                <>
                                  <button onClick={() => { setEditingCommentId(c._id); setEditingCommentText(c.text); }} className="text-gray-400 hover:text-white" title="Edit comment"><Edit size={14} /></button>
                                  <button onClick={() => showConfirm('Delete this comment?', async () => {
                                    setCommentProcessing(true);
                                    try {
                                      const res = await api.deleteDiscussionComment(id, c._id);
                                      setDiscussion(res.data || res);
                                      toast.success('Comment deleted');
                                    } catch (err) {
                                      console.error(err);
                                      toast.error('Failed to delete comment');
                                    } finally {
                                      setCommentProcessing(false);
                                    }
                                  })} className="text-gray-400 hover:text-red-500" title="Delete comment"><Trash2 size={14} /></button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 text-gray-200 leading-relaxed">
                        {editingCommentId === c._id ? (
                          <textarea value={editingCommentText} onChange={(e) => setEditingCommentText(e.target.value)} className="w-full p-3 rounded bg-gray-800 text-white resize-none" rows={3} />
                        ) : (
                          renderCommentText(c.text)
                        )}
                      </div>

                      {/* Replies list */}
                      {c.replies && c.replies.length > 0 && (
                        <div className="mt-3 ml-14 space-y-3">
                          {c.replies.map(r => (
                            <div key={r._id} className="flex gap-3 items-start">
                              <div>
                                <Avatar username={r.user?.username || 'Unknown'} avatar={r.user?.avatar} sizeClass="w-8 h-8" />
                              </div>
                              <div className="flex-1 bg-[#0f0f10] border border-gray-800 rounded-md p-3 text-sm text-gray-200">
                                <div className="flex items-center justify-between">
                                  <div className="font-semibold text-gray-100">{r.user?.username || 'Unknown User'} <span className="text-xs text-gray-500">• {timeAgo(r.createdAt)}</span></div>
                                  <div className="text-sm text-gray-400">
                                    {(user && r.user && (String(user.id || user._id) === String(r.user._id) || String(user.id || user._id) === String(discussion.starter?._id) || user.isAdmin)) && (
                                      <button onClick={() => showConfirm('Delete this reply?', async () => {
                                        setCommentProcessing(true);
                                        try {
                                          const res = await api.deleteDiscussionReply(id, c._id, r._id);
                                          setDiscussion(res.data || res);
                                          toast.success('Reply deleted');
                                        } catch (err) {
                                          console.error(err);
                                          toast.error('Failed to delete reply');
                                        } finally {
                                          setCommentProcessing(false);
                                        }
                                      })} className="text-gray-400 hover:text-red-500">Delete</button>
                                    )}
                                  </div>
                                </div>
                                <div className="mt-1">{renderCommentText(r.text)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply action + inline reply box */}
                      <div className="mt-3 ml-14 flex items-center gap-3">
                        <button onClick={() => setReplyBoxes(prev => ({ ...prev, [c._id]: prev[c._id] ? '' : '' }))} className="text-sm text-gray-400 hover:text-gray-200">Reply</button>
                        {replyBoxes[c._id] !== undefined && (
                          <div className="flex-1">
                            <input
                              value={replyBoxes[c._id] || ''}
                              onChange={(e) => setReplyBoxes(prev => ({ ...prev, [c._id]: e.target.value }))}
                              className="w-full p-2 rounded bg-gray-900 text-gray-100"
                              placeholder="Write a reply..."
                            />
                          </div>
                        )}
                        {replyBoxes[c._id] !== undefined && (
                          <button onClick={async () => {
                            const text = (replyBoxes[c._id] || '').trim();
                            if (!user) return toast.error('Log in to reply');
                            if (!text) return toast.error('Reply cannot be empty');
                            try {
                              setCommentProcessing(true);
                              const res = await api.postDiscussionReply(id, c._id, { text });
                              setDiscussion(res.data || res);
                              setReplyBoxes(prev => ({ ...prev, [c._id]: undefined }));
                              toast.success('Reply posted');
                            } catch (err) {
                              console.error(err);
                              toast.error('Failed to post reply');
                            } finally {
                              setCommentProcessing(false);
                            }
                          }} className="bg-primary text-primary-foreground px-3 py-1 rounded">Send</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Small sticky comment bar: fixed to bottom and does not move as content grows */}
          <div className="h-20" />
          <div className="fixed left-0 right-0 bottom-0 z-40 bg-background border-t border-gray-800">
            <div className="max-w-6xl mx-auto px-4 py-3">
              <div className="flex justify-center">
                <div className="w-full max-w-3xl flex items-center gap-3">
                  <textarea
                    ref={textareaRef}
                    value={commentText}
                    onKeyDown={handleKeyDown}
                    onChange={handleTextareaChange}
                    className="flex-1 p-3 rounded bg-gray-900 text-gray-100 resize-none h-11 leading-tight placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    rows={1}
                    placeholder="Add a comment... Use @ to mention someone"
                    aria-label="Add a comment"
                  />

                  <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-400 hidden sm:block">{commentText.length}/1000</div>
                    <button onClick={handleComment} aria-label="Post comment" className="bg-primary hover:bg-green-700 text-primary-foreground p-3 rounded-full shadow-lg">
                      {/* Paper plane / send icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <path d="M22 2L11 13" />
                        <path d="M22 2L15 22l-4-9-9-4 20-7z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Suggestions dropdown placed above the fixed bar when needed */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="mt-2 max-w-3xl mx-auto bg-gray-900 border border-gray-700 rounded shadow-lg z-50 max-h-56 overflow-auto">
                  {suggestions.map((s, idx) => (
                    <div key={s.username} onMouseDown={(e) => { e.preventDefault(); applySuggestion(s.username); }} className={`p-3 cursor-pointer flex items-center gap-3 ${idx === selectedSuggestion ? 'bg-indigo-700' : 'hover:bg-gray-800'}`}>
                      <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-sm overflow-hidden">
                        {s.avatar ? <img src={s.avatar} alt={s.username} className="w-full h-full object-cover" /> : <span className="font-semibold">{s.username?.[0]}</span>}
                      </div>
                      <div>
                        <div className={`text-sm ${idx === selectedSuggestion ? 'text-white' : 'text-gray-100'}`}>{s.username}</div>
                        <div className={`text-xs ${idx === selectedSuggestion ? 'text-indigo-200' : 'text-gray-400'}`}>User</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    {/* Share Modal Component */}
    <ShareModal 
      isOpen={showShare} 
      onClose={() => setShowShare(false)} 
      defaultMessage={shareText}
      title="Share Discussion"
      discussion={discussion}
    />

    {confirmState.open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmState({ open: false, title: '', onConfirm: null, loading: false })} />
        <div className="relative max-w-lg w-full bg-card border border-gray-800 rounded-lg p-6 z-60">
          <div className="text-lg font-semibold mb-3">{confirmState.title}</div>
          <div className="flex justify-end items-center gap-3">
            <button onClick={() => setConfirmState({ open: false, title: '', onConfirm: null, loading: false })} className="px-3 py-2 rounded bg-gray-700 text-gray-200">Cancel</button>
            <button onClick={handleConfirm} disabled={confirmState.loading} className="px-4 py-2 rounded bg-primary text-primary-foreground">{confirmState.loading ? 'Deleting...' : 'Delete'}</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default DiscussionPage;