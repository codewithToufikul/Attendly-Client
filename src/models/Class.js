import mongoose from 'mongoose';

const ClassSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dayOfWeek: { type: Number, required: true }, // 0..6 (Sun..Sat)
  start: { type: String, required: true }, // HH:MM
  end: { type: String, required: true },   // HH:MM
  room: { type: String },
}, { timestamps: true });

export default mongoose.model('Class', ClassSchema);
