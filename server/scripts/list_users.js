require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function listUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    const users = await User.find({})
      .select('username email isAdmin role createdAt')
      .sort({ createdAt: -1 });
    
    if (users.length === 0) {
      console.log('📭 No users found in the database');
      return;
    }
    
    console.log(`\n👥 Found ${users.length} users:\n`);
    console.log('Username'.padEnd(20) + 'Email'.padEnd(30) + 'Admin'.padEnd(8) + 'Created');
    console.log('-'.repeat(75));
    
    users.forEach(user => {
      const username = (user.username || 'N/A').padEnd(20);
      const email = (user.email || 'N/A').padEnd(30);
      const isAdmin = (user.isAdmin || user.role === 'admin' ? 'Yes' : 'No').padEnd(8);
      const created = new Date(user.createdAt).toLocaleDateString();
      
      console.log(`${username}${email}${isAdmin}${created}`);
    });
    
    const adminCount = users.filter(u => u.isAdmin || u.role === 'admin').length;
    console.log(`\n📊 Summary: ${users.length} total users, ${adminCount} admins`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

listUsers();