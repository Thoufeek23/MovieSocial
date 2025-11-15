require('dotenv').config();
const mongoose = require('mongoose');
const Puzzle = require('../models/Puzzle');
const path = require('path');

// Import all existing puzzle data using absolute paths
const clientDataPath = path.resolve(__dirname, '../../client/src/data');
const puzzlesEng = require(path.join(clientDataPath, 'modlePuzzles'));
const puzzlesHindi = require(path.join(clientDataPath, 'modlePuzzlesHindi'));
const puzzlesTamil = require(path.join(clientDataPath, 'modlePuzzlesTamil'));
const puzzlesTelugu = require(path.join(clientDataPath, 'modlePuzzlesTelugu'));
const puzzlesKannada = require(path.join(clientDataPath, 'modlePuzzlesKannada'));
const puzzlesMalayalam = require(path.join(clientDataPath, 'modlePuzzlesMalayalam'));

const languageData = {
  'English': puzzlesEng.default || puzzlesEng,
  'Hindi': puzzlesHindi.default || puzzlesHindi,
  'Tamil': puzzlesTamil.default || puzzlesTamil,
  'Telugu': puzzlesTelugu.default || puzzlesTelugu,
  'Kannada': puzzlesKannada.default || puzzlesKannada,
  'Malayalam': puzzlesMalayalam.default || puzzlesMalayalam
};

async function migratePuzzlesToDB() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGO_URI is not set in environment');
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if puzzles already exist
    const existingCount = await Puzzle.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing puzzles in database.`);
      console.log('This script will add new puzzles without removing existing ones.');
      console.log('If you want to completely reset, please manually clear the puzzles collection first.');
    }

    let totalAdded = 0;
    let totalSkipped = 0;

    // Process each language
    for (const [language, puzzles] of Object.entries(languageData)) {
      if (!puzzles || !Array.isArray(puzzles)) {
        console.log(`⚠️  No puzzles found for ${language}, skipping...`);
        continue;
      }

      console.log(`\n📚 Processing ${language} puzzles (${puzzles.length} puzzles)...`);

      // Get current count for this language to set proper indices
      const currentCount = await Puzzle.countDocuments({ language });
      
      for (let i = 0; i < puzzles.length; i++) {
        const puzzleData = puzzles[i];
        
        if (!puzzleData.answer || !puzzleData.hints) {
          console.log(`⚠️  Skipping malformed puzzle at index ${i} for ${language}`);
          totalSkipped++;
          continue;
        }

        try {
          // Check if this exact puzzle already exists
          const existing = await Puzzle.findOne({
            language,
            answer: puzzleData.answer.toUpperCase(),
            'hints.0': puzzleData.hints[0] // Check first hint as well for uniqueness
          });

          if (existing) {
            console.log(`⏭️  Skipping duplicate: ${puzzleData.answer} (${language})`);
            totalSkipped++;
            continue;
          }

          // Create new puzzle
          const puzzle = new Puzzle({
            answer: puzzleData.answer.toUpperCase(),
            hints: puzzleData.hints,
            language,
            index: currentCount + totalAdded,
            meta: puzzleData.meta || {}
          });

          await puzzle.save();
          console.log(`✅ Added: ${puzzle.answer} (${language})`);
          totalAdded++;

        } catch (error) {
          if (error.code === 11000) {
            console.log(`⏭️  Skipping duplicate index: ${puzzleData.answer} (${language})`);
            totalSkipped++;
          } else {
            console.error(`❌ Error adding ${puzzleData.answer} (${language}):`, error.message);
            totalSkipped++;
          }
        }
      }
    }

    // Print summary
    console.log(`\n📊 Migration Summary:`);
    console.log(`✅ Total puzzles added: ${totalAdded}`);
    console.log(`⏭️  Total puzzles skipped: ${totalSkipped}`);
    
    // Print final counts by language
    console.log('\n📈 Final puzzle counts by language:');
    for (const language of Object.keys(languageData)) {
      const count = await Puzzle.countDocuments({ language });
      console.log(`   ${language}: ${count} puzzles`);
    }

    const finalTotal = await Puzzle.countDocuments();
    console.log(`\n🎯 Total puzzles in database: ${finalTotal}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Check if script is run directly
if (require.main === module) {
  console.log('🚀 Starting puzzle migration...');
  migratePuzzlesToDB();
} else {
  module.exports = migratePuzzlesToDB;
}