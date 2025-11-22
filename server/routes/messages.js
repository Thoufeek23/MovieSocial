const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); 
const messageController = require('../controllers/messageController');

router.use(protect);

router.post('/', messageController.sendMessage);
router.get('/conversations', messageController.getConversationsList);
// Add this BEFORE the /:userId route to avoid conflict
router.get('/unread-count', messageController.getUnreadCount); 
router.get('/:userId', messageController.getConversation);
router.put('/:userId/read', messageController.markMessagesRead);
router.delete('/:messageId', messageController.deleteMessage);

module.exports = router;