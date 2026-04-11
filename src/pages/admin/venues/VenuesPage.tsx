import { useState, useEffect, useCallback } from 'react';
import { Button, Switch, App, Tooltip, Pagination, Empty } from 'antd';
import { PlusOutlined, EditOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { adminVenuesApi } from '../../../services/api';
import type { Venue } from '../../../types/venue';
import PageHeader from '../../../components/shared/PageHeader';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import HumanCard from '../../../components/shared/HumanCard';

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const { message } = App.useApp();
  const navigate = useNavigate();

  const loadVenues = useCallback(async (p = page, ps = pageSize) => {
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
  }, [page, pageSize, message]);

  useEffect(() => { void loadVenues(); }, [loadVenues]);

  const handleToggleActive = async (record: Venue) => {
    try {
      await adminVenuesApi.update(record.id, { isActive: !record.isActive });
      message.success(`Venue ${record.isActive ? 'disabled' : 'activated'}`);
      void loadVenues();
    } catch {
      message.error('Failed to update venue status');
    }
  };

  return (
    <div className="spring-up">
      <PageHeader 
        title="Venues" 
        subtitle="Explore and manage the beautiful spaces where your events come to life."
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => navigate('/admin/venues/new')}
            style={{ borderRadius: 'var(--radius-md)', height: 44, padding: '0 24px', fontWeight: 600 }}
          >
            Add Venue
          </Button>
        }
      />

      {loading && venues.length === 0 ? (
        <LoadingSpinner skeleton="card" />
      ) : venues.length > 0 ? (
        <>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: 24,
            marginBottom: 40 
          }}>
            {venues.map((v) => (
              <HumanCard
                key={v.id}
                style={{ 
                  opacity: v.isActive ? 1 : 0.7,
                  border: v.isActive ? '1px solid var(--border)' : '1px dashed var(--border)',
                }}
              >
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ 
                    width: 56, 
                    height: 56, 
                    borderRadius: 'var(--radius-md)', 
                    background: v.isActive ? 'var(--primary-soft)' : 'var(--bg-soft)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: 24,
                    flexShrink: 0
                  }}>
                    🏛️
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ 
                      fontSize: 18, 
                      fontWeight: 700, 
                      margin: 0, 
                      color: 'var(--text-primary)',
                      fontFamily: "'Playfair Display', serif",
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {v.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, color: 'var(--text-secondary)', fontSize: 13 }}>
                      <EnvironmentOutlined style={{ fontSize: 12, color: 'var(--primary)' }} />
                      {v.city}, {v.state}
                    </div>
                  </div>
                </div>

                <div style={{ 
                  marginTop: 20, 
                  paddingTop: 16, 
                  borderTop: '1px solid var(--border)', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Switch
                      checked={v.isActive}
                      onChange={() => handleToggleActive(v)}
                      size="small"
                    />
                    <span style={{ fontSize: 12, fontWeight: 600, color: v.isActive ? 'var(--primary)' : 'var(--text-muted)' }}>
                      {v.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                  
                  <Tooltip title="Edit Venue Details">
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => navigate(`/admin/venues/${v.id}`)}
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Edit
                    </Button>
                  </Tooltip>
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
          <Empty description="No venues hosted yet." />
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => navigate('/admin/venues/new')}
            style={{ marginTop: 16, borderRadius: 'var(--radius-full)' }}
          >
            Add Your First Venue
          </Button>
        </div>
      )}
    </div>
  );
}
