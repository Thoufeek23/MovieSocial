// server/models/Rank.js
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

const RankedMovieSchema = new mongoose.Schema({
  movieId: { type: String, required: true },
  title: { type: String, required: true },
  posterPath: { type: String },
  year: { type: String },
  rank: { type: Number, required: true } // 1, 2, 3...
});

const RankSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  movies: [RankedMovieSchema],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [CommentSchema], // Added Comments
}, { timestamps: true });

module.exports = mongoose.model('Rank', RankSchema);