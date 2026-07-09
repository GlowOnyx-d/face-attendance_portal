const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'db.json');

function load() {
  if (!fs.existsSync(DB_FILE)) {
    const initial = { faces: [], attendance: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read DB file:', err);
    return { faces: [], attendance: [] };
  }
}

function save(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function getFaces() {
  const db = load();
  return db.faces;
}

function addFace(face) {
  const db = load();
  db.faces.unshift(face);
  save(db);
  return face;
}

function getAttendance(date) {
  const db = load();
  if (!date) return db.attendance;
  return db.attendance.filter((r) => r.date === date);
}

function addAttendance(record) {
  const db = load();
  db.attendance.unshift(record);
  save(db);
  return record;
}

function deleteFace(id) {
  const db = load();
  const idx = db.faces.findIndex((f) => f.id === id);
  if (idx === -1) return false;
  db.faces.splice(idx, 1);
  save(db);
  return true;
}

module.exports = { getFaces, addFace, getAttendance, addAttendance, deleteFace };
