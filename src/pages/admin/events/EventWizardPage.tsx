import { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  DatePicker,
  Switch,
  Button,
  Card,
  Row,
  Col,
  App,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  adminEventsApi,
  type CreateEventPayload,
} from '../../../services/adminEventsApi';
import { adminVenuesApi } from '../../../services/api';
import type { Venue } from '../../../types/venue';
import PageHeader from '../../../components/shared/PageHeader';

const categories = [
  'Music',
  'Sports',
  'Arts',
  'Food',
  'Technology',
  'Business',
  'Other',
];
const layoutModes = ['None', 'Grid', 'Map'];

export default function EventWizardPage() {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [venues, setVenues] = useState<Venue[]>([]);
  const { message } = App.useApp();
  const navigate = useNavigate();

  useEffect(() => {
    const loadVenues = async () => {
      try {
        const { data } = await adminVenuesApi.list(1, 100);
        setVenues(data.items);
      } catch {
        message.error('Failed to load venues');
      }
    };
    void loadVenues();
  }, [message]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload: CreateEventPayload = {
        title: values.title,
        description: values.description,
        category: values.category,
        startDate: values.dates[0].toISOString(),
        endDate: values.dates[1].toISOString(),
        venueId: values.venueId,
        isFeatured: values.isFeatured ?? false,
        layoutMode: values.layoutMode ?? 'None',
        maxCapacity: values.maxCapacity
          ? Number(values.maxCapacity)
          : undefined,
      };
      const { data } = await adminEventsApi.create(payload);
      message.success('Event created');
      navigate(`/admin/events/${data.id}`);
    } catch {
      message.error('Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <PageHeader title="Create Event" subtitle="Fill in the event details" />
      <Card>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true }]}
          >
            <Input placeholder="Event title" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={4} placeholder="Event description" />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true }]}
              >
                <Select
                  options={categories.map((c) => ({
                    label: c,
                    value: c,
                  }))}
                  placeholder="Select category"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="venueId"
                label="Venue"
                rules={[{ required: true }]}
              >
                <Select
                  options={venues.map((v) => ({
                    label: v.name,
                    value: v.id,
                  }))}
                  placeholder="Select venue"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase()) ?? false
                  }
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="dates"
            label="Date Range"
            rules={[{ required: true }]}
          >
            <DatePicker.RangePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item name="layoutMode" label="Layout Mode">
                <Select
                  options={layoutModes.map((m) => ({
                    label: m,
                    value: m,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="maxCapacity" label="Max Capacity">
                <Input type="number" placeholder="Optional" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="isFeatured"
                label="Featured"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>
              Create Event
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
