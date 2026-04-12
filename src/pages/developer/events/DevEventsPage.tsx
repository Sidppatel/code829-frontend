import { useEffect, useState, useCallback } from 'react';
import { Table, Tag, Card, InputNumber, Button, Spin, App, Pagination, Modal, Typography, Divider, Input } from 'antd';
import { DollarOutlined, UndoOutlined, SearchOutlined } from '@ant-design/icons';
import { developerApi } from '../../../services/api';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { centsToUSD } from '../../../utils/currency';
import { formatEventDate } from '../../../utils/date';
import type { DevEventListItem, EventFeeInfo } from '../../../services/developerApi';
import type { PagedResponse } from '../../../types/shared';
import PageHeader from '../../../components/shared/PageHeader';
import HumanCard from '../../../components/shared/HumanCard';
import EmptyState from '../../../components/shared/EmptyState';

function getStatusColor(status: string): string {
  switch (status) {
    case 'Published': return 'green';
    case 'Draft': return 'orange';
    case 'Cancelled': return 'red';
    case 'Completed': return 'default';
    default: return 'default';
  }
}

export default function DevEventsPage() {
  const isMobile = useIsMobile();
  const [events, setEvents] = useState<DevEventListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const { message } = App.useApp();

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await developerApi.getEvents({ page, pageSize: 20, search: search || undefined });
      const paged = data as PagedResponse<DevEventListItem>;
      setEvents(paged.items);
      setTotal(paged.totalCount);
    } catch {
      message.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [page, search, message]);

  useEffect(() => { void loadEvents(); }, [loadEvents]);

  const columns = [
    { title: 'Title', dataIndex: 'title', key: 'title', ellipsis: true },
    {
      title: 'Date', dataIndex: 'startDate', key: 'startDate', width: 180,
      render: (d: string) => formatEventDate(d),
    },
    {
      title: 'Type', dataIndex: 'layoutMode', key: 'layoutMode', width: 100,
      render: (m: string) => <Tag color={m === 'Open' ? 'blue' : 'purple'}>{m}</Tag>,
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 110,
      render: (s: string) => <Tag color={getStatusColor(s)}>{s}</Tag>,
    },
    {
      title: 'Fee', key: 'fee', width: 120,
      render: (_: unknown, record: DevEventListItem) => (
        <span style={{ color: record.platformFeeCents !== null ? 'var(--text-primary)' : 'var(--text-muted)' }}>
          {record.platformFeeCents !== null ? centsToUSD(record.platformFeeCents) : 'Default'}
        </span>
      ),
    },
    {
      title: '', key: 'action', width: 80,
      render: (_: unknown, record: DevEventListItem) => (
        <Button size="small" icon={<DollarOutlined />} onClick={() => setSelectedEventId(record.id)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="spring-up">
      <PageHeader 
        title="Revenue & Fees" 
        subtitle={[
          "Per-event platform commission and table surcharges.",
          "Overriding global defaults for special venue partnerships.",
          "Analyzing fee absorption across high-velocity events."
        ]}
        rotateSubtitle
      />

      <div style={{ 
        display: 'flex', 
        gap: 16, 
        marginBottom: 32, 
        flexWrap: 'wrap', 
        alignItems: 'center',
        background: 'var(--bg-surface)',
        padding: '12px 20px',
        borderRadius: 'var(--radius-full)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <Input
          placeholder="Search events by title..."
          prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
          variant="borderless"
          allowClear
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ flex: 1, minWidth: 260, height: 32, fontSize: 13 }}
        />
        <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 8px' }} />
        <div style={{ display: 'flex', gap: 8 }}>
            <Tag color="purple" style={{ borderRadius: 6, fontWeight: 700, margin: 0 }}>All Events</Tag>
            <Tag color="default" style={{ borderRadius: 6, fontWeight: 700, margin: 0 }}>Has Custom Fee</Tag>
        </div>
      </div>

      {isMobile ? (
        <Spin spinning={loading}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {events.map((ev) => (
              <HumanCard
                key={ev.id}
                className="human-noise"
                onClick={() => setSelectedEventId(ev.id)}
                style={{ cursor: 'pointer', padding: 16 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{ev.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{formatEventDate(ev.startDate)}</div>
                  </div>
                  <Tag color={getStatusColor(ev.status)} style={{ margin: 0, borderRadius: 6, fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}>
                    {ev.status}
                  </Tag>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-soft)', padding: 12, borderRadius: 12, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Tag color={ev.layoutMode === 'Open' ? 'blue' : 'purple'} style={{ margin: 0, borderRadius: 4, fontWeight: 700, fontSize: 10 }}>{ev.layoutMode}</Tag>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Mode</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fee</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: ev.platformFeeCents !== null ? 'var(--primary)' : 'var(--text-muted)' }}>
                      {ev.platformFeeCents !== null ? centsToUSD(ev.platformFeeCents) : 'Auto'}
                    </div>
                  </div>
                </div>
              </HumanCard>
            ))}
            {events.length === 0 && !loading && (
              <EmptyState title="No events found" description="Application event stream is quiet." actionLabel="Clear Search" onAction={() => { setSearch(''); setPage(1); }} />
            )}
          </div>
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
            <Pagination current={page} pageSize={20} total={total} size="small" onChange={setPage} className="human-pagination" />
          </div>
        </Spin>
      ) : (
        <HumanCard>
          <div className="responsive-table">
            <Table
              dataSource={events}
              columns={columns}
              rowKey="id"
              loading={loading}
              size="middle"
              scroll={{ x: 700 }}
              pagination={{
                current: page, pageSize: 20, total,
                onChange: setPage,
                className: 'human-pagination'
              }}
              onRow={(record) => ({ onClick: () => setSelectedEventId(record.id), style: { cursor: 'pointer' } })}
            />
          </div>
        </HumanCard>
      )}

      {selectedEventId && (
        <FeeEditorModal
          eventId={selectedEventId}
          onClose={() => { setSelectedEventId(null); void loadEvents(); }}
        />
      )}
    </div>
  );
}

function FeeEditorModal({ eventId, onClose }: { eventId: string; onClose: () => void }) {
  const [feeInfo, setFeeInfo] = useState<EventFeeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [eventFee, setEventFee] = useState<number | null>(null);
  const [tableFees, setTableFees] = useState<Record<string, number | null>>({});
  const { message } = App.useApp();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await developerApi.getEventFees(eventId);
        setFeeInfo(data);
        setEventFee(data.platformFeeCents);
        const tf: Record<string, number | null> = {};
        data.tableTypes.forEach((tt) => { tf[tt.id] = tt.platformFeeCents; });
        setTableFees(tf);
      } catch {
        message.error('Failed to load fee info');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [eventId, message]);

  const handleSave = async () => {
    if (!feeInfo) return;
    setSaving(true);
    try {
      if (feeInfo.layoutMode === 'Open') {
        await developerApi.updateEventFee(eventId, eventFee);
      } else {
        await developerApi.updateEventFee(eventId, eventFee);
        await developerApi.updateTableTypeFees(eventId, tableFees);
      }
      message.success('Platform fees updated');
      onClose();
    } catch {
      message.error('Failed to update fees');
    } finally {
      setSaving(false);
    }
  };

  const defaultLabel = feeInfo ? `Default: ${centsToUSD(feeInfo.defaultFeeCents)}` : '';

  return (
    <Modal
      open
      title={feeInfo?.title ?? 'Platform Fee'}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>Cancel</Button>,
        <Button key="save" type="primary" loading={saving} onClick={handleSave}>Save</Button>,
      ]}
      width={480}
    >
      {loading || !feeInfo ? (
        <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>
      ) : (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Tag color={feeInfo.layoutMode === 'Open' ? 'blue' : 'purple'}>{feeInfo.layoutMode} Seating</Tag>
            <Typography.Text type="secondary" style={{ marginLeft: 8 }}>{defaultLabel}</Typography.Text>
          </div>

          {/* Open seating: show read-only pricing info */}
          {feeInfo.layoutMode === 'Open' && (
            <Card size="small" styles={{ body: { padding: '8px 12px' } }} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>Ticket Price (set by admin)</Typography.Text>
                <Tag style={{ margin: 0 }}>{feeInfo.pricePerPersonCents ? centsToUSD(feeInfo.pricePerPersonCents) : '—'} / person</Tag>
              </div>
              {feeInfo.maxCapacity && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>Max Capacity</Typography.Text>
                  <Typography.Text style={{ fontSize: 12 }}>{feeInfo.maxCapacity}</Typography.Text>
                </div>
              )}
            </Card>
          )}

          {/* Event-level fee */}
          <div style={{ marginBottom: 16 }}>
            <Typography.Text strong style={{ display: 'block', marginBottom: 4 }}>
              {feeInfo.layoutMode === 'Open' ? 'Platform Fee' : 'Default Event Fee'}
            </Typography.Text>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <InputNumber
                value={eventFee !== null ? eventFee / 100 : null}
                onChange={(v: number | null) => setEventFee(v !== null ? Math.round(v * 100) : null)}
                prefix="$"
                min={0}
                step={0.01}
                precision={2}
                placeholder={centsToUSD(feeInfo.defaultFeeCents)}
                style={{ flex: 1 }}
              />
              <Button
                icon={<UndoOutlined />}
                size="small"
                onClick={() => setEventFee(null)}
                disabled={eventFee === null}
              >
                Reset
              </Button>
            </div>
            {eventFee === null && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Using global default: {centsToUSD(feeInfo.defaultFeeCents)}
              </Typography.Text>
            )}
          </div>

          {/* Table type fees (Grid only) */}
          {feeInfo.layoutMode === 'Grid' && feeInfo.tableTypes.length > 0 && (
            <>
              <Divider style={{ margin: '12px 0' }} />
              <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                Per Table Type Fees
              </Typography.Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {feeInfo.tableTypes.map((tt) => (
                  <Card key={tt.id} size="small" styles={{ body: { padding: '8px 12px' } }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Typography.Text strong style={{ fontSize: 13 }}>{tt.label}</Typography.Text>
                      <Tag style={{ margin: 0 }}>Table Price: {centsToUSD(tt.priceCents)}</Tag>
                    </div>
                    <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                      Platform Fee
                    </Typography.Text>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <InputNumber
                        value={tableFees[tt.id] !== null && tableFees[tt.id] !== undefined ? tableFees[tt.id]! / 100 : null}
                        onChange={(v: number | null) => setTableFees((prev) => ({
                          ...prev,
                          [tt.id]: v !== null ? Math.round(v * 100) : null,
                        }))}
                        prefix="$"
                        min={0}
                        step={0.01}
                        precision={2}
                        placeholder={centsToUSD(eventFee ?? feeInfo.defaultFeeCents)}
                        style={{ flex: 1 }}
                      />
                      <Button
                        icon={<UndoOutlined />}
                        size="small"
                        onClick={() => setTableFees((prev) => ({ ...prev, [tt.id]: null }))}
                        disabled={tableFees[tt.id] === null || tableFees[tt.id] === undefined}
                      >
                        Reset
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}

          {feeInfo.layoutMode === 'Grid' && feeInfo.tableTypes.length === 0 && (
            <Typography.Text type="secondary">No table types configured for this event.</Typography.Text>
          )}
        </div>
      )}
    </Modal>
  );
}
