import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Row, Col, Pagination, App, Skeleton } from 'antd';
import { motion } from 'framer-motion';
import { eventsApi } from '../../services/api';
import type { EventSummary, EventFacets } from '../../types/event';
import type { EventListParams } from '../../services/eventsApi';
import EventCard from '../../components/events/EventCard';
import EventFilters from '../../components/events/EventFilters';
import EmptyState from '../../components/shared/EmptyState';

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
      setEvents(data.items);
      setTotal(data.totalCount);
    } catch {
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
    eventsApi.getFacets().then((res) => setFacets(res.data)).catch(() => {});
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
      {/* Page Header */}
      <section style={{ padding: '120px 0 60px', textAlign: 'center' }}>
        <div className="page-container">
          <motion.div variants={itemVariants}>
            <div style={{ color: 'var(--accent-rose)', fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
              The Collection
            </div>
            <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', fontWeight: 900, color: 'var(--text-primary)', marginBottom: 20, letterSpacing: '-2.5px' }}>
              Explore <span className="gradient-text">Experiences</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 18, maxWidth: 600, margin: '0 auto', fontWeight: 500, lineHeight: 1.6 }}>
              Discover an exclusive selection of upcoming events. Secure your spot in the future of entertainment.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="page-container">
        <motion.div variants={itemVariants} style={{ marginBottom: 48 }}>
          <EventFilters
            facets={facets}
            values={filters}
            onChange={handleFilterChange}
          />
        </motion.div>

        {!loading && events.length > 0 && (
          <motion.div variants={itemVariants} style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 1, background: 'var(--border)' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
              {total} results found
            </span>
          </motion.div>
        )}

        {loading ? (
          <Row gutter={[32, 32]}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Col xs={24} sm={12} md={8} key={i}>
                <div className="glass-card" style={{ height: 400, borderRadius: 24, padding: 0, overflow: 'hidden' }}>
                  <Skeleton.Image active style={{ width: '100%', height: 240 }} />
                  <div style={{ padding: 24 }}>
                    <Skeleton active paragraph={{ rows: 2 }} />
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        ) : events.length === 0 ? (
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
