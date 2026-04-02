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
import {
  EditOutlined,
  AppstoreOutlined,
  InfoCircleOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  adminEventsApi,
  type CreateEventPayload,
} from '../../../services/adminEventsApi';
import { adminVenuesApi } from '../../../services/api';
import type { Venue } from '../../../types/venue';
import PageHeader from '../../../components/shared/PageHeader';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';

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
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    if (!id) return;
    const loadEvent = async () => {
      setLoading(true);
      try {
        const { data } = await adminEventsApi.getById(id);
        if (data.status !== 'Draft' && data.status !== 'Published') {
          message.warning('Only Draft and Published events can be edited');
          navigate(`/admin/events/${id}`);
          return;
        }
        form.setFieldsValue({
          title: data.title,
          description: data.description,
          category: data.category,
          dates: [dayjs(data.startDate), dayjs(data.endDate)],
          venueId: data.venueId,
          isFeatured: data.isFeatured,
          layoutMode: data.layoutMode,
          maxCapacity: data.maxCapacity,
        });
      } catch {
        message.error('Failed to load event for editing');
      } finally {
        setLoading(false);
      }
    };
    void loadEvent();
  }, [id, form, message, navigate]);

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
      if (isEditMode && id) {
        await adminEventsApi.update(id, payload);
        message.success('Event updated');
        navigate(`/admin/events/${id}`);
      } else {
        const { data } = await adminEventsApi.create(payload);
        message.success('Event created');
        navigate(`/admin/events/${data.id}`);
      }
    } catch {
      message.error(isEditMode ? 'Failed to update event' : 'Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <PageHeader
        title={isEditMode ? 'Edit Event' : 'Create Event'}
        subtitle={isEditMode ? 'Update event details' : 'Fill in the event details'}
      />

      {isEditMode && (
        <div className="edit-mode-banner">
          <EditOutlined />
          <span>Editing: <strong>{form.getFieldValue('title') || 'Event'}</strong></span>
          <Button
            size="small"
            onClick={() => navigate(`/admin/events/${id}`)}
            style={{ marginLeft: 'auto', borderRadius: 8 }}
          >
            Cancel
          </Button>
        </div>
      )}

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

          {/* Seating Layout Section */}
          <Form.Item shouldUpdate={(prev, curr) => prev.layoutMode !== curr.layoutMode}>
            {({ getFieldValue }) => {
              const mode = getFieldValue('layoutMode') as string | undefined;
              return (
                <div className="admin-section" style={{ marginTop: 0 }}>
                  <div className="admin-section-title">
                    <AppstoreOutlined />
                    Seating Layout
                  </div>

                  {(!mode || mode === 'None') && (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                      General Admission — no assigned seating.
                      <br />
                      <span style={{ fontSize: 12, opacity: 0.7 }}>Set Max Capacity above to limit attendance.</span>
                    </div>
                  )}

                  {mode === 'Grid' && (
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                        Table-based grid layout. After saving, use <strong>Manage Seating Layout</strong> to assign tables to grid positions.
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(124,58,237,0.06)', borderRadius: 10, border: '1px solid rgba(124,58,237,0.15)', fontSize: 13, color: 'var(--text-secondary)' }}>
                        <InfoCircleOutlined style={{ color: 'var(--accent-violet)' }} />
                        Tables are configured in the Layout Editor after event creation.
                      </div>
                    </div>
                  )}

                  {mode === 'Map' && (
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '10px 14px', background: 'rgba(124,58,237,0.06)', borderRadius: 10, border: '1px solid rgba(124,58,237,0.15)' }}>
                      <EnvironmentOutlined style={{ color: 'var(--accent-violet)', marginRight: 6 }} />
                      Map-based layout. Upload a venue map and place tables in the Layout Editor after saving.
                    </div>
                  )}
                </div>
              );
            }}
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={saving}
                style={{ flex: 1, minWidth: 120, borderRadius: 10, height: 44 }}
              >
                {isEditMode ? 'Save Changes' : 'Create Event'}
              </Button>
              <Button
                onClick={() => navigate(isEditMode ? `/admin/events/${id}` : '/admin/events')}
                style={{ borderRadius: 10, height: 44 }}
              >
                Cancel
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
