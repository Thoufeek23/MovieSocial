import React, { useEffect, useState } from 'react';
import * as api from '../api';
import { Plus, X } from 'lucide-react';
import Avatar from '../components/Avatar';
import { AnimatePresence, motion } from 'framer-motion';
import CreateRank from '../components/CreateRank';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const RanksPage = () => {
  const [ranks, setRanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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

  const handleCreateSuccess = (newRank) => {
    setIsCreateOpen(false);
    loadRanks();
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
          onClick={() => setIsCreateOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-full flex items-center gap-2 font-medium transition-all transform hover:scale-105 shadow-lg shadow-primary/20"
        >
          <Plus size={20} />
          <span>Create Rank</span>
        </button>
      </div>

      {/* Ranks List or Skeleton */}
      <div className="grid gap-6">
        {loading && !ranks.length ? (
          // Skeleton Loading State
          [1, 2, 3].map((i) => (
            <div key={i} className="bg-card p-6 rounded-xl border border-white/5">
              <div className="mb-4">
                <Skeleton height={28} width={`60%`} baseColor="#202020" highlightColor="#444" />
                <Skeleton height={16} width={`40%`} className="mt-2" baseColor="#202020" highlightColor="#444" />
                <div className="flex items-center gap-2 mt-4">
                  <Skeleton circle height={24} width={24} baseColor="#202020" highlightColor="#444" />
                  <Skeleton height={16} width={100} baseColor="#202020" highlightColor="#444" />
                </div>
              </div>
              <div className="flex gap-3 overflow-hidden">
                {[1, 2, 3, 4, 5].map((j) => (
                  <Skeleton key={j} height={120} width={80} baseColor="#202020" highlightColor="#444" />
                ))}
              </div>
            </div>
          ))
        ) : (
          // Actual Ranks Data
          ranks.map((rank) => (
            <div key={rank._id} className="bg-card p-6 rounded-xl border border-white/5 hover:border-white/10 transition-all hover:bg-card/80">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">{rank.title}</h2>
                  {rank.description && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{rank.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-auto">
                    <Avatar user={rank.user} size="sm" />
                    <span className="text-sm text-gray-300 font-medium">{rank.user.username}</span>
                    <span className="text-gray-600 text-xs">•</span>
                    <span className="text-gray-500 text-xs">{new Date(rank.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Movie Strip Preview */}
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                {rank.movies.slice(0, 6).map((movie, idx) => (
                  <div key={idx} className="relative flex-shrink-0 w-20 aspect-[2/3] bg-gray-800 rounded-md overflow-hidden shadow-md snap-start group">
                     <img 
                       src={movie.posterPath ? `https://image.tmdb.org/t/p/w200${movie.posterPath}` : '/assets/images/poster1.png'} 
                       alt={movie.title}
                       className="w-full h-full object-cover transition-transform group-hover:scale-110"
                     />
                     <div className="absolute top-0 left-0 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-br-md">
                       #{movie.rank}
                     </div>
                  </div>
                ))}
                {rank.movies.length > 6 && (
                  <div className="flex-shrink-0 w-20 aspect-[2/3] bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-md flex flex-col items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer">
                    <span className="text-lg font-bold">+{rank.movies.length - 6}</span>
                    <span className="text-[10px]">more</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {!loading && ranks.length === 0 && (
          <div className="text-center py-20 bg-card/30 rounded-xl border border-dashed border-gray-700">
            <div className="bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus size={32} className="text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No ranks yet</h3>
            <p className="text-gray-400 mb-6">Be the first to create a ranked list!</p>
            <button 
              onClick={() => setIsCreateOpen(true)}
              className="text-primary font-medium hover:underline"
            >
              Start Ranking
            </button>
          </div>
        )}
      </div>

      {/* Create Rank Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setIsCreateOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }} 
              onClick={(e) => e.stopPropagation()} 
              className="bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-800 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-800 sticky top-0 bg-zinc-900 z-10 rounded-t-2xl">
                <h2 className="text-2xl font-bold text-white">Create New Rank</h2>
                <button 
                  onClick={() => setIsCreateOpen(false)}
                  className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="p-6 overflow-y-auto">
                <CreateRank 
                  onSuccess={handleCreateSuccess} 
                  onCancel={() => setIsCreateOpen(false)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RanksPage;