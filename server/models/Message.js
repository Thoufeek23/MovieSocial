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
  },
  // --- ADD THIS FIELD ---
  sharedRank: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Rank'
  }
}, { timestamps: true });

MessageSchema.pre('validate', function(next) {
  // Check sharedRank here too
  if (!this.content && !this.sharedReview && !this.sharedDiscussion && !this.sharedRank) {
    this.invalidate('content', 'Message must have text content or a shared item');
  }
  next();
});

MessageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Message', MessageSchema);