import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authMiddleware, errorHandler, AuthRequest } from './middleware.js';
import { authRouter } from './routes/auth.js';
import { facesRouter } from './routes/faces.js';
import { attendanceRouter } from './routes/attendance.js';
import { usersRouter } from './routes/users.js';
import { initializeDatabase } from './database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(
  cors({
    origin: CORS_ORIGIN.split(','),
    credentials: true,
  }),
);

// Initialize database
initializeDatabase();

// Public routes
app.use('/api/auth', authRouter);

// Protected routes
app.use('/api/faces', authMiddleware, facesRouter);
app.use('/api/attendance', authMiddleware, attendanceRouter);
app.use('/api/users', authMiddleware, usersRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ CORS enabled for: ${CORS_ORIGIN}`);
  console.log(`✓ Database initialized`);
});
