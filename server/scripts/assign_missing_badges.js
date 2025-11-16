const mongoose = require('mongoose');
const User = require('../models/User');
const { handleNewUser, BADGES } = require('../utils/badges');
const logger = require('../utils/logger');

// MongoDB connection string - adjust if needed
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/moviesocial';

async function assignMissingBadges() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get total user count first
    const totalUsers = await User.countDocuments();
    console.log(`📊 Total users in database: ${totalUsers}`);

    if (totalUsers === 0) {
      console.log('ℹ️  No users found in database. Badge assignment will happen automatically when users sign up.');
      return;
    }

    // Find all users who don't have the new_user badge
    const usersWithoutNewUserBadge = await User.find({
      $and: [
        {
          $or: [
            { badges: { $exists: false } },
            { badges: { $size: 0 } },
            { 'badges.id': { $ne: 'new_user' } }
          ]
        }
      ]
    }).select('_id username email badges createdAt');

    console.log(`🔍 Found ${usersWithoutNewUserBadge.length} users without the new_user badge`);

    if (usersWithoutNewUserBadge.length === 0) {
      console.log('✅ All users already have the new_user badge!');
      
      // Show current badge statistics
      const badgeStats = await User.aggregate([
        { $match: { 'badges.id': 'new_user' } },
        { $group: { _id: null, count: { $sum: 1 } } }
      ]);
      
      const newUserBadgeCount = badgeStats[0]?.count || 0;
      console.log(`🎬 Users with new_user badge: ${newUserBadgeCount}/${totalUsers}`);
      return;
    }

    // Show preview of users who will get badges
    console.log('\n📝 Users to receive new_user badge:');
    usersWithoutNewUserBadge.slice(0, 10).forEach((user, index) => {
      const existingBadges = (user.badges || []).map(b => b.id).join(', ') || 'none';
      console.log(`  ${index + 1}. ${user.username} (${user.email}) - Current badges: ${existingBadges}`);
    });
    
    if (usersWithoutNewUserBadge.length > 10) {
      console.log(`  ... and ${usersWithoutNewUserBadge.length - 10} more users`);
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Award the new user badge to each user
    console.log('\n🚀 Starting badge assignment...');
    for (const [index, user] of usersWithoutNewUserBadge.entries()) {
      try {
        const progress = `[${index + 1}/${usersWithoutNewUserBadge.length}]`;
        console.log(`${progress} Assigning new_user badge to: ${user.username}`);
        
        await handleNewUser(user._id);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to assign badge to user ${user.username}: ${error.message}`);
        errors.push({ username: user.username, error: error.message });
        errorCount++;
      }
    }

    console.log('\n=== Badge Assignment Complete ===');
    console.log(`✅ Successfully assigned badges: ${successCount}`);
    console.log(`❌ Failed assignments: ${errorCount}`);
    console.log(`📊 Total users processed: ${usersWithoutNewUserBadge.length}`);

    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach(err => {
        console.log(`  • ${err.username}: ${err.error}`);
      });
    }

    // Verify the results
    const updatedUsers = await User.find({
      'badges.id': 'new_user'
    }).countDocuments();

    console.log(`\n🎉 Total users now with new_user badge: ${updatedUsers}/${totalUsers}`);
    
    // Show badge statistics
    console.log('\n📈 Final Badge Statistics:');
    const badgeStats = await User.aggregate([
      { $unwind: { path: '$badges', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$badges.id', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    badgeStats.forEach(stat => {
      if (stat._id) {
        const badgeInfo = Object.values(BADGES).find(b => b.id === stat._id);
        const badgeName = badgeInfo ? badgeInfo.name : stat._id;
        console.log(`  🏆 ${badgeName} (${stat._id}): ${stat.count} users`);
      }
    });

  } catch (error) {
    console.error('❌ Script execution failed:', error);
    throw error;
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const shouldApply = args.includes('--apply');

if (!shouldApply) {
  console.log('🔍 DRY RUN MODE');
  console.log('Add --apply flag to actually assign badges');
  console.log('Usage: node assign_missing_badges.js --apply');
  process.exit(0);
}

console.log('🚀 Starting badge assignment script...');
assignMissingBadges()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });