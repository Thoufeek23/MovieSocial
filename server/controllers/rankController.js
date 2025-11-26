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
      movies: rankedMovies
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

    // Check if the rank has already been liked by this user
    // The likes array contains ObjectIds, so we compare strings
    const index = rank.likes.findIndex(id => id.toString() === req.user.id);

    if (index !== -1) {
      // User has liked it -> Unlike (remove)
      rank.likes.splice(index, 1);
    } else {
      // User hasn't liked it -> Like (add)
      rank.likes.push(req.user.id);
    }

    await rank.save();
    
    // Return the updated rank (with user populated to maintain frontend consistency)
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
    const rank = await Rank.findById(req.params.id).populate('user', 'username avatar');
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

module.exports = { getRanks, createRank, updateRank, toggleLikeRank, getRankById, deleteRank };