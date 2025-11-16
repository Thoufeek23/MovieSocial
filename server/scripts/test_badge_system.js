const mongoose = require('mongoose');
const User = require('../models/User');
const { handleNewUser } = require('../utils/badges');
const logger = require('../utils/logger');

// MongoDB connection string - adjust if needed
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/moviesocial';

async function createTestUserWithBadge() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if test user already exists
    const existingUser = await User.findOne({ username: 'testuser_badge' });
    if (existingUser) {
      console.log('Test user already exists. Checking badges...');
      console.log('Current badges:', existingUser.badges);
      
      // Check if user has new_user badge
      const hasNewUserBadge = existingUser.badges?.some(badge => badge.id === 'new_user');
      if (!hasNewUserBadge) {
        console.log('Adding new_user badge to existing test user...');
        await handleNewUser(existingUser._id);
        
        // Fetch updated user
        const updatedUser = await User.findById(existingUser._id);
        console.log('Updated badges:', updatedUser.badges);
      } else {
        console.log('✅ Test user already has new_user badge');
      }
      return;
    }

    // Create a test user
    console.log('Creating test user...');
    const testUser = await User.create({
      username: 'testuser_badge',
      email: 'testuser_badge@example.com',
      passwordHash: 'hashedpassword123', // This will be hashed automatically by the pre-save middleware
      bio: 'Test user for badge verification',
    });

    console.log(`✅ Test user created: ${testUser.username} (ID: ${testUser._id})`);

    // Assign the new user badge
    console.log('Assigning new_user badge...');
    await handleNewUser(testUser._id);

    // Fetch the updated user to verify badge was added
    const updatedUser = await User.findById(testUser._id);
    console.log('\n=== Badge Assignment Results ===');
    console.log(`User: ${updatedUser.username}`);
    console.log(`Email: ${updatedUser.email}`);
    console.log(`Badges: ${JSON.stringify(updatedUser.badges, null, 2)}`);

    if (updatedUser.badges && updatedUser.badges.length > 0) {
      console.log('🎉 SUCCESS: Badge system is working correctly!');
      
      updatedUser.badges.forEach((badge, index) => {
        console.log(`Badge ${index + 1}:`);
        console.log(`  ID: ${badge.id}`);
        console.log(`  Name: ${badge.name}`);
        console.log(`  Awarded At: ${badge.awardedAt}`);
      });
    } else {
      console.log('❌ ERROR: Badge was not assigned correctly');
    }

  } catch (error) {
    console.error('Script execution failed:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Handle command line arguments for cleanup
const args = process.argv.slice(2);
const shouldCleanup = args.includes('--cleanup');

if (shouldCleanup) {
  console.log('🧹 Cleaning up test users...');
  
  async function cleanup() {
    try {
      await mongoose.connect(MONGODB_URI);
      const result = await User.deleteMany({ 
        username: { $regex: /^testuser/ }
      });
      console.log(`Deleted ${result.deletedCount} test users`);
      await mongoose.connection.close();
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }
  
  cleanup().then(() => process.exit(0));
  return;
}

console.log('🧪 Testing badge system with test user...');
console.log('Use --cleanup flag to remove test users');

createTestUserWithBadge()
  .then(() => {
    console.log('✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });