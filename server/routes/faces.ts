import { Router } from 'express';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { db, queries } from '../database.js';
import { registerFaceSchema } from '../validation.js';
import { ApiError, AuthRequest } from '../middleware.js';
import { getCurrentTimestamp } from '../auth.js';

export const facesRouter = Router();

// Register new face
facesRouter.post('/register', (req: AuthRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { name, rollNumber, descriptor } = registerFaceSchema.parse(req.body);

    const existing = queries.getFaceByRollNumber.get(rollNumber) as any;
    if (existing) {
      throw new ApiError(409, 'Roll number already registered');
    }

    const faceId = nanoid(16);
    queries.createFace.run(
      faceId,
      req.userId,
      name,
      rollNumber,
      JSON.stringify(descriptor),
      getCurrentTimestamp(),
    );

    res.status(201).json({
      id: faceId,
      name,
      rollNumber,
      registeredAt: getCurrentTimestamp(),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// Get all faces
facesRouter.get('/', (req: AuthRequest, res, next) => {
  try {
    const faces = queries.getAllFaces.all() as any[];
    const parsedFaces = faces.map(f => ({
      ...f,
      descriptor: JSON.parse(f.descriptor),
    }));
    res.json(parsedFaces);
  } catch (err) {
    next(err);
  }
});

// Get user's faces
facesRouter.get('/user/:userId', (req: AuthRequest, res, next) => {
  try {
    const faces = queries.getFacesByUserId.all(req.params.userId) as any[];
    const parsedFaces = faces.map(f => ({
      ...f,
      descriptor: JSON.parse(f.descriptor),
    }));
    res.json(parsedFaces);
  } catch (err) {
    next(err);
  }
});

// Delete face
facesRouter.delete('/:faceId', (req: AuthRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new ApiError(401, 'Not authenticated');
    }

    queries.deleteFace.run(req.params.faceId);
    res.json({ message: 'Face deleted successfully' });
  } catch (err) {
    next(err);
  }
});
