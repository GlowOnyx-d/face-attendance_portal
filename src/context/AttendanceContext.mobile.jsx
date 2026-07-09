import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AttendanceContext = createContext();

function getDayKey(timestamp) {
  return new Date(timestamp).toDateString();
}

function dedupeAttendanceRecords(records) {
  const seen = new Set();
  return records.filter((record) => {
    const dayKey = getDayKey(record.timestamp);
    const dedupeKey = `${record.personId}-${dayKey}`;
    if (seen.has(dedupeKey)) return false;
    seen.add(dedupeKey);
    return true;
  });
}

function isLegacyTestStudent(value) {
  return typeof value === 'string' && value.trim().toLowerCase() === 'test student';
}

export function AttendanceProvider({ children }) {
  const [registeredFaces, setRegisteredFaces] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [faces, records] = await Promise.all([
          AsyncStorage.getItem('registeredFaces'),
          AsyncStorage.getItem('attendanceRecords'),
        ]);

        if (faces) {
          const parsed = JSON.parse(faces).filter((f) => !isLegacyTestStudent(f?.name));
          setRegisteredFaces(parsed);
        }

        if (records) {
          const parsed = JSON.parse(records).filter((r) => !isLegacyTestStudent(r?.personName));
          setAttendanceRecords(dedupeAttendanceRecords(parsed));
        }
      } catch (err) {
        console.warn('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem('registeredFaces', JSON.stringify(registeredFaces));
      } catch (err) {
        console.error('Failed to save faces:', err);
      }
    })();
  }, [registeredFaces]);

  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords));
      } catch (err) {
        console.error('Failed to save attendance:', err);
      }
    })();
  }, [attendanceRecords]);

  const registerFace = async (name, rollNumber, descriptor) => {
    const newFace = {
      id: Date.now().toString(),
      name,
      rollNumber,
      descriptor: Array.from(descriptor),
      registeredAt: new Date().toISOString(),
    };
    setRegisteredFaces((prev) => [...prev, newFace]);
    return newFace;
  };

  const removeFace = async (id) => {
    setRegisteredFaces((prev) => prev.filter((f) => f.id !== id));
    return true;
  };

  const markAttendance = async (personId, personName) => {
    const now = new Date();
    const today = now.toDateString();

    const alreadyMarked = attendanceRecords.some(
      (r) => r.personId === personId && getDayKey(r.timestamp) === today
    );

    if (alreadyMarked) return null;

    const record = {
      id: Date.now().toString(),
      personId,
      personName,
      timestamp: now.toISOString(),
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
      status: 'present',
    };

    setAttendanceRecords((prev) => [record, ...prev]);
    return record;
  };

  const clearAttendance = () => {
    setAttendanceRecords([]);
  };

  const getTodayAttendance = () => {
    const today = new Date().toDateString();
    return attendanceRecords.filter(
      (r) => new Date(r.timestamp).toDateString() === today
    );
  };

  return (
    <AttendanceContext.Provider
      value={{
        registeredFaces,
        attendanceRecords,
        registerFace,
        removeFace,
        markAttendance,
        clearAttendance,
        getTodayAttendance,
        loading,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within AttendanceProvider');
  }
  return context;
}
