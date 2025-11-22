const Message = require('../models/Message');
const User = require('../models/User');

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, content } = req.body;
    const senderId = req.user.id;

    if (!content || !recipientId) {
      return res.status(400).json({ msg: 'Recipient and content are required' });
    }

    // Verify recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const newMessage = new Message({
      sender: senderId,
      recipient: recipientId,
      content
    });

    const savedMessage = await newMessage.save();
    // Populate sender details for immediate frontend display
    await savedMessage.populate('sender', 'username avatar');
    
    res.status(201).json(savedMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get conversation with a specific user
exports.getConversation = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: otherUserId },
        { sender: otherUserId, recipient: currentUserId }
      ]
    })
    .sort({ createdAt: 1 }) // Oldest first
    .populate('sender', 'username avatar')
    .populate('recipient', 'username avatar');

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get list of all conversations (latest message per user)
exports.getConversationsList = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Find all messages involving the current user
    const messages = await Message.find({
      $or: [{ sender: currentUserId }, { recipient: currentUserId }]
    })
    .sort({ createdAt: -1 })
    .populate('sender', 'username avatar')
    .populate('recipient', 'username avatar');

    const conversations = [];
    const seenUsers = new Set();

    // Filter to get only the latest message for each unique conversation partner
    for (const msg of messages) {
      const otherUser = msg.sender._id.toString() === currentUserId 
        ? msg.recipient 
        : msg.sender;
      
      if (!otherUser) continue; // specific case if user was deleted

      const otherUserId = otherUser._id.toString();

      if (!seenUsers.has(otherUserId)) {
        seenUsers.add(otherUserId);
        conversations.push({
          otherUser: {
            _id: otherUser._id,
            username: otherUser.username,
            avatar: otherUser.avatar
          },
          lastMessage: {
            content: msg.content,
            createdAt: msg.createdAt,
            isMine: msg.sender._id.toString() === currentUserId,
            read: msg.read
          }
        });
      }
    }

    res.json(conversations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};