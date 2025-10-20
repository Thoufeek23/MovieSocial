const mongoose = require('mongoose');

const SignupIntentSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  passwordHash: { type: String, required: true },
  name: { type: String },
  age: { type: Number },
  // Country and state provided during signup for region-based leaderboards
  country: { type: String },
  state: { type: String },
  otpHash: { type: String },
  otpExpires: { type: Date },
  signupToken: { type: String },
  signupTokenExpires: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('SignupIntent', SignupIntentSchema);
