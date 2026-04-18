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
} from 'antd';
import {
  EditOutlined,
  AppstoreOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import { Typography } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { adminEventsApi, adminVenuesApi, imagesApi } from '../../services/api';
import type { CreateEventPayload } from '@code829/shared/services/adminEventsApi';
import type { Venue } from '@code829/shared/types/venue';
import type { ImageDto } from '@code829/shared/types/image';
import PageHeader from '@code829/shared/components/shared/PageHeader';
import LoadingSpinner from '@code829/shared/components/shared/LoadingSpinner';
import ImageUpload from '@code829/shared/components/shared/ImageUpload';
import { createLogger } from '@code829/shared/lib/logger';
import { centsToDollars } from '@code829/shared/utils/currency';

const log = createLogger('Admin/EventWizardPage');

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
  const [layoutLocked, setLayoutLocked] = useState(false);
  const [images, setImages] = useState<ImageDto[]>([]);
  const { message } = App.useApp();
  const navigate = useNavigate();
  const ticketTypes = Form.useWatch('ticketTypes', form) || [];

  useEffect(() => {
    const loadVenues = async () => {
      try {
        const { data } = await adminVenuesApi.list(1, 100);
        setVenues(data.items);
        log.info('Venues loaded for picker', { count: data.items.length });
      } catch (err) {
        log.error('Failed to load venues', err);
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
          navigate(`/events/${id}`);
          return;
        }
        const mode = data.layoutMode === 'Open' ? 'Open' : 'Grid';
        setLayoutMode(mode);

        // Check if layout mode is locked (has active bookings or table locks)
        try {
          const { data: lockData } = await adminEventsApi.checkLayoutLocked(id);
          setLayoutLocked(lockData.locked);
        } catch (err) {
          log.error('Failed to check layout lock status', err);
        }

        try {
          const { data: imgs } = await imagesApi.getByEntity('event', id);
          setImages(imgs);
        } catch (err) { log.error('Failed to load event images', err); }

        log.info('Event loaded for editing', { id, status: data.status, layoutMode: mode });
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
            ? centsToDollars(data.pricePerPersonCents)
            : undefined,
          ticketTypes: data.ticketTypes?.map(tt => ({
            ...tt,
            name: (tt as any).label ? [(tt as any).label] : [],
            price: centsToDollars((tt as any).priceCents),
            capacity: (tt as any).maxQuantity
          })) || []
        });
      } catch (err) {
        log.error('Failed to load event for editing', err);
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
        ticketTypes: layoutMode === 'Open' ? values.ticketTypes?.map((tt: any) => ({
          id: tt.id,
          name: Array.isArray(tt.name) ? tt.name[0] : tt.name,
          priceCents: Math.round(Number(tt.price) * 100),
          capacity: Number(tt.capacity),
          description: tt.description
        })) : undefined
      };

      // For Open mode, max capacity is sum of ticket types
      if (layoutMode === 'Open' && payload.ticketTypes && payload.ticketTypes.length > 0) {
        payload.maxCapacity = payload.ticketTypes.reduce((acc, curr) => acc + (curr.capacity || 0), 0);
        // If the sum is 0, set to null to avoid DB constraint violation (CK_events_MaxCapacity > 0)
        if (payload.maxCapacity === 0) payload.maxCapacity = undefined;
      } else if (layoutMode === 'Open') {
        payload.maxCapacity = values.maxCapacity ? Number(values.maxCapacity) : undefined;
        payload.pricePerPersonCents = values.pricePerPerson ? Math.round(Number(values.pricePerPerson) * 100) : undefined;
      }
      if (isEditMode && id) {
        await adminEventsApi.update(id, payload);
        log.info('Event updated', { id });
        message.success('Event updated');
        navigate(`/events/${id}`);
      } else {
        const { data } = await adminEventsApi.create(payload);
        log.info('Event created', { id: data.id, title: payload.title });
        message.success('Event created');
        navigate(`/events/${data.id}`);
      }
    } catch (err) {
      log.error('Failed to save event', err);
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
            onClick={() => navigate(`/events/${id}`)}
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
          {isEditMode && id && (
            <Form.Item label="Event Images">
              <ImageUpload
                entityType="event"
                entityId={id}
                images={images}
                onImagesChange={setImages}
              />
            </Form.Item>
          )}
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

          {/* Seating Type Toggle — Tables vs Open selectable cards (design handoff pattern) */}
          <div className="admin-section" style={{ marginTop: 0 }}>
            <div className="admin-section-title">
              <AppstoreOutlined />
              Seating type
            </div>

            <Row gutter={[14, 14]} style={{ marginBottom: 16 }}>
              <Col xs={24} sm={12}>
                <SeatingModeCard
                  active={layoutMode === 'Grid'}
                  disabled={layoutLocked}
                  onClick={() => !layoutLocked && setLayoutMode('Grid')}
                  title="Tables"
                  subtitle="Assigned seating with table-level pricing tiers. Guests pick a specific table."
                  icon={<SeatingIconTables active={layoutMode === 'Grid'} />}
                  meta="Grid-based floor plan · per-table price"
                />
              </Col>
              <Col xs={24} sm={12}>
                <SeatingModeCard
                  active={layoutMode === 'Open'}
                  disabled={layoutLocked}
                  onClick={() => !layoutLocked && setLayoutMode('Open')}
                  title="Open"
                  subtitle="General admission. Sell by ticket tier with no fixed assignments."
                  icon={<SeatingIconOpen active={layoutMode === 'Open'} />}
                  meta="Ticket tiers · capacity-based"
                />
              </Col>
            </Row>

            {layoutLocked && (
              <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: -4, marginBottom: 12 }}>
                Seating type cannot be changed — this event has active bookings or locked tables.
              </div>
            )}

            {layoutMode === 'Grid' && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 14px',
                background: 'var(--bg-elevated)',
                borderRadius: 10,
                border: '1px solid var(--border)',
                fontSize: 13,
                color: 'var(--text-secondary)',
              }}>
                <InfoCircleOutlined style={{ color: 'var(--accent-violet)' }} />
                Configure tables in the Layout Editor after creation. Price is set per table.
              </div>
            )}

            {layoutMode === 'Open' && (
              <div style={{ marginTop: 24 }}>
                <Typography.Text strong style={{ display: 'block', marginBottom: 16, fontSize: 14 }}>
                  Ticket Tiers
                </Typography.Text>
                
                <Form.List name="ticketTypes">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <Card 
                          key={key} 
                          size="small" 
                          style={{ marginBottom: 16, background: 'var(--bg-soft)', border: '1px solid var(--border)' }}
                          extra={
                            <Button 
                              type="text" 
                              danger 
                              icon={<MinusCircleOutlined />} 
                              onClick={() => remove(name)}
                            >
                              Remove
                            </Button>
                          }
                        >
                          <Form.Item {...restField} name={[name, 'id']} hidden>
                            <Input />
                          </Form.Item>
                          <Row gutter={16}>
                            <Col xs={24} sm={12}>
                              <Form.Item
                                {...restField}
                                name={[name, 'name']}
                                label="Tier Name"
                                rules={[
                                  { required: true, message: 'Missing tier name' },
                                  () => ({
                                    validator(_, value) {
                                      const nameVal = Array.isArray(value) ? value[0] : value;
                                      if (!nameVal) return Promise.resolve();
                                      const count = ticketTypes.filter((t: any) => 
                                        (Array.isArray(t?.name) ? t.name[0] : t?.name) === nameVal
                                      ).length;
                                      if (count > 1) {
                                        return Promise.reject(new Error('This tier name is already used'));
                                      }
                                      return Promise.resolve();
                                    },
                                  }),
                                ]}
                              >
                                <Select
                                  showSearch
                                  placeholder="Select or type..."
                                  options={[
                                    { value: 'General', label: 'General' },
                                    { value: 'VIP', label: 'VIP' },
                                  ].map(opt => ({
                                    ...opt,
                                    disabled: ticketTypes.some((t: any) => 
                                      (Array.isArray(t?.name) ? t.name[0] : t?.name) === opt.value && 
                                      (Array.isArray(ticketTypes[name]?.name) ? ticketTypes[name].name[0] : ticketTypes[name]?.name) !== opt.value
                                    )
                                  }))}
                                  // This allows custom text entry in Ant Design Select
                                  mode="tags"
                                  maxCount={1}
                                  onSelect={() => {
                                    // Force dropdown to close after selection
                                    setTimeout(() => {
                                      (document.activeElement as HTMLElement)?.blur();
                                    }, 0);
                                  }}
                                />
                              </Form.Item>
                            </Col>
                            <Col xs={12} sm={6}>
                              <Form.Item
                                {...restField}
                                name={[name, 'price']}
                                label="Price ($)"
                                rules={[{ required: true, message: 'Price required' }]}
                              >
                                <InputNumber
                                  min={0}
                                  precision={2}
                                  style={{ width: '100%' }}
                                  placeholder="0.00"
                                />
                              </Form.Item>
                            </Col>
                            <Col xs={12} sm={6}>
                              <Form.Item
                                {...restField}
                                name={[name, 'capacity']}
                                label="Capacity"
                                rules={[{ required: true, message: 'Qty required' }]}
                              >
                                <InputNumber
                                  min={1}
                                  style={{ width: '100%' }}
                                  placeholder="100"
                                />
                              </Form.Item>
                            </Col>
                            <Col xs={24}>
                              <Form.Item
                                {...restField}
                                name={[name, 'description']}
                                label="Description (Optional)"
                                style={{ marginBottom: 0 }}
                              >
                                <Input placeholder="e.g. Includes one free drink" />
                              </Form.Item>
                            </Col>
                          </Row>
                        </Card>
                      ))}
                      <Button
                        type="dashed"
                        onClick={() => add()}
                        block
                        icon={<PlusOutlined />}
                        style={{ height: 44, borderRadius: 10 }}
                      >
                        Add Ticket Tier
                      </Button>
                    </>
                  )}
                </Form.List>

                {/* Legacy Fallback / Single Price support if needed */}
                <div style={{ marginTop: 24, padding: '16px', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--border-light)' }}>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    <InfoCircleOutlined style={{ marginRight: 6 }} />
                    Total capacity is automatically calculated as the sum of all ticket tiers.
                  </Typography.Text>
                </div>
              </div>
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
                onClick={() => navigate(isEditMode ? `/events/${id}` : '/events')}
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

// ── Seating mode selectable card (design handoff) ─────────────────
interface SeatingModeCardProps {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  meta: string;
}

function SeatingModeCard({
  active,
  disabled,
  onClick,
  title,
  subtitle,
  icon,
  meta,
}: SeatingModeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        textAlign: 'left',
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: 18,
        border: 'none',
        borderRadius: 'var(--radius-lg)',
        background: active ? 'var(--primary-soft)' : 'var(--bg-soft)',
        outline: active ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
        outlineOffset: active ? -2 : -1,
        display: 'flex',
        gap: 16,
        alignItems: 'flex-start',
        opacity: disabled ? 0.55 : 1,
        transition: 'background 0.18s var(--ease-human), outline-color 0.18s var(--ease-human)',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 'var(--radius-md)',
          flexShrink: 0,
          background: active ? 'var(--bg-surface)' : 'var(--bg-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            {title}
          </div>
          {active && (
            <span
              style={{
                fontSize: 10,
                padding: '2px 8px',
                borderRadius: 99,
                background: 'var(--primary)',
                color: 'var(--text-on-brand)',
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              Selected
            </span>
          )}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 8 }}>
          {subtitle}
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            fontWeight: 600,
            letterSpacing: 0.5,
          }}
        >
          {meta}
        </div>
      </div>
    </button>
  );
}

function SeatingIconTables({ active }: { active: boolean }) {
  const c = active ? 'var(--primary)' : 'var(--text-muted)';
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <circle cx="8" cy="8" r="3.5" stroke={c} strokeWidth="1.6" />
      <circle cx="24" cy="8" r="3.5" stroke={c} strokeWidth="1.6" />
      <circle cx="8" cy="24" r="3.5" stroke={c} strokeWidth="1.6" />
      <circle cx="24" cy="24" r="3.5" stroke={c} strokeWidth="1.6" />
      <circle cx="16" cy="16" r="3.5" fill={c} opacity="0.25" />
      <circle cx="16" cy="16" r="3.5" stroke={c} strokeWidth="1.6" />
    </svg>
  );
}

function SeatingIconOpen({ active }: { active: boolean }) {
  const c = active ? 'var(--primary)' : 'var(--text-muted)';
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect x="3" y="6" width="26" height="5" rx="1.5" stroke={c} strokeWidth="1.6" />
      <rect x="3" y="13.5" width="26" height="5" rx="1.5" stroke={c} strokeWidth="1.6" fill={c} fillOpacity="0.25" />
      <rect x="3" y="21" width="26" height="5" rx="1.5" stroke={c} strokeWidth="1.6" />
    </svg>
  );
}
