import { Server as IOServer } from 'socket.io';

let io = null;

export const initSocket = (httpServer) => {
  io = new IOServer(httpServer, {
    cors: {
      origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
  io.on('connection', (socket) => {
    // Teachers can join room per class to get real-time updates
    socket.on('join:class', (classId) => {
      socket.join(`class:${classId}`);
    });
    socket.on('disconnect', () => {});
  });
  return io;
};

export const getIO = () => io;

export const emitAttendanceMarked = (classId, payload) => {
  if (!io) return;
  io.to(`class:${classId}`).emit('attendance:marked', payload);
};
