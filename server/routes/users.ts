import { Router } from 'express';
import { queries } from '../database.js';
import { ApiError, AuthRequest, roleMiddleware } from '../middleware.js';
import { updateUserSchema } from '../validation.js';
import { z } from 'zod';
import { getCurrentTimestamp } from '../auth.js';

export const usersRouter = Router();

// Get all users (admin only)
usersRouter.get('/', roleMiddleware('admin'), (req: AuthRequest, res, next) => {
  try {
    const users = queries.getAllUsers.all() as any[];
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// Get user by ID (admin or self)
usersRouter.get('/:userId', (req: AuthRequest, res, next) => {
  try {
    if (req.userRole !== 'admin' && req.userId !== req.params.userId) {
      throw new ApiError(403, 'Access denied');
    }

    const user = queries.getUserById.get(req.params.userId) as any;
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

// Update user (admin or self)
usersRouter.patch('/:userId', (req: AuthRequest, res, next) => {
  try {
    if (req.userRole !== 'admin' && req.userId !== req.params.userId) {
      throw new ApiError(403, 'Access denied');
    }

    const updates = updateUserSchema.parse(req.body);
    const user = queries.getUserById.get(req.params.userId) as any;

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    queries.updateUser.run(
      updates.name || user.name,
      updates.role || user.role,
      updates.status || user.status,
      getCurrentTimestamp(),
      req.params.userId,
    );

    res.json({ message: 'User updated successfully' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// Delete user (admin only)
usersRouter.delete('/:userId', roleMiddleware('admin'), (req: AuthRequest, res, next) => {
  try {
    queries.deleteUser.run(req.params.userId);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
});
