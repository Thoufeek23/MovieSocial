// server/controllers/rankController.js
const Rank = require('../models/Rank');
const logger = require('../utils/logger');

// Get all ranks (feed)
const getRanks = async (req, res) => {
  try {
    const ranks = await Rank.find()
      .sort({ createdAt: -1 })
      .populate('user', 'username avatar')
      .limit(50);
    res.json(ranks);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// Create a new rank
const createRank = async (req, res) => {
  try {
    const { title, description, movies } = req.body;
    
    if (!title || !movies || movies.length === 0) {
      return res.status(400).json({ msg: 'Title and at least one movie are required' });
    }

    // Assign rank numbers based on array order
    const rankedMovies = movies.map((m, index) => ({
      movieId: m.id || m.movieId,
      title: m.title,
      posterPath: m.poster_path || m.posterPath,
      year: m.release_date ? m.release_date.split('-')[0] : (m.year || 'N/A'),
      rank: index + 1
    }));

    const newRank = await Rank.create({
      user: req.user.id,
      title,
      description,
      movies: rankedMovies,
      comments: []
    });

    await newRank.populate('user', 'username avatar');
    res.status(201).json(newRank);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// Update an existing rank
const updateRank = async (req, res) => {
  try {
    const { title, description, movies } = req.body;
    
    let rank = await Rank.findById(req.params.id);
    if (!rank) return res.status(404).json({ msg: 'Rank list not found' });

    // Check ownership
    if (rank.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to edit this rank' });
    }

    if (!title || !movies || movies.length === 0) {
      return res.status(400).json({ msg: 'Title and at least one movie are required' });
    }

    // Re-map movies with new rank numbers
    const rankedMovies = movies.map((m, index) => ({
      movieId: m.id || m.movieId,
      title: m.title,
      posterPath: m.poster_path || m.posterPath,
      year: m.release_date ? m.release_date.split('-')[0] : (m.year || 'N/A'),
      rank: index + 1
    }));

    rank.title = title;
    rank.description = description;
    rank.movies = rankedMovies;

    await rank.save();
    await rank.populate('user', 'username avatar');

    res.json(rank);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// Toggle Like on a Rank
const toggleLikeRank = async (req, res) => {
  try {
    const rank = await Rank.findById(req.params.id);
    if (!rank) return res.status(404).json({ msg: 'Rank list not found' });

    const index = rank.likes.findIndex(id => id.toString() === req.user.id);

    if (index !== -1) {
      rank.likes.splice(index, 1);
    } else {
      rank.likes.push(req.user.id);
    }

    await rank.save();
    await rank.populate('user', 'username avatar');
    
    res.json(rank);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// Get a single rank by ID
const getRankById = async (req, res) => {
  try {
    const rank = await Rank.findById(req.params.id)
      .populate('user', 'username avatar')
      .populate('comments.user', 'username avatar')
      .populate('comments.replies.user', 'username avatar');
    if (!rank) return res.status(404).json({ msg: 'Rank list not found' });
    res.json(rank);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// Delete a rank
const deleteRank = async (req, res) => {
  try {
    const rank = await Rank.findById(req.params.id);
    if (!rank) return res.status(404).json({ msg: 'Rank list not found' });
    
    if (rank.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    await Rank.findByIdAndDelete(rank._id);
    res.json({ msg: 'Rank list deleted' });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// --- COMMENT LOGIC ---

// Add Comment
const addRankComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ msg: 'Comment text required' });
    const rank = await Rank.findById(req.params.id);
    if (!rank) return res.status(404).json({ msg: 'Rank not found' });
    
    rank.comments.push({ user: req.user.id, text });
    await rank.save();
    
    await rank.populate([
      { path: 'user', select: 'username avatar' },
      { path: 'comments.user', select: 'username avatar' },
      { path: 'comments.replies.user', select: 'username avatar' }
    ]);
    res.json(rank);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// Delete Comment
const deleteRankComment = async (req, res) => {
  try {
    const rank = await Rank.findById(req.params.id);
    if (!rank) return res.status(404).json({ msg: 'Rank not found' });

    const idx = rank.comments.findIndex(c => String(c._id) === String(req.params.commentId));
    if (idx === -1) return res.status(404).json({ msg: 'Comment not found' });

    const comment = rank.comments[idx];
    if (String(comment.user) !== String(req.user.id) && String(rank.user) !== String(req.user.id)) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    rank.comments = rank.comments.filter(c => String(c._id) !== String(req.params.commentId));
    await rank.save();
    
    await rank.populate([
      { path: 'user', select: 'username avatar' },
      { path: 'comments.user', select: 'username avatar' }
    ]);
    res.json(rank);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// Edit Comment
const editRankComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ msg: 'Comment text required' });
    const rank = await Rank.findById(req.params.id);
    if (!rank) return res.status(404).json({ msg: 'Rank not found' });

    const idx = rank.comments.findIndex(c => String(c._id) === String(req.params.commentId));
    if (idx === -1) return res.status(404).json({ msg: 'Comment not found' });

    const comment = rank.comments[idx];
    if (String(comment.user) !== String(req.user.id)) return res.status(403).json({ msg: 'Not authorized' });

    rank.comments[idx].text = text;
    await rank.save();
    
    await rank.populate([
      { path: 'user', select: 'username avatar' },
      { path: 'comments.user', select: 'username avatar' },
      { path: 'comments.replies.user', select: 'username avatar' }
    ]);
    res.json(rank);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// Add Reply
const addRankReply = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ msg: 'Reply text required' });
    const rank = await Rank.findById(req.params.id);
    if (!rank) return res.status(404).json({ msg: 'Rank not found' });

    const idx = rank.comments.findIndex(c => String(c._id) === String(req.params.commentId));
    if (idx === -1) return res.status(404).json({ msg: 'Comment not found' });

    rank.comments[idx].replies = rank.comments[idx].replies || [];
    rank.comments[idx].replies.push({ user: req.user.id, text });
    await rank.save();

    await rank.populate([
      { path: 'user', select: 'username avatar' },
      { path: 'comments.user', select: 'username avatar' },
      { path: 'comments.replies.user', select: 'username avatar' }
    ]);
    res.json(rank);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// Delete Reply
const deleteRankReply = async (req, res) => {
  try {
    const rank = await Rank.findById(req.params.id);
    if (!rank) return res.status(404).json({ msg: 'Rank not found' });

    const cidx = rank.comments.findIndex(c => String(c._id) === String(req.params.commentId));
    if (cidx === -1) return res.status(404).json({ msg: 'Comment not found' });

    const replies = rank.comments[cidx].replies || [];
    const ridx = replies.findIndex(r => String(r._id) === String(req.params.replyId));
    if (ridx === -1) return res.status(404).json({ msg: 'Reply not found' });

    const reply = replies[ridx];
    if (String(reply.user) !== String(req.user.id) && String(rank.user) !== String(req.user.id)) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    rank.comments[cidx].replies = replies.filter(r => String(r._id) !== String(req.params.replyId));
    await rank.save();

    await rank.populate([
      { path: 'user', select: 'username avatar' },
      { path: 'comments.user', select: 'username avatar' },
      { path: 'comments.replies.user', select: 'username avatar' }
    ]);
    res.json(rank);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

module.exports = { 
  getRanks, 
  createRank, 
  updateRank, 
  toggleLikeRank, 
  getRankById, 
  deleteRank,
  addRankComment,
  deleteRankComment,
  editRankComment,
  addRankReply,
  deleteRankReply
};