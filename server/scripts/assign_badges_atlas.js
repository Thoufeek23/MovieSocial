require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const { handleNewUser } = require('../utils/badges');
const logger = require('../utils/logger');

// Use the actual MONGO_URI from .env file
const MONGO_URI = process.env.MONGO_URI;

async function assignMissingBadges() {
  try {
    if (!MONGO_URI) {
      console.error('❌ MONGO_URI not found in environment variables');
      console.log('Make sure you have a .env file in the server directory with MONGO_URI set');
      return;
    }

    console.log('🔗 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Get total user count first
    const totalUsers = await User.countDocuments();
    console.log(`📊 Total users in database: ${totalUsers}`);

    if (totalUsers === 0) {
      console.log('ℹ️  No users found in database. Badge assignment will happen automatically when users sign up.');
      return;
    }

    // Show all users first
    console.log('\n👥 All Users in Database:');
    const allUsers = await User.find({}).select('username email badges createdAt').lean();
    allUsers.forEach((user, index) => {
      const badgeCount = user.badges?.length || 0;
      const badgeList = (user.badges || []).map(b => `${b.name} (${b.id})`).join(', ') || 'No badges';
      const createdDate = new Date(user.createdAt).toLocaleDateString();
      console.log(`${index + 1}. ${user.username} (${user.email})`);
      console.log(`   📅 Created: ${createdDate} | 🏆 Badges (${badgeCount}): ${badgeList}`);
    });

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

    console.log(`\n🔍 Found ${usersWithoutNewUserBadge.length} users without the new_user badge`);

    if (usersWithoutNewUserBadge.length === 0) {
      console.log('✅ All users already have the new_user badge!');
      return;
    }

    // Show preview of users who will get badges
    console.log('\n📝 Users to receive new_user badge:');
    usersWithoutNewUserBadge.forEach((user, index) => {
      const existingBadges = (user.badges || []).map(b => b.id).join(', ') || 'none';
      console.log(`  ${index + 1}. ${user.username} (${user.email}) - Current badges: ${existingBadges}`);
    });

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
  console.log('Usage: node assign_badges_atlas.js --apply');
  process.exit(0);
}

console.log('🚀 Starting badge assignment script for MongoDB Atlas...');
assignMissingBadges()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });