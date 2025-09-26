import cors from "cors";
import express from "express";
import authRoutes from "./routes/auth.js";
import studentRoutes from "./routes/student.js";
import teacherRoutes from "./routes/teacher.js";
import adminRoutes from "./routes/admin.js";
import v2Auth from "./routes/v2/auth.js";
import v2Student from "./routes/v2/student.js";
import v2Teacher from "./routes/v2/teacher.js";
import v2Admin from "./routes/v2/admin.js";

const app = express();

// CORS configuration
app.use(
  cors({
    origin: ["http://localhost:5173", "https://attendly-server.vercel.app"],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get("/", async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Campus Smart Attendance API",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/admin', adminRoutes);

// Mongo-backed v2 API routes
app.use('/api/v2/auth', v2Auth);
app.use('/api/v2/student', v2Student);
app.use('/api/v2/teacher', v2Teacher);
app.use('/api/v2/admin', v2Admin);

// 404 handler (Express 5 compatible catch-all)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});


// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
});

export default app;

