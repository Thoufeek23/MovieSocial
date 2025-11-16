const mongoose = require('mongoose');
const User = require('../models/User');
const logger = require('../utils/logger');

// MongoDB connection string - adjust if needed
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/moviesocial';

async function checkBadgeStatus() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get total user count
    const totalUsers = await User.countDocuments();
    console.log(`📊 Total users in database: ${totalUsers}`);

    if (totalUsers === 0) {
      console.log('No users found in the database');
      return;
    }

    // Check users with badges
    const usersWithBadges = await User.find({
      badges: { $exists: true, $ne: [] }
    }).select('_id username badges').lean();

    console.log(`🏆 Users with badges: ${usersWithBadges.length}`);

    // Check users without any badges
    const usersWithoutBadges = await User.find({
      $or: [
        { badges: { $exists: false } },
        { badges: { $size: 0 } }
      ]
    }).select('_id username badges').lean();

    console.log(`❌ Users without any badges: ${usersWithoutBadges.length}`);

    // Check specifically for new_user badge
    const usersWithNewUserBadge = await User.find({
      'badges.id': 'new_user'
    }).countDocuments();

    console.log(`🎬 Users with new_user badge: ${usersWithNewUserBadge}`);

    // Check for first_review badge
    const usersWithFirstReviewBadge = await User.find({
      'badges.id': 'first_review'
    }).countDocuments();

    console.log(`⭐ Users with first_review badge: ${usersWithFirstReviewBadge}`);

    // Show badge breakdown
    console.log('\n=== Badge Breakdown ===');
    
    // Aggregate all badge types
    const badgeStats = await User.aggregate([
      { $unwind: '$badges' },
      { $group: { _id: '$badges.id', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    badgeStats.forEach(stat => {
      console.log(`${stat._id}: ${stat.count} users`);
    });

    // Show some example users and their badges
    console.log('\n=== Sample Users and Their Badges ===');
    const sampleUsers = await User.find().limit(5).select('username badges').lean();
    
    sampleUsers.forEach(user => {
      const badgeNames = (user.badges || []).map(b => b.id || b.name).join(', ') || 'No badges';
      console.log(`${user.username}: [${badgeNames}]`);
    });

  } catch (error) {
    console.error('Script execution failed:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

console.log('🔍 Checking badge status...');
checkBadgeStatus()
  .then(() => {
    console.log('✅ Badge status check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });