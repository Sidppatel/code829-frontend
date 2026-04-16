import { Button, Input, Tooltip, Tag } from 'antd';
import { Helmet } from 'react-helmet-async';
import {
  PlusOutlined,
  SearchOutlined,
  EnvironmentOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { adminEventsApi } from '../../services/api';
import { usePagedTable } from '@code829/shared/hooks/usePagedTable';
import { formatEventDate } from '@code829/shared/utils/date';
import type { EventDetail } from '@code829/shared/types/event';
import type { AdminEventListParams } from '@code829/shared/services/adminEventsApi';
import PageHeader from '@code829/shared/components/shared/PageHeader';
import HumanCard from '@code829/shared/components/shared/HumanCard';
import SharedEventTable from '../../components/events/SharedEventTable';
import { createLogger } from '@code829/shared/lib/logger';
import { EVENT_STATUS_COLORS } from '@code829/shared/theme/statusColors';

const log = createLogger('Admin/EventsListPage');

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  Draft: { label: 'Draft', color: EVENT_STATUS_COLORS.Draft },
  Published: { label: 'Published', color: EVENT_STATUS_COLORS.Published },
  SoldOut: { label: 'Sold Out', color: EVENT_STATUS_COLORS.SoldOut },
  Cancelled: { label: 'Cancelled', color: EVENT_STATUS_COLORS.Cancelled },
  Completed: { label: 'Completed', color: EVENT_STATUS_COLORS.Completed },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, color: '#9CA3AF' };
  const isPulse = status === 'Published';

  return (
    <div style={{
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
      letterSpacing: '0.03em'
    }}>
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
  const {
    data,
    total,
    page,
    pageSize,
    loading,
    setPage,
    setPageSize,
    setFilters,
  } = usePagedTable<EventDetail, AdminEventListParams>({
    fetcher: adminEventsApi.list,
    defaultPageSize: 12,
  });

  const columns = [
    { title: 'Title', dataIndex: 'title', key: 'title', ellipsis: true },
    {
      title: 'Date', dataIndex: 'startDate', key: 'startDate', width: 180,
      render: (d: string) => formatEventDate(d),
    },
    {
      title: 'Venue', dataIndex: 'venueName', key: 'venueName', width: 200, ellipsis: true,
      render: (v: string, record: EventDetail) => v || record.venue?.name || 'Virtual',
    },
    {
      title: 'Type', dataIndex: 'layoutMode', key: 'layoutMode', width: 100,
      render: (m: string) => <Tag color={m === 'Open' ? 'blue' : 'purple'}>{m}</Tag>,
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 130,
      render: (s: string) => <StatusBadge status={s} />,
    },
    {
      title: 'Sales', key: 'sales', width: 100,
      render: (_: unknown, r: EventDetail) => `${r.soldCount || 0} / ${r.totalCapacity || '∞'}`,
    },
    {
      title: 'Check-ins', dataIndex: 'checkInCount', key: 'checkInCount', width: 100,
      render: (c: number) => c || 0,
    },
    {
      title: '', key: 'action', width: 120,
      render: (_: unknown, record: EventDetail) => (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'flex-end' }}>
          <Button 
            size="small" 
            onClick={(e) => { e.stopPropagation(); navigate(`/events/${record.id}`); }}
          >
            View
          </Button>
          <Tooltip title="More options">
            <Button
              size="small"
              icon={<MoreOutlined />}
              onClick={(e) => { e.stopPropagation(); }}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="spring-up">
      <Helmet><title>Events - Code829 Admin</title></Helmet>
      <PageHeader
        title="Events"
        subtitle={[
          "Design unforgettable nights for your guests.",
          "Track ticket sales and check-in progress in real-time.",
          "Manage your events with ease."
        ]}
        rotateSubtitle
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/events/new')}
            style={{
              borderRadius: 'var(--radius-full)',
              height: 48,
              padding: '0 32px',
              fontWeight: 700,
              boxShadow: '0 8px 16px hsla(var(--p-h), var(--p-s), var(--p-l), 0.3)'
            }}
          >
            Create Event
          </Button>
        }
      />

      <div style={{
        display: 'flex',
        gap: 16,
        marginBottom: 32,
        flexWrap: 'wrap',
        alignItems: 'center',
        padding: '24px',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <Input
          placeholder="Search by title..."
          prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
          allowClear
          onChange={(e) => {
            const search = e.target.value || undefined;
            setFilters({ search });
            if (search) log.info('Search events', { search });
          }}
          style={{ flex: 1, minWidth: 260, height: 44, borderRadius: 'var(--radius-full)', border: '1px solid var(--border)', paddingLeft: 16 }}
        />
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {['Draft', 'Published', 'SoldOut', 'Completed'].map(status => (
            <div
              key={status}
              onClick={() => { log.info('Filter by status', { status }); setFilters({ status: status as EventDetail['status'] }); }}
              style={{
                padding: '8px 20px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-soft)',
                border: '1px solid var(--border)',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              className="hover-lift press-state"
            >
              {status}
            </div>
          ))}
        </div>
      </div>

      <SharedEventTable
        dataSource={data}
        loading={loading}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={(p, ps) => {
          setPage(p);
          if (ps !== pageSize) setPageSize(ps);
        }}
        columns={columns}
        onRowClick={(record) => navigate(`/events/${record.id}`)}
        renderMobileCard={(record) => (
          <HumanCard
            className="human-noise"
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <StatusBadge status={record.status} />
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                color: 'var(--text-muted)',
                fontWeight: 600
              }}>
                <EnvironmentOutlined />
                {record.venueName || record.venue?.name || 'Virtual'}
              </div>
            </div>

            <h3 style={{
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
              overflow: 'hidden'
            }}>
              {record.title}
            </h3>

            <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 20 }}>
              {formatEventDate(record.startDate)}
            </div>

            <div style={{
              background: 'var(--bg-soft)',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              marginBottom: 20,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12
            }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Sales</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {record.soldCount || 0} / {record.totalCapacity || '∞'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Check-ins</div>
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
                onClick={(e) => { e.stopPropagation(); navigate(`/events/${record.id}`); }}
              >
                View Details
              </Button>
              <Tooltip title="More options">
                <Button
                  icon={<MoreOutlined />}
                  style={{ borderRadius: 'var(--radius-full)', width: 40 }}
                  onClick={(e) => { e.stopPropagation(); }}
                />
              </Tooltip>
            </div>
          </HumanCard>
        )}
        emptyProps={{
          title: "No events yet",
          description: "It looks like you haven't created any events matching these criteria. Time to start something new?",
          actionLabel: "Create Event",
          onAction: () => navigate('/events/new')
        }}
      />
    </div>
  );
}
