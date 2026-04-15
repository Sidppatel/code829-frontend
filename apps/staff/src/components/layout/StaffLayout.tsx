import { Outlet, useNavigate } from 'react-router-dom';
import { Layout, Button, Space, Typography } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import BrandLogo from '@code829/shared/components/shared/BrandLogo';
import { useAuthStore } from '@code829/shared/stores/authStore';

const { Header, Content } = Layout;

export default function StaffLayout() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
          height: 64,
          lineHeight: 'normal',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BrandLogo size="sm" />
          <div
            style={{
              width: 1,
              height: 24,
              background: 'var(--border)',
            }}
          />
          <Typography.Text
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
            }}
          >
            Staff Check-In
          </Typography.Text>
        </div>

        <Space size={12}>
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              height: 44,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '0 16px',
              fontWeight: 600,
            }}
          >
            Logout
          </Button>
        </Space>
      </Header>

      <Content style={{ padding: 24 }}>
        <Outlet />
      </Content>
    </Layout>
  );
}
