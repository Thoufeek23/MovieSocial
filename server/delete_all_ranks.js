// Script to delete all ranks from the database
require('dotenv').config();
const mongoose = require('mongoose');
const Rank = require('./models/Rank');

async function deleteAllRanks() {
  try {
    console.log('🗑️  DELETE ALL RANKS SCRIPT\n');
    
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Count existing ranks
    const count = await Rank.countDocuments();
    console.log(`📊 Found ${count} rank(s) in database\n`);

    if (count === 0) {
      console.log('ℹ️  No ranks to delete. Database is already clean.');
      process.exit(0);
    }

    // Confirm deletion (comment out for automatic execution)
    console.log('⚠️  WARNING: This will permanently delete all ranks!');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Delete all ranks
    console.log('🗑️  Deleting all ranks...');
    const result = await Rank.deleteMany({});
    
    console.log(`✅ Successfully deleted ${result.deletedCount} rank(s)\n`);

    // Verify deletion
    const remainingCount = await Rank.countDocuments();
    console.log(`📊 Verification: ${remainingCount} rank(s) remaining in database\n`);

    if (remainingCount === 0) {
      console.log('🎉 SUCCESS: All ranks have been deleted!');
    } else {
      console.log('⚠️  WARNING: Some ranks may not have been deleted. Please check manually.');
    }

    process.exit(0);

  } catch (error) {
    console.error('❌ Error deleting ranks:', error);
    process.exit(1);
  }
}

// Run the script
deleteAllRanks();
