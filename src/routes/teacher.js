import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { readJson } from '../services/db.js';
import { todayDayOfWeek } from '../utils/time.js';

const router = express.Router();

router.use(requireAuth, requireRole('teacher'));

router.get('/today-classes', (req, res) => {
  const classes = readJson('classes', []);
  const attendance = readJson('attendance', []);
  const today = todayDayOfWeek();

  const mine = classes.filter(c => c.teacherId === req.user._id && c.dayOfWeek === today);
  const withStudents = mine.map(c => {
    const studentIds = c.students || [];
    const users = readJson('users', []);
    const students = users.filter(u => studentIds.includes(u._id));
    const todays = attendance.filter(a => a.classId === c._id && a.date === new Date().toISOString().slice(0,10));
    const presentMap = new Map(todays.map(a => [a.studentId, a]));
    return {
      ...c,
      students: students.map(s => ({ _id: s._id, name: s.name, roll: s.roll, present: Boolean(presentMap.get(s._id)) })),
    };
  });

  res.json({ success: true, classes: withStudents });
});

export default router;
