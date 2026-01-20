import React, { useState, useEffect, useRef, useContext } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Send, ArrowLeft, Trash2, MessageSquare, Star } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import * as api from '../api';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// --- 1. NEW: CHAT REVIEW CARD (Compact version) ---
const ChatReviewCard = ({ review }) => {
    const { user } = useContext(AuthContext);
    const [myVote, setMyVote] = useState(null);

    // Initialize vote state
    useEffect(() => {
        if (user && review.agreementVotes) {
            const mine = review.agreementVotes.find(v =>
                String(v.user) === String(user._id) || String(v.user) === String(user.id)
            );
            setMyVote(mine ? Number(mine.value) : null);
        }
    }, [review, user]);

    const handleVote = async (e, value) => {
        e.preventDefault(); // Prevent navigation to movie page
        if (!user) return toast.error('Login to vote');
        try {
            setMyVote(value); // Optimistic update
            await api.voteReview(review._id, value);
        } catch (err) {
            console.error(err);
        }
    };

    if (!review) return null;

    return (
        <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl overflow-hidden mt-2 max-w-sm shadow-md transition-all hover:bg-gray-800 group/card">
            <Link to={`/movie/${review.movieId}`} className="block">
                <div className="flex p-3 gap-3">
                    <img
                        src={review.moviePoster ? `https://image.tmdb.org/t/p/w154${review.moviePoster}` : '/default_dp.png'}
                        alt={review.movieTitle}
                        className="w-12 h-18 object-cover rounded shadow-sm"
                    />
                    <div className="flex-1 min-w-0 flex flex-col">
                        <h4 className="font-bold text-gray-100 text-sm leading-tight truncate">{review.movieTitle}</h4>
                        <div className="flex items-center gap-1 my-1">
                            <Star size={12} className="text-yellow-500 fill-yellow-500" />
                            <span className="text-xs text-yellow-500 font-bold">{review.rating}/5</span>
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-2 italic">"{review.text}"</p>
                    </div>
                </div>

                {/* --- VOTE BUTTONS ADDED HERE --- */}
                <div className="flex gap-1 p-2 pt-0">
                    <button onClick={(e) => handleVote(e, 1)} className={`flex-1 py-1 text-[10px] rounded ${myVote === 1 ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>Agree</button>
                    <button onClick={(e) => handleVote(e, 0.5)} className={`flex-1 py-1 text-[10px] rounded ${myVote === 0.5 ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>Partial</button>
                    <button onClick={(e) => handleVote(e, 0)} className={`flex-1 py-1 text-[10px] rounded ${myVote === 0 ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>Disagree</button>
                </div>
            </Link>
        </div>
    );
};

// --- 2. EXISTING: CHAT DISCUSSION CARD ---
const ChatDiscussionCard = ({ discussion }) => {
    if (!discussion) return null;
    return (
        <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl overflow-hidden mt-2 max-w-sm shadow-md transition-all hover:bg-gray-800 group/card">
            <Link to={`/discussion/${discussion._id}`} className="flex p-3 gap-3">
                <img
                    src={discussion.poster_path ? `https://image.tmdb.org/t/p/w154${discussion.poster_path}` : '/default_dp.png'}
                    alt="poster"
                    className="w-14 h-20 object-cover rounded-lg shadow-sm"
                />
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h4 className="font-semibold text-gray-100 text-sm leading-tight mb-1 line-clamp-2">{discussion.title}</h4>
                    <div className="text-xs text-green-400 font-medium mb-2">{discussion.movieTitle}</div>

                    <div className="flex items-center gap-2 mt-auto">
                        <Avatar username={discussion.starter?.username} avatar={discussion.starter?.avatar} sizeClass="w-4 h-4" />
                        <span className="text-xs text-gray-400">{discussion.starter?.username}</span>
                    </div>
                </div>
            </Link>
        </div>
    );
};

// --- 3. NEW: CHAT RANK CARD ---
const ChatRankCard = ({ rank }) => {
    if (!rank) return null;
    // Get top 3 posters for preview
    const previewMovies = rank.movies?.slice(0, 3) || [];

    return (
        <div className="bg-gray-900/50 border border-gray-700/50 rounded-xl overflow-hidden mt-2 max-w-sm shadow-md transition-all hover:bg-gray-800 group/card">
            <Link to={`/rank/${rank._id}`} className="block p-3">
                <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-gray-100 text-sm leading-tight truncate pr-2">{rank.title}</h4>
                    <span className="text-[10px] bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded border border-green-800/30 whitespace-nowrap">
                        {rank.movies?.length || 0} movies
                    </span>
                </div>

                <div className="flex gap-1.5 overflow-hidden">
                    {previewMovies.map((movie, i) => (
                        <div key={i} className="relative w-12 aspect-[2/3] flex-shrink-0 bg-gray-800 rounded overflow-hidden">
                            <img
                                src={movie.posterPath ? `https://image.tmdb.org/t/p/w154${movie.posterPath}` : '/default_dp.png'}
                                alt={movie.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute top-0 left-0 bg-black/60 text-white text-[8px] px-1 font-bold">{movie.rank}</div>
                        </div>
                    ))}
                    {rank.movies?.length > 3 && (
                        <div className="w-12 aspect-[2/3] flex-shrink-0 bg-gray-800 rounded flex items-center justify-center text-xs text-gray-400 border border-gray-700 border-dashed">
                            +{rank.movies.length - 3}
                        </div>
                    )}
                </div>
            </Link>
        </div>
    );
};

const MessagesPage = () => {
    const { user, updateUnreadCount } = useContext(AuthContext);
    const location = useLocation();

    // State
    const [conversations, setConversations] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    // Refs
    const scrollRef = useRef();
    const inputRef = useRef();
    const socketRef = useRef();
    const currentChatRef = useRef();
    const searchTimeoutRef = useRef();

    // Parse query params
    const queryParams = new URLSearchParams(location.search);
    const initialChatUser = queryParams.get('user');

    // --- SOCKET.IO LOGIC ---
    useEffect(() => {
        currentChatRef.current = currentChat;
    }, [currentChat]);

    useEffect(() => {
        const socketUrl = process.env.REACT_APP_API_URL || 'https://moviesocial-backend-khd2.onrender.com';
        //const socketUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
        socketRef.current = io(socketUrl);
        const userId = user?._id || user?.id;

        if (userId) {
            socketRef.current.emit("join_room", userId);
        }

        socketRef.current.on("receive_message", (incomingMsg) => {
            const activeChat = currentChatRef.current;
            const senderUsername = incomingMsg.sender.username;
            const senderId = incomingMsg.sender._id || incomingMsg.sender;

            const isChattingWithSender = activeChat && (
                activeChat._id === senderId ||
                activeChat.username === senderUsername
            );

            if (isChattingWithSender) {
                setMessages(prev => [...prev, incomingMsg]);
            } else {
                if (updateUnreadCount) updateUnreadCount();
            }

            setConversations(prev => {
                const otherConvs = prev.filter(c => c.otherUser.username !== senderUsername);
                const existingConv = prev.find(c => c.otherUser.username === senderUsername);

                const newConv = {
                    otherUser: existingConv ? existingConv.otherUser : incomingMsg.sender,
                    lastMessage: incomingMsg,
                    unreadCount: isChattingWithSender ? 0 : (existingConv ? existingConv.unreadCount + 1 : 1)
                };

                return [newConv, ...otherConvs];
            });
        });

        return () => {
            socketRef.current?.disconnect();
        };
    }, [user, updateUnreadCount]);

    // Format helpers
    const formatTime = (date) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const formatConversationDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        if (messageDate.getTime() === today.getTime()) return formatTime(date);
        if (messageDate.getTime() === yesterday.getTime()) return 'Yesterday';
        return date.toLocaleDateString();
    };

    // Load Data
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const { data: convs } = await api.getConversations();
                setConversations(convs);

                if (initialChatUser) {
                    const found = convs.find(c => c.otherUser.username === initialChatUser);
                    if (found) {
                        handleSelectChat(found.otherUser);
                    } else {
                        try {
                            const { data: userProfile } = await api.getUserProfile(initialChatUser);
                            handleSelectChat(userProfile);
                        } catch (err) {
                            toast.error("User not found");
                        }
                    }
                } else if (convs.length > 0 && window.innerWidth > 768) {
                    handleSelectChat(convs[0].otherUser);
                }
            } catch (error) {
                console.error('Failed to load messages', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [initialChatUser, handleSelectChat]);

    // Auto-scroll
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSelectChat = async (chatUser) => {
        setCurrentChat(chatUser);
        setConversations(prev => prev.map(c =>
            c.otherUser.username === chatUser.username ? { ...c, unreadCount: 0 } : c
        ));

        try {
            const [msgsRes] = await Promise.all([
                api.getMessages(chatUser.username),
                api.markMessagesRead(chatUser.username)
            ]);
            setMessages(msgsRes.data);
            if (updateUnreadCount) updateUnreadCount();
        } catch (error) {
            toast.error('Failed to load conversation');
        } finally {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentChat) return;

        const tempId = Date.now();
        const msgContent = newMessage;

        setNewMessage('');
        inputRef.current?.focus();
        setSending(true);

        try {
            const optimisticMsg = {
                _id: tempId,
                content: msgContent,
                sender: { _id: user._id || user.id, username: user.username, avatar: user.avatar },
                createdAt: new Date().toISOString(),
                isOptimistic: true
            };
            setMessages(prev => [...prev, optimisticMsg]);

            const { data: sentMsg } = await api.sendMessage(currentChat.username, msgContent);

            setMessages(prev => prev.map(m => m._id === tempId ? sentMsg : m));
            setConversations(prev => {
                const filtered = prev.filter(c => c.otherUser.username !== currentChat.username);
                return [{
                    otherUser: currentChat,
                    lastMessage: sentMsg,
                    unreadCount: 0
                }, ...filtered];
            });
        } catch (error) {
            toast.error('Failed to send message');
            setMessages(prev => prev.filter(m => m._id !== tempId));
            setNewMessage(msgContent);
        } finally {
            setSending(false);
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    };

    const handleDeleteMessage = async (msgId) => {
        const confirmed = await new Promise((resolve) => {
            toast((t) => (
                <div className="flex items-center gap-3">
                    <span className="flex-1">Delete this message?</span>
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            resolve(true);
                        }}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-md"
                    >
                        Delete
                    </button>
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            resolve(false);
                        }}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold rounded-md"
                    >
                        Cancel
                    </button>
                </div>
            ), {
                duration: 5000,
            });
        });

        if (!confirmed) return;

        try {
            setMessages(prev => prev.filter(m => m._id !== msgId));
            await api.deleteMessage(msgId);
            toast.success('Message deleted');
        } catch (err) {
            toast.error("Failed to delete");
        }
    };

    const groupMessagesByDate = (msgs) => {
        const groups = {};
        msgs.forEach(msg => {
            const date = new Date(msg.createdAt).toDateString();
            if (!groups[date]) groups[date] = [];
            groups[date].push(msg);
        });
        return groups;
    };

    const isMessageFromMe = (msg) => {
        if (!user || !msg || !msg.sender) return false;
        const myId = String(user._id || user.id);
        const senderId = typeof msg.sender === 'object' ? (msg.sender._id || msg.sender.id) : msg.sender;
        return myId === String(senderId);
    };

    const groupedMessages = groupMessagesByDate(messages);

    // Search for users
    const handleSearchUsers = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            setSearching(false);
            return;
        }

        setSearching(true);
        try {
            const { data } = await api.searchUsers(query);
            // Filter out current user
            const filtered = data.filter(u => u.username !== user.username);
            setSearchResults(filtered);
        } catch (error) {
            console.error('Failed to search users', error);
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    // Debounced search
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            handleSearchUsers(searchQuery);
        }, 300);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery, handleSearchUsers]);

    const handleSelectSearchResult = async (selectedUser) => {
        setSearchQuery('');
        setSearchResults([]);
        await handleSelectChat(selectedUser);
    };

    return (
        <div className="flex h-[calc(100dvh-64px)] w-full bg-gray-950 text-gray-100 overflow-hidden relative">

            {/* --- LEFT SIDEBAR (List) --- */}
            <div className={`
                ${currentChat ? 'hidden md:flex' : 'flex'} 
                w-full md:w-80 lg:w-96 flex-col border-r border-gray-800 bg-gray-950 z-20 flex-shrink-0 h-full
            `}>
                <div className="p-5 border-b border-gray-800 bg-gray-950 flex-shrink-0 relative">
                    <h1 className="text-2xl font-bold text-white tracking-tight mb-4">Messages</h1>
                    
                    {/* Search Bar */}
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search users..."
                            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                        />
                        {searching && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>

                    {/* Search Results */}
                    {searchQuery && searchResults.length > 0 && (
                        <div className="absolute left-0 right-0 mx-5 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-30 max-h-64 overflow-y-auto">
                            {searchResults.map(u => (
                                <div
                                    key={u._id}
                                    onClick={() => handleSelectSearchResult(u)}
                                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-800 transition-colors border-b border-gray-800 last:border-b-0"
                                >
                                    <Avatar username={u.username} avatar={u.avatar} sizeClass="w-10 h-10" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-100 truncate">{u.username}</p>
                                        {u.bio && <p className="text-xs text-gray-500 truncate">{u.bio}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {searchQuery && !searching && searchResults.length === 0 && (
                        <div className="absolute left-0 right-0 mx-5 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-4 text-center text-gray-500 text-sm z-30">
                            No users found
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {!searchQuery && (
                        loading && !conversations.length ? (
                            <div className="p-4 space-y-4">
                                {Array(4).fill(0).map((_, index) => (
                                    <div key={index} className="flex items-center gap-4 p-4">
                                        <Skeleton 
                                            circle 
                                            width={48} 
                                            height={48}
                                            baseColor="rgba(255,255,255,0.05)"
                                            highlightColor="rgba(255,255,255,0.15)"
                                        />
                                        <div className="flex-1">
                                            <Skeleton 
                                                width="60%"
                                                height={16}
                                                baseColor="rgba(255,255,255,0.05)"
                                                highlightColor="rgba(255,255,255,0.15)"
                                                className="mb-2"
                                            />
                                            <Skeleton 
                                                width="40%"
                                                height={14}
                                                baseColor="rgba(255,255,255,0.05)"
                                                highlightColor="rgba(255,255,255,0.15)"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 mt-10">
                                <p>No conversations yet.</p>
                            </div>
                        ) : (
                            conversations.map(conv => (
                            <div
                                key={conv.otherUser._id}
                                onClick={() => handleSelectChat(conv.otherUser)}
                                className={`
                                    group flex items-center gap-4 p-4 cursor-pointer transition-all duration-200 border-b border-gray-900/50
                                    ${currentChat?.username === conv.otherUser.username
                                        ? 'bg-gray-900 border-l-4 border-l-green-600'
                                        : 'hover:bg-gray-900/50 border-l-4 border-l-transparent'}
                                `}
                            >
                                <Avatar username={conv.otherUser.username} avatar={conv.otherUser.avatar} sizeClass="w-12 h-12" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className={`truncate text-[15px] ${conv.unreadCount > 0 ? 'font-bold text-white' : 'font-medium text-gray-200'}`}>
                                            {conv.otherUser.username}
                                        </h3>
                                        <span className={`text-[11px] ${conv.unreadCount > 0 ? 'text-green-500 font-bold' : 'text-gray-500'}`}>
                                            {conv.lastMessage && formatConversationDate(conv.lastMessage.createdAt)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <p className={`text-sm truncate pr-2 ${conv.unreadCount > 0 ? 'text-gray-100 font-medium' : 'text-gray-500'}`}>
                                            {isMessageFromMe({ sender: conv.lastMessage?.sender }) && <span className="text-gray-400">You: </span>}
                                            {conv.lastMessage?.content || <span className="italic opacity-50">Attachment</span>}
                                        </p>
                                        {conv.unreadCount > 0 && (
                                            <span className="min-w-[18px] h-[18px] px-1.5 flex items-center justify-center bg-green-600 text-white text-[10px] font-bold rounded-full shadow-lg shadow-green-900/20">
                                                {conv.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ))}
                </div>
            </div>

            {/* --- RIGHT SIDE (Active Chat) --- */}
            <div className={`
                ${!currentChat ? 'hidden md:flex' : 'flex'} 
                flex-1 flex-col bg-black relative z-10 w-full h-full
            `}>
                {currentChat ? (
                    <>
                        <div className="h-16 px-4 md:px-6 flex items-center justify-between border-b border-gray-800 bg-gray-950/80 backdrop-blur-md sticky top-0 z-30 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setCurrentChat(null)}
                                    className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    <ArrowLeft size={20} />
                                </button>

                                <Link to={`/profile/${currentChat.username}`} className="flex items-center gap-3 group">
                                    <Avatar username={currentChat.username} avatar={currentChat.avatar} sizeClass="w-10 h-10" />
                                    <div>
                                        <h2 className="font-bold text-gray-100 group-hover:text-green-400 transition-colors">
                                            {currentChat.username}
                                        </h2>
                                    </div>
                                </Link>
                            </div>
                            <button className="text-gray-500 hover:text-white transition p-2">
                                {/*<MoreVertical size={20} />*/}
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 no-scrollbar bg-gradient-to-b from-gray-900 to-black">
                            {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                                <div key={date} className="space-y-6">
                                    <div className="flex justify-center">
                                        <span className="px-3 py-1 bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 text-[11px] font-medium text-gray-400 rounded-full">
                                            {date === new Date().toDateString() ? 'Today' : date}
                                        </span>
                                    </div>

                                    <div className="space-y-1">
                                        {dateMessages.map((msg, index) => {
                                            const isOwn = isMessageFromMe(msg);
                                            const isOptimistic = msg.isOptimistic;

                                            return (
                                                <div
                                                    key={msg._id || index}
                                                    className={`flex w-full group ${isOwn ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    <div className={`flex max-w-[85%] md:max-w-[65%] gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>

                                                        {!isOwn && (
                                                            <Link to={`/profile/${msg.sender?.username}`} className="flex-shrink-0 self-end mb-1">
                                                                <Avatar username={msg.sender?.username} avatar={msg.sender?.avatar} sizeClass="w-8 h-8" />
                                                            </Link>
                                                        )}

                                                        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                                                            {msg.content && (
                                                                <div
                                                                    className={`
                                                                    relative px-4 py-2.5 text-[15px] leading-relaxed shadow-sm
                                                                    ${isOwn
                                                                            ? 'bg-gradient-to-br from-green-600 to-emerald-700 text-white rounded-2xl rounded-br-sm'
                                                                            : 'bg-gray-800 text-gray-100 border border-gray-700/50 rounded-2xl rounded-bl-sm'
                                                                        }
                                                                    ${isOptimistic ? 'opacity-70' : 'opacity-100'}
                                                                `}
                                                                >
                                                                    {msg.content}
                                                                </div>
                                                            )}

                                                            {msg.sharedReview && (
                                                                <ChatReviewCard review={msg.sharedReview} />
                                                            )}
                                                            {msg.sharedDiscussion && (
                                                                <ChatDiscussionCard discussion={msg.sharedDiscussion} />
                                                            )}
                                                            {msg.sharedRank && (
                                                                <ChatRankCard rank={msg.sharedRank} />
                                                            )}

                                                            <div className={`flex items-center gap-2 mt-1 px-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                                                                <span className="text-[10px] text-gray-500 font-medium">
                                                                    {formatTime(msg.createdAt)}
                                                                </span>
                                                                {isOwn && !isOptimistic && (
                                                                    <button
                                                                        onClick={() => handleDeleteMessage(msg._id)}
                                                                        className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-500 transition-all"
                                                                    >
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                            <div ref={scrollRef} />
                        </div>

                        <div className="p-4 bg-gray-950 border-t border-gray-800/50 backdrop-blur-lg flex-shrink-0">
                            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-end gap-2 bg-gray-900 border border-gray-800 p-1.5 rounded-3xl shadow-lg focus-within:ring-1 focus-within:ring-green-500/50 focus-within:border-green-500/50 transition-all">

                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 max-h-32 py-2.5 px-4 text-[15px]"
                                />

                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || sending}
                                    className={`
                                        p-2.5 rounded-full shadow-md transition-all duration-200 flex items-center justify-center
                                        ${newMessage.trim()
                                            ? 'bg-green-600 text-white hover:bg-green-500 transform hover:scale-105 active:scale-95'
                                            : 'bg-gray-800 text-gray-500 cursor-not-allowed'}
                                    `}
                                >
                                    <Send size={18} fill={newMessage.trim() ? "currentColor" : "none"} />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 bg-black/50">
                        <div className="w-20 h-20 bg-gray-900 rounded-3xl flex items-center justify-center mb-6 shadow-2xl rotate-3">
                            <MessageSquare size={40} className="text-green-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">MovieSocial Chat</h2>
                        <p className="max-w-xs text-center text-gray-400">
                            Connect with other movie buffs, share reviews, and discuss your favorites.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessagesPage;