import { useEffect, useState, useCallback } from 'react';
import { Table, Select, Card, Tag, Spin, Modal, Descriptions, App } from 'antd';
import { developerApi } from '../../../services/api';
import { useIsMobile } from '../../../hooks/useIsMobile';
import PageHeader from '../../../components/shared/PageHeader';
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
    <div>
      <PageHeader title="System Logs" subtitle="Audit trail and system events — click a row for full details" />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <Select
          placeholder="Category"
          allowClear
          style={{ flex: '1 1 140px', maxWidth: 200 }}
          onChange={setCategory}
          options={['EntityChange', 'BackgroundWorker', 'Cache', 'MockService', 'Migration'].map((s) => ({ label: s, value: s }))}
        />
        <Select
          placeholder="Entity Type"
          allowClear
          style={{ flex: '1 1 140px', maxWidth: 200 }}
          onChange={setEntityType}
          options={['Event', 'Booking', 'User', 'Venue', 'Payment', 'Image'].map((s) => ({ label: s, value: s }))}
        />
      </div>

      {isMobile ? (
        <Spin spinning={loading}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {logs.map((log) => (
              <Card
                key={log.id}
                size="small"
                styles={{ body: { padding: 12 } }}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelected(log)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Tag color={categoryColors[log.category] ?? 'default'}>{log.category}</Tag>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{log.entityType}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {log.action}
                </div>
                {log.source && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    {log.source}
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {formatTs(log.timestamp)}
                  {log.durationMs != null && <span style={{ marginLeft: 8 }}>{log.durationMs}ms</span>}
                </div>
              </Card>
            ))}
            {logs.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No data</div>
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
        width={700}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        {selected && (
          <div>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 12 }}>
              <Descriptions.Item label="Timestamp" span={2}>
                <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{formatTs(selected.timestamp)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Category">{selected.category}</Descriptions.Item>
              <Descriptions.Item label="Action">{selected.action}</Descriptions.Item>
              <Descriptions.Item label="Entity Type">{selected.entityType ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Entity ID">
                <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{selected.entityId ?? '—'}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Source" span={2}>{selected.source ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Actor ID">
                <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{selected.actorId ?? '—'}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Correlation ID">
                <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{selected.correlationId ?? '—'}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Duration">
                {selected.durationMs != null ? `${selected.durationMs}ms` : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Log ID">
                <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{selected.id}</span>
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
