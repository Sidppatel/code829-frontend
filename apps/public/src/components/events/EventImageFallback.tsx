import React from 'react';
import { 
  CustomerServiceOutlined, 
  TeamOutlined, 
  RocketOutlined, 
  BgColorsOutlined, 
  CoffeeOutlined, 
  BankOutlined, 
  TrophyOutlined,
  CalendarOutlined
} from '@ant-design/icons';

interface EventImageFallbackProps {
  category: string;
  title: string;
  style?: React.CSSProperties;
  fontSize?: number | string;
}

/**
 * Returns a category-specific icon for the background.
 */
const getCategoryIcon = (category: string) => {
  const cat = (category || '').toLowerCase();
  
  if (cat.includes('music') || cat.includes('fest')) return <CustomerServiceOutlined />;
  if (cat.includes('social') || cat.includes('night') || cat.includes('party')) return <TeamOutlined />;
  if (cat.includes('tech') || cat.includes('dev') || cat.includes('code')) return <RocketOutlined />;
  if (cat.includes('art') || cat.includes('design') || cat.includes('creative')) return <BgColorsOutlined />;
  if (cat.includes('food') || cat.includes('drink') || cat.includes('culinary')) return <CoffeeOutlined />;
  if (cat.includes('business') || cat.includes('corp') || cat.includes('conference')) return <BankOutlined />;
  if (cat.includes('sport') || cat.includes('fitness') || cat.includes('match')) return <TrophyOutlined />;
  if (cat.includes('educat') || cat.includes('learn') || cat.includes('workshop')) return <RocketOutlined />;
  
  return <CalendarOutlined />;
};

const EventImageFallback: React.FC<EventImageFallbackProps> = ({ 
  category, 
  title,
  style, 
  fontSize = '4.5rem' 
}) => {
  const mainChar = (title || 'E').trim().charAt(0).toUpperCase();
  const Icon = getCategoryIcon(category);
  
  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      background: 'linear-gradient(135deg, var(--accent-violet-dark) 0%, var(--bg-surface) 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      ...style
    }}>
      {/* Subtle background texture/pattern effect */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.1,
        backgroundImage: `radial-gradient(circle at 2px 2px, var(--bg-muted) 1px, transparent 0)`,
        backgroundSize: '24px 24px',
      }} />

      {/* Decorative large background icon */}
      <div style={{
        position: 'absolute',
        fontSize: '14rem',
        color: 'var(--bg-soft)',
        userSelect: 'none',
        pointerEvents: 'none',
        transform: 'rotate(-10deg)',
        zIndex: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {Icon}
      </div>
      
      {/* Main centered character (First char of Event Name) */}
      <div style={{
        fontSize,
        fontWeight: 900,
        color: 'var(--bg-pressed)',
        zIndex: 1,
        filter: 'drop-shadow(var(--shadow-md))',
        lineHeight: 1,
        fontFamily: 'inherit',
        userSelect: 'none'
      }}>
        {mainChar}
      </div>
    </div>
  );
};

export default EventImageFallback;
