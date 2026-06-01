import { useCallback, useEffect, useState } from 'react';
import { Button, Input, Pagination, Popconfirm, Tooltip, message } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, ShopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { sponsorService } from '../../services/api';
import type { Sponsor } from '@code829/shared';
import { LoadingBoundary, PageShell } from '@code829/shared/components/ui';
import HumanCard from '@code829/shared/components/shared/HumanCard';
import { createLogger } from '@code829/shared/lib/logger';

const log = createLogger('Admin/SponsorsListPage');
const ADD_SPONSOR_TEXT = 'Add Sponsor';
const EDIT_TEXT = 'Edit';

export default function SponsorsListPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await sponsorService.listAdmin(query || undefined, page, pageSize);
      setItems(data.items);
      setTotal(data.totalCount);
    } catch (err) {
      log.error('Failed to load sponsors', err);
    } finally {
      setLoading(false);
    }
  }, [query, page, pageSize]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const onDelete = async (p: Sponsor) => {
    try {
      await sponsorService.remove(p.id);
      message.success('Sponsor deleted');
      await load();
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { message?: string } } };
      if (e?.response?.status === 409) {
        message.error(e.response.data?.message ?? 'Sponsor is linked to events');
      } else {
        message.error('Failed to delete');
      }
    }
  };

  return (
    <PageShell
      title="Sponsors"
      subtitle="Corporate sponsors and partners associated with your events"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/sponsors/new')}
          style={{ borderRadius: 'var(--radius-full)', height: 48, padding: '0 32px', fontWeight: 700 }}
        >
          {ADD_SPONSOR_TEXT}
        </Button>
      }
    >
      <div style={{ marginBottom: 24, maxWidth: 480 }}>
        <Input.Search
          placeholder="Search sponsors"
          allowClear
          onSearch={(v) => { setQuery(v); setPage(1); }}
          onChange={(e) => { if (!e.target.value) setQuery(''); }}
        />
      </div>

      <LoadingBoundary
        loading={loading}
        data={items}
        skeleton="card"
        empty={{
          title: query ? 'No sponsors match your search' : 'No sponsors yet',
          description: query ? 'Try a different search term.' : 'Add your first sponsor to link to events.',
          actionLabel: query ? undefined : 'Add First Sponsor',
          onAction: query ? undefined : () => navigate('/sponsors/new'),
        }}
      >
        {(list) => (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: 24,
                marginBottom: 40,
              }}
            >
              {list.map((p) => (
                <HumanCard key={p.id} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 16,
                        background: 'var(--bg-soft)',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {p.primaryImageUrl ? (
                        <img src={p.primaryImageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <ShopOutlined style={{ fontSize: 28, color: 'var(--text-muted)' }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {p.name}
                      </h3>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {p.eventCount} {p.eventCount === 1 ? 'event' : 'events'}
                        {p.upcomingEventCount > 0 ? ` · ${p.upcomingEventCount} upcoming` : ''}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 'auto', display: 'flex', gap: 8 }}>
                    <Button
                      type="primary"
                      icon={<EditOutlined />}
                      onClick={() => navigate(`/sponsors/${p.id}`)}
                      style={{ flex: 1, borderRadius: 'var(--radius-full)', fontWeight: 600, height: 40 }}
                    >
                      {EDIT_TEXT}
                    </Button>
                    <Tooltip title={p.eventCount > 0 ? 'Remove from all events first' : 'Delete'}>
                      <Popconfirm
                        title="Delete sponsor?"
                        description="This cannot be undone."
                        onConfirm={() => onDelete(p)}
                        okText="Delete"
                        okButtonProps={{ danger: true }}
                        disabled={p.eventCount > 0}
                      >
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          disabled={p.eventCount > 0}
                          style={{ borderRadius: 'var(--radius-full)', height: 40 }}
                        />
                      </Popconfirm>
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
                onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
                showSizeChanger
              />
            </div>
          </>
        )}
      </LoadingBoundary>
    </PageShell>
  );
}
