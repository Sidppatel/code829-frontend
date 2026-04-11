import { Button, Tag, Input, Select, App, Popconfirm, Tooltip, Pagination, Empty } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  SendOutlined,
  EyeOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  AppstoreOutlined,
  TeamOutlined,
  ScanOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { adminEventsApi } from '../../../services/api';
import { usePagedTable } from '../../../hooks/usePagedTable';
import { formatEventDate } from '../../../utils/date';
import type { EventDetail } from '../../../types/event';
import type { AdminEventListParams } from '../../../services/adminEventsApi';
import PageHeader from '../../../components/shared/PageHeader';
import HumanCard from '../../../components/shared/HumanCard';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';

const STATUS_MAP: Record<string, { className: string; label: string; color: string }> = {
  Draft:     { className: 'status-pill status-draft',     label: 'Draft',     color: '#9CA3AF' },
  Published: { className: 'status-pill status-published', label: 'Published', color: '#10B981' },
  SoldOut:   { className: 'status-pill status-soldout',   label: 'Sold Out',  color: '#F59E0B' },
  Cancelled: { className: 'status-pill status-cancelled', label: 'Cancelled', color: '#EF4444' },
  Completed: { className: 'status-pill status-completed', label: 'Completed', color: 'var(--primary)' },
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

function LayoutModeBadge({ mode }: { mode: string }) {
  const icon = mode === 'Grid' ? <AppstoreOutlined /> : <TeamOutlined />;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
      {icon} {mode}
    </div>
  );
}

export default function EventsListPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const {
    data,
    total,
    page,
    pageSize,
    loading,
    setPage,
    setPageSize,
    setFilters,
    refresh,
  } = usePagedTable<EventDetail, AdminEventListParams>({
    fetcher: adminEventsApi.list,
    defaultPageSize: 12,
  });

  const handlePublish = async (id: string) => {
    try {
      await adminEventsApi.changeStatus(id, 'Published');
      message.success('Event published successfully');
      refresh();
    } catch {
      message.error('Failed to publish event');
    }
  };

  return (
    <div className="spring-up">
      <PageHeader
        title="Your Events"
        subtitle="Manage and oversee all your upcoming and past gatherings."
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/admin/events/new')}
            style={{ borderRadius: 'var(--radius-md)', height: 44, padding: '0 24px', fontWeight: 600 }}
          >
            Create Event
          </Button>
        }
      />

      <div style={{
        display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap', alignItems: 'center'
      }}>
        <Input
          placeholder="Search events by title..."
          prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
          allowClear
          onChange={(e) => setFilters({ search: e.target.value || undefined })}
          style={{ flex: 1, minWidth: 260, height: 44, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}
        />
        <Select
          placeholder="All Statuses"
          allowClear
          className="human-select"
          style={{ minWidth: 160, height: 44 }}
          onChange={(val) => setFilters({ status: val })}
          options={['Draft', 'Published', 'SoldOut', 'Cancelled', 'Completed'].map(s => ({ label: s, value: s }))}
        />
      </div>

      {loading ? (
        <LoadingSpinner skeleton="card" />
      ) : data.length > 0 ? (
        <>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: 24,
            marginBottom: 40
          }}>
            {data.map((record) => (
              <HumanCard
                key={record.id}
                onClick={() => navigate(`/admin/events/${record.id}`)}
                style={{ padding: 0, overflow: 'hidden' }}
              >
                <div style={{ padding: '24px 24px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <StatusBadge status={record.status} />
                    <Tooltip title="Manage">
                      <Button 
                        type="text" 
                        icon={<MoreOutlined />} 
                        onClick={(e) => { e.stopPropagation(); navigate(`/admin/events/${record.id}`); }}
                        style={{ color: 'var(--text-muted)' }}
                      />
                    </Tooltip>
                  </div>

                  <h3 style={{ 
                    fontSize: 20, 
                    fontWeight: 700, 
                    fontFamily: "'Playfair Display', serif", 
                    color: 'var(--text-primary)',
                    margin: '0 0 12px 0',
                    lineHeight: 1.3
                  }}>
                    {record.title}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CalendarOutlined style={{ color: 'var(--accent-gold)' }} />
                      {formatEventDate(record.startDate)}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <EnvironmentOutlined style={{ color: 'var(--primary)' }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {record.venueName || record.venue?.name}
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: '12px 0', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <LayoutModeBadge mode={record.layoutMode} />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                      {record.category}
                    </span>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-soft)', padding: '12px 24px', display: 'flex', gap: 12 }}>
                  {(record.status === 'Draft' || record.status === 'Published') && (
                    <Button
                      size="small"
                      type="text"
                      icon={<EditOutlined />}
                      onClick={(e) => { e.stopPropagation(); navigate(`/admin/events/${record.id}/edit`); }}
                      style={{ color: 'var(--primary)', fontWeight: 600 }}
                    >
                      Edit
                    </Button>
                  )}
                  {record.status === 'Draft' && (
                    <Popconfirm
                      title="Ready to share?"
                      description="This will make the event visible to everyone."
                      onConfirm={() => handlePublish(record.id)}
                      okText="Publish"
                    >
                      <Button 
                        size="small" 
                        type="text" 
                        icon={<SendOutlined />}
                        onClick={(e) => e.stopPropagation()}
                        style={{ color: 'var(--accent-green)', fontWeight: 600 }}
                      >
                        Publish
                      </Button>
                    </Popconfirm>
                  )}
                  {(record.status === 'Published' || record.status === 'Completed') && (
                    <Button
                      size="small"
                      type="text"
                      icon={<ScanOutlined />}
                      onClick={(e) => { e.stopPropagation(); navigate(`/staff/checkin/${record.id}`); }}
                      style={{ color: 'var(--accent-gold)', fontWeight: 600 }}
                    >
                      Check-In
                    </Button>
                  )}
                </div>
              </HumanCard>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 40 }}>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              onChange={(p, ps) => {
                setPage(p);
                setPageSize(ps);
              }}
              showSizeChanger
              className="human-pagination"
            />
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '100px 24px' }}>
          <Empty description="No events found matched your search." />
          <Button 
            type="primary" 
            onClick={() => setFilters({})} 
            style={{ marginTop: 16, borderRadius: 'var(--radius-full)' }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
