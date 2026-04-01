import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Dropdown, Space, Typography } from 'antd';
import {
  HomeOutlined,
  CalendarOutlined,
  UserOutlined,
  LogoutOutlined,
  BookOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuth } from '../../hooks/useAuth';

const { Header, Content, Footer } = Layout;

export default function PublicLayout() {
  const { isAuthenticated, user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const menuItems: MenuProps['items'] = [
    { key: '/', label: <Link to="/">Home</Link>, icon: <HomeOutlined /> },
    { key: '/events', label: <Link to="/events">Events</Link>, icon: <CalendarOutlined /> },
  ];

  const userMenuItems: MenuProps['items'] = [
    { key: 'bookings', label: 'My Bookings', icon: <BookOutlined />, onClick: () => navigate('/bookings') },
    { key: 'profile', label: 'Profile', icon: <UserOutlined />, onClick: () => navigate('/profile') },
    ...(hasRole('Admin') ? [
      { key: 'admin', label: 'Admin Panel', icon: <SettingOutlined />, onClick: () => navigate('/admin') },
    ] : []),
    ...(hasRole('Developer') ? [
      { key: 'developer', label: 'Developer Panel', icon: <SettingOutlined />, onClick: () => navigate('/developer') },
    ] : []),
    { type: 'divider' as const },
    { key: 'logout', label: 'Logout', icon: <LogoutOutlined />, onClick: logout },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#0A0A0F' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 32px',
          background: 'rgba(10, 10, 15, 0.8)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Link to="/" style={{ marginRight: 32, textDecoration: 'none' }}>
          <Typography.Title
            level={4}
            style={{
              margin: 0,
              fontFamily: "'Playfair Display', serif",
              background: 'linear-gradient(135deg, #7C3AED, #F59E0B)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: 22,
            }}
          >
            Code829
          </Typography.Title>
        </Link>
        <Menu
          theme="dark"
          mode="horizontal"
          items={menuItems}
          style={{ flex: 1, background: 'transparent', borderBottom: 'none' }}
        />
        <Space>
          {isAuthenticated ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Button
                type="text"
                style={{
                  color: '#F1F0FF',
                  borderRadius: 8,
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  background: 'rgba(255, 255, 255, 0.04)',
                }}
              >
                <UserOutlined /> {user?.firstName}
              </Button>
            </Dropdown>
          ) : (
            <Button
              type="primary"
              onClick={() => navigate('/login')}
              style={{
                borderRadius: 8,
                fontWeight: 600,
              }}
            >
              Sign In
            </Button>
          )}
        </Space>
      </Header>
      <Content style={{ padding: '32px 48px', background: '#0A0A0F' }}>
        <Outlet />
      </Content>
      <Footer
        style={{
          textAlign: 'center',
          background: '#0A0A0F',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          color: '#6B7280',
        }}
      >
        Code829 Event Platform
      </Footer>
    </Layout>
  );
}
