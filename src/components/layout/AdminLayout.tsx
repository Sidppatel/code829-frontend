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
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="dark">
        <div style={{ padding: '16px 24px' }}>
          <Link to="/admin">
            <Typography.Title level={4} style={{ margin: 0, color: '#fff' }}>
              Admin
            </Typography.Title>
          </Link>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Content style={{ padding: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
