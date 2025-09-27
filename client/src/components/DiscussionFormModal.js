import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as api from '../api';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';

const DiscussionFormModal = ({ isOpen, setIsOpen, movie, origin, onDiscussionCreated }) => {
    const [discussionTitle, setDiscussionTitle] = useState('');
    const [discussionWhy, setDiscussionWhy] = useState('');
    const [creatingDiscussion, setCreatingDiscussion] = useState(false);
    // navigate not needed here

    const handleClose = () => {
        if (!creatingDiscussion) {
            setIsOpen(false);
            setDiscussionTitle('');
            setDiscussionWhy('');
        }
    }

    const modalVariants = {
        hidden: {
            opacity: 0,
            scale: 0.8,
            y: 20,
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { type: 'spring', damping: 25, stiffness: 250 },
        },
        exit: {
            opacity: 0,
            scale: 0.9,
            y: 20,
            transition: { duration: 0.2 },
        },
    };

    const handleSubmit = async () => {
        if (!discussionTitle.trim()) return toast.error('Please enter a title');
        if (!discussionWhy.trim()) return toast.error('Please write why you started this discussion');
        setCreatingDiscussion(true);
        try {
            const { data } = await api.postDiscussion({ title: discussionTitle, movieId: movie.id, movieTitle: movie.title });
            await api.postDiscussionComment(data._id, { text: discussionWhy });
            onDiscussionCreated(data._id);
            setDiscussionTitle('');
            setDiscussionWhy('');
            setIsOpen(false);
        } catch (err) {
            console.error(err);
            toast.error('Failed to create discussion');
        } finally {
            setCreatingDiscussion(false);
        }
    };

    if (!movie) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
                    onClick={handleClose}
                >
                    <motion.div
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="bg-card w-full max-w-lg rounded-lg shadow-xl p-6 relative"
                        style={{
                            transformOrigin: origin ? `${origin.left - (window.innerWidth / 2 - 256)}px ${origin.top - (window.innerHeight / 2 - 200)}px` : 'center',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold">Start a discussion about {movie.title}</h3>
                            <button onClick={handleClose} className="text-gray-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <label className="block text-sm font-medium">Title</label>
                            <input value={discussionTitle} onChange={(e) => setDiscussionTitle(e.target.value)} className="w-full p-3 rounded bg-gray-800" placeholder="What's the topic?" />
                            <label className="block text-sm font-medium">Why are you starting this discussion?</label>
                            <textarea value={discussionWhy} onChange={(e) => setDiscussionWhy(e.target.value)} rows={6} className="w-full p-3 rounded bg-gray-800" placeholder="Share why this topic matters..." />
                            <div className="flex justify-end gap-3">
                                <button onClick={handleClose} disabled={creatingDiscussion} className="px-4 py-2 rounded bg-gray-700">Cancel</button>
                                <button onClick={handleSubmit} disabled={creatingDiscussion} className="px-4 py-2 rounded bg-primary">{creatingDiscussion ? 'Creating...' : 'Create Discussion'}</button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default DiscussionFormModal;