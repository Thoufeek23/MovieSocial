const Message = require('../models/Message');
const User = require('../models/User');

const findUserByIdOrUsername = async (identifier) => {
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
  if (isObjectId) {
    const user = await User.findById(identifier);
    if (user) return user;
  }
  return await User.findOne({ username: identifier });
};

exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, content, reviewId, discussionId } = req.body;
    const senderId = req.user.id;

    if (!content && !reviewId && !discussionId && !recipientId) {
      return res.status(400).json({ msg: 'Recipient and content/attachment are required' });
    }

    const recipient = await findUserByIdOrUsername(recipientId);
    if (!recipient) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const newMessage = new Message({
      sender: senderId,
      recipient: recipient._id,
      content: content || '',
      sharedReview: reviewId || null,
      sharedDiscussion: discussionId || null,
      read: false
    });

    const savedMessage = await newMessage.save();
    
    // Populate all necessary fields for the frontend cards
    await savedMessage.populate([
      { path: 'sender', select: 'username avatar' },
      { 
        path: 'sharedReview',
        populate: { path: 'user', select: 'username avatar badges' }
      },
      { 
        path: 'sharedDiscussion',
        populate: { path: 'starter', select: 'username avatar' }
      }
    ]);
    
    res.status(201).json(savedMessage);
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserIdentifier = req.params.userId;

    const otherUser = await findUserByIdOrUsername(otherUserIdentifier);
    if (!otherUser) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: otherUser._id },
        { sender: otherUser._id, recipient: currentUserId }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'username avatar')
    .populate('recipient', 'username avatar')
    .populate({
      path: 'sharedReview',
      populate: { path: 'user', select: 'username avatar badges' }
    })
    .populate({
      path: 'sharedDiscussion',
      populate: { path: 'starter', select: 'username avatar' }
    });

    res.json(messages);
  } catch (err) {
    console.error('Error getting conversation:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getConversationsList = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const messages = await Message.find({
      $or: [{ sender: currentUserId }, { recipient: currentUserId }]
    })
    .sort({ createdAt: -1 })
    .populate('sender', 'username avatar')
    .populate('recipient', 'username avatar');

    const conversationsMap = new Map();

    for (const msg of messages) {
      const otherUser = msg.sender._id.toString() === currentUserId 
        ? msg.recipient 
        : msg.sender;
      
      if (!otherUser) continue;

      const otherUserId = otherUser._id.toString();

      if (!conversationsMap.has(otherUserId)) {
        // Determine preview text
        let previewText = msg.content;
        if (!previewText) {
            if (msg.sharedReview) previewText = 'Shared a review';
            else if (msg.sharedDiscussion) previewText = 'Shared a discussion';
            else previewText = 'Sent an attachment';
        }

        conversationsMap.set(otherUserId, {
          otherUser: {
            _id: otherUser._id,
            username: otherUser.username,
            avatar: otherUser.avatar
          },
          lastMessage: {
            _id: msg._id,
            content: previewText,
            createdAt: msg.createdAt,
            isMine: msg.sender._id.toString() === currentUserId,
            read: msg.read
          },
          unreadCount: 0
        });
      }

      if (msg.recipient._id.toString() === currentUserId && !msg.read) {
        conversationsMap.get(otherUserId).unreadCount += 1;
      }
    }

    res.json(Array.from(conversationsMap.values()));
  } catch (err) {
    console.error('Error getting conversation list:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.markMessagesRead = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserIdentifier = req.params.userId;

    const otherUser = await findUserByIdOrUsername(otherUserIdentifier);
    if (!otherUser) {
      return res.status(404).json({ msg: 'User not found' });
    }

    await Message.updateMany(
      { 
        sender: otherUser._id, 
        recipient: currentUserId, 
        read: false 
      },
      { $set: { read: true } }
    );

    res.status(200).json({ msg: 'Messages marked as read' });
  } catch (err) {
    console.error('Error marking messages read:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const userId = req.user.id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ msg: 'Message not found' });
    }

    if (message.sender.toString() !== userId) {
      return res.status(403).json({ msg: 'Not authorized to delete this message' });
    }

    await Message.findByIdAndDelete(messageId);

    res.json({ msg: 'Message deleted successfully' });
  } catch (err) {
    console.error('Error deleting message:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({ 
      recipient: req.user.id, 
      read: false 
    });
    res.json({ count });
  } catch (err) {
    console.error('Error fetching unread count:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};