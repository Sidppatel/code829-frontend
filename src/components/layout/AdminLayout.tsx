import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Typography, Button, Drawer, Dropdown, Space, Tag } from 'antd';
import {
  DashboardOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  BookOutlined,
  TableOutlined,
  BarChartOutlined,
  MenuOutlined,
  CloseOutlined,
  BellOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuth } from '../../hooks/useAuth';
import ThemeToggle from '../shared/ThemeToggle';

const { Sider, Header, Content } = Layout;

const menuItems = [
  { key: '/admin', label: <Link to="/admin">Dashboard</Link>, icon: <DashboardOutlined /> },
  { key: '/admin/events', label: <Link to="/admin/events">Events</Link>, icon: <CalendarOutlined /> },
  { key: '/admin/venues', label: <Link to="/admin/venues">Venues</Link>, icon: <EnvironmentOutlined /> },
  { key: '/admin/bookings', label: <Link to="/admin/bookings">Bookings</Link>, icon: <BookOutlined /> },
  { key: '/admin/table-types', label: <Link to="/admin/table-types">Table Templates</Link>, icon: <TableOutlined /> },
  { key: '/admin/analytics', label: <Link to="/admin/analytics">Analytics</Link>, icon: <BarChartOutlined /> },
];

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

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const bp = useBreakpoint();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const isMobile = bp === 'mobile';
  const isTablet = bp === 'tablet';
  const siderWidth = isTablet ? 64 : 240;
  const collapsed = isTablet;

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', label: 'Profile', icon: <UserOutlined />, onClick: () => navigate('/profile') },
    { type: 'divider' as const },
    { key: 'logout', label: 'Logout', icon: <LogoutOutlined />, onClick: logout },
  ];

  const siderContent = (
    <>
      <div style={{ padding: collapsed ? '16px 8px' : '16px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Link to="/admin" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--accent-violet)', fontSize: collapsed ? 18 : 20, flexShrink: 0 }}>✦</span>
          {!collapsed && (
            <span className="text-display gradient-text" style={{ fontSize: 18, fontWeight: 700 }}>Code829</span>
          )}
        </Link>
        {!collapsed && (
          <Tag
            style={{
              background: 'rgba(124, 58, 237, 0.15)',
              border: '1px solid rgba(124, 58, 237, 0.3)',
              color: 'var(--accent-violet-light)',
              borderRadius: 99,
              fontSize: 10,
              lineHeight: '18px',
              padding: '0 8px',
              marginLeft: 4,
            }}
          >
            Admin
          </Tag>
        )}
      </div>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        inlineCollapsed={collapsed}
        style={{ background: 'transparent', borderRight: 'none', flex: 1 }}
      />
      <div style={{ padding: collapsed ? '12px 8px' : '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <ThemeToggle size="small" />
        {!collapsed && user && (
          <Typography.Text ellipsis style={{ color: 'var(--text-muted)', fontSize: 12, maxWidth: '100%', textAlign: 'center' }}>
            {user.firstName} {user.lastName}
          </Typography.Text>
        )}
      </div>
    </>
  );

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      {/* Desktop/Tablet Sider */}
      {!isMobile && (
        <Sider
          width={siderWidth}
          collapsed={collapsed}
          collapsedWidth={64}
          style={{
            background: 'var(--nav-bg)',
            borderRight: '1px solid var(--nav-border)',
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {siderContent}
        </Sider>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={260}
          closeIcon={<CloseOutlined style={{ color: 'var(--text-primary)' }} />}
          styles={{
            header: { background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' },
            body: { background: 'var(--bg-surface)', padding: 0, display: 'flex', flexDirection: 'column' },
          }}
          title={
            <Link to="/admin" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'var(--accent-violet)', fontSize: 20 }}>✦</span>
              <span className="text-display gradient-text" style={{ fontSize: 18, fontWeight: 700 }}>Code829</span>
              <Tag
                style={{
                  background: 'rgba(124, 58, 237, 0.15)',
                  border: '1px solid rgba(124, 58, 237, 0.3)',
                  color: 'var(--accent-violet-light)',
                  borderRadius: 99,
                  fontSize: 10,
                  lineHeight: '18px',
                  padding: '0 8px',
                  marginLeft: 4,
                }}
              >
                Admin
              </Tag>
            </Link>
          }
        >
          <div style={{ flex: 1, padding: '8px 0' }}>
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              items={menuItems}
              style={{ background: 'transparent', borderRight: 'none' }}
            />
          </div>
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <ThemeToggle size="small" />
            <Button type="text" icon={<LogoutOutlined />} onClick={logout} style={{ color: 'var(--text-secondary)' }}>
              Logout
            </Button>
          </div>
        </Drawer>
      )}

      <Layout style={{ marginLeft: isMobile ? 0 : siderWidth, background: 'var(--bg-page)', transition: 'margin-left 0.2s ease' }}>
        {/* Top Header */}
        <Header
          style={{
            height: 60,
            lineHeight: '60px',
            background: 'var(--nav-bg)',
            borderBottom: '1px solid var(--nav-border)',
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 99,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined style={{ fontSize: 18, color: 'var(--text-primary)' }} />}
                onClick={() => setDrawerOpen(true)}
                style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              />
            )}
          </div>
          <Space>
            {!isMobile && <ThemeToggle size="small" />}
            <Button
              type="text"
              icon={<BellOutlined style={{ fontSize: 18, color: 'var(--text-secondary)' }} />}
              style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            />
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Button
                type="text"
                style={{
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <UserOutlined /> {user?.firstName}
              </Button>
            </Dropdown>
          </Space>
        </Header>

        {/* Content */}
        <Content style={{
          padding: isMobile ? 16 : isTablet ? 24 : 32,
          paddingBottom: isMobile ? 80 : 32,
          minHeight: 'calc(100vh - 60px)',
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
