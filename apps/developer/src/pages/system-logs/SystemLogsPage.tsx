import { useCallback, useEffect, useState } from 'react';
import { Descriptions, Select, Tag } from 'antd';
import { developerApi } from '../../services/api';
import HumanCard from '@code829/shared/components/shared/HumanCard';
import PulseIndicator from '@code829/shared/components/shared/PulseIndicator';
import {
  DataTableSection,
  DetailModal,
  FilterBar,
  PageShell,
  StatsRow,
} from '@code829/shared/components/ui';
import type { StatsCell } from '@code829/shared/components/ui';
import dayjs from 'dayjs';

interface SystemLog {
  id: string;
  timestamp: string;
  category: string;
  action: string;
  source?: string;
  entityType?: string;
  entityId?: string;
  beforeJson?: string;
  afterJson?: string;
  actorId?: string;
  correlationId?: string;
  durationMs?: number;
  metadataJson?: string;
}

const categoryColors: Record<string, string> = {
  EntityChange: 'blue',
  BackgroundWorker: 'purple',
  Cache: 'cyan',
  MockService: 'orange',
  Migration: 'green',
};

const CATEGORIES = ['EntityChange', 'BackgroundWorker', 'Cache', 'MockService', 'Migration'];
const ENTITY_TYPES = ['Event', 'Booking', 'User', 'Venue', 'Payment', 'Image'];

const STATS: StatsCell[] = [
  {
    label: 'API Node',
    value: (
      <>
        99.9<span style={{ fontSize: 14, fontWeight: 500 }}>%</span>
      </>
    ),
    trend: 'Up for 12d 4h',
    tone: 'success',
    icon: <PulseIndicator status="success" size={6} />,
  },
  {
    label: 'Worker Queue',
    value: (
      <>
        0<span style={{ fontSize: 14, fontWeight: 500 }}> ms</span>
      </>
    ),
    trend: 'Processing normally',
    tone: 'neutral',
    icon: <PulseIndicator status="calm" size={6} />,
  },
  {
    label: 'Memory',
    value: (
      <>
        74<span style={{ fontSize: 14, fontWeight: 500 }}>%</span>
      </>
    ),
    trend: 'Spiking in Node-02',
    tone: 'warning',
    icon: <PulseIndicator status="warning" size={6} />,
  },
];

function formatTs(ts: string) {
  return dayjs(ts).format('MMM D, YYYY h:mm:ss A');
}

function JsonBlock({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  let pretty = value;
  try {
    pretty = JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    /* leave as-is */
  }
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
      <pre
        style={{
          background: 'var(--bg-elevated)',
          borderRadius: 8,
          padding: '10px 12px',
          fontSize: 12,
          overflowX: 'auto',
          maxHeight: 240,
          margin: 0,
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
        }}
      >
        {pretty}
      </pre>
    </div>
  );
}

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>();
  const [entityType, setEntityType] = useState<string>();
  const [selected, setSelected] = useState<SystemLog | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await developerApi.getSystemLogs({ pageSize: 100, category, entityType });
      const items = (data as { items?: SystemLog[] }).items ?? (Array.isArray(data) ? (data as SystemLog[]) : []);
      setLogs(items);
    } finally {
      setLoading(false);
    }
  }, [category, entityType]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PageShell
      title="System logs"
      subtitle="Live stream · operational changes & migrations"
      stats={<StatsRow items={STATS} variant="kpi" columns={3} />}
    >
      <FilterBar
        actions={
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <Select
              placeholder="All Categories"
              allowClear
              style={{ minWidth: 160 }}
              value={category}
              onChange={setCategory}
              options={CATEGORIES.map((s) => ({ label: s, value: s }))}
            />
            <Select
              placeholder="All Entities"
              allowClear
              style={{ minWidth: 160 }}
              value={entityType}
              onChange={setEntityType}
              options={ENTITY_TYPES.map((s) => ({ label: s, value: s }))}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-green)' }} />
              <span>{loading ? 'Polling...' : 'System Nominal'}</span>
            </div>
          </div>
        }
      />
      <DataTableSection<SystemLog>
        data={logs}
        total={logs.length}
        page={1}
        pageSize={50}
        loading={loading}
        onPageChange={() => {}}
        rowKey="id"
        showSizeChanger={false}
        onRowClick={setSelected}
        columns={[
          {
            title: 'Timestamp',
            dataIndex: 'timestamp',
            key: 'timestamp',
            width: 200,
            render: (d: string) => (
              <span style={{ fontFamily: 'monospace', fontSize: 12, whiteSpace: 'nowrap' }}>{formatTs(d)}</span>
            ),
          },
          {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            width: 130,
            render: (c: string) => <Tag color={categoryColors[c] ?? 'default'}>{c}</Tag>,
          },
          { title: 'Entity', dataIndex: 'entityType', key: 'entityType', width: 110 },
          { title: 'Action', dataIndex: 'action', key: 'action', width: 160 },
          {
            title: 'Source',
            dataIndex: 'source',
            key: 'source',
            ellipsis: true,
            render: (v: string | undefined) => v ?? '—',
          },
          {
            title: 'Duration',
            dataIndex: 'durationMs',
            key: 'durationMs',
            width: 90,
            render: (v: number | undefined) => (v != null ? `${v}ms` : '—'),
          },
        ]}
        mobileCard={(entry) => (
          <HumanCard
            onClick={() => setSelected(entry)}
            style={{
              padding: 16,
              borderLeft: `4px solid ${entry.category === 'BackgroundWorker' ? 'var(--accent-rose)' : 'var(--border)'}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div
                style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: 'var(--bg-soft)',
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                }}
              >
                {entry.category}
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{entry.entityType}</span>
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: 8,
                fontFamily: 'monospace',
                wordBreak: 'break-word',
              }}
            >
              {entry.action}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{formatTs(entry.timestamp)}</div>
              {entry.durationMs != null && (
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>{entry.durationMs}ms</div>
              )}
            </div>
          </HumanCard>
        )}
        empty={{
          title: 'No system events',
          description: 'Platform is quiet. No logs recorded for this period.',
          actionLabel: 'Clear Filters',
          onAction: () => {
            setCategory(undefined);
            setEntityType(undefined);
          },
        }}
      />

      <DetailModal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.action ?? ''}
        subtitle={selected?.category}
        width={700}
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="Timestamp" span={2}>
                <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{formatTs(selected.timestamp)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Category">{selected.category}</Descriptions.Item>
              <Descriptions.Item label="Action">{selected.action}</Descriptions.Item>
              <Descriptions.Item label="Entity Type">{selected.entityType ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Entity ID">
                <span style={{ fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all' }}>{selected.entityId ?? '—'}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Source" span={2}>{selected.source ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Actor ID">
                <span style={{ fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all' }}>{selected.actorId ?? '—'}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Correlation ID">
                <span style={{ fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all' }}>{selected.correlationId ?? '—'}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Duration">{selected.durationMs != null ? `${selected.durationMs}ms` : '—'}</Descriptions.Item>
              <Descriptions.Item label="Log ID">
                <span style={{ fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all' }}>{selected.id}</span>
              </Descriptions.Item>
            </Descriptions>
            <JsonBlock label="Before" value={selected.beforeJson} />
            <JsonBlock label="After" value={selected.afterJson} />
            <JsonBlock label="Metadata" value={selected.metadataJson} />
          </div>
        )}
      </DetailModal>
    </PageShell>
  );
}
