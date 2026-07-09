import { useAttendance } from '../context/AttendanceContext';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { 
  createConfetti, 
  getAttendanceChartData, 
  getTrendIndicator,
  formatTimelineDate,
  getAttendancePercentage 
} from '../utils/animations';
import AnimatedCounter from '../components/AnimatedCounter';
import AttendanceChart from '../components/AttendanceChart';
import './Dashboard.css';

export default function Dashboard() {
  const { registeredFaces, attendanceRecords, getTodayAttendance } = useAttendance();
  
  const todayRecords = getTodayAttendance();
  const totalRegistered = registeredFaces.length;
  const todayPresent = todayRecords.length;
  const totalAbsent = totalRegistered - todayPresent;
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 800);
    
    // Show confetti if attendance was just marked
    const lastRecord = attendanceRecords[0];
    if (lastRecord) {
      const recordTime = new Date(lastRecord.timestamp);
      const now = new Date();
      const timeDiff = now - recordTime;
      
      if (timeDiff < 3000) {
        createConfetti();
      }
    }
  }, [attendanceRecords]);

  // counters are rendered via <AnimatedCounter /> component

  const recentActivity = attendanceRecords.slice(0, 5);
  const absentToday = registeredFaces
    .filter((person) => !todayRecords.some((record) => record.personName === person.name))
    .slice(0, 5);

  const attendancePercent = getAttendancePercentage(todayPresent, totalRegistered);
  const prevPercent = getAttendancePercentage(
    attendanceRecords.filter(r => {
      const date = new Date(r.timestamp);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return date.toDateString() === yesterday.toDateString();
    }).length,
    totalRegistered
  );

  const trend = getTrendIndicator(attendancePercent, prevPercent);

  const chartData = getAttendanceChartData(attendanceRecords);

  return (
    <div className="dashboard page-transition">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="dashboard-subtitle">Face Recognition Attendance System</p>
      </div>

      {loading ? (
        <div className="skeleton-loader">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton skeleton-card"></div>
          ))}
        </div>
      ) : (
        <>
          {/* Onboarding Steps */}
          <div className="onboarding-steps fade-stagger-item">
            <div className="step-card">
              <span className="step-number">1</span>
              <div>
                <h3>Register People</h3>
                <p>Add students and team members in Register Face.</p>
              </div>
            </div>
            <div className="step-card">
              <span className="step-number">2</span>
              <div>
                <h3>Start Recognition</h3>
                <p>Open Mark Attendance and start camera.</p>
              </div>
            </div>
            <div className="step-card">
              <span className="step-number">3</span>
              <div>
                <h3>Check People In</h3>
                <p>Look at camera to auto-mark attendance.</p>
              </div>
            </div>
          </div>

          {totalRegistered === 0 ? (
            <div className="dashboard-empty-state fade-in">
              <div className="empty-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="17" y1="11" x2="23" y2="11" />
                </svg>
              </div>
              <h2>Welcome to Face Attendance</h2>
              <p>Get started by registering your first person.</p>
              <Link to="/register" className="btn btn-primary">
                Register First Person
              </Link>
            </div>
          ) : (
            <div className="stats-grid fade-stagger-item">
              <div className="stat-card">
                <div className="stat-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" />
                    <path d="M16 3.13a4 4 0 010 7.75" />
                  </svg>
                </div>
                <div className="stat-info">
                  <AnimatedCounter value={totalRegistered} duration={800} />
                  <span className="stat-label">Registered</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div className="stat-info">
                  <AnimatedCounter value={todayPresent} duration={800} />
                  <span className="stat-label">Present Today</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
                <div className="stat-info">
                  <AnimatedCounter value={totalAbsent} duration={800} />
                  <span className="stat-label">Absent Today</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <div className="stat-info">
                  <AnimatedCounter value={todayTotal} duration={800} />
                  <span className="stat-label">Total Records</span>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Percentage with Trend */}
          <div className="attendance-percent-card fade-stagger-item">
            <div className="percent-content">
              <h3>Today's Attendance</h3>
              <div className="percent-display" style={{height: 'auto', width: 'auto', marginBottom: 12}}>
                <div className="percent-text" style={{position: 'static', transform: 'none'}}>
                  <span className="percent-value">{attendancePercent}%</span>
                  <span className="percent-label">Attendance</span>
                </div>
              </div>
              <div className="chart-inline" style={{marginTop: 18}}>
                <AttendanceChart data={chartData} width={360} height={80} />
              </div>
              {trend.trend !== 'stable' && (
                <div className={`trend-indicator trend-${trend.trend}`}>
                  {trend.symbol} {Math.abs(attendancePercent - prevPercent)}% from yesterday
                </div>
              )}
            </div>
          </div>

          {/* Dashboard Actions */}
          <div className="dashboard-actions fade-stagger-item">
            <Link to="/recognize" className="action-card action-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <circle cx="12" cy="10" r="3" />
                <path d="M6 17l2 3h8l2-3" />
              </svg>
              <span>Mark Attendance</span>
              <p>Use face recognition to check in</p>
            </Link>
            <Link to="/register" className="action-card action-secondary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
              <span>Register New Face</span>
              <p>Add a new person to the system</p>
            </Link>
          </div>

          {/* Recent Activity */}
          <div className="recent-activity fade-stagger-item">
            <h2>Recent Activity</h2>
            {recentActivity.length === 0 && absentToday.length === 0 ? (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="empty-state-icon">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <p>No attendance records yet</p>
                <Link to="/recognize" className="empty-link">Mark your first attendance</Link>
              </div>
            ) : (
              <>
                {/* Timeline View */}
                <div className="timeline-view">
                  {recentActivity.map((record, index) => (
                    <div key={record.id} className="timeline-item fade-stagger-item">
                      <div className="timeline-content">
                        <div className="activity-avatar">
                          {record.personName.charAt(0).toUpperCase()}
                        </div>
                        <div className="activity-details">
                          <span className="activity-name">{record.personName}</span>
                          <span className="activity-time">
                            {formatTimelineDate(record.timestamp)} at {record.time}
                          </span>
                        </div>
                        <span className="activity-status present">• Present</span>
                      </div>
                    </div>
                  ))}
                </div>

                {absentToday.length > 0 && (
                  <div className="absent-list-wrapper">
                    <h3>Absent Today</h3>
                    <div className="absent-list">
                      {absentToday.map((person) => (
                        <div key={person.name} className="absent-item fade-stagger-item">
                          <div className="activity-avatar">
                            {person.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="activity-details">
                            <span className="activity-name">{person.name}</span>
                            <span className="activity-time">Not checked in</span>
                          </div>
                          <span className="activity-status absent">• Absent</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
