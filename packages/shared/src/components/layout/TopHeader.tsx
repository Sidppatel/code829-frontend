import { Typography, Button, Dropdown, Space } from 'antd';
import type { MenuProps } from 'antd';
import PulseIndicator from '../shared/PulseIndicator';
import BrandLogo from '../shared/BrandLogo';
import type { UserProfile, AdminUserProfile } from '../../types/auth';

interface TopHeaderProps {
  isMobile: boolean;
  title: string;
  user: UserProfile | AdminUserProfile | null;
  userMenuItems: MenuProps['items'];
  showMetrics?: boolean;
}

export default function TopHeader({ isMobile, title, user, userMenuItems, showMetrics = false }: TopHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {isMobile && (
          <BrandLogo size="sm" />
        )}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Typography.Text style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>
                Welcome back, {user?.firstName}
              </Typography.Text>
              <Typography.Text style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>
                {title === 'Developer' ? 'Developer Console is ready. System load optimal.' : 'Here’s what needs your attention today.'}
              </Typography.Text>
            </div>

            {showMetrics && (
              <>
                <div style={{ width: 1, height: 24, background: 'var(--border)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <PulseIndicator status="success" size={6} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>API</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <PulseIndicator status="success" size={6} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Worker</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <PulseIndicator status="warning" size={6} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Storage</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <Space size={16}>
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
          <Button
            type="text"
            style={{
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              height: 44,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '0 16px',
              fontWeight: 600
            }}
            className="hover-lift"
          >
            <div style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 11
            }}>
              {user?.firstName?.[0]}
            </div>
            {!isMobile && (title === 'Developer' ? 'Dev Console' : user?.firstName)}
          </Button>
        </Dropdown>
      </Space>
    </div>
  );
}
