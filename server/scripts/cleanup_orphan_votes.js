// Cleanup orphan agreementVotes and likes in Review documents where the user no longer exists
// Usage: node server/scripts/cleanup_orphan_votes.js

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Review = require('../models/Review');

(async function run() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI not set in environment or .env; set MONGO_URI before running this script.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log('Connected to MongoDB.');

    const users = await User.find({}, '_id').lean();
    const validIds = new Set(users.map(u => String(u._id)));
    console.log(`Found ${validIds.size} valid users.`);

    const reviews = await Review.find({}).lean();
    let totalVotesRemoved = 0;
    let totalLikesRemoved = 0;
    let reviewsUpdated = 0;

    for (const r of reviews) {
      const originalVotesCount = (r.agreementVotes || []).length;
      const originalLikesCount = (r.likes || []).length;

      const filteredVotes = (r.agreementVotes || []).filter(v => validIds.has(String(v.user)));
      const filteredLikes = (r.likes || []).filter(u => validIds.has(String(u)));

      const removedVotes = originalVotesCount - filteredVotes.length;
      const removedLikes = originalLikesCount - filteredLikes.length;

      if (removedVotes > 0 || removedLikes > 0) {
        await Review.updateOne({ _id: r._id }, { $set: { agreementVotes: filteredVotes, likes: filteredLikes } });
        reviewsUpdated += 1;
        totalVotesRemoved += removedVotes;
        totalLikesRemoved += removedLikes;
        console.log(`Updated review ${r._id}: removed ${removedVotes} orphan votes, ${removedLikes} orphan likes`);
      }
    }

    console.log(`Done. Reviews updated: ${reviewsUpdated}. Total orphan votes removed: ${totalVotesRemoved}. Total orphan likes removed: ${totalLikesRemoved}.`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error during cleanup:', err && err.message ? err.message : err);
    try { await mongoose.disconnect(); } catch (e) {}
    process.exit(1);
  }
})();