import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { readJson, writeJson } from '../services/db.js';
import { isNowBetween, todayDayOfWeek } from '../utils/time.js';

const router = express.Router();

router.use(requireAuth, requireRole('student'));

router.get('/today-classes', (req, res) => {
  const classes = readJson('classes', []);
  const today = todayDayOfWeek();
  const my = classes.filter(c => c.dayOfWeek === today && (c.students || []).includes(req.user._id));
  const attendance = readJson('attendance', []);
  const now = new Date();
  const dateKey = now.toISOString().slice(0, 10);

  const result = my.map(c => {
    const already = attendance.find(a => a.classId === c._id && a.studentId === req.user._id && a.date === dateKey);
    return {
      ...c,
      isOngoing: isNowBetween(c.start, c.end, now),
      attendanceGiven: Boolean(already)
    };
  });
  res.json({ success: true, classes: result });
});

router.post('/attendance', (req, res) => {
  const { classId, imageData } = req.body; // imageData ignored in mock
  if (!classId) return res.status(400).json({ success: false, message: 'classId required' });

  const classes = readJson('classes', []);
  const cls = classes.find(c => c._id === classId);
  if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
  if (!(cls.students || []).includes(req.user._id)) return res.status(403).json({ success: false, message: 'Not enrolled' });

  // mock verification always success
  const now = new Date();
  const dateKey = now.toISOString().slice(0, 10);

  const attendance = readJson('attendance', []);
  const exists = attendance.find(a => a.classId === classId && a.studentId === req.user._id && a.date === dateKey);
  if (exists) return res.json({ success: true, message: 'Already marked', record: exists });

  const record = {
    _id: `a-${Date.now()}`,
    classId,
    studentId: req.user._id,
    teacherId: cls.teacherId,
    date: dateKey,
    time: now.toISOString().slice(11, 19),
    status: 'present'
  };
  attendance.push(record);
  writeJson('attendance', attendance);
  res.json({ success: true, record });
});

export default router;
