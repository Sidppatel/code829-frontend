import { useEffect, useState } from 'react';
import { Card, Form, Input, Button, App, Row, Col } from 'antd';
import { adminAuthApi } from '../../services/adminAuthApi';
import { useAuthStore } from '../../stores/authStore';
import AvatarUpload from '../shared/AvatarUpload';
import LoadingSpinner from '../shared/LoadingSpinner';
import { createLogger } from '../../lib/logger';

const log = createLogger('AdminProfilePage');

interface AdminImagesApi {
  uploadAdminImage: (file: File) => Promise<{ data: { url: string } }>;
  deleteAdminImage: () => Promise<unknown>;
}

interface Props {
  imagesApi: AdminImagesApi;
  isInitial?: boolean;
}

export default function AdminProfilePage({ imagesApi, isInitial = false }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const { message } = App.useApp();
  const setUser = useAuthStore((s) => s.setUser);

  const refetchAndSetUser = async () => {
    const { data } = await adminAuthApi.getMe();
    setUser(data);
    return data;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await adminAuthApi.getMe();
        setImageUrl(data.imageUrl ?? null);
        form.setFieldsValue({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone ?? '',
        });
      } catch (err) {
        log.error('Failed to load profile', err);
        message.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [form, message]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields(['firstName', 'lastName', 'phone']);
      setSaving(true);
      await adminAuthApi.updateProfile(values);
      await refetchAndSetUser();
      log.info('Profile updated');
      message.success('Profile updated');
      if (isInitial) {
        window.location.href = '/';
      }
    } catch (err) {
      log.error('Failed to update profile', err);
      message.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 32px 64px' }}>
      <Card>
        <AvatarUpload
          currentUrl={imageUrl}
          onUpload={async (file) => {
            const { data } = await imagesApi.uploadAdminImage(file);
            setImageUrl(data.url);
            await refetchAndSetUser();
            return data.url;
          }}
          onDelete={async () => {
            await imagesApi.deleteAdminImage();
            setImageUrl(null);
            await refetchAndSetUser();
          }}
        />
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="email" label="Email Address">
            <Input disabled />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>
              {isInitial ? 'Get Started' : 'Save Changes'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
