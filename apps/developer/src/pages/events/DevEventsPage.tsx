import { useEffect, useState } from 'react';
import { Button, Card, InputNumber, Modal, Spin, Tag, Typography } from 'antd';
import type { AxiosResponse } from 'axios';
import { DollarOutlined, UndoOutlined } from '@ant-design/icons';
import { developerApi } from '../../services/api';
import { usePagedTable } from '@code829/shared/hooks/usePagedTable';
import { useAsyncAction } from '@code829/shared/hooks';
import { centsToUSD } from '@code829/shared/utils/currency';
import { formatEventDate } from '@code829/shared/utils/date';
import type { DevEventListItem, EventFeeInfo } from '@code829/shared/services/developerApi';
import type { PagedResponse } from '@code829/shared/types/shared';
import HumanCard from '@code829/shared/components/shared/HumanCard';
import {
  DataTableSection,
  FilterBar,
  PageShell,
} from '@code829/shared/components/ui';
import { createLogger } from '@code829/shared/lib/logger';

const log = createLogger('Developer/EventsPage');

interface DevEventListParams extends Record<string, unknown> {
  search?: string;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'Published':
      return 'green';
    case 'Draft':
      return 'orange';
    case 'Cancelled':
      return 'red';
    case 'Completed':
      return 'default';
    default:
      return 'default';
  }
}

export default function DevEventsPage() {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const paged = usePagedTable<DevEventListItem, DevEventListParams>({
    fetcher: (params) =>
      developerApi.getEvents(params) as Promise<AxiosResponse<PagedResponse<DevEventListItem>>>,
    defaultPageSize: 20,
  });

  return (
    <PageShell
      title="Revenue & Fees"
      subtitle={[
        'Per-event platform commission and table surcharges.',
        'Overriding global defaults for special venue partnerships.',
        'Analyzing fee absorption across high-velocity events.',
      ]}
      rotateSubtitle
    >
      <FilterBar
        search={{
          placeholder: 'Search events by title...',
          onChange: (v) => paged.setFilters({ search: v }),
        }}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Tag color="purple" style={{ borderRadius: 6, fontWeight: 700, margin: 0 }}>
              All Events
            </Tag>
            <Tag color="default" style={{ borderRadius: 6, fontWeight: 700, margin: 0 }}>
              Has Custom Fee
            </Tag>
          </div>
        }
      />
      <DataTableSection<DevEventListItem>
        data={paged.data}
        total={paged.total}
        page={paged.page}
        pageSize={paged.pageSize}
        loading={paged.loading}
        onPageChange={paged.onPageChange}
        rowKey="id"
        scrollX={700}
        onRowClick={(record) => setSelectedEventId(record.id)}
        columns={[
          { title: 'Title', dataIndex: 'title', key: 'title', ellipsis: true },
          {
            title: 'Date',
            dataIndex: 'startDate',
            key: 'startDate',
            width: 180,
            render: (d: string) => formatEventDate(d),
          },
          {
            title: 'Type',
            dataIndex: 'layoutMode',
            key: 'layoutMode',
            width: 100,
            render: (m: string) => <Tag color={m === 'Open' ? 'blue' : 'purple'}>{m}</Tag>,
          },
          {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 110,
            render: (s: string) => <Tag color={getStatusColor(s)}>{s}</Tag>,
          },
          {
            title: '',
            key: 'action',
            width: 80,
            render: (_: unknown, record: DevEventListItem) => (
              <Button
                size="small"
                icon={<DollarOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEventId(record.id);
                }}
              >
                Edit
              </Button>
            ),
          },
        ]}
        mobileCard={(ev) => (
          <HumanCard className="human-noise hover-lift" style={{ cursor: 'pointer', padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{ev.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                  {formatEventDate(ev.startDate)}
                </div>
              </div>
              <Tag
                color={getStatusColor(ev.status)}
                style={{ margin: 0, borderRadius: 6, fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}
              >
                {ev.status}
              </Tag>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--bg-soft)',
                padding: 12,
                borderRadius: 12,
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Tag
                  color={ev.layoutMode === 'Open' ? 'blue' : 'purple'}
                  style={{ margin: 0, borderRadius: 4, fontWeight: 700, fontSize: 10 }}
                >
                  {ev.layoutMode}
                </Tag>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Mode</span>
              </div>
            </div>
          </HumanCard>
        )}
        empty={{
          title: 'No events found',
          description: 'Application event stream is quiet.',
          actionLabel: 'Clear Search',
          onAction: () => paged.setFilters({}),
        }}
      />

      {selectedEventId && (
        <FeeEditorModal
          eventId={selectedEventId}
          onClose={() => {
            setSelectedEventId(null);
            paged.refresh();
          }}
        />
      )}
    </PageShell>
  );
}

function FeeEditorModal({ eventId, onClose }: { eventId: string; onClose: () => void }) {
  const [feeInfo, setFeeInfo] = useState<EventFeeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [tableFees, setTableFees] = useState<Record<string, number | null>>({});
  const [ticketFees, setTicketFees] = useState<Record<string, number | null>>({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await developerApi.getEventFees(eventId);
        setFeeInfo(data);
        const tf: Record<string, number | null> = {};
        data.tableTypes.forEach((tt) => { tf[tt.id] = tt.platformFeeCents; });
        setTableFees(tf);
        const tkf: Record<string, number | null> = {};
        data.ticketTypes.forEach((tt) => { tkf[tt.id] = tt.platformFeeCents; });
        setTicketFees(tkf);
        log.info('Event fees loaded', { eventId, layoutMode: data.layoutMode });
      } catch (err) {
        log.error('Failed to load event fees', err);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [eventId]);

  const save = useAsyncAction(
    async () => {
      if (!feeInfo) return;
      if (feeInfo.layoutMode === 'Grid') {
        await developerApi.updateTableTypeFees(eventId, tableFees);
      } else {
        await developerApi.updateTicketTypeFees(eventId, ticketFees);
      }
      log.info('Platform fees saved', { eventId, layoutMode: feeInfo.layoutMode });
    },
    { successMessage: 'Platform fees updated', onSuccess: onClose },
  );

  const defaultLabel = feeInfo ? `Default: ${centsToUSD(feeInfo.defaultFeeCents)}` : '';

  return (
    <Modal
      open
      title={feeInfo?.title ?? 'Platform Fee'}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="save" type="primary" loading={save.loading} onClick={() => { void save.run(); }}>
          Save
        </Button>,
      ]}
      width={480}
    >
      {loading || !feeInfo ? (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <Spin />
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Tag color={feeInfo.layoutMode === 'Open' ? 'blue' : 'purple'}>{feeInfo.layoutMode} Seating</Tag>
            <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
              {defaultLabel}
            </Typography.Text>
          </div>

          {feeInfo.layoutMode === 'Open' && (
            <>
              <Card size="small" styles={{ body: { padding: '8px 12px' } }} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Ticket Price (set by admin)
                  </Typography.Text>
                  <Tag style={{ margin: 0 }}>
                    {feeInfo.pricePerPersonCents ? centsToUSD(feeInfo.pricePerPersonCents) : '—'} / person
                  </Tag>
                </div>
                {feeInfo.maxCapacity && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      Max Capacity
                    </Typography.Text>
                    <Typography.Text style={{ fontSize: 12 }}>{feeInfo.maxCapacity}</Typography.Text>
                  </div>
                )}
              </Card>

              {feeInfo.ticketTypes.length > 0 && (
                <>
                  <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                    Per Ticket Type Fees
                  </Typography.Text>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {feeInfo.ticketTypes.map((tt) => (
                      <Card key={tt.id} size="small" styles={{ body: { padding: '8px 12px' } }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Typography.Text strong style={{ fontSize: 13 }}>
                              {tt.label}
                            </Typography.Text>
                            {tt.isLocked && (
                              <Tag color="red" style={{ margin: 0, fontSize: 10 }}>
                                Locked
                              </Tag>
                            )}
                          </div>
                          <Tag style={{ margin: 0 }}>Price: {centsToUSD(tt.priceCents)}</Tag>
                        </div>
                        <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                          Platform Fee
                        </Typography.Text>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <InputNumber
                            value={ticketFees[tt.id] !== null && ticketFees[tt.id] !== undefined ? ticketFees[tt.id]! / 100 : null}
                            onChange={(v: number | null) =>
                              setTicketFees((prev) => ({
                                ...prev,
                                [tt.id]: v !== null ? Math.round(v * 100) : null,
                              }))
                            }
                            prefix="$"
                            min={0}
                            step={0.01}
                            precision={2}
                            placeholder={centsToUSD(feeInfo.defaultFeeCents)}
                            style={{ flex: 1 }}
                            disabled={tt.isLocked}
                          />
                          <Button
                            icon={<UndoOutlined />}
                            size="small"
                            onClick={() => setTicketFees((prev) => ({ ...prev, [tt.id]: null }))}
                            disabled={tt.isLocked || ticketFees[tt.id] === null || ticketFees[tt.id] === undefined}
                          >
                            Reset
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}

              {feeInfo.ticketTypes.length === 0 && (
                <Typography.Text type="secondary">No ticket types configured for this event.</Typography.Text>
              )}
            </>
          )}

          {feeInfo.layoutMode === 'Grid' && feeInfo.tableTypes.length > 0 && (
            <>
              <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                Per Table Type Fees
              </Typography.Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {feeInfo.tableTypes.map((tt) => (
                  <Card key={tt.id} size="small" styles={{ body: { padding: '8px 12px' } }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Typography.Text strong style={{ fontSize: 13 }}>
                          {tt.label}
                        </Typography.Text>
                        {tt.isLocked && (
                          <Tag color="red" style={{ margin: 0, fontSize: 10 }}>
                            Locked
                          </Tag>
                        )}
                      </div>
                      <Tag style={{ margin: 0 }}>Table Price: {centsToUSD(tt.priceCents)}</Tag>
                    </div>
                    <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                      Platform Fee
                    </Typography.Text>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <InputNumber
                        value={tableFees[tt.id] !== null && tableFees[tt.id] !== undefined ? tableFees[tt.id]! / 100 : null}
                        onChange={(v: number | null) =>
                          setTableFees((prev) => ({
                            ...prev,
                            [tt.id]: v !== null ? Math.round(v * 100) : null,
                          }))
                        }
                        prefix="$"
                        min={0}
                        step={0.01}
                        precision={2}
                        placeholder={centsToUSD(feeInfo.defaultFeeCents)}
                        style={{ flex: 1 }}
                        disabled={tt.isLocked}
                      />
                      <Button
                        icon={<UndoOutlined />}
                        size="small"
                        onClick={() => setTableFees((prev) => ({ ...prev, [tt.id]: null }))}
                        disabled={tt.isLocked || tableFees[tt.id] === null || tableFees[tt.id] === undefined}
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
