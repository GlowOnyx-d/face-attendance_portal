import { Router } from 'express';
import { z } from 'zod';
import { hashPassword, verifyPassword, generateToken, generateId, getCurrentTimestamp } from './auth.js';
import { db, queries, initializeDatabase } from './database.js';
import { loginSchema, registerSchema } from './validation.js';
import { ApiError } from './middleware.js';

export const authRouter = Router();

initializeDatabase();

// Health check
authRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'face-attendance-server',
    timestamp: getCurrentTimestamp(),
  });
});

// Register
authRouter.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = registerSchema.parse(req.body);

    const existing = queries.getUserByEmail.get(email);
    if (existing) {
      throw new ApiError(409, 'Email already registered');
    }

    const userId = generateId();
    const passwordHash = await hashPassword(password);
    const now = getCurrentTimestamp();

    queries.createUser.run(userId, email, passwordHash, name, 'employee', now, now);

    const token = generateToken({ userId, email, role: 'employee' });
    res.status(201).json({
      userId,
      email,
      name,
      token,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// Login
authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = queries.getUserByEmail.get(email) as any;
    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid email or password');
    }

    if (user.status !== 'active') {
      throw new ApiError(403, 'Account is inactive');
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.json({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      token,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// Get current user
authRouter.get('/me', (req: any, res, next) => {
  try {
    if (!req.userId) {
      throw new ApiError(401, 'Not authenticated');
    }

    const user = queries.getUserById.get(req.userId) as any;
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    });
  } catch (err) {
    next(err);
  }
});
