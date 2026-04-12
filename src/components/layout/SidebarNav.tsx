import { Link, useLocation } from 'react-router-dom';
import { Menu, Typography, Button } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import BrandLogo from '../shared/BrandLogo';
import type { UserProfile } from '../../types/auth';

interface NavGroup {
  title: string;
  items: { key: string; shortLabel: string; label: string; icon: React.ReactNode }[];
}

interface SidebarNavProps {
  collapsed: boolean;
  navGroups: NavGroup[];
  user: UserProfile | null;
  userSecondaryRole?: string;
  userSecondaryLink?: string;
  userSecondaryLinkLabel?: string;
  basePath: string; // e.g. '/admin' or '/developer'
  logout: () => void;
}

export default function SidebarNav({
  collapsed,
  navGroups,
  user,
  userSecondaryRole,
  userSecondaryLink,
  userSecondaryLinkLabel,
  basePath,
  logout
}: SidebarNavProps) {
  const location = useLocation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px 12px' }}>
      <div style={{
        padding: collapsed ? '0' : '0 12px',
        marginBottom: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
        <BrandLogo 
          size="md" 
          showText={!collapsed} 
          collapsed={collapsed} 
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', margin: '0 -4px', padding: '0 4px' }}>
        {navGroups.map((group, idx) => (
          <div key={group.title} style={{ marginBottom: idx === navGroups.length - 1 ? 0 : 24 }}>
            {!collapsed && (
              <div style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                padding: '0 16px',
                marginBottom: 12
              }}>
                {group.title}
              </div>
            )}
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              items={group.items.map(item => {
                const active = location.pathname === item.key || (item.key !== basePath && location.pathname.startsWith(item.key));
                return {
                  key: item.key,
                  icon: (
                    <span style={{
                      fontSize: 18,
                      color: active ? 'var(--primary)' : 'var(--text-secondary)',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 24,
                      height: 24,
                      borderRadius: 'var(--radius-sm)',
                      background: active ? 'var(--primary-soft)' : 'transparent'
                    }}>
                      {item.icon}
                    </span>
                  ),
                  label: (
                    <Link
                      to={item.key}
                      style={{
                        fontWeight: active ? 600 : 500,
                        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontSize: 14,
                        paddingLeft: 4
                      }}
                    >
                      {item.label}
                    </Link>
                  ),
                };
              })}
              inlineCollapsed={collapsed}
              style={{
                background: 'transparent',
                borderRight: 'none',
              }}
              className="human-side-menu"
            />
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 'auto',
        padding: '12px',
        background: 'var(--bg-soft)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        border: '1px solid var(--border)'
      }}>
        {!collapsed && user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700
            }}>
              {user.firstName?.[0]}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <Typography.Text ellipsis style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700, display: 'block', lineHeight: 1.2 }}>
                {user.firstName} {user.lastName}
              </Typography.Text>
              {userSecondaryRole && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{userSecondaryRole}</span>
                  {userSecondaryLink && <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border)' }} />}
                  {userSecondaryLink && (
                    <Link to={userSecondaryLink} style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>
                      {userSecondaryLinkLabel}
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: collapsed ? '0' : '0 4px' }}>
          {!collapsed && (
            <Button
              type="text"
              size="small"
              icon={<LogoutOutlined />}
              onClick={logout}
              style={{ color: 'var(--text-muted)' }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
