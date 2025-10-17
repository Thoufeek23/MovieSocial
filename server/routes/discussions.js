const express = require('express');
const router = express.Router();
const { listDiscussions, createDiscussion, getDiscussion, addComment, listDiscussionsByUser, deleteDiscussion, editComment, deleteComment, updateDiscussion } = require('../controllers/discussionController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', listDiscussions);
router.post('/', protect, createDiscussion);
// place user route before parameterized id route to avoid conflicts
router.get('/user/:username', listDiscussionsByUser);
router.get('/:id', getDiscussion);
router.post('/:id/comments', protect, addComment);
// edit or delete a comment
router.put('/:id/comments/:commentId', protect, editComment);
router.delete('/:id/comments/:commentId', protect, deleteComment);

// update discussion (only starter)
router.put('/:id', protect, updateDiscussion);

router.delete('/:id', protect, deleteDiscussion);

module.exports = router;
