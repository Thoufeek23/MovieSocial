#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

// Load User model
const User = require(path.join(__dirname, '..', 'models', 'User'));

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('FATAL: MONGO_URI is not set in environment. Set MONGO_URI to your DB connection string.');
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node scripts/show_user_modle.js <username-or-userid>');
    process.exit(2);
  }

  const who = args[0];

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });

  try {
    // Try username first, then treat as _id
    let user = await User.findOne({ username: who }).select('username email modle').lean();
    if (!user) {
      try {
        user = await User.findById(who).select('username email modle').lean();
      } catch (e) {
        // ignore
      }
    }

    if (!user) {
      console.error('User not found for', who);
      process.exitCode = 3;
      return;
    }

    console.log('User:', user.username, '<' + (user.email || 'no-email') + '>');
    console.log('modle (per-language):');
    console.log(JSON.stringify(user.modle || {}, null, 2));
  } catch (err) {
    console.error('Error while reading user:', err && err.stack ? err.stack : err);
    process.exitCode = 4;
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(err => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  process.exit(1);
});
