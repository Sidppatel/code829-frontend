import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout } from 'antd';
import {
  DashboardOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  BookOutlined,
  TableOutlined,
  BarChartOutlined,
  LogoutOutlined,
  UserOutlined,
  TeamOutlined,
  SendOutlined,
  ScanOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuth } from '@code829/shared/hooks/useAuth';
import { useBreakpoint } from '@code829/shared/hooks/useBreakpoint';
import SidebarNav from '@code829/shared/components/layout/SidebarNav';
import TopHeader from '@code829/shared/components/layout/TopHeader';
import { USE_NEW_SHELL } from '@code829/shared/lib/featureFlags';
import { Navbar, Footer as UIFooter, type NavItem } from '@code829/ui';

const { Sider, Header, Content } = Layout;

const navGroups = [
  {
    title: 'Overview',
    items: [
      { key: '/', shortLabel: 'Home', label: 'Dashboard', icon: <DashboardOutlined /> },
      { key: '/analytics', shortLabel: 'Reports', label: 'Analytics', icon: <BarChartOutlined /> },
    ]
  },
  {
    title: 'Events',
    items: [
      { key: '/events', shortLabel: 'Events', label: 'Events List', icon: <CalendarOutlined /> },
      { key: '/purchases', shortLabel: 'Sales', label: 'Purchases', icon: <BookOutlined /> },
    ]
  },
  {
    title: 'Spaces',
    items: [
      { key: '/table-types', shortLabel: 'Tables', label: 'Table Templates', icon: <TableOutlined /> },
      { key: '/venues', shortLabel: 'Venues', label: 'Venues', icon: <EnvironmentOutlined /> },
    ]
  },
  {
    title: 'Check-In',
    items: [
      { key: '/checkin/select', shortLabel: 'Check-In', label: 'Check-In', icon: <ScanOutlined /> },
    ]
  },
  {
    title: 'Team',
    items: [
      { key: '/staff', shortLabel: 'Staff', label: 'Staff', icon: <TeamOutlined /> },
      { key: '/invitations', shortLabel: 'Invites', label: 'Invitations', icon: <SendOutlined /> },
    ]
  },
  {
    title: 'Settings',
    items: [
      { key: '/settings', shortLabel: 'Settings', label: 'Settings', icon: <UserOutlined /> },
    ]
  }
];

const navItems = navGroups.flatMap(g => g.items);

const NEW_SHELL_NAV_ITEMS: NavItem[] = navGroups.flatMap((g) =>
  g.items.map((item) => ({
    key: item.key,
    to: item.key,
    label: item.label,
    icon: item.icon,
    group: g.title,
    end: item.key === '/',
  })),
);

function NewAdminShell({ user, onLogout }: { user: ReturnType<typeof useAuth>['user']; onLogout: () => void }) {
  const navUser = user
    ? { firstName: user.firstName, lastName: user.lastName, email: user.email, roleLabel: 'Admin' }
    : null;
  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-page)' }}>
      <Navbar variant="admin" items={NEW_SHELL_NAV_ITEMS} user={navUser} onLogout={onLogout} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <main style={{ flex: 1, padding: 32, maxWidth: 1600, margin: '0 auto', width: '100%' }}>
          <Outlet />
        </main>
        <UIFooter variant="admin" />
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const bp = useBreakpoint();

  if (USE_NEW_SHELL) {
    return <NewAdminShell user={user} onLogout={logout} />;
  }

  const isMobile = bp === 'mobile';
  const isTablet = bp === 'tablet';
  const siderWidth = isTablet ? 80 : 260;
  const collapsed = isTablet;

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', label: 'Profile', icon: <UserOutlined />, onClick: () => navigate('/settings') },
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
            userSecondaryRole="Admin"
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
                  padding: '4px 8px',
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
            title="EventFlow"
            user={user}
            userMenuItems={userMenuItems}
            showMetrics={false}
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
