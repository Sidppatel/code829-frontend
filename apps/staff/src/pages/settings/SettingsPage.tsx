import PageHeader from '@code829/shared/components/shared/PageHeader';
import AdminSecuritySection from '@code829/shared/components/auth/AdminSecuritySection';

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" subtitle="Account security" />
      <AdminSecuritySection />
    </div>
  );
}
