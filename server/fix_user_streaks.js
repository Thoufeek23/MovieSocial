// Fix existing user streaks in the database
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

function getTodayUTC() {
  return new Date().toISOString().slice(0, 10);
}

function getYesterdayUTC(dateStr) {
  const parts = String(dateStr).split('-').map(n => parseInt(n, 10));
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  d.setUTCDate(d.getUTCDate() - 1);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function calculateStreakFromHistory(history, today) {
  if (!history || typeof history !== 'object') return 0;
  
  let streak = 0;
  let currentDate = today;
  
  while (currentDate) {
    const entry = history[currentDate];
    if (entry && entry.correct) {
      streak++;
      const prevDate = getYesterdayUTC(currentDate);
      if (!prevDate) break;
      currentDate = prevDate;
    } else {
      break;
    }
  }
  
  return streak;
}

async function fixUserStreaks() {
  try {
    console.log('🔧 Fixing existing user streaks...\n');

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const today = getTodayUTC();
    const users = await User.find({ modle: { $exists: true } });
    
    console.log(`👥 Found ${users.length} users with modle data\n`);

    let updatedUsers = 0;
    let updatedStreaks = 0;

    for (const user of users) {
      let userNeedsUpdate = false;
      console.log(`👤 Processing user: ${user.username}`);

      const languages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'];
      
      for (const lang of languages) {
        const modleData = user.modle.get ? user.modle.get(lang) : user.modle[lang];
        if (modleData) {
          const currentStreak = modleData.streak || 0;
          
          // Convert Map to plain object for history if needed
          let historyObj = modleData.history || {};
          if (typeof historyObj.keys === 'function') {
            historyObj = Object.fromEntries(historyObj);
          }
          
          const correctStreak = calculateStreakFromHistory(historyObj, today);
          
          if (currentStreak !== correctStreak) {
            console.log(`  📝 Updating ${lang}: ${currentStreak} → ${correctStreak}`);
            
            // Update the streak
            modleData.streak = correctStreak;
            if (user.modle.set) {
              user.modle.set(lang, modleData);
            }
            
            userNeedsUpdate = true;
            updatedStreaks++;
          } else {
            console.log(`  ✅ ${lang}: ${currentStreak} (already correct)`);
          }
        }
      }

      // Rebuild and update global streak from all languages
      console.log(`  🔄 Rebuilding global streak from all languages...`);
      
      // Collect all history entries across languages
      const globalUnion = {};
      for (const checkLang of languages) {
        const checkModle = user.modle.get ? user.modle.get(checkLang) : user.modle[checkLang];
        if (checkModle && checkModle.history) {
          let checkHistoryObj = checkModle.history || {};
          if (typeof checkHistoryObj.keys === 'function') {
            checkHistoryObj = Object.fromEntries(checkHistoryObj);
          }
          
          Object.keys(checkHistoryObj).forEach(date => {
            const entry = checkHistoryObj[date];
            if (entry && entry.date) {
              globalUnion[date] = globalUnion[date] || { 
                date: date, 
                played: true, 
                guesses: entry.guesses || [], 
                correct: !!entry.correct 
              };
            }
          });
        }
      }
      
      // Calculate correct global streak
      const correctGlobalStreak = calculateStreakFromHistory(globalUnion, today);
      const unionLastPlayed = Object.keys(globalUnion).length ? Object.keys(globalUnion).sort().pop() : null;
      
      // Update global data
      const newGlobalData = {
        lastPlayed: unionLastPlayed,
        streak: correctGlobalStreak,
        history: globalUnion
      };
      
      const existingGlobal = user.modle.get ? user.modle.get('_global') : user.modle['_global'];
      const currentGlobalStreak = existingGlobal ? existingGlobal.streak || 0 : 0;
      
      if (currentGlobalStreak !== correctGlobalStreak) {
        console.log(`  📝 Updating Global: ${currentGlobalStreak} → ${correctGlobalStreak}`);
        
        if (user.modle.set) {
          user.modle.set('_global', newGlobalData);
        } else {
          user.modle['_global'] = newGlobalData;
        }
        
        userNeedsUpdate = true;
        updatedStreaks++;
      } else {
        console.log(`  ✅ Global: ${currentGlobalStreak} (already correct)`);
      }

      if (userNeedsUpdate) {
        user.markModified('modle');
        await user.save();
        updatedUsers++;
        console.log(`  💾 Saved user: ${user.username}`);
      }

      console.log(''); // Empty line between users
    }

    console.log(`🎯 Summary:`);
    console.log(`📊 Total users processed: ${users.length}`);
    console.log(`👥 Users updated: ${updatedUsers}`);
    console.log(`🔢 Streaks fixed: ${updatedStreaks}`);
    console.log(`✅ All user streaks are now correct!`);

  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixUserStreaks();