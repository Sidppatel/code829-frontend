import { useState } from 'react';
import { Table, Tag, Input, Pagination, Spin, Modal, Descriptions, Button } from 'antd';
import { SearchOutlined, InfoCircleOutlined, RedoOutlined } from '@ant-design/icons';
import { developerApi } from '../../services/api';
import { usePagedTable } from '@code829/shared/hooks/usePagedTable';
import { useIsMobile } from '@code829/shared/hooks/useIsMobile';
import type { DevLogEntry, DevLogParams } from '@code829/shared/services/developerApi';
import HumanCard from '@code829/shared/components/shared/HumanCard';
import EmptyState from '@code829/shared/components/shared/EmptyState';
import PageHeader from '@code829/shared/components/shared/PageHeader';
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
  const { data, total, page, pageSize, loading, setPage, setPageSize, setFilters, filters, refresh } =
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
        title="Error Logs"
        subtitle={[
          "Real-time application health and error tracking.",
          "Analyzing request throughput and endpoint latency.",
          "Monitoring exception patterns across the cluster."
        ]}
        rotateSubtitle
      />

      <div style={{ 
        display: 'flex', 
        gap: 12, 
        marginBottom: 20, 
        flexWrap: 'wrap', 
        alignItems: 'center',
        padding: '12px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        background: 'var(--bg-soft)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <Input
          placeholder="Filter by endpoint path (e.g. /api/events)..."
          prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
          variant="borderless"
          allowClear
          onChange={(e) => setFilters({ path: e.target.value || undefined })}
          style={{ flex: 1, minWidth: 200, height: 40, fontSize: 14, background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['Info', 'Warning', 'Error', 'Critical'].map(level => {
            const isActive = filters.severity === level;
            const color = severityColors[level];
            return (
              <div 
                key={level}
                onClick={() => setFilters({ severity: isActive ? undefined : level as DevLogParams['severity'] })}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  background: isActive ? `${color}15` : 'var(--bg-surface)',
                  border: '1px solid',
                  borderColor: isActive ? color : 'var(--border)',
                  fontSize: 12,
                  fontWeight: 700,
                  color: isActive ? color : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isActive ? `0 4px 12px ${color}20` : 'var(--shadow-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
                className="hover-lift press-state"
              >
                <div style={{ 
                  width: 6, 
                  height: 6, 
                  borderRadius: '50%', 
                  background: color,
                  opacity: isActive ? 1 : 0.5 
                }} />
                {level}
              </div>
            );
          })}
          <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />
          <Button 
            type="text" 
            icon={<RedoOutlined className={loading ? 'ant-spin' : ''} />} 
            onClick={refresh}
            style={{ 
              height: 38, 
              borderRadius: '12px', 
              fontWeight: 600,
              color: 'var(--text-secondary)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)'
            }}
          >
            Refresh
          </Button>
        </div>
      </div>

      {isMobile ? (
        <Spin spinning={loading}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.map((log) => (
              <HumanCard
                key={log.id}
                onClick={() => setSelected(log)}
                style={{ 
                  padding: 16,
                  borderLeft: `4px solid ${severityColors[log.severity]}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ 
                    fontSize: 10, 
                    fontWeight: 800, 
                    color: severityColors[log.severity],
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {log.severity}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {log.method && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-soft)', padding: '2px 6px', borderRadius: 4 }}>
                        {log.method}
                      </span>
                    )}
                    {log.statusCode && (
                      <span style={{ fontSize: 11, fontWeight: 800, color: log.statusCode >= 400 ? 'var(--accent-rose)' : 'var(--accent-green)' }}>
                        {log.statusCode}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'monospace', lineHeight: 1.4, wordBreak: 'break-word' }}>
                  {log.message}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
                    {log.path ?? 'System'}
                  </span>
                  <span>{formatTs(log.timestamp)}</span>
                </div>
              </HumanCard>
            ))}
            {data.length === 0 && !loading && (
              <EmptyState title="No logs found" description="Application stream is clear for these filters." actionLabel="Reset Filters" onAction={() => setFilters({})} />
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
            scroll={{ x: 'max-content' }}
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
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto', padding: isMobile ? '16px' : '24px' } }}
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Descriptions column={isMobile ? 1 : 2} size="small" bordered items={[
              { label: 'Timestamp', span: isMobile ? 1 : 2, children: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{formatTs(selected.timestamp)}</span> },
              { label: 'Level', children: <Tag color={severityColors[selected.severity] + '15'} style={{ color: severityColors[selected.severity], borderColor: severityColors[selected.severity] + '30', fontWeight: 700 }}>{selected.severity}</Tag> },
              { label: 'HTTP Status', children: <span style={{ fontWeight: 700, color: (selected.statusCode && selected.statusCode >= 400) ? 'var(--accent-rose)' : 'inherit' }}>{selected.statusCode ?? 'N/A'}</span> },
              { label: 'API Endpoint', span: isMobile ? 1 : 2, children: <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--primary)', wordBreak: 'break-all' }}>({selected.method}) {selected.path ?? 'System Internal'}</span> },
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
                wordBreak: 'break-word'
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
