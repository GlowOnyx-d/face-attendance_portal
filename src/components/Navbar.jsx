import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

export default function Navbar({ role, roleEmail, onSwitchRole }) {
  const { isDark, toggleTheme } = useTheme();
  const isTeacher = role === 'teacher';

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <svg className="navbar-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
        </svg>
        <div className="navbar-brand-copy">
          <span className="navbar-title">Attendance-Portal</span>
          <span className="role-pill">{isTeacher ? 'Teacher Mode' : 'Student Mode'}</span>
          {roleEmail && <span className="role-email-pill">{roleEmail}</span>}
        </div>
      </div>
      <div className="navbar-links">
        <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} end>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Dashboard
        </NavLink>
        <NavLink to="/recognize" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <circle cx="12" cy="10" r="3" />
            <path d="M6 17l2 3h8l2-3" />
          </svg>
          Mark Attendance
        </NavLink>
        <NavLink to="/upload" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload
        </NavLink>
        <NavLink to="/register" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          Register
        </NavLink>
        {isTeacher && (
          <NavLink to="/records" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            Records
          </NavLink>
        )}
        <button className="role-switch-btn" onClick={onSwitchRole}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 7h11" />
            <path d="M7 7l3-3" />
            <path d="M7 7l3 3" />
            <path d="M17 17H6" />
            <path d="M17 17l-3-3" />
            <path d="M17 17l-3 3" />
          </svg>
          Change Role
        </button>
        <button className="theme-toggle" onClick={toggleTheme} title={isDark ? 'Light mode' : 'Dark mode'} aria-label="Toggle dark mode">
          {isDark ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>
    </nav>
  );
}
