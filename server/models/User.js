const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  bio: { type: String, default: '' },
  // Default avatar uses the public asset '/default_dp.png' (place the provided image in client/public/default_dp.png)
  avatar: { type: String, default: '/default_dp.png' },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  watchlist: [{ type: String }], // Array of movie IDs from TMDb
  watched: [{ type: String }],   // Array of movie IDs from TMDb
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

  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

module.exports = mongoose.model('User', UserSchema);