import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Dropdown, Typography, Drawer, Row, Col } from 'antd';
import {
  HomeOutlined,
  CalendarOutlined,
  UserOutlined,
  LogoutOutlined,
  BookOutlined,
  MenuOutlined,
  CloseOutlined,
  QrcodeOutlined,
  MessageOutlined,
  LoginOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Avatar, Grid } from 'antd';
import { useAuth } from '@code829/shared/hooks/useAuth';
import ThemeToggle from '@code829/shared/components/shared/ThemeToggle';
import BrandLogo from '@code829/shared/components/shared/BrandLogo';

const { Header, Content, Footer } = Layout;
const { useBreakpoint } = Grid;

export default function PublicLayout() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const navLinks = [
    { path: '/', label: 'Experience' },
    { path: '/events', label: 'Events' },
    { path: '/feedback', label: 'Feedback' },
  ];





  const userMenuItems: MenuProps['items'] = [
    { key: 'bookings', label: 'My Bookings', icon: <BookOutlined />, onClick: () => navigate('/bookings') },
    { key: 'tickets', label: 'My Tickets', icon: <QrcodeOutlined />, onClick: () => navigate('/tickets') },
    { key: 'profile', label: 'Profile', icon: <UserOutlined />, onClick: () => navigate('/profile') },
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
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      {/* Nebula Background */}
      <div className="nebula-bg">
        <div className="nebula-mesh" />
      </div>
      {/* Top Navbar */}
      <Header
        style={{
          position: 'fixed',
          top: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 48px)',
          maxWidth: 1440,
          height: 72,
          padding: '0 32px',
          background: 'var(--nav-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--nav-border)',
          borderRadius: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 1000,
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Logo */}
        <BrandLogo size="lg" showText={!isMobile} />

        {!isMobile && (
          <div style={{ display: 'flex', gap: 8 }}>
            {navLinks.map((link) => (
              <Button
                key={link.path}
                type="text"
                onClick={() => navigate(link.path)}
                style={{
                  color: location.pathname === link.path ? 'var(--accent-violet)' : 'var(--text-secondary)',
                  fontWeight: location.pathname === link.path ? 700 : 500,
                  fontSize: 15,
                  padding: '6px 16px',
                  borderRadius: 10,
                  background: location.pathname === link.path ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                }}
              >
                {link.label}
              </Button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <ThemeToggle />
          
          {isAuthenticated ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
              <Avatar
                src={user?.avatarUrl}
                icon={<UserOutlined />}
                style={{ 
                  cursor: 'pointer', 
                  backgroundColor: 'var(--accent-violet)',
                  border: '2px solid var(--glass-border)',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }}
              >
                {user?.firstName?.[0]}
              </Avatar>
            </Dropdown>
          ) : (
            <Button
              type="primary"
              icon={<LoginOutlined />}
              onClick={() => navigate('/login')}
              style={{
                borderRadius: 12,
                fontWeight: 600,
                height: 42,
                padding: '0 24px',
                background: 'linear-gradient(135deg, var(--accent-violet), var(--accent-rose))',
                border: 'none',
                boxShadow: '0 8px 16px rgba(99, 102, 241, 0.25)',
              }}
            >
              Sign In
            </Button>
          )}

          {isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setDrawerOpen(true)}
              style={{ color: 'var(--text-primary)', fontSize: 20 }}
            />
          )}
        </div>
      </Header>

      {/* Mobile Drawer */}
      <Drawer
        placement="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        closeIcon={<CloseOutlined style={{ color: 'var(--text-primary)' }} />}
        styles={{
          header: { background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' },
          body: { background: 'var(--bg-surface)', padding: 0, display: 'flex', flexDirection: 'column' },
          wrapper: { width: 'min(280px, 85vw)' }
        }}
        title={
          <BrandLogo size="sm" />
        }
      >
        <div style={{ flex: 1, padding: '12px 0' }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            onSelect={() => setDrawerOpen(false)}
            items={[
              { key: '/', label: <Link to="/">Home</Link>, icon: <HomeOutlined /> },
              { key: '/events', label: <Link to="/events">Events</Link>, icon: <CalendarOutlined /> },
              { key: '/feedback', label: <Link to="/feedback">Feedback</Link>, icon: <MessageOutlined /> },
              ...(isAuthenticated ? [
                { key: '/bookings', label: <Link to="/bookings">My Bookings</Link>, icon: <BookOutlined /> },
                { key: '/profile', label: <Link to="/profile">Profile</Link>, icon: <UserOutlined /> },
              ] : []),
            ]}
            style={{ background: 'transparent', borderRight: 'none' }}
          />
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <ThemeToggle />
          {isAuthenticated ? (
            <Button 
              type="text" 
              icon={<LogoutOutlined />} 
              onClick={() => {
                logout();
                setDrawerOpen(false);
              }} 
              style={{ color: 'var(--text-secondary)' }}
            >
              Logout
            </Button>
          ) : (
            <Button 
              type="primary" 
              onClick={() => {
                navigate('/login');
                setDrawerOpen(false);
              }} 
              style={{ borderRadius: 99 }}
            >
              Sign In
            </Button>
          )}
        </div>
      </Drawer>

      {/* Content */}
      <Content style={{ background: 'transparent', padding: '130px 16px 100px', maxWidth: 1440, width: '100%', margin: '0 auto' }}>
        <Outlet />
      </Content>

      {/* Footer — desktop only */}
      <Footer
        className="desktop-nav"
        style={{
          background: 'transparent',
          borderTop: '1px solid var(--border)',
          padding: '80px 48px 40px',
          flexDirection: 'column',
          marginTop: 100
        }}
      >
        <Row gutter={[48, 32]} style={{ maxWidth: 1280, margin: '0 auto', width: '100%' }}>
          <Col xs={24} md={8}>
            <div style={{ marginBottom: 16 }}>
              <BrandLogo size="md" />
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
              <Link to="/feedback" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Feedback</Link>
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
