import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

// Face registration schemas
export const registerFaceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  rollNumber: z.string().min(1, 'Roll number is required'),
  descriptor: z.array(z.number()).min(1, 'Invalid face descriptor'),
});

// Attendance schemas
export const markAttendanceSchema = z.object({
  personId: z.string().min(1),
  personName: z.string().min(1),
  descriptor: z.array(z.number()),
  date: z.string().date().optional(),
  time: z.string().optional(),
});

export const updateAttendanceSchema = z.object({
  status: z.enum(['present', 'absent', 'late']),
});

// Update user schema
export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(['admin', 'employee', 'manager']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RegisterFaceInput = z.infer<typeof registerFaceSchema>;
export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
