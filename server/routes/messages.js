const express = require('express');
const router = express.Router();
// FIX: Destructure 'protect' so we get the actual function, not the object
const { protect } = require('../middleware/authMiddleware'); 
const messageController = require('../controllers/messageController');

// All routes are protected
router.use(protect); // FIX: Pass the function 'protect', not the object 'auth'

router.post('/', messageController.sendMessage);
router.get('/conversations', messageController.getConversationsList);
router.get('/:userId', messageController.getConversation);

module.exports = router;