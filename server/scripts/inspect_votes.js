// Inspect agreementVotes for reviews authored by a username
// Usage: node server/scripts/inspect_votes.js [username]

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Review = require('../models/Review');
const logger = require('../utils/logger');

const username = process.argv[2] || 'Thoufeek23';

(async function run() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    logger.error('MONGO_URI not set in environment or .env; set MONGO_URI before running this script.');
    process.exit(1);
  }

  try {
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
  logger.info('Connected to MongoDB.');

    const user = await User.findOne({ username }).lean();
    if (!user) {
      logger.info(`User with username '${username}' not found.`);
      await mongoose.disconnect();
      process.exit(0);
    }
    logger.info(`Found user ${user.username} (${user._id})`);

    const reviews = await Review.find({ user: user._id }).lean();
    if (!reviews || reviews.length === 0) {
      logger.info('No reviews found for this user.');
      await mongoose.disconnect();
      process.exit(0);
    }

    for (const r of reviews) {
  logger.info('\n=== Review ' + r._id + ' ===');
  logger.info('movieTitle:', r.movieTitle || r.movieId);
      const votes = r.agreementVotes || [];
  logger.info('agreementVotes count:', votes.length);
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
        logger.info(` vote[${i}]: user=${uid} value=${val} -> ${voter ? (voter.username + ' <' + voter.email + '>') : 'USER_NOT_FOUND'}`);
      }
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    logger.error('Error:', err && err.message ? err.message : err);
    try { await mongoose.disconnect(); } catch (e) {}
    process.exit(1);
  }
})();