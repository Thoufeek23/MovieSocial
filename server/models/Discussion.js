const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
}, { timestamps: true });

const CommentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  replies: [ReplySchema],
}, { timestamps: true });

const DiscussionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  movieId: { type: String, required: true },
  movieTitle: { type: String, required: true },
  tag: { type: String, enum: ['General','Question','Spoilers','News'], default: 'General' },
  starter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  comments: [CommentSchema],
}, { timestamps: true });

module.exports = mongoose.model('Discussion', DiscussionSchema);
