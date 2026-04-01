import { Outlet, Link, useLocation } from 'react-router-dom';
import { Layout, Menu, Typography } from 'antd';
import {
  CodeOutlined,
  MailOutlined,
  FileTextOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons';

const { Sider, Content } = Layout;

const menuItems = [
  { key: '/developer', label: <Link to="/developer">Logs</Link>, icon: <CodeOutlined /> },
  { key: '/developer/email-logs', label: <Link to="/developer/email-logs">Email Logs</Link>, icon: <MailOutlined /> },
  { key: '/developer/system-logs', label: <Link to="/developer/system-logs">System Logs</Link>, icon: <FileTextOutlined /> },
  { key: '/developer/settings', label: <Link to="/developer/settings">Settings</Link>, icon: <SettingOutlined /> },
  { key: '/developer/users', label: <Link to="/developer/users">Users</Link>, icon: <TeamOutlined /> },
];

export default function DeveloperLayout() {
  const location = useLocation();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="dark">
        <div style={{ padding: '16px 24px' }}>
          <Link to="/developer">
            <Typography.Title level={4} style={{ margin: 0, color: '#fff' }}>
              Developer
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
