#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

// Load User model
const User = require(path.join(__dirname, '..', 'models', 'User'));

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('FATAL: MONGO_URI is not set in environment. Set MONGO_URI to your DB connection string.');
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.split('=')[1]) : null;

  // languages supported by the client; we'll initialize these
  const languages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', '_global'];

  console.log(`Connecting to MongoDB... (dry-run=${!apply})`);
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });

  try {
    // Iterate all users and completely reset their modle data
    const cursor = User.find({}).select('modle').lean().cursor();

    let usersExamined = 0;
    let usersToUpdate = 0;
    const sampleUpdates = [];

    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      usersExamined++;
      if (limit && usersExamined > limit) break;

      const current = doc.modle || {};
      const updates = {};

      // Reset each language completely: streak 0, history empty, lastPlayed null
      languages.forEach(lang => {
        updates[`modle.${lang}`] = { 
          lastPlayed: null, 
          streak: 0, 
          history: {} // CLEAR ALL HISTORY
        };
      });

      usersToUpdate++;
      if (sampleUpdates.length < 5) sampleUpdates.push({ _id: doc._id, updates });

      if (apply) {
        // perform a single $set with all language objects (completely resets modle data)
        // eslint-disable-next-line no-await-in-loop
        await User.updateOne({ _id: doc._id }, { $set: updates });
      }
    }

    console.log(`Users examined: ${usersExamined}`);
    console.log(`Users requiring update: ${usersToUpdate}`);
    if (sampleUpdates.length) {
      console.log('Sample updates (first 5):');
      sampleUpdates.forEach(s => console.log(JSON.stringify(s, null, 2)));
    }

    if (!apply) {
      console.log('\nDry-run complete. This will COMPLETELY RESET all modle data (streaks AND history).');
      console.log('To actually apply the changes, re-run with the --apply flag.');
    } else {
      console.log('\nApply complete. All modle data has been completely reset (streaks=0, history={}).');
    }
  } catch (err) {
    console.error('Error while resetting modle data:', err && err.stack ? err.stack : err);
    process.exitCode = 2;
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(err => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  process.exit(1);
});