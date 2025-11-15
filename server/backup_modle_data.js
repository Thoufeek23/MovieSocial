// Backup Modle Data - Create backup before reset
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const User = require('./models/User');

async function backupModleData() {
  try {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, 'backups');
    const backupFile = path.join(backupDir, `modle_backup_${timestamp}.json`);

    console.log('💾 MODLE DATA BACKUP - Saving Current State\n');

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Ensure backup directory exists
    try {
      await fs.mkdir(backupDir, { recursive: true });
    } catch (err) {
      // Directory might already exist
    }

    // Find all users with modle data
    const users = await User.find({ modle: { $exists: true } })
      .select('username modle createdAt')
      .lean(); // Use lean() for better JSON serialization

    console.log(`👥 Found ${users.length} users with Modle data`);

    if (users.length === 0) {
      console.log('ℹ️  No users found with Modle data. Nothing to backup.');
      return null;
    }

    // Prepare backup data
    const backupData = {
      metadata: {
        backupDate: new Date().toISOString(),
        totalUsers: users.length,
        description: 'Modle game data backup before system reset',
        version: '1.0'
      },
      users: []
    };

    let totalStreaks = 0;
    let totalHistoryEntries = 0;

    // Process each user
    for (const user of users) {
      const userData = {
        userId: user._id,
        username: user.username,
        accountCreated: user.createdAt,
        modle: {},
        statistics: {
          totalStreak: 0,
          totalHistoryEntries: 0,
          languagesPlayed: []
        }
      };

      if (user.modle) {
        // Convert Mongoose Map to plain object if needed
        const modleData = user.modle.toObject ? user.modle.toObject() : user.modle;
        userData.modle = modleData;

        // Calculate statistics
        const languages = Object.keys(modleData);
        for (const lang of languages) {
          const langData = modleData[lang];
          if (langData) {
            const streak = langData.streak || 0;
            const historyCount = langData.history ? Object.keys(langData.history).length : 0;
            
            userData.statistics.totalStreak += streak;
            userData.statistics.totalHistoryEntries += historyCount;
            
            if (historyCount > 0 && lang !== '_global') {
              userData.statistics.languagesPlayed.push(lang);
            }
          }
        }

        totalStreaks += userData.statistics.totalStreak;
        totalHistoryEntries += userData.statistics.totalHistoryEntries;
      }

      backupData.users.push(userData);
    }

    // Update metadata with totals
    backupData.metadata.totalStreaks = totalStreaks;
    backupData.metadata.totalHistoryEntries = totalHistoryEntries;

    // Save backup to file
    await fs.writeFile(backupFile, JSON.stringify(backupData, null, 2), 'utf8');

    console.log('\n✅ BACKUP COMPLETED SUCCESSFULLY!');
    console.log(`📁 Backup saved to: ${backupFile}`);
    console.log(`📊 Backup contains:`);
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   🔥 Total streaks: ${totalStreaks}`);
    console.log(`   📖 Total history entries: ${totalHistoryEntries}`);
    console.log(`   📅 Backup date: ${backupData.metadata.backupDate}`);

    console.log('\n📋 BACKUP FILE STRUCTURE:');
    console.log('   metadata: Backup information and totals');
    console.log('   users[]: Array of user data with:');
    console.log('     - userId, username, accountCreated');
    console.log('     - modle: Complete Modle data');
    console.log('     - statistics: Calculated stats');

    console.log('\n🔄 NEXT STEPS:');
    console.log('1. Review backup file if needed');
    console.log('2. Run reset script: node reset_modle_system.js');
    console.log('3. Backup file can be used to restore data if needed');

    return backupFile;

  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Restore function (for future use)
async function restoreModleData(backupFile) {
  console.log(`🔄 RESTORE MODLE DATA from ${backupFile}`);
  console.log('⚠️  This feature is not implemented yet.');
  console.log('📋 Manual restore steps:');
  console.log('1. Review backup file structure');
  console.log('2. Create custom restore script if needed');
  console.log('3. Manually update user records');
}

// Check if script is run directly
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'restore') {
    const backupFile = process.argv[3];
    if (!backupFile) {
      console.log('❌ Please specify backup file: node backup_modle_data.js restore <backup_file>');
      process.exit(1);
    }
    restoreModleData(backupFile);
  } else {
    console.log('💾 Modle Data Backup Starting...');
    backupModleData().catch(error => {
      console.error('💥 Backup script failed:', error);
      process.exit(1);
    });
  }
} else {
  module.exports = { backupModleData, restoreModleData };
}