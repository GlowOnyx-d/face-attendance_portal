import React from 'react';

// Small SVG bar chart for last 7 days. Expects data: { labels: [], data: [] }
export default function AttendanceChart({ data = { labels: [], data: [] }, width = 360, height = 80 }) {
  const values = data.data || [];
  const labels = data.labels || [];
  const max = Math.max(...values, 1);
  const padding = 8;
  const barGap = 6;
  const barWidth = Math.max(6, (width - padding * 2 - barGap * (values.length - 1)) / values.length);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">

      {values.map((v, i) => {
        const x = padding + i * (barWidth + barGap);
        const h = (v / max) * (height - 20);
        const y = height - h - 12;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={h} rx="3" fill="#0071E3">
              <animate attributeName="height" from="0" to={h} dur="0.6s" fill="freeze" />
            </rect>
            <text x={x + barWidth / 2} y={height - 2} fontSize="10" fill="currentColor" opacity="0.6" textAnchor="middle">{labels[i] ? labels[i].slice(0,3) : ''}</text>
          </g>
        );
      })}
    </svg>
  );
}
