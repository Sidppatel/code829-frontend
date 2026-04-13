import React from 'react';

interface PulseIndicatorProps {
  status?: 'success' | 'warning' | 'critical' | 'calm';
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function PulseIndicator({
  status = 'calm',
  size = 8,
  className = '',
  style,
}: PulseIndicatorProps) {
  const getColors = () => {
    switch (status) {
      case 'success':
        return { dot: 'var(--accent-green)', duration: '2s' };
      case 'warning':
        return { dot: 'var(--accent-gold)', duration: '1s' };
      case 'critical':
        return { dot: 'var(--accent-rose)', duration: '0.6s' };
      case 'calm':
      default:
        return { dot: 'var(--primary)', duration: '3s' };
    }
  };

  const colors = getColors();

  return (
    <div
      className={`pulse-indicator-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size * 2.5,
        height: size * 2.5,
        position: 'relative',
        ...style,
      }}
    >
      <div
        className="pulse-dot"
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: colors.dot,
          position: 'relative',
          zIndex: 2,
        }}
      />
      <div
        className="pulse-ring"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          border: `2px solid ${colors.dot}`,
          animation: `pulse-ring ${colors.duration} cubic-bezier(0.24, 0, 0.38, 1) infinite`,
          zIndex: 1,
        }}
      />
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.33); opacity: 0.8; }
          80%, 100% { transform: scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
