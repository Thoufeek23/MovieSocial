// One-off script to print all user emails to the terminal
// Usage: from repo root run: node server/scripts/print_emails.js

require('dotenv').config();
const mongoose = require('mongoose');

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('MONGO_URI not set in environment or .env; set MONGO_URI before running this script.');
  process.exit(1);
}

// Load the User model
const User = require('../models/User');

(async function run() {
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log('Connected to MongoDB. Fetching users...');

    const users = await User.find({}, 'email username').lean();
    if (!users || users.length === 0) {
      console.log('No users found.');
    } else {
      console.log(`Found ${users.length} users:`);
      for (const u of users) {
        // Print email and optional username for context
        console.log(u.email + (u.username ? `    (${u.username})` : ''));
      }
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error fetching users:', err && err.message ? err.message : err);
    try { await mongoose.disconnect(); } catch (e) {}
    process.exit(1);
  }
})();