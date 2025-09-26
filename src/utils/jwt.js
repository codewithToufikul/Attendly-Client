import jwt from 'jsonwebtoken';
import { envVars } from '../config/env.js';

const SECRET = envVars.JWT_SECRET || 'demo-secret';

export const signToken = (payload, options = {}) => {
  return jwt.sign(payload, SECRET, { expiresIn: '6h', ...options });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET);
  } catch (e) {
    return null;
  }
};
