// Confetti effect
export function createConfetti() {
  const colors = ['#667eea', '#764ba2', '#f93b1d', '#10b981', '#06b6d4'];
  const confettiCount = 50;

  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti-piece';
    confetti.style.left = Math.random() * window.innerWidth + 'px';
    confetti.style.top = '-10px';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.delay = Math.random() * 0.5 + 's';
    document.body.appendChild(confetti);

    setTimeout(() => confetti.remove(), 3000);
  }
}

// Animated counter
export function animateCounter(element, start, end, duration = 1000) {
  const range = end - start;
  const increment = end > start ? 1 : -1;
  const stepTime = Math.abs(Math.floor(duration / range));
  let current = start;

  const timer = setInterval(() => {
    current += increment;
    if (element) {
      element.textContent = current;
    }

    if (current === end) {
      clearInterval(timer);
    }
  }, stepTime);
}

// Ripple effect on button click
export function createRipple(event) {
  const button = event.currentTarget;
  const ripple = document.createElement('span');
  
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  ripple.className = 'ripple-effect';

  button.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
}

// Generate attendance chart data
export function getAttendanceChartData(records) {
  const last7Days = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    last7Days.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
  }

  const data = last7Days.map(day => {
    return records.filter(r => r.date.includes(day)).length;
  });

  return { labels: last7Days, data };
}

// Get attendance percentage
export function getAttendancePercentage(presentCount, totalCount) {
  return totalCount === 0 ? 0 : Math.round((presentCount / totalCount) * 100);
}

// Get trend indicator
export function getTrendIndicator(currentValue, previousValue) {
  if (currentValue > previousValue) return { trend: 'up', symbol: '↑' };
  if (currentValue < previousValue) return { trend: 'down', symbol: '↓' };
  return { trend: 'stable', symbol: '→' };
}

// Format date for timeline
export function formatTimelineDate(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

// Smooth page scroll
export function smoothScroll(target) {
  const element = document.getElementById(target);
  element?.scrollIntoView({ behavior: 'smooth' });
}

// Create skeleton loader
export function createSkeletonLoader(count = 3) {
  return Array.from({ length: count }, (_, i) => i);
}
