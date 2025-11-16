const mongoose = require('mongoose');
const User = require('../models/User');

// MongoDB connection string - adjust if needed
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/moviesocial';

async function createUserWithoutBadge() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create a user directly without going through the signup process
    // This simulates an existing user who was created before the badge system
    const userWithoutBadge = new User({
      username: 'legacy_user',
      email: 'legacy_user@example.com',
      passwordHash: 'hashedpassword123',
      bio: 'Legacy user created before badge system',
      badges: [] // Explicitly set empty badges array
    });

    // Save without triggering badge assignment middleware
    await userWithoutBadge.save();
    
    console.log(`✅ Created legacy user: ${userWithoutBadge.username} (ID: ${userWithoutBadge._id})`);
    console.log(`📋 User badges: ${JSON.stringify(userWithoutBadge.badges)}`);

  } catch (error) {
    console.error('Failed to create legacy user:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

createUserWithoutBadge();