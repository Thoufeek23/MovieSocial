const express = require('express');
const router = express.Router();
const { listDiscussions, createDiscussion, getDiscussion, addComment, listDiscussionsByUser, deleteDiscussion } = require('../controllers/discussionController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', listDiscussions);
router.post('/', protect, createDiscussion);
// place user route before parameterized id route to avoid conflicts
router.get('/user/:username', listDiscussionsByUser);
router.get('/:id', getDiscussion);
router.post('/:id/comments', protect, addComment);
router.delete('/:id', protect, deleteDiscussion);

module.exports = router;
