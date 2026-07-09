import { useState } from 'react';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { AttendanceProvider } from './context/AttendanceContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import FaceRecognition from './pages/FaceRecognition';
import RegisterFace from './pages/RegisterFace';
import AttendanceLog from './pages/AttendanceLog';
import UploadAttendance from './pages/UploadAttendance';
import './App.css';
import './animations.css';

const ROLE_STORAGE_KEY = 'portalRole';
const ROLE_EMAIL_STORAGE_KEY = 'portalRoleEmail';

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isOutlookEmail(value) {
  return /@outlook\.[a-z]{2,}$/i.test(value);
}

function isKrmuStudentEmail(value) {
  if (!isValidEmail(value)) return false;
  return /@krmu\.edu\.in$/i.test(value);
}

function RoleSelection({ onSelectRole }) {
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleChooseRole = (role) => {
    setSelectedRole(role);
    setEmail('');
    setError('');
  };

  const handleContinue = () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError(selectedRole === 'teacher' ? 'Please enter your Outlook email.' : 'Please enter your college email.');
      return;
    }

    if (selectedRole === 'teacher') {
      if (!isOutlookEmail(normalizedEmail)) {
        setError('Teacher access requires an Outlook email (example: name@outlook.com).');
        return;
      }
    } else if (!isKrmuStudentEmail(normalizedEmail)) {
      setError('Student access requires a KRMU email (example: name@krmu.edu.in).');
      return;
    }

    onSelectRole(selectedRole, normalizedEmail);
  };

  return (
    <div className="role-selection-page">
      <div className="role-selection-glow role-selection-glow-1" />
      <div className="role-selection-glow role-selection-glow-2" />
      <div className="role-selection-card card">
        <span className="role-selection-kicker">Face Attendance Portal</span>
        <h1>Select Your Access</h1>
        <p>Choose your role to continue. You can change this anytime from the sidebar.</p>
        <div className="role-selection-actions">
          <button
            className="btn btn-primary role-option"
            onClick={() => handleChooseRole('teacher')}
          >
            <span className="role-option-title">Teacher</span>
            <span className="role-option-subtitle">Full access including attendance records</span>
          </button>
          <button
            className="btn btn-secondary role-option"
            onClick={() => handleChooseRole('student')}
          >
            <span className="role-option-title">Student</span>
            <span className="role-option-subtitle">Dashboard, recognition, upload, register</span>
          </button>
        </div>
        {selectedRole && (
          <div className="role-email-box">
            <label className="role-email-label" htmlFor="roleEmailInput">
              {selectedRole === 'teacher' ? 'Enter your Outlook email' : 'Enter your college email'}
            </label>
            <input
              id="roleEmailInput"
              type="email"
              className="role-email-input"
              value={email}
              placeholder={selectedRole === 'teacher' ? 'name@outlook.com' : 'name@krmu.edu.in'}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
            />
            {error && <p className="role-email-error">{error}</p>}
            <button className="btn btn-primary role-email-submit" onClick={handleContinue}>
              Continue as {selectedRole === 'teacher' ? 'Teacher' : 'Student'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const basename = import.meta.env.BASE_URL || '/';
  const [role, setRole] = useState(() => {
    const savedRole = localStorage.getItem(ROLE_STORAGE_KEY);
    if (savedRole === 'teacher' || savedRole === 'student') {
      return savedRole;
    }
    return null;
  });
  const [roleEmail, setRoleEmail] = useState(() => localStorage.getItem(ROLE_EMAIL_STORAGE_KEY) || '');

  const handleSelectRole = (selectedRole, email) => {
    localStorage.setItem(ROLE_STORAGE_KEY, selectedRole);
    localStorage.setItem(ROLE_EMAIL_STORAGE_KEY, email);
    setRole(selectedRole);
    setRoleEmail(email);
  };

  const handleSwitchRole = () => {
    localStorage.removeItem(ROLE_STORAGE_KEY);
    localStorage.removeItem(ROLE_EMAIL_STORAGE_KEY);
    setRole(null);
    setRoleEmail('');
  };

  const isTeacher = role === 'teacher';

  return (
    <ThemeProvider>
      <BrowserRouter basename={basename}>
        {!role ? (
          <RoleSelection onSelectRole={handleSelectRole} />
        ) : (
          <AttendanceProvider>
            <div className="app">
              <Navbar role={role} roleEmail={roleEmail} onSwitchRole={handleSwitchRole} />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/recognize" element={<FaceRecognition />} />
                  <Route path="/upload" element={<UploadAttendance />} />
                  <Route path="/register" element={<RegisterFace />} />
                  <Route
                    path="/records"
                    element={isTeacher ? <AttendanceLog /> : <Navigate to="/" replace />}
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </AttendanceProvider>
        )}
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
