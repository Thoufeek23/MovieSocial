import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import PostButton from '../components/PostButton';
import PickMovieModal from '../components/PickMovieModal';
import ReviewModal from '../components/ReviewModal';
import DiscussionFormModal from '../components/DiscussionFormModal';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';

const PostPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [mode, setMode] = useState(null);
  const [pickOpen, setPickOpen] = useState(false);
  const [movieForModal, setMovieForModal] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [discussionOpen, setDiscussionOpen] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleChoose = (choice) => {
    setMode(choice);
    setPickOpen(true);
  };

  const handleMoviePicked = (movie) => {
    setMovieForModal(movie);
    if (mode === 'review') setReviewOpen(true);
    if (mode === 'discussion') setDiscussionOpen(true);
    setMode(null);
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Create a post</h1>
        <div className="space-y-3">
          <div className="flex gap-3">
            <button onClick={() => handleChoose('review')} className="flex-1 px-4 py-3 rounded bg-primary">Write a Review</button>
            <button onClick={() => handleChoose('discussion')} className="flex-1 px-4 py-3 rounded bg-gray-800">Start a Discussion</button>
          </div>
          <p className="text-sm text-gray-400">Choose Review to write a review about a movie, or Discussion to start a conversation.</p>
        </div>
      </motion.div>

      <PickMovieModal isOpen={pickOpen} setIsOpen={setPickOpen} onMoviePicked={handleMoviePicked} />
      <ReviewModal isOpen={reviewOpen} setIsOpen={setReviewOpen} movie={movieForModal} onReviewPosted={() => { navigate('/reviews'); }} />
      <DiscussionFormModal isOpen={discussionOpen} setIsOpen={setDiscussionOpen} movie={movieForModal} onDiscussionCreated={() => { navigate('/discussions'); }} />
    </div>
  );
};

export default PostPage;
