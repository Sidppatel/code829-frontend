import { adminAuthApi } from '../../services/adminAuthApi';
import HumanCard from '../shared/HumanCard';
import PasswordForm from './PasswordForm';

export default function AdminSecuritySection() {
  return (
    <HumanCard title="Change Password" style={{ maxWidth: 480 }}>
      <PasswordForm
        mode="change"
        onSubmit={async (v) => {
          await adminAuthApi.changePassword({ currentPassword: v.currentPassword!, newPassword: v.newPassword });
        }}
        submitLabel="Update password"
      />
    </HumanCard>
  );
}
