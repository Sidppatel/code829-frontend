import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Row, Col, Pagination, App, Skeleton } from 'antd';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { createLogger } from '@code829/shared/lib/logger';
import { eventsApi } from '../../services/api';
import type { EventSummary, EventFacets } from '@code829/shared/types/event';
import type { EventListParams } from '@code829/shared/services/eventsApi';

const log = createLogger('Public/EventsPage');
import EventCard from '../../components/events/EventCard';
import EventFilters from '../../components/events/EventFilters';
import EmptyState from '@code829/shared/components/shared/EmptyState';

export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(() => parseInt(searchParams.get('page') ?? '1', 10));
  const [pageSize] = useState(12);
  const [loading, setLoading] = useState(true);
  const [facets, setFacets] = useState<EventFacets | null>(null);
  const [filters, setFilters] = useState<EventListParams>({});
  const { message } = App.useApp();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await eventsApi.list({ ...filters, page, pageSize });
      setEvents(data?.items ?? []);
      setTotal(data?.totalCount ?? 0);
      log.info('Loaded events', { count: data?.items?.length ?? 0, total: data?.totalCount ?? 0 });
    } catch (err) {
      log.error('Failed to load events', err);
      message.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize, message]);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    const pageParam = parseInt(searchParams.get('page') ?? '1', 10);
    if (pageParam !== page) {
      setPage(pageParam);
    }
  }, [searchParams, page]);

  useEffect(() => {
    eventsApi.getFacets()
      .then((res) => setFacets(res.data))
      .catch((err) => {
        // Facets power the filter sidebar. Log but don't block — list still works without them.
        log.warn('Failed to load facets', { err });
        setFacets(null);
      });
  }, []);

  const handleFilterChange = (newFilters: EventListParams) => {
    setFilters(newFilters);
    setPage(1);
    setSearchParams({ page: '1' });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSearchParams({ page: newPage.toString() });
    window.scrollTo(0, 0);
  };

  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      style={{ minHeight: '100vh', paddingBottom: 100 }}
    >
      <Helmet><title>All events — Code829</title></Helmet>

      {/* Page Header — editorial, left-aligned */}
      <section style={{ padding: '120px 32px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div variants={itemVariants}>
            <h1
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 'clamp(2.4rem, 6vw, 3.5rem)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.03em',
                margin: '0 0 8px',
                lineHeight: 1.1,
              }}
            >
              All events
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
              {total} {total === 1 ? 'evening' : 'evenings'} across the season
            </p>
          </motion.div>
        </div>
      </section>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px' }}>
        <motion.div variants={itemVariants} style={{ marginBottom: 32 }}>
          <EventFilters
            facets={facets}
            values={filters}
            onChange={handleFilterChange}
          />
        </motion.div>

        {loading ? (
          <Row gutter={[32, 32]}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Col xs={24} sm={12} md={8} key={i}>
                <div className="glass-card" style={{ height: 480, borderRadius: 24, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {/* Image Placeholder */}
                  <div style={{ position: 'relative', height: 240, background: 'var(--bg-soft)', overflow: 'hidden' }}>
                    <div className="ant-skeleton ant-skeleton-active" style={{ height: '100%', width: '100%' }}>
                      <div className="ant-skeleton-content" style={{ height: '100%' }}>
                        <div className="ant-skeleton-title" style={{ width: '100%', height: '100%', margin: 0, borderRadius: 0 }} />
                      </div>
                    </div>
                    {/* Status/Category Tag on Right */}
                    <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }}>
                      <Skeleton.Button active size="small" shape="round" style={{ width: 80, height: 28 }} />
                    </div>
                  </div>

                  <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Title */}
                    <div style={{ marginBottom: 16 }}>
                      <Skeleton.Button active size="small" style={{ width: '80%', height: 24 }} />
                    </div>

                    {/* Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Skeleton.Avatar active size="small" shape="square" />
                        <Skeleton.Input active size="small" style={{ width: 140 }} />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Skeleton.Avatar active size="small" shape="square" />
                        <Skeleton.Input active size="small" style={{ width: 180 }} />
                      </div>
                    </div>

                    {/* Footer */}
                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ height: 12, width: 60, background: 'var(--bg-soft)', borderRadius: 4 }} className="ant-skeleton-active" />
                        <Skeleton.Button active size="small" style={{ width: 80, height: 28 }} />
                      </div>
                      <Skeleton.Avatar active shape="square" size={44} style={{ borderRadius: 12 }} />
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        ) : (events?.length ?? 0) === 0 ? (
          <div style={{ padding: '100px 0' }}>
            <EmptyState description="No events found matching your current filters" />
          </div>
        ) : (
          <>
            <motion.div variants={containerVariants}>
              <Row gutter={[32, 48]}>
                {events.map((event) => (
                  <Col xs={24} sm={12} md={8} key={event.id}>
                    <motion.div
                      variants={itemVariants}
                      style={{ height: '100%' }}
                    >
                      <EventCard event={event} />
                    </motion.div>
                  </Col>
                ))}
              </Row>
            </motion.div>

            <motion.div variants={itemVariants} style={{ textAlign: 'center', marginTop: 80 }}>
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                onChange={handlePageChange}
                showSizeChanger={false}
                className="custom-pagination"
              />
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
}
