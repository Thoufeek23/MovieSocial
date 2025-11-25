import React, { useState, useEffect, useRef, useContext } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Send, MoreVertical, ArrowLeft, Trash2, MessageSquare } from 'lucide-react'; 
import { AuthContext } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import ReviewCard from '../components/ReviewCard';
import * as api from '../api';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

// Simple Discussion Card for Chat
const ChatDiscussionCard = ({ discussion }) => {
    if (!discussion) return null;
    return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden mt-2 max-w-sm shadow-lg">
            <Link to={`/discussion/${discussion._id}`} className="flex p-3 gap-3 hover:bg-gray-750 transition-colors">
                <img 
                    src={discussion.poster_path ? `https://image.tmdb.org/t/p/w154${discussion.poster_path}` : '/default_dp.png'} 
                    alt="poster"
                    className="w-16 h-24 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-sm leading-tight mb-1 line-clamp-2">{discussion.title}</h4>
                    <div className="text-xs text-green-400 mb-2">{discussion.movieTitle}</div>
                    
                    <div className="flex items-center gap-2 mt-auto">
                        <Avatar username={discussion.starter?.username} avatar={discussion.starter?.avatar} sizeClass="w-5 h-5" />
                        <span className="text-xs text-gray-400">{discussion.starter?.username}</span>
                        <span className="text-xs text-gray-500 ml-auto flex items-center gap-1">
                            <MessageSquare size={10} /> {discussion.comments?.length || 0}
                        </span>
                    </div>
                </div>
            </Link>
        </div>
    );
};

const MessagesPage = () => {
    const { user, updateUnreadCount } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    
    // State
    const [conversations, setConversations] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    
    // Refs
    const scrollRef = useRef();
    const inputRef = useRef();
    
    // Socket Refs
    const socketRef = useRef();
    const currentChatRef = useRef(); 

    // Parse query params
    const queryParams = new URLSearchParams(location.search);
    const initialChatUser = queryParams.get('user');

    // --- SOCKET.IO INTEGRATION START ---

    // 1. Keep the Ref synced with the State so the socket listener knows who we are talking to
    useEffect(() => {
        currentChatRef.current = currentChat;
    }, [currentChat]);

    // 2. Initialize Socket & Listen for Messages
    useEffect(() => {
        // Connect to backend
        const socketUrl = process.env.REACT_APP_API_URL || 'https://moviesocial-backend-khd2.onrender.com';
        socketRef.current = io(socketUrl);

        // FIX: Robustly check for User ID (handle both _id and id)
        const userId = user?._id || user?.id;

        if (userId) {
            socketRef.current.emit("join_room", userId);
        } else {
            console.warn("User ID missing, cannot join socket room.", user);
        }

        // Listen for incoming messages
        socketRef.current.on("receive_message", (incomingMsg) => {
            
            const activeChat = currentChatRef.current;
            const senderUsername = incomingMsg.sender.username;
            const senderId = incomingMsg.sender._id || incomingMsg.sender;

            // Check if this message belongs to the currently open chat
            const isChattingWithSender = activeChat && (
                activeChat._id === senderId || 
                activeChat.username === senderUsername
            );

            if (isChattingWithSender) {
                // If chat is open, append message immediately to the view
                setMessages(prev => [...prev, incomingMsg]);
            } else {
                // If chat is NOT open, update the global unread count badge
                if (updateUnreadCount) updateUnreadCount();
            }

            // Update the Sidebar Conversations List (Move sender to top)
            setConversations(prev => {
                // Remove the sender's old conversation entry from the list
                const otherConvs = prev.filter(c => 
                    c.otherUser.username !== senderUsername
                );
                
                // Find existing conversation data to preserve user details
                const existingConv = prev.find(c => c.otherUser.username === senderUsername);
                
                // Create new conversation object
                const newConv = {
                    otherUser: existingConv ? existingConv.otherUser : incomingMsg.sender,
                    lastMessage: incomingMsg,
                    unreadCount: isChattingWithSender ? 0 : (existingConv ? existingConv.unreadCount + 1 : 1)
                };

                return [newConv, ...otherConvs];
            });
        });

        // Cleanup on unmount
        return () => {
            socketRef.current?.disconnect();
        };
    }, [user, updateUnreadCount]); // Re-run if user object changes (e.g., loads from null)

    // --- SOCKET.IO INTEGRATION END ---

    // Helper: Format Date for Sidebar
    const formatConversationDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        if (messageDate.getTime() === today.getTime()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (messageDate.getTime() === yesterday.getTime()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString();
        }
    };

    // Load Conversations & Initial Chat
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
                } else if (convs.length > 0) {
                    handleSelectChat(convs[0].otherUser);
                }
            } catch (error) {
                console.error('Failed to load messages', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [initialChatUser]);

    // Auto-scroll to bottom
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSelectChat = async (chatUser) => {
        setCurrentChat(chatUser);
        
        // Optimistically clear unread count in local conversation list
        setConversations(prev => prev.map(c => {
            if (c.otherUser.username === chatUser.username) {
                return { ...c, unreadCount: 0 };
            }
            return c;
        }));

        try {
            const [msgsRes, readRes] = await Promise.all([
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
        setSending(true);

        try {
            // FIX: Ensure optimistic message has correct sender structure
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
        }
    };

    // Handle Deleting Messages
    const handleDeleteMessage = async (msgId) => {
        if (!window.confirm("Delete this message for everyone?")) return;

        try {
            setMessages(prev => prev.filter(m => m._id !== msgId));
            await api.deleteMessage(msgId);
            toast.success("Message deleted");
        } catch (err) {
            toast.error("Failed to delete message");
            if (currentChat) {
                const { data } = await api.getMessages(currentChat.username);
                setMessages(data);
            }
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

    const groupedMessages = groupMessagesByDate(messages);

    const isMessageFromMe = (msg) => {
        if (!user || !msg || !msg.sender) return false;
        // FIX: Robust ID check here too
        const myId = String(user._id || user.id);
        let senderId;
        if (typeof msg.sender === 'object') {
            senderId = msg.sender._id || msg.sender.id;
        } else {
            senderId = msg.sender;
        }
        return myId === String(senderId);
    };

    return (
        <div className="flex h-[calc(100vh-64px)] bg-gray-900 text-gray-100 overflow-hidden">
            
            {/* LEFT SIDEBAR */}
            <div className={`${currentChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 flex-col border-r border-gray-800 bg-gray-900`}>
                <div className="p-4 border-b border-gray-800">
                    <h1 className="text-xl font-bold text-white">Messages</h1>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading && !conversations.length ? (
                        <div className="p-4 text-center text-gray-500">Loading chats...</div>
                    ) : conversations.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <p>No conversations yet.</p>
                        </div>
                    ) : (
                        conversations.map(conv => (
                            <div 
                                key={conv.otherUser._id}
                                onClick={() => handleSelectChat(conv.otherUser)}
                                className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-800 transition-colors ${currentChat?.username === conv.otherUser.username ? 'bg-gray-800 border-l-4 border-green-600' : ''}`}
                            >
                                <Avatar username={conv.otherUser.username} avatar={conv.otherUser.avatar} sizeClass="w-12 h-12" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                        <h3 className={`truncate text-gray-200 ${conv.unreadCount > 0 ? 'font-bold text-white' : 'font-semibold'}`}>
                                            {conv.otherUser.username}
                                        </h3>
                                        <div className="flex flex-col items-end">
                                            <span className={`text-xs ${conv.unreadCount > 0 ? 'text-green-500 font-bold' : 'text-gray-500'}`}>
                                                {conv.lastMessage && formatConversationDate(conv.lastMessage.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center mt-1">
                                        <p className={`text-sm truncate pr-2 ${conv.unreadCount > 0 ? 'text-white font-medium' : 'text-gray-400'}`}>
                                            {isMessageFromMe({ sender: conv.lastMessage?.sender }) ? 'You: ' : ''}
                                            {conv.lastMessage?.content}
                                        </p>
                                        {conv.unreadCount > 0 && (
                                            <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-green-600 text-white text-xs font-bold rounded-full">
                                                {conv.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* RIGHT SIDE - Active Chat Area */}
            <div className={`${!currentChat ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-black/20`}>
                {currentChat ? (
                    <>
                        <div className="h-16 px-4 flex items-center justify-between border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => setCurrentChat(null)}
                                    className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                
                                <Link to={`/profile/${currentChat.username}`} className="flex items-center gap-3 group">
                                    <Avatar username={currentChat.username} avatar={currentChat.avatar} sizeClass="w-10 h-10" />
                                    <div>
                                        <h2 className="font-bold text-gray-100 group-hover:underline decoration-green-500 underline-offset-2">
                                            {currentChat.username}
                                        </h2>
                                    </div>
                                </Link>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                            {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                                <div key={date} className="space-y-4">
                                    <div className="flex justify-center sticky top-0 z-10">
                                        <span className="px-3 py-1 bg-gray-800/80 backdrop-blur text-xs text-gray-400 rounded-full shadow-sm">
                                            {date === new Date().toDateString() ? 'Today' : date}
                                        </span>
                                    </div>

                                    {dateMessages.map((msg, index) => {
                                        const isOwn = isMessageFromMe(msg);
                                        const isOptimistic = msg.isOptimistic;

                                        return (
                                            <div 
                                                key={msg._id || index} 
                                                className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'} group`}
                                            >
                                                <div className={`flex flex-col items-end max-w-[90%] md:max-w-[70%] gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
                                                    <div className={`flex gap-2 items-end ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                                                        {!isOwn && (
                                                            <Link to={`/profile/${msg.sender?.username}`} className="flex-shrink-0 mb-1">
                                                                <Avatar 
                                                                    username={msg.sender?.username} 
                                                                    avatar={msg.sender?.avatar} 
                                                                    sizeClass="w-8 h-8" 
                                                                    className="hover:ring-2 ring-green-500 transition-all"
                                                                />
                                                            </Link>
                                                        )}

                                                        {/* Message Bubble */}
                                                        <div className="flex flex-col">
                                                            {/* Text Content */}
                                                            {msg.content && (
                                                                <div 
                                                                    className={`
                                                                        relative px-4 py-2 shadow-md text-sm md:text-base break-words
                                                                        ${isOwn 
                                                                            ? 'bg-green-600 text-white rounded-2xl rounded-br-sm' 
                                                                            : 'bg-gray-700 text-gray-100 rounded-2xl rounded-bl-sm'
                                                                        }
                                                                        ${isOptimistic ? 'opacity-70' : 'opacity-100'}
                                                                    `}
                                                                >
                                                                    {msg.content}
                                                                </div>
                                                            )}

                                                            {/* Shared Cards */}
                                                            {msg.sharedReview && (
                                                                <div className={`mt-1 transform scale-95 origin-${isOwn ? 'right' : 'left'}`}>
                                                                    <ReviewCard review={msg.sharedReview} />
                                                                </div>
                                                            )}
                                                            {msg.sharedDiscussion && (
                                                                <ChatDiscussionCard discussion={msg.sharedDiscussion} />
                                                            )}

                                                            {/* Timestamp & Status */}
                                                            <div className={`text-[10px] mt-1 flex items-center gap-1 ${isOwn ? 'text-gray-400 justify-end' : 'text-gray-400'}`}>
                                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                {isOwn && !isOptimistic && (
                                                                    <button 
                                                                        onClick={() => handleDeleteMessage(msg._id)}
                                                                        className="opacity-0 group-hover:opacity-100 hover:text-red-500 ml-2"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                )}
                                                                {isOwn && (
                                                                    <span>{isOptimistic ? '🕒' : (msg.read ? '✓✓' : '✓')}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                            <div ref={scrollRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="p-4 bg-gray-900 border-t border-gray-800 flex gap-2 items-end">
                            <button type="button" className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors">
                                <MoreVertical size={20} />
                            </button>
                            
                            <div className="flex-1 bg-gray-800 rounded-2xl flex items-center px-4 py-2 focus-within:ring-2 ring-green-500/50 transition-all">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder={`Message ${currentChat.username}...`}
                                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 max-h-32 py-1"
                                    disabled={sending}
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={!newMessage.trim() || sending}
                                className="p-3 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
                            >
                                <Send size={20} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8">
                        <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6 animate-pulse">
                            <Send size={40} className="text-green-500 ml-2" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Your Messages</h2>
                        <p className="max-w-md text-center">
                            Select a conversation to start chatting
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessagesPage;