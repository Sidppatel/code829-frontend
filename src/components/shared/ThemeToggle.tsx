import { SunOutlined, MoonOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import { useTheme } from '../../hooks/useTheme';

interface ThemeToggleProps {
  size?: 'small' | 'middle' | 'large';
}

export default function ThemeToggle({ size = 'middle' }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();
  
  return (
    <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
      <Button
        type="text"
        size={size}
        icon={isDark ? <SunOutlined style={{ color: 'var(--accent-gold)', fontSize: 18 }} /> : <MoonOutlined style={{ color: 'var(--accent-violet)', fontSize: 18 }} />}
        onClick={toggleTheme}
        style={{ borderRadius: 8, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      />
    </Tooltip>
  );
}
