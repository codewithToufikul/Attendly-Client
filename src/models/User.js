import mongoose from 'mongoose';

const FaceEmbeddingSchema = new mongoose.Schema({
  vector: { type: [Number], default: [] }, // e.g., 128/512-dim
  model: { type: String, default: 'mock' },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const UserSchema = new mongoose.Schema({
  role: { type: String, enum: ['admin', 'teacher', 'student'], required: true },
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true, lowercase: true },
  password: { type: String },
  roll: { type: String }, // for students
  faceEmbedding: { type: FaceEmbeddingSchema, default: null },
  approved: { type: Boolean, default: false }, // admin approval required for teachers/students
  active: { type: Boolean, default: true }, // admin can deactivate accounts
}, { timestamps: true });

export default mongoose.model('User', UserSchema);
