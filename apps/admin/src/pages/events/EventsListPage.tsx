import { Button, Tag, Tooltip } from 'antd';
import {
  EnvironmentOutlined,
  MoreOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { adminEventsApi } from '../../services/api';
import { usePagedTable } from '@code829/shared/hooks/usePagedTable';
import { useIsMobile } from '@code829/shared/hooks/useIsMobile';
import { formatEventDate } from '@code829/shared/utils/date';
import type { EventDetail } from '@code829/shared/types/event';
import type { AdminEventListParams } from '@code829/shared/services/adminEventsApi';
import HumanCard from '@code829/shared/components/shared/HumanCard';
import {
  DataTableSection,
  FilterBar,
  PageShell,
} from '@code829/shared/components/ui';
import { createLogger } from '@code829/shared/lib/logger';
import { EVENT_STATUS_COLORS } from '@code829/shared/theme/statusColors';

const log = createLogger('Admin/EventsListPage');

const STATUS_FILTERS: EventDetail['status'][] = ['Draft', 'Published', 'SoldOut', 'Completed'];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  Draft: { label: 'Draft', color: EVENT_STATUS_COLORS.Draft },
  Published: { label: 'Published', color: EVENT_STATUS_COLORS.Published },
  SoldOut: { label: 'Sold Out', color: EVENT_STATUS_COLORS.SoldOut },
  Cancelled: { label: 'Cancelled', color: EVENT_STATUS_COLORS.Cancelled },
  Completed: { label: 'Completed', color: EVENT_STATUS_COLORS.Completed },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, color: 'var(--status-neutral)' };
  const isPulse = status === 'Published';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 99,
        background: `${s.color}15`,
        color: s.color,
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
      }}
    >
      <div
        style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }}
        className={isPulse ? 'pulse-soft' : ''}
      />
      {s.label}
    </div>
  );
}

export default function EventsListPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const paged = usePagedTable<EventDetail, AdminEventListParams>({
    fetcher: adminEventsApi.list,
    defaultPageSize: 12,
  });

  return (
    <PageShell
      title="Events"
      documentTitle="Events - Code829 Admin"
      subtitle={[
        'Design unforgettable nights for your guests.',
        'Track ticket sales and check-in progress in real-time.',
        'Manage your events with ease.',
      ]}
      rotateSubtitle
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/events/new')}
          style={{
            borderRadius: 'var(--radius-full)',
            height: isMobile ? 40 : 48,
            padding: isMobile ? '0 20px' : '0 32px',
            fontWeight: 700,
            boxShadow: 'var(--shadow-md)',
          }}
        >
          Create Event
        </Button>
      }
    >
      <FilterBar
        search={{
          placeholder: 'Search by title...',
          onChange: (v) => {
            paged.setFilters({ search: v });
            if (v) log.info('Search events', { search: v });
          },
        }}
        chips={STATUS_FILTERS.map((status) => ({
          key: status,
          label: STATUS_MAP[status]?.label ?? status,
          active: paged.filters.status === status,
          onClick: () => {
            log.info('Filter by status', { status });
            paged.setFilters({ status: paged.filters.status === status ? undefined : status });
          },
          dot: STATUS_MAP[status]?.color,
        }))}
      />
      <DataTableSection<EventDetail>
        data={paged.data}
        total={paged.total}
        page={paged.page}
        pageSize={paged.pageSize}
        loading={paged.loading}
        onPageChange={paged.onPageChange}
        rowKey="eventId"
        scrollX={700}
        onRowClick={(record) => navigate(`/events/${record.eventId}`)}
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
            title: 'Venue',
            dataIndex: 'venueName',
            key: 'venueName',
            width: 200,
            ellipsis: true,
            render: (v: string, record: EventDetail) => v || record.venue?.name || 'Virtual',
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
            width: 130,
            render: (s: string) => <StatusBadge status={s} />,
          },
          {
            title: 'Sales',
            key: 'sales',
            width: 100,
            render: (_: unknown, r: EventDetail) =>
              r.layoutMode === 'Grid'
                ? `${r.bookedTables || 0} / ${r.totalTables || '∞'}`
                : `${r.totalSold || 0} / ${r.totalCapacity || '∞'}`,
          },
          {
            title: 'Check-ins',
            dataIndex: 'checkInCount',
            key: 'checkInCount',
            width: 100,
            render: (c: number) => c || 0,
          },
          {
            title: '',
            key: 'action',
            width: 120,
            render: (_: unknown, record: EventDetail) => (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
                <Button
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/events/${record.eventId}`);
                  }}
                >
                  View
                </Button>
                <Tooltip title="More options">
                  <Button
                    size="small"
                    icon={<MoreOutlined />}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Tooltip>
              </div>
            ),
          },
        ]}
        mobileCard={(record) => (
          <HumanCard className="human-noise" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <StatusBadge status={record.status} />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                }}
              >
                <EnvironmentOutlined />
                {record.venueName || record.venue?.name || 'Virtual'}
              </div>
            </div>
            <h3
              style={{
                fontSize: 22,
                fontWeight: 700,
                fontFamily: "'Playfair Display', serif",
                color: 'var(--text-primary)',
                margin: '0 0 16px 0',
                lineHeight: 1.2,
                minHeight: 52,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {record.title}
            </h3>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 20 }}>
              {formatEventDate(record.startDate)}
            </div>
            <div
              style={{
                background: 'var(--bg-soft)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: 20,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  Sales
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {record.layoutMode === 'Grid'
                    ? `${record.bookedTables || 0} / ${record.totalTables || '∞'}`
                    : `${record.totalSold || 0} / ${record.totalCapacity || '∞'}`}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  Check-ins
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {record.checkInCount || 0}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 'auto', display: 'flex', gap: 12, paddingTop: 8 }}>
              <Button
                type="primary"
                block
                style={{ borderRadius: 'var(--radius-full)', fontWeight: 600 }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/events/${record.eventId}`);
                }}
              >
                View Details
              </Button>
              <Tooltip title="More options">
                <Button
                  icon={<MoreOutlined />}
                  style={{ borderRadius: 'var(--radius-full)', width: 40 }}
                  onClick={(e) => e.stopPropagation()}
                />
              </Tooltip>
            </div>
          </HumanCard>
        )}
        empty={{
          title: 'No events yet',
          description: "It looks like you haven't created any events matching these criteria. Time to start something new?",
          actionLabel: 'Create Event',
          onAction: () => navigate('/events/new'),
        }}
      />
    </PageShell>
  );
}
