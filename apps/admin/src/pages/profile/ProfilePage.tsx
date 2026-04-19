import { useLocation } from 'react-router-dom';
import AdminProfilePage from '@code829/shared/components/auth/AdminProfilePage';
import PageHeader from '@code829/shared/components/shared/PageHeader';
import { imagesApi } from '../../services/api';

export default function ProfilePage() {
  const location = useLocation();
  const isInitial = location.state?.setup === true;

  return (
    <div style={{ padding: 24 }}>
      {!isInitial && <PageHeader title="Profile" subtitle="Manage your personal information and avatar." />}
      <AdminProfilePage imagesApi={imagesApi} isInitial={isInitial} />
    </div>
  );
}
