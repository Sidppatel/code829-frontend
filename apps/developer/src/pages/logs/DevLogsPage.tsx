import { useState } from 'react';
import { Tag, Button, Descriptions } from 'antd';
import { InfoCircleOutlined, RedoOutlined } from '@ant-design/icons';
import type { DescriptionsItemType } from 'antd/es/descriptions';
import { developerApi } from '../../services/api';
import { usePagedTable } from '@code829/shared/hooks/usePagedTable';
import type { DevLogEntry, DevLogParams } from '@code829/shared/services/developerApi';
import HumanCard from '@code829/shared/components/shared/HumanCard';
import {
  DataTableSection,
  DetailModal,
  FilterBar,
  PageShell,
} from '@code829/shared/components/ui';
import dayjs from 'dayjs';
import { createLogger } from '@code829/shared/lib/logger';
import { LOG_SEVERITY_COLORS } from '@code829/shared/theme/statusColors';

const log = createLogger('Developer/LogsPage');
const SEVERITIES = ['Info', 'Warning', 'Error', 'Critical'] as const;

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

function buildLogDescriptions(selected: FullDevLog): DescriptionsItemType[] {
  const severityColor = LOG_SEVERITY_COLORS[selected.severity];
  return [
    {
      key: 'ts',
      label: 'Timestamp',
      span: 2,
      children: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{formatTs(selected.timestamp)}</span>,
    },
    {
      key: 'level',
      label: 'Level',
      children: (
        <Tag
          color={severityColor + '15'}
          style={{ color: severityColor, borderColor: severityColor + '30', fontWeight: 700 }}
        >
          {selected.severity}
        </Tag>
      ),
    },
    {
      key: 'status',
      label: 'HTTP Status',
      children: (
        <span style={{ fontWeight: 700, color: selected.statusCode && selected.statusCode >= 400 ? 'var(--accent-rose)' : 'inherit' }}>
          {selected.statusCode ?? 'N/A'}
        </span>
      ),
    },
    {
      key: 'endpoint',
      label: 'API Endpoint',
      span: 2,
      children: (
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--primary)', wordBreak: 'break-all' }}>
          ({selected.method}) {selected.path ?? 'System Internal'}
        </span>
      ),
    },
    { key: 'ip', label: 'Origin IP', children: selected.ipAddress ?? 'Hidden' },
    {
      key: 'user',
      label: 'Execution User',
      children: selected.userId ? (
        <span style={{ fontFamily: 'monospace' }}>{selected.userId}</span>
      ) : (
        'Anonymous'
      ),
    },
  ];
}

export default function DevLogsPage() {
  const [selected, setSelected] = useState<FullDevLog | null>(null);
  const paged = usePagedTable<FullDevLog, DevLogParams>({
    fetcher: developerApi.getDevLogs as Parameters<typeof usePagedTable<FullDevLog, DevLogParams>>[0]['fetcher'],
    defaultPageSize: 20,
  });

  const severityFilter = paged.filters.severity;
  const selectedSeverityColor = selected ? LOG_SEVERITY_COLORS[selected.severity] : 'var(--primary)';

  return (
    <PageShell
      title="Error Logs"
      documentTitle="Error Logs - Code829 Developer"
      subtitle={[
        'Real-time application health and error tracking.',
        'Analyzing request throughput and endpoint latency.',
        'Monitoring exception patterns across the cluster.',
      ]}
      rotateSubtitle
    >
      <FilterBar
        search={{
          placeholder: 'Filter by endpoint path (e.g. /api/events)...',
          onChange: (v) => paged.setFilters({ path: v }),
        }}
        chips={SEVERITIES.map((level) => ({
          key: level,
          label: level,
          active: severityFilter === level,
          onClick: () =>
            paged.setFilters({ severity: severityFilter === level ? undefined : (level as DevLogParams['severity']) }),
          dot: LOG_SEVERITY_COLORS[level],
        }))}
        actions={
          <Button
            type="text"
            icon={<RedoOutlined className={paged.loading ? 'ant-spin' : ''} />}
            onClick={paged.refresh}
            style={{ fontWeight: 600, color: 'var(--text-secondary)' }}
          >
            Refresh
          </Button>
        }
      />
      <DataTableSection<FullDevLog>
        data={paged.data}
        total={paged.total}
        page={paged.page}
        pageSize={paged.pageSize}
        loading={paged.loading}
        onPageChange={paged.onPageChange}
        rowKey="id"
        onRowClick={(r) => { log.info('Viewing log detail', { id: r.id, severity: r.severity }); setSelected(r); }}
        columns={[
          {
            title: 'Timestamp',
            dataIndex: 'timestamp',
            key: 'timestamp',
            width: 200,
            render: (d: string) => (
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{formatTs(d)}</span>
            ),
          },
          {
            title: 'Severity',
            dataIndex: 'severity',
            key: 'severity',
            width: 110,
            render: (s: string) => (
              <Tag
                color={LOG_SEVERITY_COLORS[s] + '15'}
                style={{
                  color: LOG_SEVERITY_COLORS[s],
                  borderColor: LOG_SEVERITY_COLORS[s] + '30',
                  fontWeight: 700,
                  borderRadius: 6,
                  textTransform: 'uppercase',
                  fontSize: 10,
                  letterSpacing: '0.05em',
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
            render: (v: string) => <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{v}</span>,
          },
          {
            title: 'Path',
            dataIndex: 'path',
            key: 'path',
            width: 200,
            ellipsis: true,
            render: (v: string | undefined) => (
              <span style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'monospace' }}>{v ?? '—'}</span>
            ),
          },
          {
            title: 'Method',
            dataIndex: 'method',
            key: 'method',
            width: 80,
            render: (v: string) => (
              <Tag
                style={{
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-soft)',
                  borderColor: 'var(--border)',
                  borderRadius: 4,
                  fontSize: 11,
                }}
              >
                {v}
              </Tag>
            ),
          },
          {
            title: 'Status',
            dataIndex: 'statusCode',
            key: 'statusCode',
            width: 70,
            render: (v: number | undefined) => (
              <span style={{ fontWeight: 700, color: v && v >= 400 ? 'var(--accent-rose)' : 'var(--text-muted)' }}>
                {v ?? '—'}
              </span>
            ),
          },
        ]}
        mobileCard={(logEntry) => (
          <HumanCard
            onClick={() => setSelected(logEntry)}
            style={{ padding: 16, borderLeft: `4px solid ${LOG_SEVERITY_COLORS[logEntry.severity]}` }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: LOG_SEVERITY_COLORS[logEntry.severity],
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {logEntry.severity}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {logEntry.method && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-soft)', padding: '2px 6px', borderRadius: 4 }}>
                    {logEntry.method}
                  </span>
                )}
                {logEntry.statusCode && (
                  <span style={{ fontSize: 11, fontWeight: 800, color: logEntry.statusCode >= 400 ? 'var(--accent-rose)' : 'var(--accent-green)' }}>
                    {logEntry.statusCode}
                  </span>
                )}
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'monospace', lineHeight: 1.4, wordBreak: 'break-word' }}>
              {logEntry.message}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
                {logEntry.path ?? 'System'}
              </span>
              <span>{formatTs(logEntry.timestamp)}</span>
            </div>
          </HumanCard>
        )}
        empty={{
          title: 'No logs found',
          description: 'Application stream is clear for these filters.',
          actionLabel: 'Reset Filters',
          onAction: () => paged.setFilters({}),
        }}
      />

      <DetailModal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Log Intelligence"
        subtitle={selected ? `Correlation ID: ${selected.correlationId?.slice(0, 8) ?? '—'}...` : undefined}
        tone={selectedSeverityColor}
        icon={<InfoCircleOutlined />}
        width={840}
        descriptions={selected ? buildLogDescriptions(selected) : undefined}
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Primary Message</div>
              <div
                style={{
                  background: 'var(--bg-soft)',
                  borderRadius: 12,
                  padding: '16px',
                  fontSize: 14,
                  color: 'var(--text-primary)',
                  lineHeight: 1.6,
                  border: '1px solid var(--border)',
                  wordBreak: 'break-word',
                }}
              >
                {selected.message}
              </div>
            </div>
            {selected.stackTrace && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-rose)', marginBottom: 8 }}>Trace Investigation</div>
                <pre
                  style={{
                    background: 'color-mix(in srgb, var(--accent-rose) 8%, var(--bg-surface))',
                    borderRadius: 12,
                    padding: '16px',
                    fontSize: 12,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    overflowX: 'auto',
                    maxHeight: 400,
                    margin: 0,
                    color: 'var(--accent-rose)',
                    border: '1px dashed color-mix(in srgb, var(--accent-rose) 24%, transparent)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {selected.stackTrace}
                </pre>
              </div>
            )}
            {selected.metadataJson && (() => {
              let pretty = selected.metadataJson;
              try {
                pretty = JSON.stringify(JSON.parse(selected.metadataJson), null, 2);
              } catch (err) {
                log.error('Failed to parse metadata JSON', err);
              }
              return (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Environment Metadata</div>
                  <pre
                    style={{
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
                    }}
                  >
                    {pretty}
                  </pre>
                </div>
              );
            })()}
            {/* Descriptions handled by DetailModal */}
            <Descriptions
              column={2}
              size="small"
              bordered
              items={buildLogDescriptions(selected)}
              style={{ display: 'none' }}
            />
          </div>
        )}
      </DetailModal>
    </PageShell>
  );
}
