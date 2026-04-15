import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Row, Col, Pagination, App, Skeleton } from 'antd';
import { motion } from 'framer-motion';
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
      {/* Page Header with hero background */}
      <section className="hero-section">
        <div
          className="page-container"
          style={{ position: 'relative', zIndex: 2, paddingTop: 140, paddingBottom: 60 }}
        >
          <motion.div variants={itemVariants}>
            <div
              style={{
                color: 'var(--accent-rose)',
                fontWeight: 800,
                fontSize: 13,
                textTransform: 'uppercase',
                letterSpacing: 2,
                marginBottom: 16,
              }}
            >
              The Collection
            </div>
            <h1
              style={{
                fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
                fontWeight: 900,
                color: 'var(--text-primary)',
                marginBottom: 20,
                letterSpacing: '-2.5px',
              }}
            >
              Explore <span className="gradient-text">Experiences</span>
            </h1>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: 18,
                maxWidth: 600,
                margin: '0 auto',
                fontWeight: 500,
                lineHeight: 1.6,
              }}
            >
              Discover an exclusive selection of upcoming events. Secure your spot in the
              future of entertainment.
            </p>
          </motion.div>
        </div>
      </section>

      {/* rest of the page stays the same */}
      <div className="page-container">
        {/* filters, list, pagination ... */}
      </div>
    </motion.div>
  );
}
