const Discussion = require('../models/Discussion');
const User = require('../models/User');

// GET /api/discussions - list recent discussions
const listDiscussions = async (req, res) => {
  try {
    const { movieId, sortBy } = req.query;
    let query = {};
    if (movieId) query.movieId = String(movieId);

    // If sorting by comments, use aggregation to compute comment counts and sort
    if (sortBy === 'comments') {
      const agg = [
        { $match: query },
        { $addFields: { commentsCount: { $size: { $ifNull: ['$comments', []] } } } },
        { $sort: { commentsCount: -1, createdAt: -1 } },
        { $limit: 100 },
      ];
      const results = await Discussion.aggregate(agg);
      // Populate starter and comments.user manually
      await User.populate(results, { path: 'starter', select: 'username avatar' });
      await User.populate(results, { path: 'comments.user', select: 'username avatar' });
      return res.json(results);
    }

    const discussions = await Discussion.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
  .populate('starter', 'username avatar')
  .populate('comments.user', 'username avatar')
  .populate('comments.replies.user', 'username avatar');
    res.json(discussions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// POST /api/discussions - create a discussion (protected)
const createDiscussion = async (req, res) => {
  try {
    const { title, movieId, movieTitle, tag } = req.body;
    if (!title || !movieId || !movieTitle) return res.status(400).json({ msg: 'Title and movie are required' });
    const discussion = await Discussion.create({ title, movieId: String(movieId), movieTitle, tag: tag || 'General', starter: req.user.id, comments: [] });
    // Mongoose 6+: execPopulate() removed. Use await populate() which returns the document.
    await discussion.populate([
      { path: 'starter', select: 'username avatar' }
    ]);
    res.status(201).json(discussion);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// GET /api/discussions/:id - get discussion by id
const getDiscussion = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id)
      .populate('starter', 'username avatar')
      .populate('comments.user', 'username avatar')
      .populate('comments.replies.user', 'username avatar');
    if (!discussion) return res.status(404).json({ msg: 'Discussion not found' });
    res.json(discussion);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// GET /api/discussions/user/:username - list discussions started by a user
const listDiscussionsByUser = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ msg: 'User not found' });
    const discussions = await Discussion.find({ starter: user._id })
      .sort({ createdAt: -1 })
      .populate('starter', 'username avatar')
      .populate('comments.user', 'username avatar')
      .populate('comments.replies.user', 'username avatar');
    res.json(discussions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// POST /api/discussions/:id/comments - add a comment (protected)
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ msg: 'Comment text required' });
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ msg: 'Discussion not found' });
    discussion.comments.push({ user: req.user.id, text });
    await discussion.save();
    // Populate starter and comment users using the modern populate API
    await discussion.populate([
      { path: 'starter', select: 'username avatar' },
      { path: 'comments.user', select: 'username avatar' },
      { path: 'comments.replies.user', select: 'username avatar' }
    ]);
    res.json(discussion);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// PUT /api/discussions/:id/comments/:commentId - edit a comment (protected, only comment author)
const editComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ msg: 'Comment text required' });
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ msg: 'Discussion not found' });

  // find comment by id using index to be robust if comments are plain objects
  const idx = discussion.comments.findIndex(c => String(c._id) === String(req.params.commentId));
  if (idx === -1) return res.status(404).json({ msg: 'Comment not found' });

  const comment = discussion.comments[idx];
  if (String(comment.user) !== String(req.user.id)) return res.status(403).json({ msg: 'Not authorized' });

  discussion.comments[idx].text = text;
  await discussion.save();
    await discussion.populate([
      { path: 'starter', select: 'username avatar' },
      { path: 'comments.user', select: 'username avatar' },
      { path: 'comments.replies.user', select: 'username avatar' }
    ]);
    res.json(discussion);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// DELETE /api/discussions/:id/comments/:commentId - delete a comment (protected, only comment author or discussion starter)
const deleteComment = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ msg: 'Discussion not found' });

    // find comment by index and remove it
    const idx = discussion.comments.findIndex(c => String(c._id) === String(req.params.commentId));
    if (idx === -1) return res.status(404).json({ msg: 'Comment not found' });

    const comment = discussion.comments[idx];
    // allow deletion by comment author or discussion starter
    if (String(comment.user) !== String(req.user.id) && String(discussion.starter) !== String(req.user.id)) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    // remove by filtering out the comment id
    discussion.comments = discussion.comments.filter(c => String(c._id) !== String(req.params.commentId));
    await discussion.save();
    await discussion.populate([
      { path: 'starter', select: 'username avatar' },
      { path: 'comments.user', select: 'username avatar' }
    ]);
    res.json(discussion);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// POST /api/discussions/:id/comments/:commentId/replies - add a reply to a comment (protected)
const addReply = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ msg: 'Reply text required' });
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ msg: 'Discussion not found' });

    const idx = discussion.comments.findIndex(c => String(c._id) === String(req.params.commentId));
    if (idx === -1) return res.status(404).json({ msg: 'Comment not found' });

    discussion.comments[idx].replies = discussion.comments[idx].replies || [];
    discussion.comments[idx].replies.push({ user: req.user.id, text });
    await discussion.save();

    await discussion.populate([
      { path: 'starter', select: 'username avatar' },
      { path: 'comments.user', select: 'username avatar' },
      { path: 'comments.replies.user', select: 'username avatar' }
    ]);
    res.json(discussion);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// DELETE /api/discussions/:id/comments/:commentId/replies/:replyId - delete a reply (protected, reply author or discussion starter)
const deleteReply = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ msg: 'Discussion not found' });

    const cidx = discussion.comments.findIndex(c => String(c._id) === String(req.params.commentId));
    if (cidx === -1) return res.status(404).json({ msg: 'Comment not found' });

    const replies = discussion.comments[cidx].replies || [];
    const ridx = replies.findIndex(r => String(r._id) === String(req.params.replyId));
    if (ridx === -1) return res.status(404).json({ msg: 'Reply not found' });

    const reply = replies[ridx];
    // allow deletion by reply author or discussion starter
    if (String(reply.user) !== String(req.user.id) && String(discussion.starter) !== String(req.user.id)) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    // remove the reply
    discussion.comments[cidx].replies = replies.filter(r => String(r._id) !== String(req.params.replyId));
    await discussion.save();

    await discussion.populate([
      { path: 'starter', select: 'username avatar' },
      { path: 'comments.user', select: 'username avatar' },
      { path: 'comments.replies.user', select: 'username avatar' }
    ]);
    res.json(discussion);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// PUT /api/discussions/:id - update discussion (only starter)
const updateDiscussion = async (req, res) => {
  try {
    const { title, tag } = req.body;
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ msg: 'Discussion not found' });
    if (String(discussion.starter) !== String(req.user.id)) return res.status(403).json({ msg: 'Not authorized' });

    if (title) discussion.title = title;
    if (tag) discussion.tag = tag;
    await discussion.save();
    await discussion.populate([
      { path: 'starter', select: 'username avatar' },
      { path: 'comments.user', select: 'username avatar' }
    ]);
    res.json(discussion);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

// DELETE /api/discussions/:id - delete a discussion (protected, only starter)
const deleteDiscussion = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) return res.status(404).json({ msg: 'Discussion not found' });
    if (String(discussion.starter) !== String(req.user.id)) return res.status(403).json({ msg: 'Not authorized' });
      // Use model-level deletion for compatibility across Mongoose versions
      await Discussion.findByIdAndDelete(discussion._id);
    res.json({ msg: 'Discussion deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server Error' });
  }
};

module.exports = {
  listDiscussions,
  createDiscussion,
  getDiscussion,
  addComment,
  addReply,
  deleteReply,
  editComment,
  deleteComment,
  updateDiscussion,
  listDiscussionsByUser,
  deleteDiscussion,
};
