require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function makeUserAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get username from command line args or use default
    const username = process.argv[2];
    
    if (!username) {
      console.log('❌ Please provide a username');
      console.log('Usage: node make_admin.js <username>');
      process.exit(1);
    }
    
    // Find user by username
    const user = await User.findOne({ username: username });
    
    if (!user) {
      console.log(`❌ User "${username}" not found`);
      process.exit(1);
    }
    
    // Add admin flag
    user.isAdmin = true;
    await user.save();
    
    console.log(`✅ Successfully made "${username}" an admin`);
    console.log(`   User ID: ${user._id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Admin Status: ${user.isAdmin}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

makeUserAdmin();