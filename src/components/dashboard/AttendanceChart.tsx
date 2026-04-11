import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface ChartPoint {
  day: string;
  checkIns: number;
  capacity: number;
}

interface AttendanceChartProps {
  data?: ChartPoint[];
  height?: number;
}

const DEFAULT_DATA: ChartPoint[] = [
  { day: 'Mon', checkIns: 45, capacity: 100 },
  { day: 'Tue', checkIns: 52, capacity: 100 },
  { day: 'Wed', checkIns: 48, capacity: 100 },
  { day: 'Thu', checkIns: 70, capacity: 100 },
  { day: 'Fri', checkIns: 120, capacity: 150 },
  { day: 'Sat', checkIns: 145, capacity: 150 },
  { day: 'Sun', checkIns: 95, capacity: 150 },
];

export default function AttendanceChart({ data = DEFAULT_DATA, height = 300 }: AttendanceChartProps) {
  const maxValue = useMemo(() => Math.max(...data.map(d => d.capacity)) * 1.2, [data]);
  const width = 800;
  
  const points = useMemo(() => {
    return data.map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - (d.checkIns / maxValue) * height;
      const capY = height - (d.capacity / maxValue) * height;
      return { x, y, capY, ...d };
    });
  }, [data, height, maxValue]);

  const areaPath = useMemo(() => {
    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    return `${path} L ${width} ${height} L 0 ${height} Z`;
  }, [points, height]);

  const linePath = useMemo(() => {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }, [points]);

  const capacityPath = useMemo(() => {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.capY}`).join(' ');
  }, [points]);

  return (
    <div style={{ width: '100%', height, position: 'relative', marginTop: 20 }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: '100%', overflow: 'visible' }}
        preserveAspectRatio="none"
      >
        {/* Grids */}
        {[0, 0.25, 0.5, 0.75, 1].map((p) => (
          <line
            key={p}
            x1="0"
            y1={height * p}
            x2={width}
            y2={height * p}
            stroke="var(--border)"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
        ))}

        {/* Capacity Baseline */}
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.3 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          d={capacityPath}
          fill="none"
          stroke="var(--accent-gold)"
          strokeWidth="2"
          strokeDasharray="8 4"
        />

        {/* Main Area */}
        <motion.path
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: 'bottom' }}
          d={areaPath}
          fill="url(#chartGradient)"
        />

        {/* Main Line */}
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut", delay: 0.2 }}
          d={linePath}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points */}
        {points.map((p, i) => (
          <motion.circle
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + i * 0.1, type: 'spring' }}
            cx={p.x}
            cy={p.y}
            r="6"
            fill="var(--bg-surface)"
            stroke="var(--primary)"
            strokeWidth="3"
            style={{ cursor: 'pointer' }}
            whileHover={{ r: 8, strokeWidth: 4 }}
          />
        ))}

        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Axis Labels */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginTop: 12, 
        color: 'var(--text-muted)', 
        fontSize: 11, 
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        {data.map((d, i) => <span key={i}>{d.day}</span>)}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, marginTop: 24, fontSize: 12, fontWeight: 600 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 12, height: 4, borderRadius: 2, background: 'var(--primary)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Check-in Velocity</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 12, height: 4, borderRadius: 2, background: 'var(--accent-gold)', opacity: 0.5 }} />
          <span style={{ color: 'var(--text-muted)' }}>Baseline Capacity</span>
        </div>
      </div>
    </div>
  );
}
