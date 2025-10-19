// Inspect agreementVotes for reviews authored by a username
// Usage: node server/scripts/inspect_votes.js [username]

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Review = require('../models/Review');

const username = process.argv[2] || 'Thoufeek23';

(async function run() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI not set in environment or .env; set MONGO_URI before running this script.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log('Connected to MongoDB.');

    const user = await User.findOne({ username }).lean();
    if (!user) {
      console.log(`User with username '${username}' not found.`);
      await mongoose.disconnect();
      process.exit(0);
    }
    console.log(`Found user ${user.username} (${user._id})`);

    const reviews = await Review.find({ user: user._id }).lean();
    if (!reviews || reviews.length === 0) {
      console.log('No reviews found for this user.');
      await mongoose.disconnect();
      process.exit(0);
    }

    for (const r of reviews) {
      console.log('\n=== Review ' + r._id + ' ===');
      console.log('movieTitle:', r.movieTitle || r.movieId);
      const votes = r.agreementVotes || [];
      console.log('agreementVotes count:', votes.length);
      for (let i = 0; i < votes.length; i++) {
        const v = votes[i];
        const uid = v.user;
        const val = v.value;
        let voter = null;
        try {
          voter = await User.findById(uid).lean();
        } catch (e) {
          voter = null;
        }
        console.log(` vote[${i}]: user=${uid} value=${val} -> ${voter ? (voter.username + ' <' + voter.email + '>') : 'USER_NOT_FOUND'}`);
      }
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err && err.message ? err.message : err);
    try { await mongoose.disconnect(); } catch (e) {}
    process.exit(1);
  }
})();