import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Space, App, Row, Col } from 'antd';
import { adminVenuesApi } from '../../../services/api';
import type { CreateVenuePayload } from '../../../services/adminVenuesApi';
import PageHeader from '../../../components/shared/PageHeader';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AddressAutocomplete from '../../../components/shared/AddressAutocomplete';
import type { AddressParts } from '../../../components/shared/AddressAutocomplete';

export default function VenueFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const { message } = App.useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const { data } = await adminVenuesApi.getById(id);
        form.setFieldsValue(data);
      } catch {
        message.error('Failed to load venue');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id, form, message]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload: CreateVenuePayload = {
        name: values.name,
        address: values.address,
        city: values.city,
        state: values.state,
        zipCode: values.zipCode,
        description: values.description,
        phone: values.phone,
        email: values.email,
        website: values.website,
      };
      if (isEdit && id) {
        await adminVenuesApi.update(id, payload);
        message.success('Venue updated');
      } else {
        await adminVenuesApi.create(payload);
        message.success('Venue created');
      }
      navigate('/admin/venues');
    } catch {
      message.error('Failed to save venue');
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
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <PageHeader title={isEdit ? 'Edit Venue' : 'Add Venue'} subtitle="Fill in the venue details" />
      <Card>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Address" rules={[{ required: true }]}>
            <AddressAutocomplete onSelect={handleAddressSelect} />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item name="city" label="City" rules={[{ required: true }]}><Input /></Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="state" label="State" rules={[{ required: true }]}><Input maxLength={2} /></Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="zipCode" label="ZIP Code" rules={[{ required: true }]}><Input /></Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item name="phone" label="Phone"><Input /></Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="email" label="Email"><Input type="email" /></Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="website" label="Website"><Input /></Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={saving}>{isEdit ? 'Update' : 'Create'}</Button>
              <Button onClick={() => navigate('/admin/venues')}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
