const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  bio: { type: String, default: '' },
  // Default avatar uses the public asset '/default_dp.png' (place the provided image in client/public/default_dp.png)
  avatar: { type: String, default: '/default_dp.png' },
  // User's movie language interests (selected during signup)
  interests: [{ type: String }],
  // Region/state for leaderboard grouping (optional)
  country: { type: String },
  state: { type: String },
  // legacy combined region field (kept for compatibility)
  region: { type: String },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  watchlist: [{ type: String }], // Array of movie IDs from TMDb
  watched: [{ type: String }],   // Array of movie IDs from TMDb
  // Badges awarded to the user (for gamification)
  // Stored as objects so we can include metadata and awardedAt timestamps
  badges: [{ id: { type: String }, name: { type: String }, awardedAt: { type: Date } }],
  // Admin status
  isAdmin: { type: Boolean, default: false },
  // Modle (daily movie puzzle) history and streaks stored per language
  // Modle (daily movie puzzle) history and streaks stored per language
  // Structure: { <language>: { lastPlayed: 'YYYY-MM-DD', streak: Number, history: { 'YYYY-MM-DD': { date, correct, guesses } } } }
  // Stored as a Map of language -> ModleEntry for better schema tracking in Mongoose
  modle: {
    type: Map,
    of: new mongoose.Schema({
      lastPlayed: { type: String, default: null },
      streak: { type: Number, default: 0 },
      history: { type: Map, of: new mongoose.Schema({ date: String, correct: Boolean, guesses: [String] }, { _id: false }), default: {} }
    }, { _id: false }),
    default: {}
  },
  // Fields for password reset OTP
  resetOtpHash: { type: String },
  resetOtpExpires: { type: Date },
  // Token-based reset used after OTP verification (hashed)
  passwordResetToken: { type: String },
  passwordResetTokenExpires: { type: Date },
}, { timestamps: true });

// Method to compare password for login
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Middleware to hash password before saving when passwordHash is modified
UserSchema.pre('save', async function () {
  // If passwordHash wasn't modified, do nothing
  if (!this.isModified('passwordHash')) return;

  // If the passwordHash already looks like a bcrypt hash, skip re-hashing.
  // Bcrypt hashes look like: $2a$10$................................................. (60 chars)
  const maybeHash = this.passwordHash || '';
  const bcryptRegex = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
  if (bcryptRegex.test(maybeHash)) {
    // already hashed, skip
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

module.exports = mongoose.model('User', UserSchema);