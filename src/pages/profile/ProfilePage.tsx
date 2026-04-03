import { useEffect, useState } from 'react';
import { Card, Form, Input, Switch, Button, App, Row, Col } from 'antd';
import { authApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import type { UserProfile } from '../../types/auth';
import PageHeader from '../../components/shared/PageHeader';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import AddressAutocomplete from '../../components/shared/AddressAutocomplete';
import type { AddressParts } from '../../components/shared/AddressAutocomplete';

export default function ProfilePage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { message } = App.useApp();
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await authApi.getMe();
        form.setFieldsValue({
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone ?? '',
          address: data.address ?? '',
          city: data.city ?? '',
          state: data.state ?? '',
          zipCode: data.zipCode ?? '',
          optInLocationEmail: data.optInLocationEmail,
        });
      } catch {
        message.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [form, message]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await authApi.updateProfile(values);
      const { data } = await authApi.getMe();
      setUser(data as UserProfile);
      message.success('Profile updated');
    } catch {
      message.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddressSelect = (parts: AddressParts) => {
    form.setFieldsValue({
      address: parts.address,
      city: parts.city,
      state: parts.state,
      zipCode: parts.zipCode,
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <PageHeader title="Profile" subtitle="Manage your account information" />
      <Card>
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
          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <AddressAutocomplete onSelect={handleAddressSelect} />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item name="city" label="City">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="state" label="State">
                <Input maxLength={2} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="zipCode" label="ZIP Code">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="optInLocationEmail"
            label="Receive emails about events near you"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
