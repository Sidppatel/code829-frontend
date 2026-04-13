import { SunOutlined, MoonOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import { useTheme } from '../../hooks/useTheme';

interface ThemeToggleProps {
  size?: 'small' | 'middle' | 'large';
  style?: React.CSSProperties;
  className?: string;
}

export default function ThemeToggle({ size = 'middle', style, className }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();
  
  return (
    <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
      <Button
        type="text"
        size={size}
        icon={isDark ? <SunOutlined style={{ color: 'var(--accent-gold)', fontSize: 20 }} /> : <MoonOutlined style={{ color: 'var(--accent-violet)', fontSize: 20 }} />}
        onClick={toggleTheme}
        className={className}
        style={{ 
          borderRadius: 'var(--radius-md)', 
          width: 44, 
          height: 44, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          ...style 
        }}
      />
    </Tooltip>
  );
}
