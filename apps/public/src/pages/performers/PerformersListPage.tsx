import { useCallback, useEffect, useState } from 'react';
import { Col, Empty, Input, Pagination, Row, Spin } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import type { Performer } from '@code829/shared/types/performer';
import { performerService } from '../../services/api';
import { createLogger } from '@code829/shared/lib/logger';

const log = createLogger('Public/PerformersListPage');

export default function PerformersListPage() {
  const [items, setItems] = useState<Performer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await performerService.listPublic(query || undefined, page, pageSize);
      setItems(data.items);
      setTotal(data.totalCount);
    } catch (err) {
      log.error('Failed to load performers', err);
    } finally {
      setLoading(false);
    }
  }, [query, page, pageSize]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
        <div style={{ width: 6, height: 56, borderRadius: 10, background: 'var(--gradient-brand, var(--primary))' }} />
        <div>
          <h1 style={{ margin: 0, fontSize: 36, fontWeight: 900, color: 'var(--text-primary)', fontFamily: "'Playfair Display', serif" }}>
            Performers
          </h1>
          <p style={{ margin: '6px 0 0 0', color: 'var(--text-secondary)', fontSize: 15 }}>
            Artists, hosts and acts appearing across our events
          </p>
        </div>
      </div>

      <div style={{ marginBottom: 28, maxWidth: 460 }}>
        <Input.Search
          placeholder="Search performers"
          allowClear
          size="large"
          onSearch={(v) => { setQuery(v); setPage(1); }}
          onChange={(e) => { if (!e.target.value) { setQuery(''); setPage(1); } }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
      ) : items.length === 0 ? (
        <Empty description={query ? `No performers match "${query}"` : 'No performers yet'} />
      ) : (
        <>
          <Row gutter={[24, 24]}>
            {items.map((p) => (
              <Col key={p.id} xs={24} sm={12} md={8} lg={6}>
                <Link
                  to={`/performers/${p.slug}`}
                  className="glass-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    borderRadius: 16,
                    overflow: 'hidden',
                    color: 'inherit',
                    textDecoration: 'none',
                    transition: 'transform .2s ease, box-shadow .2s ease',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '1 / 1',
                      background: 'var(--bg-soft)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {p.primaryImageUrl ? (
                      <img src={p.primaryImageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <UserOutlined style={{ fontSize: 48, color: 'var(--text-muted)' }} />
                    )}
                  </div>
                  <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
                      {p.name}
                    </h3>
                    <div style={{ marginTop: 6, color: 'var(--text-secondary)', fontSize: 13 }}>
                      {p.upcomingEventCount > 0
                        ? `${p.upcomingEventCount} upcoming ${p.upcomingEventCount === 1 ? 'event' : 'events'}`
                        : 'No upcoming events'}
                    </div>
                  </div>
                </Link>
              </Col>
            ))}
          </Row>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
              showSizeChanger
            />
          </div>
        </>
      )}
    </div>
  );
}
