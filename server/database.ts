import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_URL || './data/attendance.db';
const dbDir = path.dirname(dbPath);

// Ensure database directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'employee', 'manager')) DEFAULT 'employee',
      status TEXT CHECK(status IN ('active', 'inactive')) DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS faces (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      roll_number TEXT UNIQUE NOT NULL,
      descriptor TEXT NOT NULL,
      registered_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      person_id TEXT,
      person_name TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      status TEXT CHECK(status IN ('present', 'absent', 'late')) DEFAULT 'present',
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, date)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      resource TEXT NOT NULL,
      resource_id TEXT,
      old_values TEXT,
      new_values TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
    CREATE INDEX IF NOT EXISTS idx_faces_user_id ON faces(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
  `);
}

export const queries = {
  // Users
  createUser: db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
  getUserByEmail: db.prepare(`SELECT * FROM users WHERE email = ?`),
  getUserById: db.prepare(`SELECT * FROM users WHERE id = ?`),
  getAllUsers: db.prepare(`SELECT id, email, name, role, status, created_at FROM users`),
  updateUser: db.prepare(`
    UPDATE users SET name = ?, role = ?, status = ?, updated_at = ? WHERE id = ?
  `),
  deleteUser: db.prepare(`DELETE FROM users WHERE id = ?`),

  // Faces
  createFace: db.prepare(`
    INSERT INTO faces (id, user_id, name, roll_number, descriptor, registered_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
  getFacesByUserId: db.prepare(`SELECT * FROM faces WHERE user_id = ?`),
  getAllFaces: db.prepare(`SELECT * FROM faces`),
  getFaceByRollNumber: db.prepare(`SELECT * FROM faces WHERE roll_number = ?`),
  deleteFace: db.prepare(`DELETE FROM faces WHERE id = ?`),

  // Attendance
  createAttendance: db.prepare(`
    INSERT INTO attendance (id, user_id, person_id, person_name, date, time, timestamp, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  getAttendanceByDate: db.prepare(`SELECT * FROM attendance WHERE date = ? ORDER BY timestamp DESC`),
  getAttendanceByUserId: db.prepare(`SELECT * FROM attendance WHERE user_id = ? ORDER BY date DESC`),
  getAttendanceByDateRange: db.prepare(`
    SELECT * FROM attendance WHERE user_id = ? AND date BETWEEN ? AND ? ORDER BY date DESC
  `),
  updateAttendance: db.prepare(`UPDATE attendance SET status = ? WHERE id = ?`),
  deleteAttendance: db.prepare(`DELETE FROM attendance WHERE id = ?`),
  getAttendanceStats: db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
      SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
      SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late
    FROM attendance WHERE user_id = ? AND date BETWEEN ? AND ?
  `),

  // Audit Logs
  createAuditLog: db.prepare(`
    INSERT INTO audit_logs (id, user_id, action, resource, resource_id, old_values, new_values, ip_address, user_agent, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  getAuditLogs: db.prepare(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ? OFFSET ?`),
};
