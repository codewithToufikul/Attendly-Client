import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  time: { type: String, required: true }, // HH:MM:SS
  status: { type: String, enum: ['present', 'absent'], default: 'present' },
}, { timestamps: true });

AttendanceSchema.index({ classId: 1, studentId: 1, date: 1 }, { unique: true });

export default mongoose.model('Attendance', AttendanceSchema);
