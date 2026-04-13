import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout } from 'antd';
import {
  CodeOutlined,
  MailOutlined,
  FileTextOutlined,
  SettingOutlined,
  TeamOutlined,
  CalendarOutlined,
  LogoutOutlined,
  UserOutlined,
  SendOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuth } from '@code829/shared/hooks/useAuth';
import { useBreakpoint } from '@code829/shared/hooks/useBreakpoint';
import SidebarNav from '@code829/shared/components/layout/SidebarNav';
import TopHeader from '@code829/shared/components/layout/TopHeader';

const { Sider, Header, Content } = Layout;

const navGroups = [
  {
    title: 'Monitoring',
    items: [
      { key: '/', shortLabel: 'Logs', label: 'Error Logs', icon: <CodeOutlined /> },
      { key: '/email-logs', shortLabel: 'Email', label: 'Email Delivery', icon: <MailOutlined /> },
      { key: '/system-logs', shortLabel: 'System', label: 'System Health', icon: <FileTextOutlined /> },
    ]
  },
  {
    title: 'Accounts',
    items: [
      { key: '/admins', shortLabel: 'Admins', label: 'Admin Accounts', icon: <SafetyOutlined /> },
      { key: '/staff', shortLabel: 'Staff', label: 'Staff Accounts', icon: <TeamOutlined /> },
      { key: '/invitations', shortLabel: 'Invites', label: 'Invitations', icon: <SendOutlined /> },
    ]
  },
  {
    title: 'Governance',
    items: [
      { key: '/users', shortLabel: 'Users', label: 'User Roles', icon: <TeamOutlined /> },
      { key: '/events', shortLabel: 'Fees', label: 'Platform Fees', icon: <CalendarOutlined /> },
    ]
  },
  {
    title: 'Configuration',
    items: [
      { key: '/settings', shortLabel: 'Settings', label: 'Global Settings', icon: <SettingOutlined /> },
    ]
  }
];

const navItems = navGroups.flatMap(g => g.items);

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
    { key: 'settings', label: 'Settings', icon: <UserOutlined />, onClick: () => navigate('/settings') },
    { type: 'divider' as const },
    { key: 'logout', label: 'Logout', icon: <LogoutOutlined />, onClick: () => { logout(); navigate('/login'); } },
  ];

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
          <SidebarNav
            collapsed={collapsed}
            navGroups={navGroups}
            user={user}
            userSecondaryRole="Developer"
            basePath=""
            logout={logout}
          />
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
                  gap: 3,
                  padding: '6px 2px',
                  color: active ? 'var(--primary)' : 'var(--text-muted)',
                  fontSize: 9.5,
                  textDecoration: 'none',
                  position: 'relative',
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden'
                }}
              >
                <span style={{ 
                  fontSize: 18, 
                  background: active ? 'var(--primary-soft)' : 'transparent',
                  padding: '4px 10px',
                  borderRadius: 12,
                  transition: 'all 0.2s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {item.icon}
                </span>
                <span style={{ 
                  fontWeight: active ? 700 : 500,
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  width: '100%',
                  textAlign: 'center'
                }}>
                  {item.shortLabel}
                </span>
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
          <TopHeader 
            isMobile={isMobile}
            title="Developer"
            user={user}
            userMenuItems={userMenuItems}
            showMetrics={true}
          />
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
