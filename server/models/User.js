const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: false }, // Made optional for Google users
  googleId: { type: String, unique: true, sparse: true }, // Google OAuth ID
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' }, // Track auth method
  bio: { type: String, default: '' },
  avatar: { type: String, default: '/default_dp.png' },
  interests: [{ type: String }],
  country: { type: String },
  state: { type: String },
  region: { type: String },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  watchlist: [{ type: String }], 
  
  // --- UPDATED SECTION ---
  watched: [{
    _id: false,
    movieId: { type: String, required: true },
    watchedAt: { type: Date, default: Date.now }
  }],
  // -----------------------

  badges: [{ id: { type: String }, name: { type: String }, awardedAt: { type: Date } }],
  isAdmin: { type: Boolean, default: false },
  modle: {
    type: Map,
    of: new mongoose.Schema({
      lastPlayed: { type: String, default: null },
      streak: { type: Number, default: 0 },
      history: { type: Map, of: new mongoose.Schema({ date: String, correct: Boolean, guesses: [String] }, { _id: false }), default: {} }
    }, { _id: false }),
    default: {}
  },
  resetOtpHash: { type: String },
  resetOtpExpires: { type: Date },
  passwordResetToken: { type: String },
  passwordResetTokenExpires: { type: Date },
}, { timestamps: true });

UserSchema.methods.matchPassword = async function (enteredPassword) {
  // Users without passwords (Google-only users) can't login with password
  if (!this.passwordHash) return false;
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

UserSchema.pre('save', async function () {
  // Skip password hashing if no password is set
  if (!this.passwordHash) return;
  if (!this.isModified('passwordHash')) return;
  const maybeHash = this.passwordHash || '';
  const bcryptRegex = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
  if (bcryptRegex.test(maybeHash)) return;
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

module.exports = mongoose.model('User', UserSchema);