import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as api from '../api';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Avatar from '../components/Avatar';
import { Edit, Trash2 } from 'lucide-react';

const DiscussionPage = () => {
  const { id } = useParams();
  const [discussion, setDiscussion] = useState(null);
  const [commentText, setCommentText] = useState('');
  const { user } = useContext(AuthContext);
  const [moviePoster, setMoviePoster] = useState(null);
  const textareaRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionRange, setMentionRange] = useState(null); // { start, end }
  const debounceRef = useRef(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [commentProcessing, setCommentProcessing] = useState(false);
  const [pendingDeleteCommentId, setPendingDeleteCommentId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.getDiscussion(id);
        setDiscussion(data);
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

  // whether the current user started this discussion
  const isStarter = !!user && !!discussion && String(user.id || user._id) === String(discussion.starter?._id || discussion.starter?._id);

  const handleDeleteDiscussion = async () => {
    if (!user) return toast.error('Not authorized');
    if (!window.confirm('Delete this discussion? This cannot be undone.')) return;
    try {
      await api.deleteDiscussion(id);
      toast.success('Discussion deleted');
      window.location.href = '/discussions';
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete discussion');
    }
  };

  const handleEditDiscussion = async () => {
    const newTitle = window.prompt('Edit discussion title', discussion.title);
    if (newTitle === null) return; // cancelled
    try {
      const { data } = await api.updateDiscussion(id, { title: newTitle });
      setDiscussion(data);
      toast.success('Discussion updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update discussion');
    }
  };

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

  return (
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
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold mb-2 leading-tight">{discussion.title}</h1>
              <div className="text-sm text-gray-400">Started by <Link to={`/profile/${discussion.starter?.username}`} className="font-semibold text-gray-200 hover:underline">{discussion.starter?.username}</Link> • <span className="text-gray-400">{timeAgo(discussion.createdAt)}</span></div>
              <div className="mt-2 text-sm text-gray-300">Movie: <span className="font-medium text-gray-100">{discussion.movieTitle}</span></div>
            </div>
            <div className="ml-4">
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
                      <Avatar username={c.user.username} avatar={c.user.avatar} sizeClass="w-12 h-12" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <Link to={`/profile/${c.user.username}`} className="font-semibold text-gray-100 hover:underline">{c.user.username}</Link>
                          <div className="text-xs text-gray-500">{timeAgo(c.createdAt)}</div>
                        </div>
                        <div className="text-sm text-gray-400 flex items-center gap-2">
                          {(user && (String(user.id || user._id) === String(c.user._id) || String(user.id || user._id) === String(discussion.starter?._id))) && (
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
                              ) : pendingDeleteCommentId === c._id ? (
                                <div className="flex items-center gap-2">
                                  <button disabled={commentProcessing} onClick={async () => {
                                    try {
                                      setCommentProcessing(true);
                                      const res = await api.deleteDiscussionComment(id, c._id);
                                      setDiscussion(res.data || res);
                                      setPendingDeleteCommentId(null);
                                      toast.success('Comment deleted');
                                    } catch (err) {
                                      console.error(err);
                                      toast.error('Failed to delete comment');
                                    } finally {
                                      setCommentProcessing(false);
                                    }
                                  }} className="text-sm bg-red-600 text-white px-2 py-1 rounded">Confirm</button>
                                  <button disabled={commentProcessing} onClick={() => setPendingDeleteCommentId(null)} className="text-sm bg-gray-700 text-white px-2 py-1 rounded">Cancel</button>
                                </div>
                              ) : (
                                <>
                                  <button onClick={() => { setEditingCommentId(c._id); setEditingCommentText(c.text); }} className="text-gray-400 hover:text-white" title="Edit comment"><Edit size={14} /></button>
                                  <button onClick={() => setPendingDeleteCommentId(c._id)} className="text-gray-400 hover:text-red-500" title="Delete comment"><Trash2 size={14} /></button>
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card border border-gray-800 rounded-lg p-4">
            <div className="relative">
              <textarea ref={textareaRef} value={commentText} onKeyDown={handleKeyDown} onChange={handleTextareaChange} className="w-full p-4 rounded bg-background text-gray-100 resize-none shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600" rows={5} placeholder="Share your thoughts... Use @ to mention someone" />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-3 w-80 md:w-96 top-full mt-2 bg-gray-900 border border-gray-700 rounded shadow-lg z-50 max-h-56 overflow-auto">
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
            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm text-gray-400">Be respectful and follow the community guidelines.</div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-400">{commentText.length}/1000</div>
                <button onClick={handleComment} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow">Post Comment</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscussionPage;
