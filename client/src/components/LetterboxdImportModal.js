import React, { useState, useEffect } from 'react';
import { IoMdClose } from 'react-icons/io';
import * as api from '../api';
import toast from 'react-hot-toast';
import { List, BookOpen } from 'lucide-react';

const LetterboxdImportModal = ({ isOpen, onClose, onImportComplete, defaultTab = 'reviews' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab); // 'reviews' or 'list'
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setInputValue('');
    }
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  const handleImport = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      toast.error('Please enter a username');
      return;
    }

    setLoading(true);
    const toastId = toast.loading(
      activeTab === 'reviews' ? 'Importing reviews...' : 'Importing lists...'
    );

    try {
      let data;
      
      if (activeTab === 'reviews') {
        // --- IMPORT REVIEWS ---
        const res = await api.importLetterboxd(inputValue.trim());
        data = res.data;
        
        if (data.count === 0) {
          toast.success(data.msg || 'No new reviews found.', { id: toastId });
        } else {
          toast.success(`Imported ${data.imported} reviews!`, { id: toastId });
        }
      } else {
        // --- IMPORT RANK (LIST) ---
        // Automatically construct URL from username
        const username = inputValue.trim();
        const constructedUrl = `https://letterboxd.com/${username}`;

        const res = await api.importLetterboxdRank(constructedUrl);
        data = res.data;
        
        toast.success(data.msg, { id: toastId });
        if (data.note) toast(data.note, { icon: 'ℹ️', duration: 5000 });
      }

      onImportComplete?.();
      onClose();
      setInputValue('');
    } catch (error) {
      const msg = error.response?.data?.msg || 'Failed to import.';
      toast.error(msg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-0 shadow-2xl relative overflow-hidden flex flex-col">
        
        {/* Header with Close Button */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-950">
           <h2 className="text-xl font-bold text-white flex items-center gap-2">
             <div className="flex gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-[#40bcf4]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#00e054]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff8000]"></div>
            </div>
            Letterboxd Import
           </h2>
           <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
             <IoMdClose size={24} />
           </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
            <button 
                onClick={() => setActiveTab('reviews')}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    activeTab === 'reviews' 
                    ? 'bg-gray-800 text-white border-b-2 border-green-500' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                }`}
            >
                <BookOpen size={16} /> Import Reviews
            </button>
            <button 
                onClick={() => setActiveTab('list')}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    activeTab === 'list' 
                    ? 'bg-gray-800 text-white border-b-2 border-green-500' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                }`}
            >
                <List size={16} /> Import List
            </button>
        </div>

        <div className="p-6">
            <form onSubmit={handleImport}>
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                    Letterboxd Username
                    </label>
                    <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="username"
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all placeholder:text-gray-600"
                    autoFocus
                    disabled={loading}
                    />
                </div>

                <div className="bg-gray-800/50 rounded-lg p-3 mb-6 border border-gray-800">
                    <p className="text-xs text-gray-400 text-center leading-relaxed">
                        {activeTab === 'reviews' 
                            ? "Imports your latest star rated films as Reviews. Perfect for keeping your feed up to date." 
                            : "Imports the first 10 films of your lists. Perfect for keeping your feed up to date."
                        }
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 font-semibold text-lg transition-all transform active:scale-95 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                    {loading ? 'Processing...' : (activeTab === 'reviews' ? 'Import Reviews' : 'Import Lists')}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default LetterboxdImportModal;