// Preview Modle Reset - Shows what would be reset without making changes
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function previewModleReset() {
  try {
    console.log('👀 MODLE RESET PREVIEW - No Changes Will Be Made\n');

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all users with modle data
    const users = await User.find({ modle: { $exists: true } });
    console.log(`👥 Found ${users.length} users with Modle data\n`);

    if (users.length === 0) {
      console.log('ℹ️  No users found with Modle data.');
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    console.log(`📅 Preview Date: ${today}\n`);

    let totalStreaks = 0;
    let totalHistoryEntries = 0;
    let activeUsers = 0;
    const languageStats = {};

    // Analyze current state
    for (const user of users) {
      console.log(`👤 User: ${user.username}`);
      
      let userHasData = false;
      let userStreaks = 0;
      let userHistoryCount = 0;

      if (user.modle) {
        const languages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', '_global'];
        
        for (const lang of languages) {
          const modleData = user.modle.get ? user.modle.get(lang) : user.modle[lang];
          if (modleData) {
            const streak = modleData.streak || 0;
            let historyCount = 0;
            
            if (modleData.history) {
              if (typeof modleData.history.size === 'number') {
                historyCount = modleData.history.size;
              } else {
                historyCount = Object.keys(modleData.history).length;
              }
            }
            
            const lastPlayed = modleData.lastPlayed || 'never';
            
            if (streak > 0 || historyCount > 0 || lastPlayed !== 'never') {
              userHasData = true;
              console.log(`   ${lang}: Streak=${streak}, History=${historyCount} days, LastPlayed=${lastPlayed}`);
              
              userStreaks += streak;
              userHistoryCount += historyCount;
              
              // Track language usage
              if (lang !== '_global') {
                languageStats[lang] = (languageStats[lang] || 0) + (historyCount > 0 ? 1 : 0);
              }
            }
          }
        }

        if (userHasData) {
          activeUsers++;
          totalStreaks += userStreaks;
          totalHistoryEntries += userHistoryCount;
          console.log(`   📊 User totals: ${userStreaks} streak points, ${userHistoryCount} history entries`);
        } else {
          console.log('   📭 No active Modle data');
        }
      } else {
        console.log('   📭 No Modle data');
      }
      
      console.log(''); // Empty line between users
    }

    // Summary statistics
    console.log('📊 CURRENT SYSTEM STATISTICS:');
    console.log(`👥 Total users: ${users.length}`);
    console.log(`🎮 Active Modle users: ${activeUsers}`);
    console.log(`🔥 Total streak points: ${totalStreaks}`);
    console.log(`📖 Total history entries: ${totalHistoryEntries}`);
    
    console.log('\n📈 Language Usage:');
    Object.entries(languageStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([lang, count]) => {
        console.log(`   ${lang}: ${count} active users`);
      });

    // Show what would happen
    console.log('\n🔄 WHAT WOULD BE RESET:');
    console.log(`✂️  ${totalStreaks} total streak points → 0`);
    console.log(`🗑️  ${totalHistoryEntries} history entries → deleted`);
    console.log(`👥 ${activeUsers} users → fresh start`);
    console.log(`🌍 Global streaks → reset to 0`);
    console.log(`📅 All lastPlayed dates → null`);

    console.log('\n💾 AFTER RESET, ALL USERS WOULD HAVE:');
    console.log('   - Streak: 0 (all languages)');
    console.log('   - History: {} (empty)');
    console.log('   - LastPlayed: null');
    console.log('   - Ready for fresh start');

    console.log('\n⚠️  TO ACTUALLY PERFORM THE RESET:');
    console.log('   Run: node reset_modle_system.js');
    console.log('   Or: node reset_modle_system.js --force');

  } catch (error) {
    console.error('❌ Preview failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Check if script is run directly
if (require.main === module) {
  console.log('👀 Modle Reset Preview Starting...');
  previewModleReset();
} else {
  module.exports = previewModleReset;
}