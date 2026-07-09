import { Router } from 'express';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { db, queries } from '../database.js';
import { markAttendanceSchema, updateAttendanceSchema } from '../validation.js';
import { ApiError, AuthRequest } from '../middleware.js';
import { getCurrentTimestamp } from '../auth.js';

export const attendanceRouter = Router();

// Mark attendance
attendanceRouter.post('/mark', (req: AuthRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { personId, personName, descriptor, date, time } = markAttendanceSchema.parse(req.body);

    const today = date || new Date().toISOString().split('T')[0];
    const now = time || new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });

    // Check if already marked today
    const existing = db.prepare(
      'SELECT * FROM attendance WHERE user_id = ? AND date = ?'
    ).get(req.userId, today) as any;

    if (existing) {
      throw new ApiError(409, 'Already marked attendance today');
    }

    const attendanceId = nanoid(16);
    queries.createAttendance.run(
      attendanceId,
      req.userId,
      personId,
      personName,
      today,
      now,
      getCurrentTimestamp(),
      'present',
      getCurrentTimestamp(),
    );

    res.status(201).json({
      id: attendanceId,
      personName,
      date: today,
      time: now,
      status: 'present',
      timestamp: getCurrentTimestamp(),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// Get attendance records
attendanceRouter.get('/records', (req: AuthRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { startDate, endDate, limit = '30', offset = '0' } = req.query;

    let records: any[] = [];

    if (startDate && endDate) {
      records = queries.getAttendanceByDateRange.all(
        req.userId,
        startDate,
        endDate,
      ) as any[];
    } else {
      records = queries.getAttendanceByUserId.all(req.userId) as any[];
    }

    res.json({
      total: records.length,
      records: records.slice(
        Number(offset),
        Number(offset) + Number(limit),
      ),
    });
  } catch (err) {
    next(err);
  }
});

// Get attendance stats
attendanceRouter.get('/stats', (req: AuthRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw new ApiError(400, 'startDate and endDate are required');
    }

    const stats = queries.getAttendanceStats.get(
      req.userId,
      startDate,
      endDate,
    ) as any;

    res.json({
      total: stats.total || 0,
      present: stats.present || 0,
      absent: stats.absent || 0,
      late: stats.late || 0,
      percentage: stats.total ? ((stats.present / stats.total) * 100).toFixed(2) : 0,
    });
  } catch (err) {
    next(err);
  }
});

// Update attendance status (admin only)
attendanceRouter.patch('/:recordId', (req: AuthRequest, res, next) => {
  try {
    if (req.userRole !== 'admin') {
      throw new ApiError(403, 'Only admins can update attendance');
    }

    const { status } = updateAttendanceSchema.parse(req.body);
    queries.updateAttendance.run(status, req.params.recordId);

    res.json({ message: 'Attendance updated successfully' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0].message });
    }
    next(err);
  }
});

// Export attendance CSV
attendanceRouter.get('/export/csv', (req: AuthRequest, res, next) => {
  try {
    if (!req.userId) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw new ApiError(400, 'startDate and endDate are required');
    }

    const records = queries.getAttendanceByDateRange.all(
      req.userId,
      startDate,
      endDate,
    ) as any[];

    let csv = 'Date,Time,Status\n';
    records.forEach(r => {
      csv += `${r.date},${r.time},${r.status}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
});
