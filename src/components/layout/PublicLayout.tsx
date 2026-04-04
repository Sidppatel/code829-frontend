import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Dropdown, Space, Typography, Drawer, Row, Col } from 'antd';
import {
  HomeOutlined,
  CalendarOutlined,
  UserOutlined,
  LogoutOutlined,
  BookOutlined,
  SettingOutlined,
  MenuOutlined,
  CloseOutlined,
  ScanOutlined,
  QrcodeOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuth } from '../../hooks/useAuth';
import ThemeToggle from '../shared/ThemeToggle';

const { Header, Content, Footer } = Layout;

export default function PublicLayout() {
  const { isAuthenticated, user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const menuItems: MenuProps['items'] = [
    { key: '/', label: <Link to="/">Home</Link>, icon: <HomeOutlined /> },
    { key: '/events', label: <Link to="/events">Events</Link>, icon: <CalendarOutlined /> },
  ];

  const userMenuItems: MenuProps['items'] = [
    { key: 'bookings', label: 'My Bookings', icon: <BookOutlined />, onClick: () => navigate('/bookings') },
    { key: 'tickets', label: 'My Tickets', icon: <QrcodeOutlined />, onClick: () => navigate('/tickets') },
    { key: 'profile', label: 'Profile', icon: <UserOutlined />, onClick: () => navigate('/profile') },
    ...(hasRole('Staff') ? [
      { key: 'checkin', label: 'Staff Check-In', icon: <ScanOutlined />, onClick: () => navigate('/staff/checkin/select') },
    ] : []),
    ...(hasRole('Admin') ? [
      { key: 'admin', label: 'Admin Panel', icon: <SettingOutlined />, onClick: () => navigate('/admin') },
    ] : []),
    ...(hasRole('Developer') ? [
      { key: 'developer', label: 'Developer Panel', icon: <SettingOutlined />, onClick: () => navigate('/developer') },
    ] : []),
    { type: 'divider' as const },
    { key: 'logout', label: 'Logout', icon: <LogoutOutlined />, onClick: logout },
  ];

  const bottomNavItems = [
    { key: '/', icon: <HomeOutlined />, label: 'Home', action: 'navigate' as const },
    { key: '/events', icon: <CalendarOutlined />, label: 'Events', action: 'navigate' as const },
    { key: '/bookings', icon: <BookOutlined />, label: 'Bookings', action: 'navigate' as const },
    { key: 'menu', icon: <MenuOutlined />, label: 'Menu', action: 'drawer' as const },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      {/* Top Navbar */}
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          background: scrolled ? 'var(--nav-bg)' : 'transparent',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          borderBottom: scrolled ? '1px solid var(--nav-border)' : '1px solid transparent',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          transition: 'background 0.3s ease, border-bottom 0.3s ease, backdrop-filter 0.3s ease',
          height: 60,
          lineHeight: '60px',
        }}
      >
        {/* Logo */}
        <Link to="/" style={{ marginRight: 24, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{ color: 'var(--accent-violet)', fontSize: 22, lineHeight: 1 }}>✦</span>
          <Typography.Title
            level={4}
            className="text-display gradient-text"
            style={{ margin: 0, fontSize: 22 }}
          >
            Code829
          </Typography.Title>
        </Link>

        {/* Desktop nav */}
        <div className="desktop-nav" style={{ flex: 1, alignItems: 'center' }}>
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            style={{ flex: 1, background: 'transparent', borderBottom: 'none' }}
          />
        </div>

        <Space style={{ marginLeft: 'auto' }}>
          <ThemeToggle />
          {/* Desktop auth */}
          <div className="desktop-nav" style={{ alignItems: 'center' }}>
            {isAuthenticated ? (
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Button
                  type="text"
                  style={{
                    color: 'var(--text-primary)',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                  }}
                >
                  <UserOutlined /> {user?.firstName}
                </Button>
              </Dropdown>
            ) : (
              <Button
                type="primary"
                onClick={() => navigate('/login')}
                style={{ borderRadius: 99, fontWeight: 600 }}
              >
                Sign In
              </Button>
            )}
          </div>
        </Space>
      </Header>

      {/* Mobile Drawer */}
      <Drawer
        placement="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width="min(280px, 85vw)"
        closeIcon={<CloseOutlined style={{ color: 'var(--text-primary)' }} />}
        styles={{
          header: { background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' },
          body: { background: 'var(--bg-surface)', padding: 0, display: 'flex', flexDirection: 'column' },
        }}
        title={
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--accent-violet)', fontSize: 20 }}>✦</span>
            <span className="text-display gradient-text" style={{ fontSize: 20, fontWeight: 700 }}>Code829</span>
          </Link>
        }
      >
        <div style={{ flex: 1, padding: '12px 0' }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={[
              { key: '/', label: <Link to="/">Home</Link>, icon: <HomeOutlined /> },
              { key: '/events', label: <Link to="/events">Events</Link>, icon: <CalendarOutlined /> },
              ...(isAuthenticated ? [
                { key: '/bookings', label: <Link to="/bookings">My Bookings</Link>, icon: <BookOutlined /> },
                { key: '/profile', label: <Link to="/profile">Profile</Link>, icon: <UserOutlined /> },
              ] : []),
              ...(hasRole('Staff') ? [
                { key: '/staff', label: <Link to="/staff/checkin/select">Staff Check-In</Link>, icon: <ScanOutlined /> },
              ] : []),
              ...(hasRole('Admin') ? [
                { key: '/admin', label: <Link to="/admin">Admin Panel</Link>, icon: <SettingOutlined /> },
              ] : []),
              ...(hasRole('Developer') ? [
                { key: '/developer', label: <Link to="/developer">Developer Panel</Link>, icon: <SettingOutlined /> },
              ] : []),
            ]}
            style={{ background: 'transparent', borderRight: 'none' }}
          />
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <ThemeToggle />
          {isAuthenticated ? (
            <Button type="text" icon={<LogoutOutlined />} onClick={logout} style={{ color: 'var(--text-secondary)' }}>
              Logout
            </Button>
          ) : (
            <Button type="primary" onClick={() => navigate('/login')} style={{ borderRadius: 99 }}>
              Sign In
            </Button>
          )}
        </div>
      </Drawer>

      {/* Content */}
      <Content style={{ background: 'var(--bg-page)', padding: '16px 16px 72px', maxWidth: 1280, width: '100%', margin: '0 auto' }}>
        <Outlet />
      </Content>

      {/* Footer — desktop only */}
      <Footer
        className="desktop-nav"
        style={{
          background: 'var(--nav-bg)',
          borderTop: '1px solid var(--nav-border)',
          padding: '48px 48px 24px',
          flexDirection: 'column',
        }}
      >
        <Row gutter={[48, 32]} style={{ maxWidth: 1280, margin: '0 auto', width: '100%' }}>
          <Col xs={24} md={8}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <span style={{ color: 'var(--accent-violet)', fontSize: 20 }}>✦</span>
              <span className="text-display gradient-text" style={{ fontSize: 20, fontWeight: 700 }}>Code829</span>
            </div>
            <Typography.Text style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              Your premier event booking platform in Mobile, Alabama. Discover, book, and enjoy unforgettable experiences.
            </Typography.Text>
          </Col>
          <Col xs={24} md={8}>
            <Typography.Text strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 12, fontSize: 14 }}>
              Quick Links
            </Typography.Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to="/" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Home</Link>
              <Link to="/events" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Events</Link>
              <Link to="/login" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Sign In</Link>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <Typography.Text strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 12, fontSize: 14 }}>
              Info
            </Typography.Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Typography.Text style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Mobile, Alabama</Typography.Text>
              <Typography.Text style={{ color: 'var(--text-secondary)', fontSize: 13 }}>hello@code829.com</Typography.Text>
            </div>
          </Col>
        </Row>
        <div style={{ textAlign: 'center', marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 13 }}>
          © 2025 Code829. Built for Mobile, AL.
        </div>
      </Footer>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-bottom-nav">
        {bottomNavItems.map((item) => {
          const active = item.action === 'navigate' && isActive(item.key);
          const isMenuOpen = item.action === 'drawer' && drawerOpen;
          return (
            <button
              key={item.key}
              onClick={() => {
                if (item.action === 'drawer') {
                  setDrawerOpen(true);
                } else {
                  navigate(item.key);
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                padding: '4px 12px',
                color: active || isMenuOpen ? 'var(--accent-violet)' : 'var(--text-muted)',
                fontSize: 10,
                fontFamily: "'Inter', sans-serif",
                position: 'relative',
              }}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span>{item.label}</span>
              {active && (
                <span style={{
                  position: 'absolute',
                  bottom: -2,
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: 'var(--accent-violet)',
                }} />
              )}
            </button>
          );
        })}
      </nav>
    </Layout>
  );
}
