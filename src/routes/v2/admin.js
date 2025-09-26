import express from 'express';
import { requireAuthMongo, requireRoleMongo } from '../../middleware/mongoAuth.js';
import User from '../../models/User.js';
import ClassModel from '../../models/Class.js';
const router = express.Router();

router.use(requireAuthMongo, requireRoleMongo('admin'));

// Users listing and status management (approve/reject/activate/deactivate)
router.get('/users', async (req, res) => {
  const users = await User.find().select('_id role name email roll approved active').lean();
  res.json({ success: true, users });
});

// Approve user (teacher/student)
router.post('/users/:id/approve', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { approved: true, active: true },
      { new: true }
    ).select('_id role name email roll approved active');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Failed to approve user' });
  }
});

// Reject user (set approved=false & active=false)
router.post('/users/:id/reject', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { approved: false, active: false },
      { new: true }
    ).select('_id role name email roll approved active');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Failed to reject user' });
  }
});

// Activate user
router.post('/users/:id/activate', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { active: true },
      { new: true }
    ).select('_id role name email roll approved active');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Failed to activate user' });
  }
});

// Deactivate user
router.post('/users/:id/deactivate', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    ).select('_id role name email roll approved active');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Failed to deactivate user' });
  }
});

// Classes: list only (no create from admin)
router.get('/classes', async (req, res) => {
  const classes = await ClassModel.find().lean();
  res.json({ success: true, classes });
});

// Admin can view and optionally delete classes (no create or update)
router.delete('/classes/:id', async (req, res) => {
  try {
    const result = await ClassModel.findByIdAndDelete(req.params.id);
    res.json({ success: true, deleted: result ? 1 : 0 });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Failed to delete class' });
  }
});

export default router;
