import { useState, useEffect } from 'react';
import { Table, Button, Switch, App, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { adminVenuesApi } from '../../../services/api';
import type { Venue } from '../../../types/venue';
import PageHeader from '../../../components/shared/PageHeader';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const { message } = App.useApp();
  const navigate = useNavigate();

  const loadVenues = async (p = page, ps = pageSize) => {
    setLoading(true);
    try {
      const { data } = await adminVenuesApi.list(p, ps);
      setVenues(data.items);
      setTotal(data.totalCount);
    } catch {
      message.error('Failed to load venues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadVenues(); }, [page, pageSize]);

  const handleToggleActive = async (record: Venue) => {
    try {
      await adminVenuesApi.update(record.id, { isActive: !record.isActive });
      message.success(`Venue ${record.isActive ? 'disabled' : 'activated'}`);
      void loadVenues();
    } catch {
      message.error('Failed to update venue status');
    }
  };

  const columns = [
    {
      title: 'Venue',
      key: 'venue',
      render: (_: unknown, record: Venue) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="venue-avatar">🏛️</div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{record.name}</div>
            {record.address && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{record.address}</div>}
          </div>
        </div>
      ),
      minWidth: 200,
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      render: (v: string) => <span style={{ color: 'var(--text-secondary)' }}>{v}</span>,
      width: 130,
    },
    {
      title: 'State',
      dataIndex: 'state',
      key: 'state',
      render: (v: string) => <span style={{ color: 'var(--text-secondary)' }}>{v}</span>,
      width: 80,
    },
    {
      title: 'Status',
      key: 'isActive',
      width: 100,
      render: (_: unknown, record: Venue) => (
        <Switch
          checked={record.isActive}
          onChange={() => handleToggleActive(record)}
          checkedChildren="Active"
          unCheckedChildren="Off"
          style={{ minWidth: 70 }}
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right' as const,
      width: 80,
      render: (_: unknown, record: Venue) => (
        <Tooltip title="Edit Venue">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/admin/venues/${record.id}`)}
            style={{ borderRadius: 8 }}
          />
        </Tooltip>
      ),
    },
  ];

  if (loading && venues.length === 0) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Venues" subtitle="Manage event venues"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/admin/venues/new')}>Add Venue</Button>}
      />

      {/* Mobile card list */}
      <div className="mobile-card-list">
        {venues.map((v) => (
          <div key={v.id} className={`data-card${v.isActive ? '' : ' inactive'}`}>
            <div className="venue-avatar">🏛️</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {v.name}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {v.city}, {v.state}
              </div>
            </div>
            <Switch
              checked={v.isActive}
              onChange={() => handleToggleActive(v)}
              size="small"
            />
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/admin/venues/${v.id}`)}
              style={{ borderRadius: 8 }}
            />
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="desktop-table">
        <div className="responsive-table">
          <Table dataSource={venues} columns={columns} rowKey="id" loading={loading}
            scroll={{ x: 600 }}
            pagination={{ current: page, pageSize, total, onChange: (p, ps) => { setPage(p); setPageSize(ps); }, showSizeChanger: true }}
          />
        </div>
      </div>
    </div>
  );
}
