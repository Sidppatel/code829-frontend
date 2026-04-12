import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Typography, Button, Dropdown, Space } from 'antd';
import {
  CodeOutlined,
  MailOutlined,
  FileTextOutlined,
  SettingOutlined,
  TeamOutlined,
  CalendarOutlined,
  LogoutOutlined,
  RocketOutlined,
  EyeOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuth } from '../../hooks/useAuth';
import ThemeToggle from '../shared/ThemeToggle';
import PulseIndicator from '../shared/PulseIndicator';

const { Sider, Header, Content } = Layout;

const navGroups = [
  {
    title: 'Monitoring',
    items: [
      { key: '/developer', shortLabel: 'Logs', label: 'Error Logs', icon: <CodeOutlined /> },
      { key: '/developer/email-logs', shortLabel: 'Email', label: 'Email Delivery', icon: <MailOutlined /> },
      { key: '/developer/system-logs', shortLabel: 'System', label: 'System Health', icon: <FileTextOutlined /> },
    ]
  },
  {
    title: 'Governance',
    items: [
      { key: '/developer/users', shortLabel: 'Users', label: 'User Roles', icon: <TeamOutlined /> },
      { key: '/developer/events', shortLabel: 'Fees', label: 'Platform Fees', icon: <CalendarOutlined /> },
    ]
  },
  {
    title: 'Configuration',
    items: [
      { key: '/developer/settings', shortLabel: 'Settings', label: 'Global Settings', icon: <SettingOutlined /> },
    ]
  }
];

const navItems = navGroups.flatMap(g => g.items);

type Breakpoint = 'mobile' | 'tablet' | 'desktop';

function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(() => {
    if (typeof window === 'undefined') return 'desktop';
    if (window.innerWidth < 768) return 'mobile';
    if (window.innerWidth < 1024) return 'tablet';
    return 'desktop';
  });

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      setBp(w < 768 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop');
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return bp;
}

export default function DeveloperLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const bp = useBreakpoint();

  const isMobile = bp === 'mobile';
  const isTablet = bp === 'tablet';
  const siderWidth = isTablet ? 80 : 260;
  const collapsed = isTablet;

  const userMenuItems: MenuProps['items'] = [
    { key: 'home', label: 'View Site', icon: <EyeOutlined />, onClick: () => navigate('/') },
    { key: 'admin', label: 'Admin Panel', icon: <SettingOutlined />, onClick: () => navigate('/admin') },
    { type: 'divider' as const },
    { key: 'profile', label: 'Profile', icon: <UserOutlined />, onClick: () => navigate('/profile') },
    { type: 'divider' as const },
    { key: 'logout', label: 'Logout', icon: <LogoutOutlined />, onClick: logout },
  ];

  const siderContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px 12px' }}>
      <div style={{
        padding: collapsed ? '0' : '0 12px',
        marginBottom: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 10
      }}>
        <div style={{
          width: 32,
          height: 32,
          background: 'var(--primary)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 18,
          boxShadow: '0 4px 12px hsla(var(--p-h), var(--p-s), var(--p-l), 0.4)'
        }}>
          ✦
        </div>
        {!collapsed && (
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Playfair Display', serif" }}>
            Developer
          </span>
        )}
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
                const active = location.pathname === item.key || (item.key !== '/developer' && location.pathname.startsWith(item.key));
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Developer</span>
                <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border)' }} />
                <Link to="/admin" style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>
                  Admin View
                </Link>
              </div>
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

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      {/* Desktop/Tablet Sider */}
      {!isMobile && (
        <Sider
          width={siderWidth}
          collapsed={collapsed}
          collapsedWidth={80}
          style={{
            background: 'var(--nav-bg)',
            borderRight: '1px solid var(--nav-border)',
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 100,
          }}
        >
          {siderContent}
        </Sider>
      )}

      {/* Mobile Bottom Nav */}
      {isMobile && (
        <nav className="mobile-bottom-nav">
          {navItems.slice(0, 6).map((item) => {
            const active = location.pathname === item.key;
            return (
              <Link
                key={item.key}
                to={item.key}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: '8px 4px',
                  color: active ? 'var(--primary)' : 'var(--text-muted)',
                  fontSize: 10,
                  textDecoration: 'none',
                  position: 'relative',
                  flex: 1
                }}
              >
                <span style={{
                  fontSize: 20,
                  background: active ? 'var(--primary-soft)' : 'transparent',
                  padding: '4px 12px',
                  borderRadius: 12,
                  transition: 'all 0.2s ease'
                }}>
                  {item.icon}
                </span>
                <span style={{ fontWeight: active ? 600 : 400 }}>{item.shortLabel}</span>
              </Link>
            );
          })}
        </nav>
      )}

      <Layout style={{ marginLeft: isMobile ? 0 : siderWidth, background: 'var(--bg-page)', transition: 'margin-left 0.3s ease' }}>
        {/* Top Header */}
        <Header
          style={{
            height: 72,
            lineHeight: '72px',
            background: 'var(--nav-bg)',
            borderBottom: '1px solid var(--nav-border)',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 99,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 24, height: 24, background: 'var(--primary)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14 }}>✦</div>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Playfair Display', serif" }}>Developer</span>
              </div>
            )}
            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography.Text style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>
                    Welcome back, {user?.firstName}
                  </Typography.Text>
                  <Typography.Text style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>
                    Developer Console is ready. System load optimal.
                  </Typography.Text>
                </div>

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
              </div>
            )}
          </div>

          <Space size={16}>
            {!isMobile && (
              <Button
                type="primary"
                icon={<RocketOutlined />}
                onClick={() => navigate('/')}
                style={{
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, var(--accent-violet), var(--accent-rose))',
                  border: 'none',
                  boxShadow: '0 8px 16px rgba(99, 102, 241, 0.25)',
                  fontWeight: 700,
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '0 20px',
                }}
                className="hover-lift"
              >
                Live Experience
              </Button>
            )}
            <ThemeToggle
              className="hover-lift"
              style={{
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)'
              }}
            />
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
                {!isMobile && 'Dev Console'}
              </Button>
            </Dropdown>
          </Space>
        </Header>

        {/* Content */}
        <Content style={{
          padding: isMobile ? '24px 16px' : isTablet ? 32 : 48,
          paddingBottom: isMobile ? 100 : 48,
          minHeight: 'calc(100vh - 72px)',
          maxWidth: 1600,
          margin: '0 auto',
          width: '100%',
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
