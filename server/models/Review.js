const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  movieId: { type: String, required: true }, // TMDb movie ID
  movieTitle: { type: String, required: true }, // For easier display
  moviePoster: { type: String, required: true }, // Poster path
  text: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 }, // Star rating required
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  // Agreement votes from other users: value should be 1.0 (agree), 0.5 (partially), or 0.0 (disagree)
  agreementVotes: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, value: { type: Number } }],
}, { timestamps: true });

module.exports = mongoose.model('Review', ReviewSchema);