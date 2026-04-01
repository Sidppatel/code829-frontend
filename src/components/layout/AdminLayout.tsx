import { Outlet, Link, useLocation } from 'react-router-dom';
import { Layout, Menu, Typography } from 'antd';
import {
  DashboardOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  BookOutlined,
  TableOutlined,
  BarChartOutlined,
  SettingOutlined,
} from '@ant-design/icons';

const { Sider, Content } = Layout;

const menuItems = [
  { key: '/admin', label: <Link to="/admin">Dashboard</Link>, icon: <DashboardOutlined /> },
  { key: '/admin/events', label: <Link to="/admin/events">Events</Link>, icon: <CalendarOutlined /> },
  { key: '/admin/venues', label: <Link to="/admin/venues">Venues</Link>, icon: <EnvironmentOutlined /> },
  { key: '/admin/bookings', label: <Link to="/admin/bookings">Bookings</Link>, icon: <BookOutlined /> },
  { key: '/admin/table-types', label: <Link to="/admin/table-types">Table Types</Link>, icon: <TableOutlined /> },
  { key: '/admin/analytics', label: <Link to="/admin/analytics">Analytics</Link>, icon: <BarChartOutlined /> },
  { key: '/admin/settings', label: <Link to="/admin/settings">Settings</Link>, icon: <SettingOutlined /> },
];

export default function AdminLayout() {
  const location = useLocation();

  return (
    <Layout style={{ minHeight: '100vh', background: '#0A0A0F' }}>
      <Sider
        width={240}
        style={{
          background: '#13131A',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div style={{ padding: '20px 24px' }}>
          <Link to="/admin" style={{ textDecoration: 'none' }}>
            <Typography.Title
              level={4}
              style={{
                margin: 0,
                fontFamily: "'Playfair Display', serif",
                background: 'linear-gradient(135deg, #7C3AED, #F59E0B)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: 20,
              }}
            >
              Admin
            </Typography.Title>
          </Link>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ background: 'transparent', borderRight: 'none' }}
        />
      </Sider>
      <Layout style={{ marginLeft: 240, background: '#0A0A0F' }}>
        <Content style={{ padding: 28, minHeight: '100vh' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
