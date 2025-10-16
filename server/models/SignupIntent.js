const mongoose = require('mongoose');

const SignupIntentSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  passwordHash: { type: String, required: true },
  name: { type: String },
  age: { type: Number },
  otpHash: { type: String },
  otpExpires: { type: Date },
  signupToken: { type: String },
  signupTokenExpires: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('SignupIntent', SignupIntentSchema);
