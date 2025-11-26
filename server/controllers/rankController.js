// server/controllers/rankController.js
const Rank = require('../models/Rank');
const logger = require('../utils/logger');
const Parser = require('rss-parser');
const axios = require('axios');

// Initialize RSS Parser
const parser = new Parser({
    customFields: {
        item: [
            ['tmdb:movieId', 'tmdbId'],
            ['letterboxd:filmTitle', 'filmTitle'],
            ['letterboxd:filmYear', 'filmYear']
        ]
    }
});

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

// Import Rank from Letterboxd (List OR User Feed)
const importLetterboxdRank = async (req, res) => {
    const { url } = req.body;

    if (!url || !url.includes('letterboxd.com')) {
        return res.status(400).json({ msg: 'Please provide a valid Letterboxd URL' });
    }

    try {
        // Construct RSS URL: https://letterboxd.com/username/rss/
        let feedUrl = url.endsWith('/') ? `${url}rss/` : `${url}/rss/`;
        if (url.includes('/rss')) feedUrl = url;

        let feed;
        try {
            feed = await parser.parseURL(feedUrl);
        } catch (error) {
            logger.error(`Failed to fetch Letterboxd feed:`, error);
            return res.status(404).json({ msg: 'Could not fetch feed. Ensure the profile is public.' });
        }

        if (!feed.items || feed.items.length === 0) {
            return res.status(400).json({ msg: 'No items found in this feed.' });
        }

        const tmdbApiKey = process.env.TMDB_API_KEY;
        
        // 1. CHECK FOR LISTS
        // List items usually have links like letterboxd.com/user/list/name/
        const listItems = feed.items.filter(item => item.link && item.link.includes('/list/'));
        
        let importedCount = 0;
        let updatedCount = 0;
        let isListImport = false;

        if (listItems.length > 0) {
            isListImport = true;
            
            // --- LOOP THROUGH ALL FOUND LISTS ---
            for (const targetList of listItems) {
                let movies = [];
                let listTitle = targetList.title;
                let listDescription = "";

                // Clean description: Strip HTML tags and the "...plus 5 more" text
                if (targetList.description) {
                    listDescription = targetList.description
                        .replace(/<[^>]+>/g, '') // Remove HTML
                        .replace(/\.\.\.plus \d+ more\. View the full list on Letterboxd\./, '')
                        .trim();
                }

                // Parse Movies from HTML content
                const htmlContent = targetList.description || targetList.content;
                // Regex matches: <a href="https://letterboxd.com/film/slug/">Title</a>
                const linkRegex = /<a href="https:\/\/letterboxd\.com\/film\/([^/]+)\/">([^<]+)<\/a>/g;
                const movieMatches = [...htmlContent.matchAll(linkRegex)];

                for (const [index, match] of movieMatches.entries()) {
                    if (index >= 50) break; // Safety limit

                    const slug = match[1]; // e.g., "dragon-2025"
                    const title = match[2]; // e.g., "Dragon"
                    
                    // Try to extract year from slug
                    const slugParts = slug.split('-');
                    const potentialYear = slugParts[slugParts.length - 1];
                    const year = /^\d{4}$/.test(potentialYear) ? potentialYear : null;

                    let movieId = null;
                    let moviePoster = null;
                    let movieYear = year;

                    // Search TMDb
                    try {
                        const searchParams = { api_key: tmdbApiKey, query: title };
                        if (year) searchParams.year = year;

                        const searchRes = await axios.get(`https://api.themoviedb.org/3/search/movie`, { params: searchParams });
                        
                        if (searchRes.data.results?.[0]) {
                            const m = searchRes.data.results[0];
                            movieId = m.id;
                            moviePoster = m.poster_path;
                            if (!movieYear) movieYear = m.release_date?.split('-')[0];
                        }
                    } catch (e) { console.error(`Search failed for ${title}`); }

                    if (movieId && moviePoster) {
                        movies.push({
                            movieId: String(movieId),
                            title: title,
                            posterPath: moviePoster,
                            year: movieYear,
                            rank: index + 1
                        });
                    }
                }

                if (movies.length > 0) {
                    // Clean Title
                    if (listTitle.includes(', a list by')) {
                        listTitle = listTitle.split(', a list by')[0];
                    }

                    // Check for existing rank by this user with same title
                    const existingRank = await Rank.findOne({ user: req.user.id, title: listTitle });

                    if (existingRank) {
                        existingRank.movies = movies;
                        existingRank.description = listDescription;
                        await existingRank.save();
                        updatedCount++;
                    } else {
                        await Rank.create({
                            user: req.user.id,
                            title: listTitle,
                            description: listDescription,
                            movies: movies,
                            comments: []
                        });
                        importedCount++;
                    }
                }
            }
        } 
        else {
            // 2. FALLBACK: Process Diary Entries (Recent Watches) if no lists found
            let movies = [];
            for (const [index, item] of feed.items.entries()) {
                try {
                    let movieId = item.tmdbId;
                    let movieTitle = item.filmTitle;
                    let movieYear = item.filmYear;
                    let moviePoster = null;

                    // Resolve Missing Data
                    if (!movieId && movieTitle) {
                        try {
                            const searchRes = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
                                params: { api_key: tmdbApiKey, query: movieTitle, year: movieYear }
                            });
                            if (searchRes.data.results?.[0]) {
                                movieId = searchRes.data.results[0].id;
                                moviePoster = searchRes.data.results[0].poster_path;
                                movieTitle = searchRes.data.results[0].title;
                            }
                        } catch (e) {}
                    } else if (movieId) {
                        try {
                            const detailRes = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
                                params: { api_key: tmdbApiKey }
                            });
                            moviePoster = detailRes.data.poster_path;
                            movieTitle = detailRes.data.title; 
                        } catch (e) {}
                    }

                    if (movieId && moviePoster) {
                        movies.push({
                            movieId: String(movieId),
                            title: movieTitle,
                            posterPath: moviePoster,
                            year: movieYear,
                            rank: index + 1
                        });
                    }
                } catch (e) {}
            }
            
            if (movies.length > 0) {
                const username = url.split('.com/')[1]?.split('/')[0] || 'User';
                const listTitle = `${username}'s Recent Watches`;
                
                await Rank.create({
                    user: req.user.id,
                    title: listTitle,
                    description: "Imported from Letterboxd Diary",
                    movies: movies,
                    comments: []
                });
                importedCount++;
            }
        }

        if (importedCount === 0 && updatedCount === 0) {
            return res.status(400).json({ msg: 'Could not find any parseable movies or lists in the feed.' });
        }

        res.status(201).json({
            success: true,
            msg: isListImport 
                ? `Process complete: ${importedCount} imported, ${updatedCount} updated.`
                : `Imported recent activity successfully.`,
            note: isListImport 
                ? "Note: Scanned RSS feed for all public lists." 
                : "Note: No lists found, so we created a rank from recent watches."
        });

    } catch (err) {
        logger.error(err);
        res.status(500).json({ msg: 'Server Error during import' });
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
  importLetterboxdRank, // Exported
  addRankComment,
  deleteRankComment,
  editRankComment,
  addRankReply,
  deleteRankReply
};