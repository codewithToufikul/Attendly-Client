import express from 'express';
import { requireAuthMongo, requireRoleMongo } from '../../middleware/mongoAuth.js';
import ClassModel from '../../models/Class.js';
import Attendance from '../../models/Attendance.js';
import User from '../../models/User.js';
import { cosineSimilarity } from '../../utils/similarity.js';
import { todayDayOfWeek, isNowBetween } from '../../utils/time.js';
import { emitAttendanceMarked } from '../../socket.js';

const router = express.Router();

router.use(requireAuthMongo, requireRoleMongo('student'));

// Today classes for student
router.get('/today-classes', async (req, res) => {
  const day = todayDayOfWeek();
  const classes = await ClassModel.find({ dayOfWeek: day, students: req.user._id }).lean();
  const now = new Date();
  const dateKey = now.toISOString().slice(0, 10);
  const att = await Attendance.find({ studentId: req.user._id, date: dateKey }).lean();
  const marked = new Set(att.map(a => a.classId.toString()));
  const result = classes.map(c => ({
    ...c,
    isOngoing: isNowBetween(c.start, c.end, now),
    attendanceGiven: marked.has(c._id.toString()),
  }));
  res.json({ success: true, classes: result });
});

// Mark attendance with embedding verification
router.post('/attendance', async (req, res) => {
  try {
    const { classId, embedding = [], threshold = 0.75 } = req.body; // threshold can be tuned
    if (!classId || !Array.isArray(embedding) || embedding.length === 0) {
      return res.status(400).json({ success: false, message: 'classId and embedding are required' });
    }

    const cls = await ClassModel.findById(classId);
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    if (!cls.students.map(String).includes(String(req.user._id))) {
      return res.status(403).json({ success: false, message: 'Not enrolled' });
    }

    // Verify time window
    const now = new Date();
    if (!isNowBetween(cls.start, cls.end, now)) {
      return res.status(400).json({ success: false, message: 'Attendance window closed' });
    }

    // Verify embedding against stored face
    const enrolled = await User.findById(req.user._id).lean();
    const stored = enrolled?.faceEmbedding?.vector || [];
    if (!stored.length) {
      return res.status(400).json({ success: false, message: 'No enrolled face embedding' });
    }
    const sim = cosineSimilarity(stored, embedding);
    if (sim < threshold) {
      return res.status(401).json({ success: false, message: 'Face verification failed', similarity: sim });
    }

    const dateKey = now.toISOString().slice(0, 10);
    const time = now.toISOString().slice(11, 19);

    const record = await Attendance.findOneAndUpdate(
      { classId: cls._id, studentId: req.user._id, date: dateKey },
      { $setOnInsert: { teacherId: cls.teacherId, time, status: 'present' } },
      { new: true, upsert: true }
    );

    // Emit socket event to teacher room for this class
    emitAttendanceMarked(String(cls._id), {
      classId: String(cls._id),
      studentId: String(req.user._id),
      date: dateKey,
      time,
      status: 'present'
    });

    res.json({ success: true, record });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Failed to mark attendance' });
  }
});

export default router;
