import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Row, Col, Pagination, App, Skeleton } from 'antd';
import { eventsApi } from '../../services/api';
import type { EventSummary, EventFacets } from '../../types/event';
import type { EventListParams } from '../../services/eventsApi';
import EventCard from '../../components/events/EventCard';
import EventFilters from '../../components/events/EventFilters';
import PageHeader from '../../components/shared/PageHeader';
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
  }, [searchParams]);

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

  return (
    <div className="page-container">
      <PageHeader title="Events" subtitle="Discover upcoming events near you" />

      <EventFilters
        facets={facets}
        values={filters}
        onChange={handleFilterChange}
      />

      {!loading && events.length > 0 && (
        <div style={{ marginBottom: 16, color: 'var(--text-muted)', fontSize: 13 }}>
          Showing {events.length} of {total} events
        </div>
      )}

      {loading ? (
        <Row gutter={[20, 20]}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Col xs={24} sm={12} md={8} key={i}>
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                overflow: 'hidden',
              }}>
                <Skeleton.Image active style={{ width: '100%', height: 180, display: 'block' }} />
                <div style={{ padding: 16 }}>
                  <Skeleton active paragraph={{ rows: 3 }} />
                </div>
              </div>
            </Col>
          ))}
        </Row>
      ) : events.length === 0 ? (
        <EmptyState description="No events found matching your filters" />
      ) : (
        <>
          <Row gutter={[20, 20]}>
            {events.map((event) => (
              <Col xs={24} sm={12} md={8} key={event.id}>
                <div className="hover-lift">
                  <EventCard event={event} />
                </div>
              </Col>
            ))}
          </Row>
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              onChange={handlePageChange}
              showSizeChanger={false}
            />
          </div>
        </>
      )}
    </div>
  );
}
