const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); 
const messageController = require('../controllers/messageController');

router.use(protect);

router.post('/', messageController.sendMessage);
router.get('/conversations', messageController.getConversationsList);
router.get('/:userId', messageController.getConversation);
router.put('/:userId/read', messageController.markMessagesRead);
router.delete('/:messageId', messageController.deleteMessage); // New Route

module.exports = router;