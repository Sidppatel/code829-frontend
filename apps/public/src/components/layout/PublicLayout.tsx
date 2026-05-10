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
  GiftOutlined,
  FacebookOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Avatar, Grid } from 'antd';
import { useAuth } from '@code829/shared/hooks/useAuth';
import BrandLogo from '@code829/shared/components/shared/BrandLogo';
import { motion, AnimatePresence } from 'framer-motion';
import { USE_NEW_SHELL } from '@code829/shared/lib/featureFlags';
import { Navbar, Footer as UIFooter } from '@code829/ui';

const { Header, Content, Footer } = Layout;
const { useBreakpoint } = Grid;

const PUBLIC_NAV_ITEMS = [
  { key: 'home', to: '/', label: 'Experience', end: true },
  { key: 'events', to: '/events', label: 'Events' },
  { key: 'feedback', to: '/feedback', label: 'Feedback' },
];

function MessengerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" focusable="false">
      <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.19 5.44 3.14 7.17.16.14.26.34.27.55l.05 1.78a.8.8 0 0 0 1.12.71l1.99-.88c.16-.07.34-.08.51-.04 1 .27 2.05.42 3.16.42 5.64 0 10-4.13 10-9.7C22 6.13 17.64 2 12 2Zm6 7.46-2.93 4.66a1.5 1.5 0 0 1-2.17.4l-2.34-1.75a.6.6 0 0 0-.72 0l-3.16 2.4c-.42.32-.97-.18-.69-.63l2.93-4.66a1.5 1.5 0 0 1 2.17-.4l2.34 1.75c.21.16.5.16.72 0l3.16-2.4c.42-.32.97.18.69.63Z" />
    </svg>
  );
}

const PUBLIC_FOOTER_SOCIALS = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=100057209869136',
    icon: <FacebookOutlined />,
  },
  {
    label: 'Messenger',
    href: 'https://m.me/100057209869136',
    icon: <MessengerIcon />,
  },
];

const PUBLIC_FOOTER_COLUMNS = [
  {
    title: 'Experience',
    links: [
      { label: 'Events', to: '/events' },
      { label: 'Feedback', to: '/feedback' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'My purchases', to: '/purchases' },
      { label: 'My entries', to: '/tickets' },
      { label: 'Guest tickets', to: '/guest-tickets' },
      { label: 'Profile', to: '/profile' },
    ],
  },
];

function NewPublicShell({ user, onLogout }: { user: ReturnType<typeof useAuth>['user']; onLogout: () => void }) {
  const navUser = user
    ? { firstName: user.firstName, lastName: user.lastName, email: user.email, imageUrl: user.imageUrl }
    : null;
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column' }}>
      <Navbar variant="public" items={PUBLIC_NAV_ITEMS} user={navUser} onLogout={onLogout} />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <UIFooter
        variant="public"
        columns={PUBLIC_FOOTER_COLUMNS}
        socials={PUBLIC_FOOTER_SOCIALS}
        tagline="Curated evenings, thoughtfully seated."
      />
    </div>
  );
}

export default function PublicLayout() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  if (USE_NEW_SHELL) {
    return <NewPublicShell user={user} onLogout={logout} />;
  }

  const navLinks = [
    { path: '/', label: 'Experience' },
    { path: '/events', label: 'Events' },
    { path: '/feedback', label: 'Feedback' },
  ];

  const userMenuItems: MenuProps['items'] = [
    { key: 'bookings', label: 'My Purchases', icon: <BookOutlined />, onClick: () => navigate('/purchases') },
    { key: 'tickets', label: 'My Entries', icon: <QrcodeOutlined />, onClick: () => navigate('/tickets') },
    { key: 'guest-tickets', label: 'Guest Tickets', icon: <GiftOutlined />, onClick: () => navigate('/guest-tickets') },
    { key: 'profile', label: 'Profile', icon: <UserOutlined />, onClick: () => navigate('/profile') },
    { type: 'divider' as const },
    { key: 'logout', label: 'Logout', icon: <LogoutOutlined />, onClick: logout },
  ];

  const bottomNavItems = [
    { key: '/', icon: <HomeOutlined />, label: 'Home', action: 'navigate' as const },
    { key: '/events', icon: <CalendarOutlined />, label: 'Events', action: 'navigate' as const },
    { key: '/purchases', icon: <BookOutlined />, label: 'Purchases', action: 'navigate' as const },
    { key: 'menu', icon: <MenuOutlined />, label: 'Menu', action: 'drawer' as const },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      <div className="nebula-bg">
        <div className="nebula-mesh" />
      </div>
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
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <BrandLogo size="lg" showText={!isMobile} textColor="var(--text-primary)" />

        {!isMobile && (
          <div style={{ display: 'flex', gap: 8 }}>
            {navLinks.map((link) => (
              <Button
                key={link.path}
                type="text"
                onClick={() => navigate(link.path)}
                style={{
                  color: location.pathname === link.path ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: location.pathname === link.path ? 700 : 500,
                  fontSize: 15,
                  padding: '6px 16px',
                  borderRadius: 10,
                  background: location.pathname === link.path ? 'var(--bg-muted)' : 'transparent',
                }}
              >
                {link.label}
              </Button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {isAuthenticated ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
              <Avatar
                src={user?.imageUrl}
                icon={<UserOutlined />}
                style={{
                  cursor: 'pointer',
                  backgroundColor: 'var(--primary)',
                  border: '2px solid var(--glass-border)',
                  boxShadow: 'var(--shadow-md)'
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
                background: 'var(--gradient-brand)',
                border: 'none',
                boxShadow: 'var(--shadow-hover)',
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
                { key: '/purchases', label: <Link to="/purchases">My Purchases</Link>, icon: <BookOutlined /> },
                { key: '/tickets', label: <Link to="/tickets">My Entries</Link>, icon: <QrcodeOutlined /> },
                { key: '/guest-tickets', label: <Link to="/guest-tickets">Guest Tickets</Link>, icon: <GiftOutlined /> },
                { key: '/profile', label: <Link to="/profile">Profile</Link>, icon: <UserOutlined /> },
              ] : []),
            ]}
            style={{ background: 'transparent', borderRight: 'none' }}
          />
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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

      <Content style={{ background: 'transparent', padding: '130px 16px 100px', maxWidth: 1440, width: '100%', margin: '0 auto' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </Content>

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
                color: active || isMenuOpen ? 'var(--primary)' : 'var(--text-muted)',
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
                  background: 'var(--primary)',
                }} />
              )}
            </button>
          );
        })}
      </nav>
    </Layout>
  );
}
