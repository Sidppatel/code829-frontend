import { useState } from 'react';
import { Table, Tag, Input, Select, Pagination, Spin, Modal, Descriptions, Button } from 'antd';
import { SearchOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { developerApi } from '../../../services/api';
import { usePagedTable } from '../../../hooks/usePagedTable';
import { useIsMobile } from '../../../hooks/useIsMobile';
import type { DevLogEntry, DevLogParams } from '../../../services/developerApi';
import PageHeader from '../../../components/shared/PageHeader';
import HumanCard from '../../../components/shared/HumanCard';
import dayjs from 'dayjs';

const severityColors: Record<string, string> = {
  Info: '#3B82F6',
  Warning: '#F59E0B',
  Error: '#EF4444',
  Critical: '#8B5CF6',
  Debug: '#9CA3AF',
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
      defaultPageSize: 20,
    });

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 200,
      render: (d: string) => (
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
          {formatTs(d)}
        </span>
      ),
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      width: 110,
      render: (s: string) => (
        <Tag 
          color={severityColors[s] + '15'} 
          style={{ 
            color: severityColors[s], 
            borderColor: severityColors[s] + '30',
            fontWeight: 700,
            borderRadius: 6,
            textTransform: 'uppercase',
            fontSize: 10,
            letterSpacing: '0.05em'
          }}
        >
          {s}
        </Tag>
      ),
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (v: string) => <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{v}</span>
    },
    {
      title: 'Path',
      dataIndex: 'path',
      key: 'path',
      width: 200,
      ellipsis: true,
      render: (v: string | undefined) => (
        <span style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'monospace' }}>
          {v ?? '—'}
        </span>
      ),
    },
    { 
      title: 'Method', 
      dataIndex: 'method', 
      key: 'method', 
      width: 80,
      render: (v: string) => <Tag color="default" style={{ borderRadius: 4, fontSize: 11 }}>{v}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'statusCode',
      key: 'statusCode',
      width: 70,
      render: (v: number | undefined) => (
        <span style={{ fontWeight: 700, color: (v && v >= 400) ? 'var(--accent-rose)' : 'var(--text-muted)' }}>
          {v ?? '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="spring-up">
      <PageHeader 
        title="Application Logs" 
        subtitle="Real-time system health and error tracking. Click a row for deep-dive analysis." 
      />
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24, alignItems: 'center' }}>
        <Input
          placeholder="Filter by endpoint path..."
          prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
          allowClear
          onChange={(e) => setFilters({ path: e.target.value || undefined })}
          style={{ flex: '1 1 200px', maxWidth: 360, height: 44, borderRadius: 'var(--radius-md)' }}
        />
        <Select
          placeholder="Select Severity"
          allowClear
          style={{ flex: '0 0 160px', height: 44 }}
          className="human-select"
          onChange={(val) => setFilters({ severity: val })}
          options={['Warning', 'Error', 'Critical'].map((s) => ({ label: s, value: s }))}
        />
      </div>

      {isMobile ? (
        <Spin spinning={loading}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {data.map((log) => (
              <HumanCard
                key={log.id}
                onClick={() => setSelected(log)}
                style={{ padding: 16 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Tag 
                     color={severityColors[log.severity] + '15'} 
                     style={{ 
                       color: severityColors[log.severity], 
                       borderColor: severityColors[log.severity] + '30',
                       fontWeight: 700,
                       borderRadius: 6,
                       textTransform: 'uppercase',
                       fontSize: 10,
                       letterSpacing: '0.05em'
                     }}
                  >
                    {log.severity}
                  </Tag>
                  <span style={{ fontSize: 12, fontWeight: 700, color: (log.statusCode && log.statusCode >= 400) ? 'var(--accent-rose)' : 'var(--text-muted)' }}>
                    {log.method && <span style={{ marginRight: 6 }}>{log.method}</span>}
                    {log.statusCode ?? ''}
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.4 }}>
                  {log.message}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '50%', fontFamily: 'monospace' }}>
                    {log.path ?? ''}
                  </span>
                  <span>{formatTs(log.timestamp)}</span>
                </div>
              </HumanCard>
            ))}
            {data.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: 48 }}>No log entries found</div>
            )}
          </div>
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              current={page} pageSize={pageSize} total={total} size="small"
              onChange={(p, ps) => { setPage(p); setPageSize(ps); }}
              className="human-pagination"
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
            size="middle"
            scroll={{ x: 900 }}
            pagination={{
              current: page, pageSize, total,
              onChange: (p, ps) => { setPage(p); setPageSize(ps); },
              showSizeChanger: true,
              className: 'human-pagination'
            }}
            onRow={(record) => ({ onClick: () => setSelected(record), style: { cursor: 'pointer' } })}
          />
        </div>
      )}

      {/* Detail modal */}
      <Modal
        open={!!selected}
        onCancel={() => setSelected(null)}
        footer={[
          <Button key="close" onClick={() => setSelected(null)} style={{ borderRadius: 8 }}>
            Close
          </Button>
        ]}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 32, height: 32, borderRadius: 8, background: (severityColors[selected?.severity ?? ''] || 'var(--primary)') + '15',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: severityColors[selected?.severity ?? ''] || 'var(--primary)'
            }}>
              <InfoCircleOutlined />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Log Intelligence</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Correlation ID: {selected?.correlationId?.slice(0, 8)}...</div>
            </div>
          </div>
        }
        width={840}
        centered
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto', padding: '24px' } }}
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Descriptions column={isMobile ? 1 : 2} size="small" bordered items={[
              { label: 'Timestamp', span: 2, children: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{formatTs(selected.timestamp)}</span> },
              { label: 'Level', children: <Tag color={severityColors[selected.severity] + '15'} style={{ color: severityColors[selected.severity], borderColor: severityColors[selected.severity] + '30', fontWeight: 700 }}>{selected.severity}</Tag> },
              { label: 'HTTP Status', children: <span style={{ fontWeight: 700, color: (selected.statusCode && selected.statusCode >= 400) ? 'var(--accent-rose)' : 'inherit' }}>{selected.statusCode ?? 'N/A'}</span> },
              { label: 'API Endpoint', span: 2, children: <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--primary)', wordBreak: 'break-all' }}>({selected.method}) {selected.path ?? 'System Internal'}</span> },
              { label: 'Origin IP', children: selected.ipAddress ?? 'Hidden' },
              { label: 'Execution User', children: selected.userId ? <span style={{ fontFamily: 'monospace' }}>{selected.userId}</span> : 'Anonymous' },
            ]} />

            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Primary Message</div>
              <div style={{
                background: 'var(--bg-soft)',
                borderRadius: 12,
                padding: '16px',
                fontSize: 14,
                color: 'var(--text-primary)',
                lineHeight: 1.6,
                border: '1px solid var(--border)',
              }}>
                {selected.message}
              </div>
            </div>

            {selected.stackTrace && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-rose)', marginBottom: 8 }}>Trace Investigation</div>
                <pre style={{
                  background: 'rgba(239, 68, 68, 0.03)',
                  borderRadius: 12,
                  padding: '16px',
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  overflowX: 'auto',
                  maxHeight: 400,
                  margin: 0,
                  color: '#EF4444',
                  border: '1px dashed rgba(239, 68, 68, 0.2)',
                  whiteSpace: 'pre-wrap',
                }}>
                  {selected.stackTrace}
                </pre>
              </div>
            )}

            {selected.metadataJson && (() => {
              let pretty = selected.metadataJson;
              try { pretty = JSON.stringify(JSON.parse(selected.metadataJson), null, 2); } catch { /* leave */ }
              return (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Environment Metadata</div>
                  <pre style={{
                    background: 'var(--bg-soft)',
                    borderRadius: 12,
                    padding: '16px',
                    fontSize: 12,
                    fontFamily: "'JetBrains Mono', monospace",
                    overflowX: 'auto',
                    maxHeight: 250,
                    margin: 0,
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
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
