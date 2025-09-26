import User from '../models/User.js';
import { verifyToken } from '../utils/jwt.js';

export const requireAuthMongo = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ success: false, message: 'Invalid token' });
  const user = await User.findById(payload.sub);
  if (!user) return res.status(401).json({ success: false, message: 'User not found' });
  req.user = user;
  next();
};

export const requireRoleMongo = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
  if (!roles.includes(req.user.role)) return res.status(403).json({ success: false, message: 'Forbidden' });
  next();
};
