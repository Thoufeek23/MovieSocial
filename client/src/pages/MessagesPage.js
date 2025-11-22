import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as api from '../api';
import { AuthContext } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import { Send, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const MessagesPage = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    // State
    const [conversations, setConversations] = useState([]);
    const [currentChatUser, setCurrentChatUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);

    // URL param ?user=username to start/open a chat directly
    const targetUsername = searchParams.get('user');

    // Fetch conversation list
    useEffect(() => {
        fetchConversations();
        // Optional: Poll for new conversations every 10s
        const interval = setInterval(fetchConversations, 10000);
        return () => clearInterval(interval);
    }, [user]);

    // Handle direct navigation via ?user=username
    useEffect(() => {
        const initChat = async () => {
            if (targetUsername && user) {
                if (targetUsername === user.username) return; // Can't chat with self
                
                try {
                    // Check if we already have this user in our list
                    const existing = conversations.find(c => c.otherUser.username === targetUsername);
                    if (existing) {
                        setCurrentChatUser(existing.otherUser);
                    } else {
                        // Fetch user details if new chat
                        const { data } = await api.getUserProfile(targetUsername);
                        // Structure it like the conversation object user
                        setCurrentChatUser({
                            _id: data._id,
                            username: data.username,
                            avatar: data.avatar
                        });
                    }
                } catch (err) {
                    toast.error("User not found");
                }
            }
        };
        initChat();
    }, [targetUsername, conversations.length, user]);

    // Fetch messages when active chat user changes
    useEffect(() => {
        if (currentChatUser) {
            fetchMessages(currentChatUser._id);
            // Poll for new messages in this specific chat every 3s
            const interval = setInterval(() => fetchMessages(currentChatUser._id), 3000);
            return () => clearInterval(interval);
        }
    }, [currentChatUser]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchConversations = async () => {
        try {
            const { data } = await api.getConversations();
            setConversations(data);
            setLoading(false);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchMessages = async (userId) => {
        try {
            const { data } = await api.getMessages(userId);
            setMessages(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentChatUser) return;

        try {
            const tempMsg = {
                _id: Date.now(), // temp id
                content: newMessage,
                sender: { _id: user._id, username: user.username, avatar: user.avatar },
                createdAt: new Date().toISOString(),
                pending: true
            };
            
            setMessages([...messages, tempMsg]);
            const msgContent = newMessage;
            setNewMessage(''); // Clear input early

            const { data } = await api.sendMessage(currentChatUser._id, msgContent);
            
            // Replace temp message with real one
            setMessages(prev => prev.map(m => m._id === tempMsg._id ? data : m));
            fetchConversations(); // Update sidebar list to show latest
        } catch (err) {
            toast.error('Failed to send message');
        }
    };

    return (
        <div className="h-[calc(100vh-100px)] flex bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden">
            {/* Sidebar - List of Conversations */}
            <div className={`w-full md:w-1/3 border-r border-zinc-800 flex flex-col ${currentChatUser ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-zinc-800">
                    <h2 className="text-xl font-bold text-white">Messages</h2>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-zinc-500">Loading chats...</div>
                    ) : conversations.length === 0 ? (
                        <div className="p-8 text-center text-zinc-500">
                            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No conversations yet.</p>
                            <p className="text-sm mt-2">Visit a profile to start chatting!</p>
                        </div>
                    ) : (
                        conversations.map(conv => (
                            <div 
                                key={conv.otherUser._id}
                                onClick={() => setCurrentChatUser(conv.otherUser)}
                                className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-zinc-800/50 transition-colors ${currentChatUser?._id === conv.otherUser._id ? 'bg-zinc-800' : ''}`}
                            >
                                <Avatar 
                                    username={conv.otherUser.username} 
                                    avatar={conv.otherUser.avatar} 
                                    sizeClass="w-12 h-12" 
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline">
                                        <h3 className="font-semibold text-zinc-200 truncate">{conv.otherUser.username}</h3>
                                        <span className="text-xs text-zinc-500">
                                            {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className={`text-sm truncate ${!conv.lastMessage.read && !conv.lastMessage.isMine ? 'text-white font-bold' : 'text-zinc-500'}`}>
                                        {conv.lastMessage.isMine ? 'You: ' : ''}{conv.lastMessage.content}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`w-full md:w-2/3 flex flex-col ${!currentChatUser ? 'hidden md:flex' : 'flex'}`}>
                {!currentChatUser ? (
                    <div className="flex-1 flex items-center justify-center text-zinc-500 flex-col">
                        <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                        <p>Select a conversation to start messaging</p>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-zinc-800 flex items-center gap-3 bg-zinc-900">
                            <button 
                                onClick={() => setCurrentChatUser(null)}
                                className="md:hidden mr-2 text-zinc-400"
                            >
                                ← Back
                            </button>
                            <Avatar 
                                username={currentChatUser.username} 
                                avatar={currentChatUser.avatar} 
                                sizeClass="w-10 h-10" 
                            />
                            <div>
                                <h3 className="font-bold text-white">{currentChatUser.username}</h3>
                            </div>
                        </div>

                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/20" ref={chatContainerRef}>
                            {messages.map((msg, idx) => {
                                const isMine = msg.sender._id === user._id;
                                return (
                                    <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                                            isMine 
                                                ? 'bg-primary text-white rounded-br-none' 
                                                : 'bg-zinc-800 text-zinc-200 rounded-bl-none'
                                        }`}>
                                            <p>{msg.content}</p>
                                            <p className={`text-[10px] mt-1 text-right ${isMine ? 'text-primary-content/70' : 'text-zinc-500'}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-800 bg-zinc-900">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-zinc-800 border-none rounded-full px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:outline-none"
                                />
                                <button 
                                    type="submit" 
                                    disabled={!newMessage.trim()}
                                    className="p-2 bg-primary rounded-full text-white disabled:opacity-50 hover:bg-primary-focus transition-colors"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default MessagesPage;