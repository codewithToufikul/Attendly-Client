import express from 'express';
import { requireAuthMongo, requireRoleMongo } from '../../middleware/mongoAuth.js';
import ClassModel from '../../models/Class.js';
import Attendance from '../../models/Attendance.js';
import { todayDayOfWeek } from '../../utils/time.js';
import User from '../../models/User.js';

const router = express.Router();

router.use(requireAuthMongo, requireRoleMongo('teacher'));

// Guard: block unapproved/inactive teachers
router.use((req, res, next) => {
  if (req.user && req.user.role === 'teacher') {
    if (!req.user.active) return res.status(403).json({ success: false, message: 'Account is deactivated' });
    if (!req.user.approved) return res.status(403).json({ success: false, message: 'Account pending admin approval' });
  }
  next();
});

router.get('/today-classes', async (req, res) => {
  try {
    const day = todayDayOfWeek();
    const classes = await ClassModel.find({ dayOfWeek: day, teacherId: req.user._id }).lean();
    const dateKey = new Date().toISOString().slice(0, 10);

    const classIds = classes.map(c => c._id);
    const attendance = await Attendance.find({ classId: { $in: classIds }, date: dateKey }).lean();

    // Build attendance map per class: studentId -> { present: true, time }
    const attMapByClass = new Map();
    for (const a of attendance) {
      const ckey = String(a.classId);
      if (!attMapByClass.has(ckey)) attMapByClass.set(ckey, new Map());
      attMapByClass.get(ckey).set(String(a.studentId), { present: true, time: a.time || null });
    }

    // populate students basic info from aggregation
    const result = await ClassModel.aggregate([
      { $match: { _id: { $in: classIds } } },
      { $lookup: { from: 'users', localField: 'students', foreignField: '_id', as: 'studentDocs' } },
      { $project: { subject: 1, start: 1, end: 1, room: 1, studentDocs: { _id: 1, name: 1, roll: 1 } } }
    ]);

    const output = result.map(c => {
      const attMap = attMapByClass.get(String(c._id)) || new Map();
      return {
        _id: c._id,
        subject: c.subject,
        start: c.start,
        end: c.end,
        room: c.room,
        students: (c.studentDocs || []).map(s => {
          const att = attMap.get(String(s._id));
          return {
            _id: s._id,
            name: s.name,
            roll: s.roll,
            present: !!att,
            attendanceTime: att?.time || null,
          };
        })
      };
    });

    res.json({ success: true, classes: output });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Failed to load classes' });
  }
});

// List approved students for selection when creating classes
router.get('/students', async (req, res) => {
  try {
    const students = await User.find({ role: 'student', approved: true, active: true })
      .select('_id name email roll')
      .lean();
    res.json({ success: true, students });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Failed to load students' });
  }
});

// Teacher can create classes with multiple students
router.post('/classes', async (req, res) => {
  try {
    const { subject, students = [], dayOfWeek, start, end, room } = req.body;
    if (!subject || dayOfWeek === undefined || !start || !end) {
      return res.status(400).json({ success: false, message: 'subject, dayOfWeek, start, end required' });
    }
    const cls = await ClassModel.create({
      subject,
      teacherId: req.user._id,
      students,
      dayOfWeek,
      start,
      end,
      room,
    });
    res.json({ success: true, class: cls });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Failed to create class' });
  }
});

// List teacher's classes (not restricted to today)
router.get('/my-classes', async (req, res) => {
  try {
    const classes = await ClassModel.find({ teacherId: req.user._id }).lean();
    res.json({ success: true, classes });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Failed to load classes' });
  }
});

export default router;
