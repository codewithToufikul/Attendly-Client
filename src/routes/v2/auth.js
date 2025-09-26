import express from 'express';
import bcrypt from 'bcrypt';
import User from '../../models/User.js';
import { signToken } from '../../utils/jwt.js';

const router = express.Router();

// Student registration with optional face embedding
router.post('/register-student', async (req, res) => {
  try {
    const { name, email, password, roll, faceEmbedding } = req.body;
    if (!name || !email || !password || !roll) {
      return res.status(400).json({ success: false, message: 'name, email, password, roll required' });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ success: false, message: 'Email already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      role: 'student',
      name,
      email: email.toLowerCase(),
      password: hashed,
      roll,
      faceEmbedding: faceEmbedding?.vector?.length ? { vector: faceEmbedding.vector, model: faceEmbedding.model || 'mock' } : null,
      approved: false,
      active: true,
    });
    return res.json({ success: true, user: { _id: user._id, name: user.name, email: user.email, role: user.role, roll: user.roll } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// Teacher registration (approval required)
router.post('/register-teacher', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'name, email, password required' });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ success: false, message: 'Email already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      role: 'teacher',
      name,
      email: email.toLowerCase(),
      password: hashed,
      approved: false,
      active: true,
    });
    return res.json({ success: true, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// Login (all roles)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const ok = await bcrypt.compare(String(password), user.password || '');
    if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (!user.active) return res.status(403).json({ success: false, message: 'Account is deactivated' });
    if (!user.approved) return res.status(403).json({ success: false, message: 'Your account is not approved yet. Please wait for admin approval.' });
    const token = signToken({ sub: user._id, role: user.role, email: user.email, name: user.name });
    res.json({ success: true, token, user: { _id: user._id, role: user.role, email: user.email, name: user.name, roll: user.roll } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
});

export default router;
