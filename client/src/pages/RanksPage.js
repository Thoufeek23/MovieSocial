import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../api';
import { Plus, X, Pencil, Heart, MessageCircle, Share2 } from 'lucide-react'; // Added Share2
import { toast } from 'react-hot-toast';
import Avatar from '../components/Avatar';
import { AnimatePresence, motion } from 'framer-motion';
import CreateRank from '../components/CreateRank';
import ShareModal from '../components/ShareModal'; // Added ShareModal
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useAuth } from '../context/AuthContext';

const RanksPage = () => {
  const { user } = useAuth();
  const [ranks, setRanks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRank, setEditingRank] = useState(null);
  
  // Share State
  const [sharingRank, setSharingRank] = useState(null);

  const loadRanks = async () => {
    try {
      setLoading(true);
      const { data } = await api.fetchRanks();
      setRanks(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRanks();
  }, []);

  const handleCreateOpen = () => {
    setEditingRank(null);
    setIsModalOpen(true);
  };

  const handleEditOpen = (rank) => {
    setEditingRank(rank);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingRank(null);
  };

  const handleSuccess = (newRank) => {
    handleModalClose();
    loadRanks();
  };

  const handleLike = async (rankId) => {
    if (!user) return toast.error('Please login to like this list');
    
    // Optimistic update
    const originalRanks = [...ranks];
    setRanks(prevRanks => prevRanks.map(rank => {
      if (rank._id === rankId) {
        const userId = user._id || user.id;
        const hasLiked = rank.likes.includes(userId);
        return {
          ...rank,
          likes: hasLiked ? rank.likes.filter(id => id !== userId) : [...rank.likes, userId]
        };
      }
      return rank;
    }));

    try {
      await api.likeRank(rankId);
    } catch (error) {
      console.error(error);
      toast.error('Failed to like rank');
      setRanks(originalRanks);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 mt-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Community Ranks</h1>
          <p className="text-gray-400 mt-1">Discover and create custom movie lists</p>
        </div>
        <button 
          onClick={handleCreateOpen}
          className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-full flex items-center gap-2 font-medium transition-all transform hover:scale-105 shadow-lg shadow-primary/20"
        >
          <Plus size={20} />
          <span>Create Rank</span>
        </button>
      </div>

      {/* Ranks List or Skeleton */}
      <div className="grid gap-6">
        {loading && !ranks.length ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="bg-card p-6 rounded-xl border border-white/5">
              <Skeleton height={28} width={`60%`} baseColor="#202020" highlightColor="#444" />
              <Skeleton height={16} width={`40%`} className="mt-2" baseColor="#202020" highlightColor="#444" />
              <div className="flex items-center gap-2 mt-4">
                 <Skeleton circle height={24} width={24} baseColor="#202020" highlightColor="#444" />
              </div>
            </div>
          ))
        ) : (
          ranks.map((rank) => {
            const isLiked = user && rank.likes.includes(user._id || user.id);
            return (
              <div key={rank._id} className="bg-card p-6 rounded-xl border border-white/5 hover:border-white/10 transition-all hover:bg-card/80 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      {/* Title Link to Details */}
                      <Link to={`/rank/${rank._id}`} className="text-xl font-bold text-white mb-2 hover:text-primary transition-colors">
                          {rank.title}
                      </Link>
                      
                      <div className="flex items-center gap-2">
                        {/* LIKE BUTTON */}
                        <button 
                          onClick={() => handleLike(rank._id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            isLiked ? 'text-red-500 bg-red-500/10' : 'text-gray-500 hover:text-red-400 hover:bg-white/5'
                          }`}
                        >
                          <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                          <span>{rank.likes.length}</span>
                        </button>

                        {/* COMMENT BUTTON */}
                        <Link 
                          to={`/rank/${rank._id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <MessageCircle size={18} />
                          <span>{rank.comments?.length || 0}</span>
                        </Link>

                        {/* SHARE BUTTON */}
                        <button 
                          onClick={() => setSharingRank(rank)}
                          className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                          title="Share Rank"
                        >
                          <Share2 size={18} />
                        </button>

                        {/* EDIT BUTTON */}
                        {user && rank.user && (user._id === rank.user._id || user.id === rank.user._id) && (
                          <button 
                            onClick={() => handleEditOpen(rank)}
                            className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                            title="Edit Rank"
                          >
                            <Pencil size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {rank.description && (
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">{rank.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-auto">
                      <Avatar user={rank.user} size="sm" />
                      <span className="text-sm text-gray-300 font-medium">{rank.user?.username || 'Unknown'}</span>
                      <span className="text-gray-600 text-xs">•</span>
                      <span className="text-gray-500 text-xs">{new Date(rank.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Movie Strip Preview */}
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                  {rank.movies.slice(0, 6).map((movie, idx) => (
                    <Link 
                      key={idx} 
                      to={`/movie/${movie.movieId}`} 
                      className="relative flex-shrink-0 w-20 aspect-[2/3] bg-gray-800 rounded-md overflow-hidden shadow-md snap-start group/poster block hover:opacity-90 transition-opacity"
                    >
                       <img 
                         src={movie.posterPath ? `https://image.tmdb.org/t/p/w200${movie.posterPath}` : '/assets/images/poster1.png'} 
                         alt={movie.title}
                         className="w-full h-full object-cover transition-transform group-hover/poster:scale-110"
                       />
                       <div className="absolute top-0 left-0 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-br-md">
                         #{movie.rank}
                       </div>
                    </Link>
                  ))}
                  {rank.movies.length > 6 && (
                    <Link to={`/rank/${rank._id}`} className="flex-shrink-0 w-20 aspect-[2/3] bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-md flex flex-col items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer">
                      <span className="text-lg font-bold">+{rank.movies.length - 6}</span>
                      <span className="text-[10px]">more</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={handleModalClose}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }} 
              onClick={(e) => e.stopPropagation()} 
              className="bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-800 flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-800 sticky top-0 bg-zinc-900 z-10 rounded-t-2xl">
                <h2 className="text-2xl font-bold text-white">
                  {editingRank ? 'Edit Rank' : 'Create New Rank'}
                </h2>
                <button onClick={handleModalClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <CreateRank initialData={editingRank} onSuccess={handleSuccess} onCancel={handleModalClose} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      {sharingRank && (
        <ShareModal 
          isOpen={!!sharingRank} 
          onClose={() => setSharingRank(null)} 
          title="Share Rank"
          defaultMessage={`Check out this ranking list on MovieSocial:\n\n"${sharingRank.title}"\n\n${window.location.origin}/rank/${sharingRank._id}`}
        />
      )}
    </div>
  );
};

export default RanksPage;