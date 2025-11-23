import React, { useState } from 'react';
import { IoMdClose } from 'react-icons/io';
import * as api from '../api';
import toast from 'react-hot-toast';

const LetterboxdImportModal = ({ isOpen, onClose, onImportComplete }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleImport = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error('Please enter a Letterboxd username');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Importing reviews... this may take a moment.');

    try {
      const { data } = await api.importLetterboxd(username.trim());
      
      if (data.count === 0) {
        toast.success(data.msg || 'No new reviews found.', { id: toastId });
      } else {
        toast.success(`Imported ${data.imported} reviews! (${data.skipped} skipped)`, { id: toastId });
        onImportComplete?.();
        onClose();
        setUsername('');
      }
    } catch (error) {
      const msg = error.response?.data?.msg || 'Failed to import reviews.';
      toast.error(msg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <IoMdClose size={24} />
        </button>

        <div className="text-center mb-6">
            <div className="flex justify-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-[#40bcf4]"></div>
                <div className="w-3 h-3 rounded-full bg-[#00e054]"></div>
                <div className="w-3 h-3 rounded-full bg-[#ff8000]"></div>
            </div>
          <h2 className="text-2xl font-bold mb-2">Import from Letterboxd</h2>
          <p className="text-gray-400 text-sm">
            Enter your Letterboxd username to import your recent reviews (from your public RSS feed).
          </p>
        </div>

        <form onSubmit={handleImport}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Letterboxd Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              autoFocus
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full btn btn-primary py-3 font-semibold text-lg ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Importing...' : 'Import Reviews'}
          </button>
          
          <p className="mt-4 text-xs text-center text-gray-500">
            Note: Only reviews with star ratings will be imported. We only fetch the latest 10 items from your public feed.
          </p>
        </form>
      </div>
    </div>
  );
};

export default LetterboxdImportModal;