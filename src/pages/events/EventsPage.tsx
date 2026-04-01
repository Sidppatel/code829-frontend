import { useEffect, useState, useCallback } from 'react';
import { Row, Col, Pagination, App } from 'antd';
import { eventsApi } from '../../services/api';
import type { EventSummary, EventFacets } from '../../types/event';
import type { EventListParams } from '../../services/eventsApi';
import EventCard from '../../components/events/EventCard';
import EventFilters from '../../components/events/EventFilters';
import PageHeader from '../../components/shared/PageHeader';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import EmptyState from '../../components/shared/EmptyState';

export default function EventsPage() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
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
      setTotal(data.total);
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
    eventsApi.getFacets().then((res) => setFacets(res.data)).catch(() => {});
  }, []);

  const handleFilterChange = (newFilters: EventListParams) => {
    setFilters(newFilters);
    setPage(1);
  };

  return (
    <>
      <PageHeader title="Events" subtitle="Discover upcoming events near you" />
      <EventFilters
        facets={facets}
        values={filters}
        onChange={handleFilterChange}
      />

      {loading ? (
        <LoadingSpinner />
      ) : events.length === 0 ? (
        <EmptyState description="No events found matching your filters" />
      ) : (
        <>
          <Row gutter={[24, 24]}>
            {events.map((event) => (
              <Col xs={24} sm={12} md={8} lg={6} key={event.id}>
                <EventCard event={event} />
              </Col>
            ))}
          </Row>
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              onChange={setPage}
              showSizeChanger={false}
            />
          </div>
        </>
      )}
    </>
  );
}
