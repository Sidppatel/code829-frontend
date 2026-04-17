import ProfileSetupForm from '@code829/shared/components/auth/ProfileSetupForm';
import PageHeader from '@code829/shared/components/shared/PageHeader';
import { useLocation } from 'react-router-dom';

export default function ProfilePage() {
  const location = useLocation();
  const isInitial = location.state?.setup === true;

  return (
    <div style={{ padding: isInitial ? 0 : 24, minHeight: isInitial ? '100vh' : 'auto', display: 'flex', flexDirection: 'column' }}>
      {!isInitial && <PageHeader title="Profile Settings" subtitle="Manage your personal information and preferences" />}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ProfileSetupForm isInitial={isInitial} />
      </div>
    </div>
  );
}
