import { useEffect, useState, useCallback } from 'react';
import { Table, Tag, Card, InputNumber, Button, Spin, App, Pagination, Modal, Typography, Divider } from 'antd';
import { DollarOutlined, UndoOutlined } from '@ant-design/icons';
import { developerApi } from '../../../services/api';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { centsToUSD } from '../../../utils/currency';
import { formatEventDate } from '../../../utils/date';
import type { DevEventListItem, EventFeeInfo } from '../../../services/developerApi';
import type { PagedResponse } from '../../../types/shared';
import PageHeader from '../../../components/shared/PageHeader';

export default function DevEventsPage() {
  const isMobile = useIsMobile();
  const [events, setEvents] = useState<DevEventListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const { message } = App.useApp();

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await developerApi.getEvents({ page, pageSize: 20 });
      const paged = data as PagedResponse<DevEventListItem>;
      setEvents(paged.items);
      setTotal(paged.total);
    } catch {
      message.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [page, message]);

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
    { title: 'Status', dataIndex: 'status', key: 'status', width: 100 },
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
    <div>
      <PageHeader title="Platform Fees" subtitle="Manage per-event platform fees" />

      {isMobile ? (
        <Spin spinning={loading}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {events.map((ev) => (
              <Card
                key={ev.id}
                size="small"
                styles={{ body: { padding: 12 } }}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedEventId(ev.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>
                    {ev.title}
                  </span>
                  <Tag color={ev.layoutMode === 'Open' ? 'blue' : 'purple'}>{ev.layoutMode}</Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                  <span>{formatEventDate(ev.startDate)}</span>
                  <span style={{ fontWeight: 500, color: ev.platformFeeCents !== null ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {ev.platformFeeCents !== null ? centsToUSD(ev.platformFeeCents) : 'Default'}
                  </span>
                </div>
              </Card>
            ))}
            {events.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No events</div>
            )}
          </div>
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
            <Pagination current={page} pageSize={20} total={total} size="small" onChange={setPage} />
          </div>
        </Spin>
      ) : (
        <div className="responsive-table">
          <Table
            dataSource={events}
            columns={columns}
            rowKey="id"
            loading={loading}
            size="small"
            scroll={{ x: 700 }}
            pagination={{
              current: page, pageSize: 20, total,
              onChange: setPage,
            }}
          />
        </div>
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

          {/* Event-level fee */}
          <div style={{ marginBottom: 16 }}>
            <Typography.Text strong style={{ display: 'block', marginBottom: 4 }}>
              {feeInfo.layoutMode === 'Open' ? 'Event Platform Fee' : 'Default Event Fee'}
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
