const mongoose = require('mongoose');
const User = require('../models/User');
const logger = require('../utils/logger');

// Try different possible MongoDB URIs
const possibleURIs = [
  process.env.MONGODB_URI,
  'mongodb://localhost:27017/moviesocial',
  'mongodb://127.0.0.1:27017/moviesocial',
  'mongodb://localhost:27017/movie-social',
  'mongodb://localhost:27017/MovieSocial',
  'mongodb://localhost:27017/test'
];

async function comprehensiveUserCheck() {
  console.log('🔍 Starting comprehensive database check...\n');

  for (const uri of possibleURIs) {
    if (!uri) continue;
    
    try {
      console.log(`📡 Connecting to: ${uri}`);
      await mongoose.connect(uri);
      
      // Get database name
      const dbName = mongoose.connection.db.databaseName;
      console.log(`✅ Connected to database: ${dbName}`);
      
      // List all collections
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log(`📚 Collections found: ${collections.map(c => c.name).join(', ')}`);
      
      // Check if users collection exists
      const hasUsersCollection = collections.some(c => c.name === 'users');
      if (hasUsersCollection) {
        // Get all users
        const allUsers = await User.find({}).select('username email badges createdAt').lean();
        console.log(`👥 Total users in ${dbName}: ${allUsers.length}\n`);
        
        if (allUsers.length > 0) {
          console.log('=== All Users ===');
          allUsers.forEach((user, index) => {
            const badgeCount = user.badges?.length || 0;
            const badgeList = (user.badges || []).map(b => b.id || b.name).join(', ') || 'No badges';
            const createdDate = new Date(user.createdAt).toLocaleDateString();
            console.log(`${index + 1}. ${user.username} (${user.email})`);
            console.log(`   Created: ${createdDate} | Badges (${badgeCount}): ${badgeList}`);
          });
          
          // Check users without new_user badge
          const usersWithoutNewUserBadge = allUsers.filter(user => 
            !user.badges?.some(badge => badge.id === 'new_user')
          );
          
          console.log(`\n❗ Users without new_user badge: ${usersWithoutNewUserBadge.length}`);
          if (usersWithoutNewUserBadge.length > 0) {
            usersWithoutNewUserBadge.forEach(user => {
              console.log(`   - ${user.username} (${user.email})`);
            });
          }
        }
      } else {
        console.log('❌ No users collection found in this database');
      }
      
      await mongoose.connection.close();
      console.log('\n' + '='.repeat(60) + '\n');
      
    } catch (error) {
      console.log(`❌ Failed to connect to ${uri}: ${error.message}`);
      try {
        await mongoose.connection.close();
      } catch (closeError) {
        // Ignore close errors
      }
    }
  }
  
  // Also check environment variables
  console.log('🔧 Environment Variables:');
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`MONGODB_URI: ${process.env.MONGODB_URI ? 'set (hidden for security)' : 'not set'}`);
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? 'set (hidden for security)' : 'not set'}`);
}

comprehensiveUserCheck()
  .then(() => {
    console.log('✅ Comprehensive check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Comprehensive check failed:', error);
    process.exit(1);
  });