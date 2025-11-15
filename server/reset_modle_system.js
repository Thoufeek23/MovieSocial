// Reset all Modle data for all users - Fresh Start Script
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function resetAllModleData() {
  try {
    console.log('🔄 MODLE SYSTEM RESET - Fresh Start for All Users\n');

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all users with modle data
    const users = await User.find({ modle: { $exists: true } });
    console.log(`👥 Found ${users.length} users with Modle data\n`);

    if (users.length === 0) {
      console.log('ℹ️  No users found with Modle data. Nothing to reset.');
      return;
    }

    // Confirm the reset operation
    console.log('⚠️  WARNING: This will completely reset ALL Modle data for ALL users!');
    console.log('📋 What will be reset:');
    console.log('   - All streaks (global and per-language) → 0');
    console.log('   - All play history → cleared');
    console.log('   - All lastPlayed dates → null');
    console.log('   - Fresh start for everyone');
    console.log('');

    // Get current date for logging
    const today = new Date().toISOString().slice(0, 10);
    console.log(`📅 Reset Date: ${today}\n`);

    let resetCount = 0;
    let errorCount = 0;

    // Process each user
    for (const user of users) {
      try {
        console.log(`🔄 Resetting user: ${user.username}`);

        // Show current state before reset
        if (user.modle) {
          const languages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', '_global'];
          console.log('   Current state:');
          
          for (const lang of languages) {
            const modleData = user.modle.get ? user.modle.get(lang) : user.modle[lang];
            if (modleData) {
              const streak = modleData.streak || 0;
              const historyCount = modleData.history ? Object.keys(modleData.history).length : 0;
              const lastPlayed = modleData.lastPlayed || 'never';
              console.log(`     ${lang}: Streak=${streak}, History=${historyCount} days, LastPlayed=${lastPlayed}`);
            }
          }
        }

        // Create fresh Modle data structure
        const freshModleData = {
          English: { lastPlayed: null, streak: 0, history: {} },
          Hindi: { lastPlayed: null, streak: 0, history: {} },
          Tamil: { lastPlayed: null, streak: 0, history: {} },
          Telugu: { lastPlayed: null, streak: 0, history: {} },
          Kannada: { lastPlayed: null, streak: 0, history: {} },
          Malayalam: { lastPlayed: null, streak: 0, history: {} },
          _global: { lastPlayed: null, streak: 0, history: {} }
        };

        // Reset the user's modle data
        if (user.modle && typeof user.modle.clear === 'function') {
          // If it's a Map, clear it and set fresh data
          user.modle.clear();
          Object.entries(freshModleData).forEach(([lang, data]) => {
            user.modle.set(lang, data);
          });
        } else {
          // If it's a plain object, replace it
          user.modle = freshModleData;
        }

        // Mark as modified for Mongoose
        user.markModified('modle');

        // Save the user
        await user.save();

        console.log(`   ✅ Reset completed for ${user.username}`);
        resetCount++;

      } catch (error) {
        console.error(`   ❌ Error resetting ${user.username}:`, error.message);
        errorCount++;
      }

      console.log(''); // Empty line between users
    }

    // Final summary
    console.log('🎯 RESET SUMMARY:');
    console.log(`📊 Total users processed: ${users.length}`);
    console.log(`✅ Successfully reset: ${resetCount}`);
    console.log(`❌ Errors encountered: ${errorCount}`);
    console.log(`📅 Reset date: ${today}`);

    if (resetCount > 0) {
      console.log('\n🎉 MODLE SYSTEM RESET COMPLETE!');
      console.log('🎮 All users now have:');
      console.log('   - Zero streaks across all languages');
      console.log('   - Empty play history');
      console.log('   - Fresh start opportunity');
      console.log('   - Ready to begin new Modle journey');
      
      console.log('\n📢 Next Steps:');
      console.log('   1. Inform users about the fresh start');
      console.log('   2. Users can play any language today');
      console.log('   3. New streaks will begin from today');
      console.log('   4. Global streak system is ready');
    }

    if (errorCount > 0) {
      console.log(`\n⚠️  Warning: ${errorCount} users could not be reset. Check the errors above.`);
    }

  } catch (error) {
    console.error('❌ Reset operation failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Add confirmation prompt for production safety
function confirmReset() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log('\n🚨 DANGER ZONE - MODLE SYSTEM RESET 🚨');
    console.log('This will permanently delete ALL Modle progress for ALL users.');
    console.log('This action cannot be undone!');
    
    rl.question('\nType "RESET ALL MODLE DATA" to confirm: ', (answer) => {
      rl.close();
      resolve(answer === 'RESET ALL MODLE DATA');
    });
  });
}

// Main execution
async function main() {
  try {
    // For safety, require confirmation unless --force flag is used
    const forceReset = process.argv.includes('--force');
    
    if (!forceReset) {
      const confirmed = await confirmReset();
      if (!confirmed) {
        console.log('\n❌ Reset cancelled. No data was modified.');
        process.exit(0);
      }
    } else {
      console.log('🚀 Force reset enabled - skipping confirmation');
    }

    await resetAllModleData();

  } catch (error) {
    console.error('💥 Script execution failed:', error);
    process.exit(1);
  }
}

// Check if script is run directly
if (require.main === module) {
  console.log('🔄 Modle System Reset Script Starting...');
  main();
} else {
  module.exports = resetAllModleData;
}

// Usage examples:
// node reset_modle_system.js              (interactive confirmation)
// node reset_modle_system.js --force      (skip confirmation - dangerous!)