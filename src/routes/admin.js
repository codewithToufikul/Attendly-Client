import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { readJson, writeJson } from '../services/db.js';

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

// Users: list
router.get('/users', (req, res) => {
  const users = readJson('users', []);
  res.json({ success: true, users });
});

// Users: create
router.post('/users', (req, res) => {
  const users = readJson('users', []);
  const { role, name, email, roll } = req.body;
  if (!role || !name || !email) return res.status(400).json({ success: false, message: 'role, name, email required' });
  const exists = users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (exists) return res.status(409).json({ success: false, message: 'Email already exists' });
  const user = { _id: `u-${Date.now()}`, role, name, email, roll, password: null };
  users.push(user);
  writeJson('users', users);
  res.json({ success: true, user });
});

// Users: update
router.put('/users/:id', (req, res) => {
  const users = readJson('users', []);
  const idx = users.findIndex(u => u._id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'User not found' });
  users[idx] = { ...users[idx], ...req.body, _id: users[idx]._id };
  writeJson('users', users);
  res.json({ success: true, user: users[idx] });
});

// Users: delete
router.delete('/users/:id', (req, res) => {
  let users = readJson('users', []);
  const before = users.length;
  users = users.filter(u => u._id !== req.params.id);
  writeJson('users', users);
  res.json({ success: true, deleted: before - users.length });
});

// Classes: list
router.get('/classes', (req, res) => {
  const classes = readJson('classes', []);
  res.json({ success: true, classes });
});

// Classes: create
router.post('/classes', (req, res) => {
  const classes = readJson('classes', []);
  const { subject, teacherId, students = [], dayOfWeek, start, end, room } = req.body;
  if (!subject || !teacherId || dayOfWeek === undefined || !start || !end) {
    return res.status(400).json({ success: false, message: 'subject, teacherId, dayOfWeek, start, end required' });
  }
  const cls = { _id: `c-${Date.now()}`, subject, teacherId, students, dayOfWeek, start, end, room };
  classes.push(cls);
  writeJson('classes', classes);
  res.json({ success: true, class: cls });
});

// Classes: update
router.put('/classes/:id', (req, res) => {
  const classes = readJson('classes', []);
  const idx = classes.findIndex(c => c._id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Class not found' });
  classes[idx] = { ...classes[idx], ...req.body, _id: classes[idx]._id };
  writeJson('classes', classes);
  res.json({ success: true, class: classes[idx] });
});

// Classes: delete
router.delete('/classes/:id', (req, res) => {
  let classes = readJson('classes', []);
  const before = classes.length;
  classes = classes.filter(c => c._id !== req.params.id);
  writeJson('classes', classes);
  res.json({ success: true, deleted: before - classes.length });
});

// Attendance: list all (today) or by class
router.get('/attendance', (req, res) => {
  const attendance = readJson('attendance', []);
  const { classId, date } = req.query;
  const day = date || new Date().toISOString().slice(0, 10);
  const filtered = attendance.filter(a => (!classId || a.classId === classId) && a.date === day);
  res.json({ success: true, records: filtered });
});

export default router;
