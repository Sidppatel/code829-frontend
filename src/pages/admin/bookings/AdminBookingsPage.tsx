import { Table, Button, Space, Input, App, Popconfirm, Pagination } from 'antd';
import { SearchOutlined, DownloadOutlined, UndoOutlined, UserOutlined, DollarOutlined } from '@ant-design/icons';
import { adminBookingsApi } from '../../../services/api';
import { usePagedTable } from '../../../hooks/usePagedTable';
import { centsToUSD } from '../../../utils/currency';
import { formatEventDate } from '../../../utils/date';
import type { Booking, BookingStatus } from '../../../types/booking';
import type { AdminBookingListParams } from '../../../services/adminBookingsApi';
import BookingStatusTag from '../../../components/bookings/BookingStatusTag';
import PageHeader from '../../../components/shared/PageHeader';
import EmptyState from '../../../components/shared/EmptyState';
import HumanCard from '../../../components/shared/HumanCard';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';

export default function AdminBookingsPage() {
  const { message } = App.useApp();
  const { data, total, page, pageSize, loading, setPage, setPageSize, setFilters, refresh } =
    usePagedTable<Booking, AdminBookingListParams>({
      fetcher: adminBookingsApi.list,
      defaultPageSize: 15,
    });

  const handleRefund = async (id: string) => {
    try {
      await adminBookingsApi.refund(id);
      message.success('Booking refunded');
      refresh();
    } catch {
      message.error('Failed to refund booking');
    }
  };

  const handleExport = async (format: 'csv' | 'xlsx') => {
    try {
      const res = format === 'csv' ? await adminBookingsApi.exportCsv() : await adminBookingsApi.exportXlsx();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `bookings.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      message.error('Export failed');
    }
  };



  // ── Desktop columns ──
  const columns = [
    { title: 'Booking #', dataIndex: 'bookingNumber', key: 'bookingNumber' },
    { title: 'Event', dataIndex: 'eventTitle', key: 'eventTitle' },
    { title: 'Customer', dataIndex: 'userName', key: 'userName' },
    { title: 'Status', dataIndex: 'status', key: 'status',
      render: (status: BookingStatus) => <BookingStatusTag status={status} />,
    },
    { title: 'Total', dataIndex: 'totalCents', key: 'totalCents',
      render: (cents: number) => centsToUSD(cents),
    },
    { title: 'Date', dataIndex: 'createdAt', key: 'createdAt',
      render: (d: string) => formatEventDate(d),
    },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, record: Booking) => (
        <Space>
          {record.status === 'Paid' && (
            <Popconfirm title="Refund this booking?" onConfirm={() => handleRefund(record.id)}>
              <Button size="small" icon={<UndoOutlined />}>Refund</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];



  return (
    <div className="spring-up">
      <PageHeader 
        title="Sales Pipeline" 
        subtitle={[
          "Track and manage every guest booking with ease.",
          "Process refunds and oversee entry status in real-time.",
          "Monitor your revenue and guest list at a glance."
        ]}
        rotateSubtitle
        extra={
          <div style={{ display: 'flex', gap: 12 }}>
            <Button 
              icon={<DownloadOutlined />} 
              onClick={() => handleExport('csv')}
              style={{ borderRadius: 'var(--radius-full)', fontWeight: 600 }}
            >
              CSV
            </Button>
            <Button 
              icon={<DownloadOutlined />} 
              onClick={() => handleExport('xlsx')}
              style={{ borderRadius: 'var(--radius-full)', fontWeight: 600 }}
            >
              Excel
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div style={{ 
        display: 'flex', 
        gap: 16, 
        marginBottom: 32, 
        flexWrap: 'wrap', 
        alignItems: 'center',
        background: 'var(--bg-surface)',
        padding: '16px 24px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <Input
          placeholder="Search customer or booking number..."
          prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
          allowClear
          onChange={(e) => setFilters({ search: e.target.value || undefined })}
          style={{ flex: 1, minWidth: 260, height: 44, borderRadius: 'var(--radius-full)', border: '1px solid var(--border)', paddingLeft: 16 }}
        />
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {['Pending', 'Paid', 'CheckedIn', 'Refunded'].map(status => (
            <div 
              key={status}
              onClick={() => setFilters({ status: status as BookingStatus })}
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

      {/* Desktop: Table */}
      <div className="desktop-table">
        <div className="responsive-table">
          <Table dataSource={data} columns={columns} rowKey="id" loading={loading}
            scroll={{ x: 600 }}
            pagination={{ current: page, pageSize, total, onChange: (p, ps) => { setPage(p); setPageSize(ps); }, showSizeChanger: true }}
          />
        </div>
      </div>

      {/* Mobile: Cards */}
      <div className="mobile-card-list">
        {loading ? (
          <div style={{ padding: '24px 0' }}>
            <LoadingSpinner skeleton="card" />
          </div>
        ) : data.length === 0 ? (
          <EmptyState
            title="No bookings found"
            description="It looks like no one has reserved a spot under these filters yet."
            actionLabel="Clear Filters"
            onAction={() => setFilters({})}
          />
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
              {data.map((booking) => (
                <HumanCard 
                  key={booking.id} 
                  className="human-noise"
                  onClick={() => {}} // Optional: navigate to booking details
                  style={{ borderLeft: `4px solid ${booking.status === 'Paid' ? 'var(--accent-green)' : 'var(--border)'}` }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', fontFamily: "'Playfair Display', serif" }}>
                        {booking.eventTitle}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }}>
                        #{booking.bookingNumber}
                      </div>
                    </div>
                    <BookingStatusTag status={booking.status} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                      <UserOutlined style={{ color: 'var(--primary)', opacity: 0.7 }} />
                      <span style={{ fontWeight: 600 }}>{booking.userName}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                      <DollarOutlined style={{ color: 'var(--accent-gold)' }} />
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{centsToUSD(booking.totalCents)}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                      Captured {formatEventDate(booking.createdAt)}
                    </div>
                    {booking.status === 'Paid' && (
                      <Popconfirm title="Refund this booking?" onConfirm={() => handleRefund(booking.id)}>
                        <Button size="small" type="text" icon={<UndoOutlined />} danger style={{ fontWeight: 600 }}>
                          Refund
                        </Button>
                      </Popconfirm>
                    )}
                  </div>
                </HumanCard>
              ))}
            </div>
            {total > pageSize && (
              <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 40 }}>
                <Pagination
                  current={page}
                  pageSize={pageSize}
                  total={total}
                  onChange={setPage}
                  showSizeChanger={false}
                  className="human-pagination"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
