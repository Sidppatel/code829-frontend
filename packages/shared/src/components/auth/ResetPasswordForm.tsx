import { Typography, Card, App, Result } from 'antd';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { adminAuthApi } from '../../services/adminAuthApi';
import BrandLogo from '../shared/BrandLogo';
import PasswordForm from './PasswordForm';

interface ResetPasswordFormProps {
  title?: string;
  loginPath?: string;
}

export default function ResetPasswordForm({
  title = 'Reset Password',
  loginPath = '/login',
}: ResetPasswordFormProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const token = searchParams.get('token');

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Result
          status="error"
          title="Invalid Reset Link"
          subTitle="No reset token was provided. Please request a new password reset."
          extra={<Link to={loginPath}>Back to sign in</Link>}
        />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Card style={{ maxWidth: 420, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <BrandLogo size="lg" />
          <Typography.Title level={3} style={{ marginTop: 16, marginBottom: 4 }}>
            {title}
          </Typography.Title>
          <Typography.Text type="secondary">
            Enter your new password below
          </Typography.Text>
        </div>

        <PasswordForm
          mode="reset"
          onSubmit={async ({ newPassword }) => {
            await adminAuthApi.resetPassword(token, newPassword);
            message.success('Password updated. Please sign in with your new password.');
            navigate(loginPath, { replace: true });
          }}
          submitLabel="Reset Password"
        />

        <div style={{ textAlign: 'center' }}>
          <Link to={loginPath}>Back to sign in</Link>
        </div>
      </Card>
    </div>
  );
}
