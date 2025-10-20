/*
 Script to rename existing badge entries with id 'first_review' from name 'First Review' to 'New User'.
 Run with: node scripts/migrate_first_review_badge_name.js
*/

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const User = require('../models/User');

async function main() {
  const MONGO = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/moviesocial';
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });

  // Update users who already have the badge id 'first_review'
  const badgeId = 'first_review';
  const newName = 'New User';

  const users = await User.find({ 'badges.id': badgeId }).select('_id badges');
  console.log('Found', users.length, 'users with badge', badgeId);

  for (const u of users) {
    let changed = false;
    const newBadges = (u.badges || []).map(b => {
      if (String(b.id) === badgeId && b.name !== newName) {
        changed = true;
        return { ...b.toObject ? b.toObject() : b, name: newName };
      }
      return b;
    });
    if (changed) {
      await User.updateOne({ _id: u._id }, { $set: { badges: newBadges } });
      console.log('Updated user', u._id.toString());
    }
  }

  console.log('Migration complete');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
