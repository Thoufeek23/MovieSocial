#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error('FATAL: MONGO_URI is not set in environment. Set MONGO_URI to your DB connection string.');
  process.exit(1);
}

async function inspect() {
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
    const db = mongoose.connection.db;
    console.log('Connected. databaseName =', db.databaseName);
    const cols = await db.listCollections().toArray();
    console.log('Collections:', cols.map(c => c.name));

    // Try count in users collection if present
    const usersCol = cols.find(c => c.name.toLowerCase().includes('user'))?.name;
    if (usersCol) {
      const count = await db.collection(usersCol).countDocuments();
      console.log(`Document count in '${usersCol}':`, count);
      const sample = await db.collection(usersCol).findOne({}, { projection: { modle: 1, _id: 1 } });
      console.log('Sample user (modle field):', sample);
    } else {
      console.log('No collection with name containing "user" found.');
    }
  } catch (err) {
    console.error('Inspect failed:', err && err.stack ? err.stack : err);
    process.exitCode = 2;
  } finally {
    await mongoose.disconnect();
  }
}

inspect();
