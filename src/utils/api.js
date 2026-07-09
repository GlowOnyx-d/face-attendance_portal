const API_URL = (import.meta && import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:4000';

async function getJSON(path) {
  const res = await fetch(API_URL + path);
  if (!res.ok) throw new Error('API error ' + res.status);
  return res.json();
}

async function postJSON(path, body) {
  const res = await fetch(API_URL + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let payload = null;
    try {
      payload = await res.json();
    } catch (_) {
      payload = null;
    }
    throw new Error(payload?.error || ('API error ' + res.status));
  }
  return res.json();
}

export async function fetchRegistered() {
  return getJSON('/api/registered');
}

export async function registerFaceAPI(name, rollNumber, descriptor) {
  return postJSON('/api/register', { name, rollNumber, descriptor });
}

export async function fetchAttendance(date = null) {
  const url = date ? `/api/attendance?date=${encodeURIComponent(date)}` : '/api/attendance';
  return getJSON(url);
}

export async function checkBackendHealth() {
  try {
    const res = await fetch(API_URL + '/api/health', { method: 'GET' });
    if (!res.ok) return { connected: false };
    const payload = await res.json();
    return { connected: true, payload };
  } catch (_) {
    return { connected: false };
  }
}

export async function markAttendanceAPI(personId, personName) {
  const res = await fetch(API_URL + '/api/attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ personId, personName }),
  });

  if (res.status === 409) {
    const payload = await res.json();
    return { alreadyMarked: true, record: payload?.record || null };
  }

  if (!res.ok) {
    let payload = null;
    try {
      payload = await res.json();
    } catch (_) {
      payload = null;
    }
    throw new Error(payload?.error || ('API error ' + res.status));
  }

  const record = await res.json();
  return { alreadyMarked: false, record };
}

export async function matchDescriptor(descriptor, threshold = 0.5) {
  return postJSON('/api/match', { descriptor, threshold });
}

export async function deleteRegistered(id) {
  const res = await fetch(API_URL + '/api/registered/' + encodeURIComponent(id), { method: 'DELETE' });
  if (!res.ok) {
    let payload = null;
    try {
      payload = await res.json();
    } catch (_) {
      payload = null;
    }
    throw new Error(payload?.error || ('API error ' + res.status));
  }
  return res.json();
}

export default {
  fetchRegistered,
  registerFaceAPI,
  fetchAttendance,
  checkBackendHealth,
  markAttendanceAPI,
  deleteRegistered,
  matchDescriptor,
};
