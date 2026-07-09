const express = require('express');
const cors = require('cors');
const { nanoid } = require('nanoid');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'face-attendance-server', timestamp: new Date().toISOString() });
});

app.get('/api/registered', (req, res) => {
  const faces = db.getFaces();
  res.json(faces);
});

app.post('/api/register', (req, res) => {
  const { name, rollNumber, descriptor } = req.body || {};
  if (!name || !rollNumber || !descriptor) return res.status(400).json({ error: 'Missing fields' });
  if (!Array.isArray(descriptor) || descriptor.length === 0) {
    return res.status(400).json({ error: 'Invalid descriptor' });
  }

  const existingRoll = db.getFaces().find(
    (f) => (f.rollNumber || '').toLowerCase() === String(rollNumber).toLowerCase()
  );
  if (existingRoll) {
    return res.status(409).json({ error: 'Roll number already registered' });
  }

  const face = {
    id: nanoid(),
    name,
    rollNumber,
    descriptor, // should be array of numbers
    registeredAt: new Date().toISOString(),
  };
  db.addFace(face);
  res.json(face);
});

app.get('/api/attendance', (req, res) => {
  const date = req.query.date || null;
  const records = db.getAttendance(date);
  res.json(records);
});

app.post('/api/attendance', (req, res) => {
  const { personId, personName } = req.body || {};
  if (!personId || !personName) return res.status(400).json({ error: 'Missing fields' });

  const all = db.getAttendance();
  const today = new Date().toDateString();
  const existing = all.find(
    (r) => r.personId === personId && new Date(r.timestamp).toDateString() === today
  );
  if (existing) {
    return res.status(409).json({ error: 'Already marked today', record: existing });
  }

  const now = new Date();
  const rec = {
    id: nanoid(),
    personId,
    personName,
    timestamp: now.toISOString(),
    date: now.toLocaleDateString(),
    time: now.toLocaleTimeString(),
    status: 'present',
  };

  db.addAttendance(rec);
  res.json(rec);
});

// Server-side descriptor matching
app.post('/api/match', (req, res) => {
  const { descriptor, threshold = 0.5 } = req.body || {};
  if (!descriptor || !Array.isArray(descriptor)) return res.status(400).json({ error: 'Missing descriptor' });

  const faces = db.getFaces();
  if (!faces.length) return res.json({ matched: false });

  // simple nearest-neighbor by Euclidean distance
  const d = (a, b) => {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      const diff = (a[i] || 0) - (b[i] || 0);
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  };

  let best = null;
  for (const f of faces) {
    if (!f.descriptor || !Array.isArray(f.descriptor)) continue;
    const dist = d(descriptor, f.descriptor);
    if (!best || dist < best.distance) {
      best = { face: f, distance: dist };
    }
  }

  if (!best || best.distance > threshold) {
    return res.json({ matched: false });
  }

  return res.json({ matched: true, id: best.face.id, name: best.face.name, distance: best.distance });
});

// Delete a registered face by id
app.delete('/api/registered/:id', (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const ok = db.deleteFace(id);
  if (!ok) return res.status(404).json({ error: 'Not found' });
  return res.json({ success: true, id });
});

app.listen(PORT, () => {
  console.log(`Face Attendance Server listening on http://localhost:${PORT}`);
});
