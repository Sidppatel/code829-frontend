import { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  Switch,
  Button,
  Card,
  Row,
  Col,
  InputNumber,
  App,
  Segmented,
} from 'antd';
import {
  EditOutlined,
  AppstoreOutlined,
  InfoCircleOutlined,
  TeamOutlined,
  DollarOutlined,
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

export default function EventWizardPage() {
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [layoutMode, setLayoutMode] = useState<'Grid' | 'Open'>('Grid');
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
        const mode = data.layoutMode === 'Open' ? 'Open' : 'Grid';
        setLayoutMode(mode);
        form.setFieldsValue({
          title: data.title,
          description: data.description,
          category: data.category,
          startDate: dayjs(data.startDate),
          startTime: dayjs(data.startDate),
          endDate: dayjs(data.endDate),
          endTime: dayjs(data.endDate),
          venueId: data.venueId,
          isFeatured: data.isFeatured,
          maxCapacity: data.maxCapacity,
          pricePerPerson: data.pricePerPersonCents != null
            ? data.pricePerPersonCents / 100
            : undefined,
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
      const startDt = values.startDate
        .hour(values.startTime.hour())
        .minute(values.startTime.minute())
        .second(0);
      const endDt = values.endDate
        .hour(values.endTime.hour())
        .minute(values.endTime.minute())
        .second(0);
      const payload: CreateEventPayload = {
        title: values.title,
        description: values.description,
        category: values.category,
        startDate: startDt.toISOString(),
        endDate: endDt.toISOString(),
        venueId: values.venueId,
        isFeatured: values.isFeatured ?? false,
        layoutMode,
        maxCapacity: layoutMode === 'Open' && values.maxCapacity
          ? Number(values.maxCapacity)
          : undefined,
        pricePerPersonCents: layoutMode === 'Open' && values.pricePerPerson != null
          ? Math.round(Number(values.pricePerPerson) * 100)
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
          <Row gutter={16}>
            <Col xs={12} sm={6}>
              <Form.Item
                name="startDate"
                label="Start Date"
                rules={[{ required: true, message: 'Required' }]}
              >
                <DatePicker
                  format="MMM D, YYYY"
                  placeholder="Pick date"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Item
                name="startTime"
                label="Start Time"
                rules={[{ required: true, message: 'Required' }]}
              >
                <TimePicker
                  use12Hours
                  format="h:mm a"
                  placeholder="Pick time"
                  minuteStep={5}
                  needConfirm={false}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Item
                name="endDate"
                label="End Date"
                rules={[{ required: true, message: 'Required' }]}
              >
                <DatePicker
                  format="MMM D, YYYY"
                  placeholder="Pick date"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Item
                name="endTime"
                label="End Time"
                rules={[{ required: true, message: 'Required' }]}
              >
                <TimePicker
                  use12Hours
                  format="h:mm a"
                  placeholder="Pick time"
                  minuteStep={5}
                  needConfirm={false}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="isFeatured"
                label="Featured"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          {/* Seating Type Toggle */}
          <div className="admin-section" style={{ marginTop: 0 }}>
            <div className="admin-section-title">
              <AppstoreOutlined />
              Seating Type
            </div>

            <Segmented
              block
              size="large"
              value={layoutMode}
              onChange={(val) => setLayoutMode(val as 'Grid' | 'Open')}
              options={[
                {
                  label: (
                    <div style={{ padding: '8px 0' }}>
                      <AppstoreOutlined style={{ fontSize: 20, display: 'block', marginBottom: 4 }} />
                      <div style={{ fontWeight: 600 }}>Table Seating</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Grid Layout</div>
                    </div>
                  ),
                  value: 'Grid',
                },
                {
                  label: (
                    <div style={{ padding: '8px 0' }}>
                      <TeamOutlined style={{ fontSize: 20, display: 'block', marginBottom: 4 }} />
                      <div style={{ fontWeight: 600 }}>Open Seating</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Capacity Based</div>
                    </div>
                  ),
                  value: 'Open',
                },
              ]}
              style={{ marginBottom: 16 }}
            />

            {layoutMode === 'Grid' && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 14px',
                background: 'var(--bg-elevated, rgba(124,58,237,0.06))',
                borderRadius: 10,
                border: '1px solid var(--border-light, rgba(124,58,237,0.15))',
                fontSize: 13,
                color: 'var(--text-secondary)',
              }}>
                <InfoCircleOutlined style={{ color: 'var(--accent-violet)' }} />
                Configure tables in the Layout Editor after creation. Price is set per table.
              </div>
            )}

            {layoutMode === 'Open' && (
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="maxCapacity"
                    label="Max Capacity"
                    rules={[{ required: true, message: 'Required for open seating' }]}
                  >
                    <InputNumber
                      min={1}
                      style={{ width: '100%' }}
                      placeholder="Total number of people"
                      prefix={<TeamOutlined />}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="pricePerPerson"
                    label="Price Per Person ($)"
                    rules={[{ required: true, message: 'Required for open seating' }]}
                  >
                    <InputNumber
                      min={0}
                      step={0.01}
                      precision={2}
                      style={{ width: '100%' }}
                      placeholder="0.00"
                      prefix={<DollarOutlined />}
                    />
                  </Form.Item>
                </Col>
              </Row>
            )}
          </div>

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
