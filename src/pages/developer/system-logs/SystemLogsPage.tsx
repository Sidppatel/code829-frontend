import { useEffect, useState, useCallback } from 'react';
import { Table, Select, Tag, Spin, Modal, Descriptions, App } from 'antd';
import { developerApi } from '../../../services/api';
import { useIsMobile } from '../../../hooks/useIsMobile';
import PageHeader from '../../../components/shared/PageHeader';
import HumanCard from '../../../components/shared/HumanCard';
import EmptyState from '../../../components/shared/EmptyState';
import PulseIndicator from '../../../components/shared/PulseIndicator';
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

function formatTs(ts: string) {
  return dayjs(ts).format('MMM D, YYYY h:mm:ss A');
}

function JsonBlock({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  let pretty = value;
  try { pretty = JSON.stringify(JSON.parse(value), null, 2); } catch { /* leave as-is */ }
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
      <pre style={{
        background: 'var(--bg-elevated, rgba(0,0,0,0.2))',
        borderRadius: 8,
        padding: '10px 12px',
        fontSize: 12,
        overflowX: 'auto',
        maxHeight: 240,
        margin: 0,
        color: 'var(--text-primary)',
        border: '1px solid var(--border, rgba(255,255,255,0.08))',
      }}>
        {pretty}
      </pre>
    </div>
  );
}

export default function SystemLogsPage() {
  const isMobile = useIsMobile();
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>();
  const [entityType, setEntityType] = useState<string>();
  const [selected, setSelected] = useState<SystemLog | null>(null);
  const { message } = App.useApp();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await developerApi.getSystemLogs({ pageSize: 100, category, entityType });
      const items = (data as { items?: SystemLog[] }).items ?? (Array.isArray(data) ? data as SystemLog[] : []);
      setLogs(items);
    } catch {
      message.error('Failed to load system logs');
    } finally {
      setLoading(false);
    }
  }, [category, entityType, message]);

  useEffect(() => { void load(); }, [load]);

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 200,
      render: (d: string) => (
        <span style={{ fontFamily: 'monospace', fontSize: 12, whiteSpace: 'nowrap' }}>
          {formatTs(d)}
        </span>
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
      render: (v: number | undefined) => v != null ? `${v}ms` : '—',
    },
  ];

  return (
    <div className="spring-up">
      <PageHeader 
        title="DevCore: System Pulse" 
        subtitle={[
          "Audit trail and system events across all nodes.",
          "Monitoring API latency and background worker health.",
          "Live stream of operational changes and migrations."
        ]}
        rotateSubtitle
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
        <HumanCard className="human-noise" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>API Node</div>
            <PulseIndicator status="success" size={6} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>99.9<span style={{ fontSize: 14, fontWeight: 500 }}>%</span></div>
          <div style={{ fontSize: 12, color: 'var(--accent-green)', fontWeight: 600 }}>Up for 12d 4h</div>
        </HumanCard>
        <HumanCard className="human-noise" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Worker Queue</div>
            <PulseIndicator status="calm" size={6} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>0<span style={{ fontSize: 14, fontWeight: 500 }}> ms</span></div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Processing normally</div>
        </HumanCard>
        <HumanCard className="human-noise" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Memory</div>
            <PulseIndicator status="warning" size={6} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>74<span style={{ fontSize: 14, fontWeight: 500 }}>%</span></div>
          <div style={{ fontSize: 12, color: 'var(--accent-gold)', fontWeight: 600 }}>Spiking in Node-02</div>
        </HumanCard>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: 16, 
        marginBottom: 32, 
        flexWrap: 'wrap', 
        alignItems: 'center',
        background: 'var(--bg-surface)',
        padding: '16px 24px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flex: 1 }}>
          <Select
            placeholder="All Categories"
            allowClear
            variant="borderless"
            style={{ minWidth: 160, background: 'var(--bg-soft)', borderRadius: 'var(--radius-full)', padding: '4px 12px' }}
            onChange={setCategory}
            options={['EntityChange', 'BackgroundWorker', 'Cache', 'MockService', 'Migration'].map((s) => ({ label: s, value: s }))}
          />
          <Select
            placeholder="All Entities"
            allowClear
            variant="borderless"
            style={{ minWidth: 160, background: 'var(--bg-soft)', borderRadius: 'var(--radius-full)', padding: '4px 12px' }}
            onChange={setEntityType}
            options={['Event', 'Booking', 'User', 'Venue', 'Payment', 'Image'].map((s) => ({ label: s, value: s }))}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-green)' }} />
          <span>{loading ? 'Polling...' : 'System Nominal'}</span>
        </div>
      </div>

      {isMobile ? (
        <Spin spinning={loading}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {logs.map((log) => (
              <HumanCard
                key={log.id}
                className="human-noise"
                onClick={() => setSelected(log)}
                style={{ padding: '16px', borderLeft: `4px solid ${log.category === 'BackgroundWorker' ? 'var(--accent-rose)' : 'var(--border)'}` }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ 
                    padding: '2px 8px', 
                    borderRadius: 4, 
                    background: 'var(--bg-soft)', 
                    fontSize: 10, 
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase'
                  }}>
                    {log.category}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{log.entityType}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'monospace' }}>
                  {log.action}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {formatTs(log.timestamp)}
                  </div>
                  {log.durationMs != null && (
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>{log.durationMs}ms</div>
                  )}
                </div>
              </HumanCard>
            ))}
            {logs.length === 0 && !loading && (
              <EmptyState title="No system events" description="Platform is quiet. No logs recorded for this period." actionLabel="Clear Filters" onAction={() => { setCategory(undefined); setEntityType(undefined); }} />
            )}
          </div>
        </Spin>
      ) : (
        <div className="responsive-table">
          <Table
            dataSource={logs}
            columns={columns}
            rowKey="id"
            loading={loading}
            size="small"
            scroll={{ x: 800 }}
            pagination={{ pageSize: 50, showSizeChanger: true }}
            onRow={(record) => ({ onClick: () => setSelected(record), style: { cursor: 'pointer' } })}
          />
        </div>
      )}

      <Modal
        open={!!selected}
        onCancel={() => setSelected(null)}
        footer={null}
        title={
          <span>
            <Tag color={categoryColors[selected?.category ?? ''] ?? 'default'} style={{ marginRight: 8 }}>
              {selected?.category}
            </Tag>
            {selected?.action}
          </span>
        }
        width={isMobile ? '95vw' : 700}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        {selected && (
          <div>
            <Descriptions column={isMobile ? 1 : 2} size="small" bordered style={{ marginBottom: 12 }}>
              <Descriptions.Item label="Timestamp" span={isMobile ? 1 : 2}>
                <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{formatTs(selected.timestamp)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Category">{selected.category}</Descriptions.Item>
              <Descriptions.Item label="Action">{selected.action}</Descriptions.Item>
              <Descriptions.Item label="Entity Type">{selected.entityType ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Entity ID">
                <span style={{ fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all' }}>{selected.entityId ?? '—'}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Source" span={isMobile ? 1 : 2}>{selected.source ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Actor ID">
                <span style={{ fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all' }}>{selected.actorId ?? '—'}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Correlation ID">
                <span style={{ fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all' }}>{selected.correlationId ?? '—'}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Duration">
                {selected.durationMs != null ? `${selected.durationMs}ms` : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Log ID">
                <span style={{ fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all' }}>{selected.id}</span>
              </Descriptions.Item>
            </Descriptions>

            <JsonBlock label="Before" value={selected.beforeJson} />
            <JsonBlock label="After" value={selected.afterJson} />
            <JsonBlock label="Metadata" value={selected.metadataJson} />
          </div>
        )}
      </Modal>
    </div>
  );
}
