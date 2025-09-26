import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { envVars } from './config/env.js';
import User from './models/User.js';
import ClassModel from './models/Class.js';

const run = async () => {
  try {
    await mongoose.connect(envVars.MONGO_URI);
    console.log('Connected to MongoDB for seeding');

    await User.deleteMany({});
    await ClassModel.deleteMany({});

    const password = await bcrypt.hash('123456', 10);

    const admin = await User.create({ role: 'admin', name: 'Admin User', email: 'admin@test.com', password });
    const teacher = await User.create({ role: 'teacher', name: 'John Teacher', email: 'teacher@test.com', password });
    const student = await User.create({ role: 'student', name: 'Alice Student', email: 'student@test.com', password, roll: 'CSE-190101', faceEmbedding: null });

    const now = new Date();
    const day = now.getDay(); // 0..6

    await ClassModel.create([
      { subject: 'Web Programming', teacherId: teacher._id, students: [student._id], dayOfWeek: day, start: '08:00', end: '08:45', room: 'C-301' },
      { subject: 'Data Structures', teacherId: teacher._id, students: [student._id], dayOfWeek: day, start: '09:00', end: '09:45', room: 'C-302' }
    ]);

    console.log('Seeded users and classes');
  } catch (e) {
    console.error('Seed error', e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
