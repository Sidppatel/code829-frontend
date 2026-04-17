import { useState, useEffect, useCallback } from 'react';
import { Button, Switch, App, Pagination } from 'antd';
import { PlusOutlined, EditOutlined, EnvironmentOutlined, TableOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { adminVenuesApi } from '../../services/api';
import type { Venue } from '@code829/shared/types/venue';
import PageHeader from '@code829/shared/components/shared/PageHeader';
import LoadingSpinner from '@code829/shared/components/shared/LoadingSpinner';
import HumanCard from '@code829/shared/components/shared/HumanCard';
import EmptyState from '@code829/shared/components/shared/EmptyState';
import { createLogger } from '@code829/shared/lib/logger';

const log = createLogger('Admin/VenuesPage');

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
      log.info('Venues loaded', { count: data.items.length, total: data.totalCount });
    } catch (err) {
      log.error('Failed to load venues', err);
      message.error('Failed to load venues');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, message]);

  useEffect(() => { void loadVenues(); }, [loadVenues]);

  const handleToggleActive = async (record: Venue) => {
    try {
      await adminVenuesApi.update(record.id, { isActive: !record.isActive });
      log.info('Venue toggled', { id: record.id, isActive: !record.isActive });
      message.success(`Venue ${record.isActive ? 'disabled' : 'activated'}`);
      void loadVenues();
    } catch (err) {
      log.error('Failed to toggle venue status', err);
      message.error('Failed to update venue status');
    }
  };

  return (
    <div className="spring-up">
      <PageHeader
        title="Venue"
        subtitle={[
          "Explore the beautiful spaces where your events come to life.",
          "Manage capacity, layouts, and availability across your portfolio.",
          "Add new spaces to host even more unforgettable gatherings."
        ]}
        rotateSubtitle
        extra={
          <div style={{ display: 'flex', gap: 12 }}>
            <Button
              icon={<TableOutlined />}
              onClick={() => navigate('/table-types')}
              style={{
                borderRadius: 'var(--radius-full)',
                height: 48,
                padding: '0 24px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)'
              }}
            >
              Table Templates
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/venues/new')}
              style={{
                borderRadius: 'var(--radius-full)',
                height: 48,
                padding: '0 32px',
                fontWeight: 700,
                boxShadow: 'var(--shadow-md)'
              }}
            >
              Add Venue
            </Button>
          </div>
        }
      />

      {loading && venues.length === 0 ? (
        <LoadingSpinner skeleton="card" />
      ) : venues.length > 0 ? (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 24,
            marginBottom: 40
          }}>
            {venues.map((v) => (
              <HumanCard
                key={v.id}
                className="human-noise"
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  opacity: v.isActive ? 1 : 0.8,
                  border: v.isActive ? '1px solid var(--border)' : '1px dashed var(--border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: v.isActive ? 'var(--primary-soft)' : 'var(--bg-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    flexShrink: 0,
                    boxShadow: v.isActive ? 'var(--shadow-sm)' : 'none'
                  }}>
                    🏛️
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: v.isActive ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                      {v.isActive ? 'Active' : 'Archived'}
                    </span>
                    <Switch
                      checked={v.isActive}
                      onChange={() => handleToggleActive(v)}
                      size="small"
                    />
                  </div>
                </div>

                <h3 style={{
                  fontSize: 22,
                  fontWeight: 700,
                  margin: '0 0 8px 0',
                  color: 'var(--text-primary)',
                  fontFamily: "'Playfair Display', serif",
                }}>
                  {v.name}
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500, marginBottom: 24 }}>
                  <EnvironmentOutlined style={{ color: 'var(--primary)' }} />
                  {v.city}, {v.state}
                </div>

                <div style={{
                  background: 'var(--bg-soft)',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 24,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12
                }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Capacity</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {v.totalSeats || '800+'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Layout</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                      Grid Base
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 'auto' }}>
                  <Button
                    type="primary"
                    block
                    icon={<EditOutlined />}
                    onClick={() => navigate(`/venues/${v.id}`)}
                    style={{ borderRadius: 'var(--radius-full)', fontWeight: 600, height: 40 }}
                  >
                    Manage Venue
                  </Button>
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
        <EmptyState
          title="No spaces yet"
          description="Your venue collection is empty. Add your first space to start hosting events."
          actionLabel="Add My First Venue"
          onAction={() => navigate('/venues/new')}
        />
      )}
    </div>
  );
}
