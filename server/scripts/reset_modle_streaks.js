#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

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
  const languages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'];

  console.log(`Connecting to MongoDB... (dry-run=${!apply})`);
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });

  try {
    // Iterate all users (we will create modle object for users missing it)
    const cursor = User.find({}).select('modle').lean().cursor();

    let usersExamined = 0;
    let usersToUpdate = 0;
    const sampleUpdates = [];

    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      usersExamined++;
      if (limit && usersExamined > limit) break;

      const current = doc.modle || {};
      const updates = {};

      // Ensure top-level modle exists and each language entry exists with streak 0
      languages.forEach(lang => {
        const langObj = current[lang] || {};
        // If streak missing or non-zero, plan to set to 0 and ensure lastPlayed/history exist
        if (typeof langObj.streak !== 'number' || langObj.streak !== 0 || !langObj.history || typeof langObj.lastPlayed === 'undefined') {
          updates[`modle.${lang}`] = { lastPlayed: langObj.lastPlayed || null, streak: 0, history: langObj.history || {} };
        }
      });

      if (Object.keys(updates).length > 0) {
        usersToUpdate++;
        if (sampleUpdates.length < 5) sampleUpdates.push({ _id: doc._id, updates });

        if (apply) {
          // perform a single $set with all language objects (safe: won't touch other top-level fields)
          // eslint-disable-next-line no-await-in-loop
          await User.updateOne({ _id: doc._id }, { $set: updates });
        }
      }
    }

    console.log(`Users examined: ${usersExamined}`);
    console.log(`Users requiring update: ${usersToUpdate}`);
    if (sampleUpdates.length) {
      console.log('Sample updates (first 5):');
      sampleUpdates.forEach(s => console.log(JSON.stringify(s, null, 2)));
    }

    if (!apply) {
      console.log('\nDry-run complete. To actually apply the changes, re-run with the --apply flag.');
    } else {
      console.log('\nApply complete. All modle language streaks have been initialized to 0.');
    }
  } catch (err) {
    console.error('Error while resetting modle streaks:', err && err.stack ? err.stack : err);
    process.exitCode = 2;
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(err => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  process.exit(1);
});
