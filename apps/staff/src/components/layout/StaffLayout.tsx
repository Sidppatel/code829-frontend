import { Outlet, useNavigate } from 'react-router-dom';
import { Layout, Button, Typography } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import BrandLogo from '@code829/shared/components/shared/BrandLogo';
import { useAuth } from '@code829/shared/hooks/useAuth';
import { USE_NEW_SHELL } from '@code829/shared/lib/featureFlags';
import { Navbar, Footer as UIFooter } from '@code829/ui';

const { Header, Content } = Layout;

export default function StaffLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (USE_NEW_SHELL) {
    const navUser = user
      ? { firstName: user.firstName, lastName: user.lastName, email: user.email, roleLabel: 'Staff' }
      : null;
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column' }}>
        <Navbar variant="staff" user={navUser} onLogout={handleLogout} />
        <main style={{ flex: 1, padding: 24, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
          <Outlet />
        </main>
        <UIFooter variant="staff" />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          background: 'var(--nav-bg)',
          borderBottom: '1px solid var(--nav-border)',
          height: 64,
          lineHeight: 'normal',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BrandLogo size="sm" />
          <div style={{ width: 1, height: 24, background: 'var(--border)' }} />
          <Typography.Text
            style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}
          >
            Staff Check-In
          </Typography.Text>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 12,
                fontWeight: 700,
              }}>
                {user.firstName?.[0]}
              </div>
              <Typography.Text style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap' }}>
                {user.firstName}
              </Typography.Text>
            </div>
          )}
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              height: 40,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '0 14px',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Logout
          </Button>
        </div>
      </Header>

      <Content style={{ padding: 24 }}>
        <Outlet />
      </Content>
    </Layout>
  );
}
