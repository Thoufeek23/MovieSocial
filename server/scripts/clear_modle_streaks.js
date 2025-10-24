// One-off script to clear Modle streak/history from users
// Usage:
//   node server/scripts/clear_modle_streaks.js           # prompts for confirmation, clears all modle data
//   node server/scripts/clear_modle_streaks.js --yes     # run without prompt
//   node server/scripts/clear_modle_streaks.js --lang=Hindi  # clears only the `Hindi` entry inside user.modle

require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  logger.error('MONGO_URI not set in environment or .env; set MONGO_URI before running this script.');
  process.exit(1);
}

const User = require('../models/User');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { yes: false, lang: null };
  for (const a of args) {
    if (a === '--yes' || a === '-y') opts.yes = true;
    else if (a.startsWith('--lang=')) opts.lang = a.split('=')[1];
    else if (a.startsWith('-l=')) opts.lang = a.split('=')[1];
  }
  return opts;
}

async function confirmPrompt(msg) {
  if (!process.stdin.isTTY) return false;
  return new Promise((resolve) => {
    process.stdout.write(msg + ' (y/N): ');
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', (d) => {
      const t = (d || '').toString().trim().toLowerCase();
      resolve(t === 'y' || t === 'yes');
    });
  });
}

(async function run() {
  const opts = parseArgs();
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    logger.info('Connected to MongoDB.');

    if (!opts.lang) {
      if (!opts.yes) {
        const ok = await confirmPrompt('This will REMOVE the entire `modle` field from all users. Continue?');
        if (!ok) {
          logger.info('Aborted by user.');
          await mongoose.disconnect();
          process.exit(0);
        }
      }

      const res = await User.updateMany({ modle: { $exists: true } }, { $unset: { modle: '' } });
      const count = res && (res.modifiedCount || res.nModified || 0);
      logger.info(`Removed 'modle' field from ${count} users.`);
    } else {
      const lang = opts.lang;
      if (!opts.yes) {
        const ok = await confirmPrompt(`This will REMOVE the '${lang}' entry inside user.modle for all users. Continue?`);
        if (!ok) {
          logger.info('Aborted by user.');
          await mongoose.disconnect();
          process.exit(0);
        }
      }

      const path = `modle.${lang}`;
      const unset = {};
      unset[path] = '';
      const res = await User.updateMany({ [path]: { $exists: true } }, { $unset: unset });
      const count = res && (res.modifiedCount || res.nModified || 0);
      logger.info(`Removed '${lang}' from 'modle' on ${count} users.`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    logger.error('Error while clearing modle streaks:', err && err.message ? err.message : err);
    try { await mongoose.disconnect(); } catch (e) {}
    process.exit(1);
  }
})();
