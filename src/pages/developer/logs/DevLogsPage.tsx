import { useState } from 'react';
import { Table, Tag, Input, Select, Card, Pagination, Spin, Modal, Descriptions } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { developerApi } from '../../../services/api';
import { usePagedTable } from '../../../hooks/usePagedTable';
import { useIsMobile } from '../../../hooks/useIsMobile';
import type { DevLogEntry, DevLogParams } from '../../../services/developerApi';
import PageHeader from '../../../components/shared/PageHeader';
import dayjs from 'dayjs';

const severityColors: Record<string, string> = {
  Info: 'blue',
  Warning: 'gold',
  Error: 'red',
  Critical: 'magenta',
  Debug: 'default',
};

function formatTs(ts: string) {
  return dayjs(ts).format('MMM D, YYYY h:mm:ss A');
}

interface FullDevLog extends DevLogEntry {
  exceptionType?: string;
  stackTrace?: string;
  userId?: string;
  ipAddress?: string;
  correlationId?: string;
  metadataJson?: string;
}

export default function DevLogsPage() {
  const isMobile = useIsMobile();
  const [selected, setSelected] = useState<FullDevLog | null>(null);
  const { data, total, page, pageSize, loading, setPage, setPageSize, setFilters } =
    usePagedTable<FullDevLog, DevLogParams>({
      fetcher: developerApi.getDevLogs as Parameters<typeof usePagedTable<FullDevLog, DevLogParams>>[0]['fetcher'],
      defaultPageSize: 25,
    });

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
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (s: string) => <Tag color={severityColors[s] ?? 'default'}>{s}</Tag>,
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
    },
    {
      title: 'Path',
      dataIndex: 'path',
      key: 'path',
      width: 200,
      ellipsis: true,
      render: (v: string | undefined) => v ?? '—',
    },
    { title: 'Method', dataIndex: 'method', key: 'method', width: 80 },
    {
      title: 'Status',
      dataIndex: 'statusCode',
      key: 'statusCode',
      width: 70,
      render: (v: number | undefined) => v ?? '—',
    },
  ];

  return (
    <div>
      <PageHeader title="Dev Logs" subtitle="Application error logs — click a row for full details" />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <Input
          placeholder="Filter by path..."
          prefix={<SearchOutlined />}
          allowClear
          onChange={(e) => setFilters({ path: e.target.value || undefined })}
          style={{ flex: '1 1 200px', maxWidth: 300 }}
        />
        <Select
          placeholder="Severity"
          allowClear
          style={{ flex: '0 0 140px' }}
          onChange={(val) => setFilters({ severity: val })}
          options={['Warning', 'Error', 'Critical'].map((s) => ({ label: s, value: s }))}
        />
      </div>

      {isMobile ? (
        <Spin spinning={loading}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.map((log) => (
              <Card
                key={log.id}
                size="small"
                styles={{ body: { padding: 12 } }}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelected(log)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Tag color={severityColors[log.severity] ?? 'default'}>{log.severity}</Tag>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {log.method && <span style={{ marginRight: 6, fontWeight: 600 }}>{log.method}</span>}
                    {log.statusCode ?? ''}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 4, wordBreak: 'break-word' }}>
                  {log.message}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
                    {log.path ?? ''}
                  </span>
                  <span>{formatTs(log.timestamp)}</span>
                </div>
              </Card>
            ))}
            {data.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No data</div>
            )}
          </div>
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              current={page} pageSize={pageSize} total={total} size="small"
              onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
            />
          </div>
        </Spin>
      ) : (
        <div className="responsive-table">
          <Table
            dataSource={data}
            columns={columns}
            rowKey="id"
            loading={loading}
            size="small"
            scroll={{ x: 800 }}
            pagination={{
              current: page, pageSize, total,
              onChange: (p, ps) => { setPage(p); setPageSize(ps); },
              showSizeChanger: true,
            }}
            onRow={(record) => ({ onClick: () => setSelected(record), style: { cursor: 'pointer' } })}
          />
        </div>
      )}

      {/* Detail modal */}
      <Modal
        open={!!selected}
        onCancel={() => setSelected(null)}
        footer={null}
        title={
          <span>
            <Tag color={severityColors[selected?.severity ?? ''] ?? 'default'} style={{ marginRight: 8 }}>
              {selected?.severity}
            </Tag>
            {selected?.method && (
              <Tag style={{ marginRight: 8 }}>{selected.method}</Tag>
            )}
            {selected?.path ?? 'Log Detail'}
          </span>
        }
        width={780}
        styles={{ body: { maxHeight: '75vh', overflowY: 'auto' } }}
      >
        {selected && (
          <div>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Timestamp" span={2}>
                <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{formatTs(selected.timestamp)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Severity">
                <Tag color={severityColors[selected.severity] ?? 'default'}>{selected.severity}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status Code">{selected.statusCode ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Method">{selected.method ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Path">
                <span style={{ fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>
                  {selected.path ?? '—'}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Exception Type" span={2}>
                {selected.exceptionType ?? '—'}
              </Descriptions.Item>
              <Descriptions.Item label="User ID">
                <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{selected.userId ?? '—'}</span>
              </Descriptions.Item>
              <Descriptions.Item label="IP Address">
                <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{selected.ipAddress ?? '—'}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Correlation ID" span={2}>
                <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{selected.correlationId ?? '—'}</span>
              </Descriptions.Item>
            </Descriptions>

            {/* Message */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Message</div>
              <div style={{
                background: 'var(--bg-elevated, rgba(0,0,0,0.2))',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 13,
                color: 'var(--text-primary)',
                wordBreak: 'break-word',
                border: '1px solid var(--border, rgba(255,255,255,0.08))',
              }}>
                {selected.message}
              </div>
            </div>

            {/* Stack Trace */}
            {selected.stackTrace && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Stack Trace</div>
                <pre style={{
                  background: 'var(--bg-elevated, rgba(0,0,0,0.2))',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontSize: 11,
                  overflowX: 'auto',
                  maxHeight: 300,
                  margin: 0,
                  color: '#ff7875',
                  border: '1px solid rgba(255,120,120,0.15)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}>
                  {selected.stackTrace}
                </pre>
              </div>
            )}

            {/* Metadata */}
            {selected.metadataJson && (() => {
              let pretty = selected.metadataJson;
              try { pretty = JSON.stringify(JSON.parse(selected.metadataJson), null, 2); } catch { /* leave */ }
              return (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Metadata</div>
                  <pre style={{
                    background: 'var(--bg-elevated, rgba(0,0,0,0.2))',
                    borderRadius: 8,
                    padding: '10px 12px',
                    fontSize: 12,
                    overflowX: 'auto',
                    maxHeight: 200,
                    margin: 0,
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border, rgba(255,255,255,0.08))',
                  }}>
                    {pretty}
                  </pre>
                </div>
              );
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
}
