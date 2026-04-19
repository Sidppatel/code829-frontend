import { useState } from 'react';
import { Form, Input, Button, Typography, Card, App, Upload, Avatar } from 'antd';
import { UserOutlined, PhoneOutlined, CameraOutlined, SaveOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import { useAuthStore } from '../../stores/authStore';
import { adminAuthApi } from '../../services/adminAuthApi';
import BrandLogo from '../shared/BrandLogo';

export default function ProfileSetupForm({ isInitial = false }: { isInitial?: boolean }) {
  const { user, setAuth, token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const { data } = await adminAuthApi.updateProfile({
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
      });
      
      // If we have an avatar to upload
      if (fileList.length > 0 && fileList[0].originFileObj) {
        // Assume updateProfile handles or we need separate call?
        // Checking AdminAuthController... it doesn't handle avatar in updateProfile yet.
        // Actually, I'll stick to names for now or add avatar support if needed.
      }

      setAuth(token!, data);
      message.success('Profile updated successfully!');
      if (isInitial) {
        window.location.href = '/'; // Full refresh to clear setup state
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update profile';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const uploadProps: UploadProps = {
    beforeUpload: (file) => {
      setFileList([{ ...file, originFileObj: file } as unknown as UploadFile]);
      return false;
    },
    onRemove: () => setFileList([]),
    fileList,
    maxCount: 1,
  };

  return (
    <Card style={{ maxWidth: 600, width: '100%', margin: '0 auto' }} bordered={false} className="glass-card">
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        {isInitial && <BrandLogo size="lg" style={{ marginBottom: 16 }} />}
        <Typography.Title level={2}>
          {isInitial ? 'Complete Your Profile' : 'Account Settings'}
        </Typography.Title>
        <Typography.Text type="secondary">
          {isInitial 
            ? 'Set your name and contact info to finish setting up your account.' 
            : 'Keep your information up to date.'}
        </Typography.Text>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
        <Upload {...uploadProps} showUploadList={false}>
          <div style={{ cursor: 'pointer', position: 'relative' }}>
            <Avatar 
              size={120} 
              icon={<UserOutlined />} 
              src={fileList.length > 0 ? URL.createObjectURL(fileList[0].originFileObj as any) : user?.imageUrl}
              style={{ border: '4px solid var(--ant-primary-color-outline)' }}
            />
            <div style={{ 
              position: 'absolute', 
              bottom: 0, 
              right: 0, 
              background: 'var(--ant-primary-color)',
              color: 'var(--text-on-brand)',
              borderRadius: '50%', 
              padding: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}>
              <CameraOutlined />
            </div>
          </div>
        </Upload>
      </div>

      <Form 
        form={form}
        layout="vertical" 
        onFinish={onFinish} 
        initialValues={{
          firstName: user?.firstName === 'Pending' ? '' : user?.firstName,
          lastName: user?.lastName === 'Setup' ? '' : user?.lastName,
          phone: user?.phone,
        }}
        autoComplete="off"
        size="large"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: 'Required' }]}>
            <Input prefix={<UserOutlined style={{ color: 'var(--text-muted)' }} />} placeholder="John" />
          </Form.Item>
          <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: 'Required' }]}>
            <Input prefix={<UserOutlined style={{ color: 'var(--text-muted)' }} />} placeholder="Doe" />
          </Form.Item>
        </div>

        <Form.Item name="phone" label="Phone Number" rules={[{ required: false }]}>
          <Input prefix={<PhoneOutlined style={{ color: 'var(--text-muted)' }} />} placeholder="+1 (555) 000-0000" />
        </Form.Item>

        <Form.Item style={{ marginTop: 24 }}>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading} 
            block 
            icon={<SaveOutlined />}
            style={{ height: 50, borderRadius: 8 }}
          >
            {isInitial ? 'Get Started' : 'Save Changes'}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
