const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  content: { 
    type: String, 
    trim: true
    // Removed required: true, validation handled below
  },
  read: { 
    type: Boolean, 
    default: false 
  },
  sharedReview: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  },
  sharedDiscussion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Discussion'
  }
}, { timestamps: true });

// Validate that at least content OR a shared item is present
MessageSchema.pre('validate', function(next) {
  if (!this.content && !this.sharedReview && !this.sharedDiscussion) {
    this.invalidate('content', 'Message must have text content or a shared item');
  }
  next();
});

// Index for faster queries on conversations
MessageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Message', MessageSchema);