import mongoose from 'mongoose';
import { envVars } from '../src/config/env.js';

async function main() {
  const uri = envVars.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI not set in environment');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const coll = db.collection('attendances');

  console.log('Current indexes on attendances:');
  const before = await coll.indexes();
  console.table(before.map(i => ({ name: i.name, key: i.key, unique: !!i.unique })));

  // Drop legacy/stale index if it exists
  const legacyIndex = before.find(i => i.name === 'user_1_date_1');
  if (legacyIndex) {
    console.log('Dropping legacy index user_1_date_1 ...');
    await coll.dropIndex('user_1_date_1');
    console.log('Dropped user_1_date_1');
  } else {
    console.log('Legacy index user_1_date_1 not found, nothing to drop.');
  }

  // Ensure the correct unique index exists
  const desiredName = 'classId_1_studentId_1_date_1';
  const hasDesired = (await coll.indexes()).some(i => i.name === desiredName);
  if (!hasDesired) {
    console.log('Creating unique index on { classId:1, studentId:1, date:1 } ...');
    await coll.createIndex({ classId: 1, studentId: 1, date: 1 }, { unique: true, name: desiredName });
    console.log('Created index', desiredName);
  } else {
    console.log('Desired index already exists:', desiredName);
  }

  const after = await coll.indexes();
  console.log('Indexes after migration:');
  console.table(after.map(i => ({ name: i.name, key: i.key, unique: !!i.unique })));

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
