// Run this script with: node scripts/run_monthly_badges.js [year] [month]
// Defaults to previous month

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const badges = require('../utils/badges');

async function main() {
  const argYear = process.argv[2];
  const argMonth = process.argv[3];

  let year, month;
  if (argYear && argMonth) {
    year = parseInt(argYear, 10);
    month = parseInt(argMonth, 10);
  } else {
    const now = new Date();
    now.setDate(1);
    now.setHours(0,0,0,0);
    now.setMonth(now.getMonth() - 1); // previous month
    year = now.getUTCFullYear();
    month = now.getUTCMonth() + 1; // 1-12
  }

  const MONGO = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/moviesocial';
  console.log('Connecting to', MONGO);
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });

  console.log('Running monthly badge computation for', year, month);
  await badges.computeMonthlyBadges(year, month);
  console.log('Done');
  process.exit(0);
}

main().catch(err => {
  console.error('Script error', err);
  process.exit(1);
});
