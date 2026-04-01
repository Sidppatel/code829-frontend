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
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', padding: '0 24px' }}>
        <Link to="/" style={{ marginRight: 24 }}>
          <Typography.Title level={4} style={{ margin: 0, color: '#fff' }}>
            Code829
          </Typography.Title>
        </Link>
        <Menu
          theme="dark"
          mode="horizontal"
          items={menuItems}
          style={{ flex: 1 }}
        />
        <Space>
          {isAuthenticated ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Button type="text" style={{ color: '#fff' }}>
                <UserOutlined /> {user?.firstName}
              </Button>
            </Dropdown>
          ) : (
            <Button type="primary" onClick={() => navigate('/login')}>
              Sign In
            </Button>
          )}
        </Space>
      </Header>
      <Content style={{ padding: '24px 48px' }}>
        <Outlet />
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        Code829 Event Platform
      </Footer>
    </Layout>
  );
}
