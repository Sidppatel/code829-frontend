import { useCallback, useEffect, useState } from 'react';
import { Button, Pagination, Switch } from 'antd';
import { EditOutlined, EnvironmentOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { adminVenuesApi } from '../../services/api';
import type { Venue } from '@code829/shared/types/venue';
import { LoadingBoundary, PageShell } from '@code829/shared/components/ui';
import HumanCard from '@code829/shared/components/shared/HumanCard';
import { useAsyncAction } from '@code829/shared/hooks';
import { createLogger } from '@code829/shared/lib/logger';

const log = createLogger('Admin/VenuesPage');

export default function VenuesPage() {
  const navigate = useNavigate();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminVenuesApi.list(page, pageSize);
      setVenues(data.items);
      setTotal(data.totalCount);
      log.info('Venues loaded', { count: data.items.length });
    } catch (err) {
      log.error('Failed to load venues', err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => { Promise.resolve().then(() => load()); }, [load]);

  const toggle = useAsyncAction(
    (v: Venue) => adminVenuesApi.update(v.venueId, { isActive: !v.isActive }),
    { successMessage: 'Venue updated', onSuccess: load },
  );

  return (
    <PageShell
      title="Venue"
      subtitle={[
        'Explore the beautiful spaces where your events come to life.',
        'Manage capacity, layouts, and availability across your portfolio.',
        'Add new spaces to host even more unforgettable gatherings.',
      ]}
      rotateSubtitle
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/venues/new')}
          style={{
            borderRadius: 'var(--radius-full)',
            height: 48,
            padding: '0 32px',
            fontWeight: 700,
            boxShadow: 'var(--shadow-md)',
          }}
        >
          Add Venue
        </Button>
      }
    >
      <LoadingBoundary
        loading={loading}
        data={venues}
        skeleton="card"
        empty={{
          title: 'No spaces yet',
          description: 'Your venue collection is empty. Add your first space to start hosting events.',
          actionLabel: 'Add My First Venue',
          onAction: () => navigate('/venues/new'),
        }}
      >
        {(items) => (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: 24,
                marginBottom: 40,
              }}
            >
              {items.map((v) => (
                <HumanCard
                  key={v.venueId}
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
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: v.isActive ? 'var(--primary-soft)' : 'var(--bg-soft)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        flexShrink: 0,
                        boxShadow: v.isActive ? 'var(--shadow-sm)' : 'none',
                      }}
                    >
                      🏛️
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: v.isActive ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                        {v.isActive ? 'Active' : 'Archived'}
                      </span>
                      <Switch checked={v.isActive} onChange={() => { void toggle.run(v); }} size="small" />
                    </div>
                  </div>
                  <h3
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      margin: '0 0 8px 0',
                      color: 'var(--text-primary)',
                      fontFamily: "'Playfair Display', serif",
                    }}
                  >
                    {v.name}
                  </h3>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      color: 'var(--text-secondary)',
                      fontSize: 14,
                      fontWeight: 500,
                      marginBottom: 24,
                    }}
                  >
                    <EnvironmentOutlined style={{ color: 'var(--primary)' }} />
                    {v.city}, {v.state}
                  </div>
<div style={{ marginTop: 'auto' }}>
                    <Button
                      type="primary"
                      block
                      icon={<EditOutlined />}
                      onClick={() => navigate(`/venues/${v.venueId}`)}
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
                onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
                showSizeChanger
                className="human-pagination"
              />
            </div>
          </>
        )}
      </LoadingBoundary>
    </PageShell>
  );
}
