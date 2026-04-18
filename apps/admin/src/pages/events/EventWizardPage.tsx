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
  InfoCircleOutlined,
  PlusOutlined,
  MinusCircleOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { Typography } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { adminEventsApi, adminVenuesApi, imagesApi } from '../../services/api';
import type { CreateEventPayload } from '@code829/shared/services/adminEventsApi';
import type { Venue } from '@code829/shared/types/venue';
import type { ImageDto } from '@code829/shared/types/image';
import type { EventTableDto, EventTableTypeInfo } from '@code829/shared/types/event';
import LoadingSpinner from '@code829/shared/components/shared/LoadingSpinner';
import ImageUpload from '@code829/shared/components/shared/ImageUpload';
import {
  DisplayHeading,
  Kicker,
  SeatingModeCard,
  SeatingIconTables,
  SeatingIconOpen,
  Stepper,
  SoftCard,
} from '@code829/shared/components/ui';
import { FloorPlan, TierLegend } from '@code829/shared/components/floorplan';
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

const STEPS = [
  { key: 'details', label: 'Details' },
  { key: 'seating', label: 'Seating' },
] as const;

// Which form fields must be valid to leave a given step.
const STEP_FIELDS: Record<number, string[]> = {
  0: ['title', 'category', 'venueId', 'startDate', 'startTime', 'endDate', 'endTime'],
  1: [],
};

export default function EventWizardPage() {
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);
  const [form] = Form.useForm();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [eventLoaded, setEventLoaded] = useState(!isEditMode);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [layoutMode, setLayoutMode] = useState<'Grid' | 'Open'>('Grid');
  const [layoutLocked, setLayoutLocked] = useState(false);
  const [images, setImages] = useState<ImageDto[]>([]);
  const [existingTables] = useState<EventTableDto[]>([]);
  const [existingTiers, setExistingTiers] = useState<EventTableTypeInfo[]>([]);
  const [existingGrid, setExistingGrid] = useState<{ rows: number; cols: number }>({ rows: 8, cols: 10 });
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

        try {
          const { data: lockData } = await adminEventsApi.checkLayoutLocked(id);
          setLayoutLocked(lockData.locked);
        } catch (err) {
          log.error('Failed to check layout lock status', err);
        }

        try {
          const { data: imgs } = await imagesApi.getByEntity('event', id);
          setImages(imgs);
        } catch (err) {
          log.error('Failed to load event images', err);
        }

        if (mode === 'Grid' && data.tableTypes) {
          setExistingTiers(
            data.tableTypes.map((t) => ({
              id: t.id,
              label: t.label,
              capacity: t.capacity,
              shape: t.shape,
              color: t.color,
              priceCents: t.priceCents,
              displayPriceCents: t.displayPriceCents,
            })),
          );
        }
        if (data.gridRows && data.gridCols) {
          setExistingGrid({ rows: data.gridRows, cols: data.gridCols });
        }

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
          ticketTypes: data.ticketTypes?.map((tt) => ({
            id: tt.id,
            name: tt.label ? [tt.label] : [],
            price: centsToDollars(tt.priceCents),
            capacity: tt.maxQuantity,
            description: tt.description,
          })) || [],
        });
      } catch (err) {
        log.error('Failed to load event for editing', err);
        message.error('Failed to load event for editing');
        setEventLoaded(true);
      } finally {
        setEventLoaded(true);
        setLoading(false);
      }
    };
    void loadEvent();
  }, [id, form, message, navigate]);

  const handleSubmit = async () => {
    try {
      const fieldsToValidate = layoutMode === 'Grid'
        ? ['title', 'category', 'venueId', 'startDate', 'startTime', 'endDate', 'endTime']
        : undefined;
      const values = fieldsToValidate
        ? await form.validateFields(fieldsToValidate)
        : await form.validateFields();
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
        ticketTypes: layoutMode === 'Open' ? values.ticketTypes?.map((tt: { id?: string; name: string | string[]; price: number; capacity: number; description?: string }) => ({
          id: tt.id,
          name: Array.isArray(tt.name) ? tt.name[0] : tt.name,
          priceCents: Math.round(Number(tt.price) * 100),
          capacity: Number(tt.capacity),
          description: tt.description,
        })) : undefined,
      };

      if (layoutMode === 'Open' && payload.ticketTypes && payload.ticketTypes.length > 0) {
        payload.maxCapacity = payload.ticketTypes.reduce((acc, curr) => acc + (curr.capacity || 0), 0);
        if (payload.maxCapacity === 0) payload.maxCapacity = undefined;
      } else if (layoutMode === 'Open') {
        payload.maxCapacity = values.maxCapacity ? Number(values.maxCapacity) : undefined;
        payload.pricePerPersonCents = values.pricePerPerson ? Math.round(Number(values.pricePerPerson) * 100) : undefined;
      }
      if (isEditMode && id) {
        await adminEventsApi.update(id, payload);
        log.info('Event updated', { id });
        message.success('Event updated');
        setIsDirty(false);
        navigate(`/events/${id}`);
      } else {
        const { data } = await adminEventsApi.create(payload);
        log.info('Event created', { id: data.id, title: payload.title });
        message.success('Event created');
        setIsDirty(false);
        navigate(`/events/${data.id}`);
      }
    } catch (err) {
      log.error('Failed to save event', err);
      message.error(isEditMode ? 'Failed to update event' : 'Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    const fields = STEP_FIELDS[step] ?? [];
    if (fields.length) {
      try {
        await form.validateFields(fields);
      } catch {
        message.error('Please complete required fields before continuing');
        return;
      }
    }
    // Open seating: require at least one ticket tier before moving past the seating step
    if (step === 1 && layoutMode === 'Open') {
      const tiers = form.getFieldValue('ticketTypes') ?? [];
      if (tiers.length === 0) {
        message.error('Add at least one ticket tier before continuing');
        return;
      }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  if (loading) return <LoadingSpinner />;

  const showFloorPlanPreview = layoutMode === 'Grid' && isEditMode && existingTables.length > 0;
  const isLast = step === STEPS.length - 1;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
      <Kicker style={{ marginBottom: 8 }}>
        {isEditMode ? 'Edit event' : 'New event'}
      </Kicker>
      <DisplayHeading as="h1" size="lg" style={{ marginBottom: 20 }}>
        {isEditMode ? 'Edit event' : 'Create event'}
      </DisplayHeading>

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

      <Stepper steps={[...STEPS]} current={step} onSelect={setStep} />

      <Form form={form} layout="vertical" onFinish={handleSubmit} onValuesChange={() => setIsDirty(true)}>
        {/* ── Step 1: Details ─────────────────────────────────────── */}
        <div style={{ display: step === 0 ? 'block' : 'none' }}>
          <SoftCard padding={24}>
            <Form.Item name="title" label="Title" rules={[{ required: true }]}>
              <Input placeholder="Event title" />
            </Form.Item>
            <Form.Item name="description" label="Description">
              <Input.TextArea rows={4} placeholder="Event description" />
            </Form.Item>
            {isEditMode && id && (
              <Form.Item label="Event images">
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
                <Form.Item name="category" label="Category" rules={[{ required: true }]}>
                  <Select
                    options={categories.map((c) => ({ label: c, value: c }))}
                    placeholder="Select category"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="venueId" label="Venue" rules={[{ required: true }]}>
                  <Select
                    options={venues.map((v) => ({ label: v.name, value: v.id }))}
                    placeholder="Select venue"
                    showSearch
                    filterOption={(input, option) =>
                      (option?.label as string)?.toLowerCase().includes(input.toLowerCase()) ?? false
                    }
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={12} sm={6}>
                <Form.Item name="startDate" label="Start date" rules={[{ required: true, message: 'Required' }]}>
                  <DatePicker
                    format="MMM D, YYYY"
                    placeholder="Pick date"
                    style={{ width: '100%' }}
                    getPopupContainer={(trigger) => trigger.parentElement ?? document.body}
                  />
                </Form.Item>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Item name="startTime" label="Start time" rules={[{ required: true, message: 'Required' }]}>
                  <TimePicker
                    use12Hours
                    format="h:mm a"
                    placeholder="Pick time"
                    minuteStep={5}
                    needConfirm={false}
                    style={{ width: '100%' }}
                    getPopupContainer={(trigger) => trigger.parentElement ?? document.body}
                  />
                </Form.Item>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Item
                  name="endDate"
                  label="End date"
                  rules={[
                    { required: true, message: 'Required' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        const startDate = getFieldValue('startDate');
                        if (!value || !startDate) return Promise.resolve();
                        if (value.isBefore(startDate, 'day')) {
                          return Promise.reject(new Error('End date must be on or after start date'));
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                >
                  <DatePicker
                    format="MMM D, YYYY"
                    placeholder="Pick date"
                    style={{ width: '100%' }}
                    getPopupContainer={(trigger) => trigger.parentElement ?? document.body}
                  />
                </Form.Item>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Item
                  name="endTime"
                  label="End time"
                  rules={[
                    { required: true, message: 'Required' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        const startDate = getFieldValue('startDate');
                        const endDate = getFieldValue('endDate');
                        const startTime = getFieldValue('startTime');
                        if (!value || !startTime || !startDate || !endDate) return Promise.resolve();
                        const isSameDay = endDate.isSame(startDate, 'day');
                        if (isSameDay) {
                          const startMinutes = startTime.hour() * 60 + startTime.minute();
                          const endMinutes = value.hour() * 60 + value.minute();
                          if (endMinutes <= startMinutes) {
                            return Promise.reject(new Error('End time must be after start time'));
                          }
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                >
                  <TimePicker
                    use12Hours
                    format="h:mm a"
                    placeholder="Pick time"
                    minuteStep={5}
                    needConfirm={false}
                    style={{ width: '100%' }}
                    getPopupContainer={(trigger) => trigger.parentElement ?? document.body}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="isFeatured" label="Featured" valuePropName="checked">
              <Switch />
            </Form.Item>
          </SoftCard>
        </div>

        {/* ── Step 2: Seating ─────────────────────────────────────── */}
        <div style={{ display: step === 1 ? 'block' : 'none' }}>
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
            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 12 }}>
              Seating type cannot be changed — this event has active bookings or locked tables.
            </div>
          )}

          {layoutMode === 'Grid' && (
            <SoftCard tone="elevated" padding={18}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: 'var(--text-secondary)',
                  fontSize: 13,
                  marginBottom: showFloorPlanPreview ? 16 : 0,
                }}
              >
                <InfoCircleOutlined style={{ color: 'var(--primary)' }} />
                {isEditMode
                  ? 'Refine the floor plan in the Layout Editor. Price is set per table.'
                  : 'Configure tables in the Layout Editor after creation. Price is set per table.'}
                {isEditMode && id && (
                  <Button
                    size="small"
                    type="link"
                    onClick={() => navigate(`/layout/${id}`)}
                    style={{ marginLeft: 'auto' }}
                  >
                    Open editor →
                  </Button>
                )}
              </div>

              {showFloorPlanPreview && (
                <>
                  <TierLegend tiers={existingTiers} />
                  <div style={{ marginTop: 12 }}>
                    <FloorPlan
                      mode="display"
                      tables={existingTables}
                      tierTypes={existingTiers}
                      gridRows={existingGrid.rows}
                      gridCols={existingGrid.cols}
                    />
                  </div>
                </>
              )}
            </SoftCard>
          )}

          {layoutMode === 'Open' && (
            <SoftCard padding={20}>
              <Typography.Text strong style={{ display: 'block', marginBottom: 16, fontSize: 14 }}>
                Ticket tiers
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
                              label="Tier name"
                              rules={[
                                { required: true, message: 'Missing tier name' },
                                () => ({
                                  validator(_, value) {
                                    const nameVal = Array.isArray(value) ? value[0] : value;
                                    if (!nameVal) return Promise.resolve();
                                    const count = ticketTypes.filter((t: { name?: string | string[] }) =>
                                      (Array.isArray(t?.name) ? t.name[0] : t?.name) === nameVal,
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
                                ]}
                                mode="tags"
                                maxCount={1}
                                onSelect={() => {
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
                              <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="0.00" />
                            </Form.Item>
                          </Col>
                          <Col xs={12} sm={6}>
                            <Form.Item
                              {...restField}
                              name={[name, 'capacity']}
                              label="Capacity"
                              rules={[{ required: true, message: 'Qty required' }]}
                            >
                              <InputNumber min={1} style={{ width: '100%' }} placeholder="100" />
                            </Form.Item>
                          </Col>
                          <Col xs={24}>
                            <Form.Item
                              {...restField}
                              name={[name, 'description']}
                              label="Description (optional)"
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
                      Add ticket tier
                    </Button>
                  </>
                )}
              </Form.List>
              <div
                style={{
                  marginTop: 24,
                  padding: '12px 14px',
                  background: 'var(--bg-elevated)',
                  borderRadius: 10,
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  <InfoCircleOutlined style={{ marginRight: 6 }} />
                  Total capacity is the sum of all ticket tier capacities.
                </Typography.Text>
              </div>
            </SoftCard>
          )}
        </div>

        {/* ── Navigation ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
          {step > 0 && (
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              style={{ height: 44, borderRadius: 10 }}
            >
              Back
            </Button>
          )}
          <Button
            onClick={() => navigate(isEditMode ? `/events/${id}` : '/events')}
            style={{ height: 44, borderRadius: 10 }}
          >
            Cancel
          </Button>
          {isEditMode && isDirty && (
            <Button
              onClick={handleSubmit}
              loading={saving}
              disabled={!eventLoaded}
              style={{ height: 44, borderRadius: 10 }}
            >
              Save changes
            </Button>
          )}
          {!isLast ? (
            <Button
              type="primary"
              onClick={handleNext}
              icon={<ArrowRightOutlined />}
              iconPosition="end"
              style={{ height: 44, borderRadius: 10, marginLeft: 'auto' }}
            >
              Continue
            </Button>
          ) : (
            <Button
              type="primary"
              htmlType="submit"
              loading={saving}
              disabled={!eventLoaded}
              style={{ height: 44, borderRadius: 10, marginLeft: 'auto' }}
            >
              {isEditMode ? 'Save changes' : 'Create event'}
            </Button>
          )}
        </div>
      </Form>
    </div>
  );
}
