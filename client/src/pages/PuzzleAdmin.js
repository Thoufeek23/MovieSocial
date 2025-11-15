import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import * as api from '../api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Save, X, Database, BarChart3 } from 'lucide-react';

const PuzzleAdmin = () => {
  const { user } = useContext(AuthContext);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [puzzles, setPuzzles] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editingPuzzle, setEditingPuzzle] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPuzzle, setNewPuzzle] = useState({
    answer: '',
    hints: ['', '', '', '', ''],
    language: 'English',
    meta: {}
  });

  const availableLanguages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'];

  const loadPuzzles = async () => {
    try {
      setLoading(true);
      const response = await api.getAllPuzzles(selectedLanguage);
      setPuzzles(response.data.puzzles || []);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Admin access required');
      } else {
        toast.error('Failed to load puzzles');
      }
      console.error('Load puzzles error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.getPuzzleStats();
      setStats(response.data);
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };

  // Load puzzles for selected language
  useEffect(() => {
    if (user) {
      loadPuzzles();
      loadStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLanguage, user]);

  const handleAddPuzzle = async () => {
    try {
      // Validate
      if (!newPuzzle.answer.trim()) {
        toast.error('Answer is required');
        return;
      }
      
      const validHints = newPuzzle.hints.filter(hint => hint.trim());
      if (validHints.length === 0) {
        toast.error('At least one hint is required');
        return;
      }

      const puzzleData = {
        answer: newPuzzle.answer.trim(),
        hints: validHints,
        language: newPuzzle.language,
        meta: newPuzzle.meta
      };

      await api.createPuzzle(puzzleData);
      toast.success('Puzzle added successfully');
      setShowAddForm(false);
      setNewPuzzle({
        answer: '',
        hints: ['', '', '', '', ''],
        language: selectedLanguage,
        meta: {}
      });
      loadPuzzles();
      loadStats();
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to add puzzle');
    }
  };

  const handleUpdatePuzzle = async (id, updatedData) => {
    try {
      await api.updatePuzzle(id, updatedData);
      toast.success('Puzzle updated successfully');
      setEditingPuzzle(null);
      loadPuzzles();
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to update puzzle');
    }
  };

  const handleDeletePuzzle = async (id, answer) => {
    if (!window.confirm(`Are you sure you want to delete "${answer}"?`)) {
      return;
    }

    try {
      await api.deletePuzzle(id);
      toast.success('Puzzle deleted successfully');
      loadPuzzles();
      loadStats();
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to delete puzzle');
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-card p-6 rounded-lg text-center">
          <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
          <p className="text-gray-400">Please log in to access the puzzle admin panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Database className="text-primary" />
          Puzzle Admin Panel
        </h1>
        <p className="text-gray-400">Manage movie puzzles for the Modle game</p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-card p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Puzzles</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <BarChart3 className="text-primary" size={24} />
            </div>
          </div>
          
          {Object.entries(stats.byLanguage).slice(0, 3).map(([lang, data]) => (
            <div key={lang} className="bg-card p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{lang}</p>
                  <p className="text-2xl font-bold">{data.count}</p>
                </div>
                <div className="text-primary text-sm">puzzles</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Language Selection and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-white">Language:</label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="bg-gray-800 text-white border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {availableLanguages.map(lang => (
              <option key={lang} value={lang} className="bg-gray-800 text-white">{lang}</option>
            ))}
          </select>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-primary hover:bg-primary/90 text-white font-semibold py-2 px-4 rounded-md flex items-center gap-2 transition-colors"
        >
          <Plus size={16} />
          Add New Puzzle
        </button>
      </div>

      {/* Add Puzzle Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-card p-6 rounded-lg mb-6 border border-primary/20"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add New Puzzle</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-white transition-colors p-2"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Movie Answer *
                </label>
                <input
                  type="text"
                  placeholder="e.g., INCEPTION"
                  value={newPuzzle.answer}
                  onChange={(e) => setNewPuzzle({...newPuzzle, answer: e.target.value})}
                  className="w-full bg-gray-800 text-white border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-gray-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Language
                </label>
                <select
                  value={newPuzzle.language}
                  onChange={(e) => setNewPuzzle({...newPuzzle, language: e.target.value})}
                  className="w-full bg-gray-800 text-white border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {availableLanguages.map(lang => (
                    <option key={lang} value={lang} className="bg-gray-800 text-white">{lang}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Hints (at least 1 required)
              </label>
              {newPuzzle.hints.map((hint, index) => (
                <input
                  key={index}
                  type="text"
                  placeholder={`Hint ${index + 1}`}
                  value={hint}
                  onChange={(e) => {
                    const updatedHints = [...newPuzzle.hints];
                    updatedHints[index] = e.target.value;
                    setNewPuzzle({...newPuzzle, hints: updatedHints});
                  }}
                  className="w-full bg-gray-800 text-white border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-gray-400 mb-2"
                />
              ))}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleAddPuzzle}
                className="bg-primary hover:bg-primary/90 text-white font-semibold py-2 px-4 rounded-md flex items-center gap-2 transition-colors"
              >
                <Save size={16} />
                Add Puzzle
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Puzzles List */}
      <div className="bg-card rounded-lg">
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold">
            {selectedLanguage} Puzzles ({puzzles.length})
          </h3>
        </div>
        
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="loading loading-spinner loading-lg"></div>
            </div>
          ) : puzzles.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No puzzles found for {selectedLanguage}
            </div>
          ) : (
            <div className="space-y-4">
              {puzzles.map((puzzle) => (
                <PuzzleItem
                  key={puzzle.id}
                  puzzle={puzzle}
                  onUpdate={handleUpdatePuzzle}
                  onDelete={handleDeletePuzzle}
                  editingPuzzle={editingPuzzle}
                  setEditingPuzzle={setEditingPuzzle}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Individual Puzzle Item Component
const PuzzleItem = ({ puzzle, onUpdate, onDelete, editingPuzzle, setEditingPuzzle }) => {
  const [editData, setEditData] = useState({
    answer: puzzle.answer,
    hints: [...puzzle.hints]
  });

  const isEditing = editingPuzzle === puzzle.id;

  const handleSave = () => {
    const validHints = editData.hints.filter(hint => hint.trim());
    if (!editData.answer.trim() || validHints.length === 0) {
      toast.error('Answer and at least one hint are required');
      return;
    }

    onUpdate(puzzle.id, {
      answer: editData.answer.trim(),
      hints: validHints
    });
  };

  const handleCancel = () => {
    setEditData({
      answer: puzzle.answer,
      hints: [...puzzle.hints]
    });
    setEditingPuzzle(null);
  };

  return (
    <div className="border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors bg-gray-800/30">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          {isEditing ? (
            <input
              type="text"
              value={editData.answer}
              onChange={(e) => setEditData({...editData, answer: e.target.value})}
              className="w-full bg-gray-800 text-white border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-bold text-lg mb-2"
            />
          ) : (
            <h4 className="font-bold text-lg">{puzzle.answer}</h4>
          )}
          <span className="text-sm text-gray-400">
            Index: {puzzle.index} | Created: {new Date(puzzle.createdAt).toLocaleDateString()}
          </span>
        </div>
        
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-white font-medium py-1 px-3 rounded-md text-sm transition-colors">
                <Save size={14} />
              </button>
              <button onClick={handleCancel} className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-1 px-3 rounded-md text-sm transition-colors">
                <X size={14} />
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setEditingPuzzle(puzzle.id)}
                className="text-gray-400 hover:text-primary transition-colors p-1"
              >
                <Edit2 size={14} />
              </button>
              <button 
                onClick={() => onDelete(puzzle.id, puzzle.answer)}
                className="text-red-400 hover:text-red-300 hover:bg-red-400/20 transition-colors p-1 rounded"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <h5 className="font-medium text-sm text-gray-300">Hints:</h5>
        {isEditing ? (
          <div className="space-y-2">
            {editData.hints.map((hint, index) => (
              <input
                key={index}
                type="text"
                value={hint}
                onChange={(e) => {
                  const updatedHints = [...editData.hints];
                  updatedHints[index] = e.target.value;
                  setEditData({...editData, hints: updatedHints});
                }}
                placeholder={`Hint ${index + 1}`}
                className="w-full bg-gray-800 text-white border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-gray-400 text-sm"
              />
            ))}
            <button
              onClick={() => setEditData({
                ...editData,
                hints: [...editData.hints, '']
              })}
              className="text-primary hover:text-primary/80 font-medium text-sm transition-colors py-1 px-2 border border-primary/30 rounded hover:bg-primary/10"
            >
              + Add Hint
            </button>
          </div>
        ) : (
          <ol className="list-decimal list-inside space-y-1 text-sm">
            {puzzle.hints.map((hint, index) => (
              <li key={index} className="text-gray-300">{hint}</li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
};

export default PuzzleAdmin;