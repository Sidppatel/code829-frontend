import { Table, Tag, Input, Select, Card, Pagination, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { developerApi } from '../../../services/api';
import { usePagedTable } from '../../../hooks/usePagedTable';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { formatEventDate } from '../../../utils/date';
import type { DevLogEntry, DevLogParams } from '../../../services/developerApi';
import PageHeader from '../../../components/shared/PageHeader';

const severityColors: Record<string, string> = {
  Info: 'blue',
  Warning: 'gold',
  Error: 'red',
  Debug: 'default',
};

export default function DevLogsPage() {
  const isMobile = useIsMobile();
  const { data, total, page, pageSize, loading, setPage, setPageSize, setFilters } =
    usePagedTable<DevLogEntry, DevLogParams>({
      fetcher: developerApi.getDevLogs,
      defaultPageSize: 25,
    });

  const columns = [
    {
      title: 'Timestamp', dataIndex: 'timestamp', key: 'timestamp', width: 200,
      render: (d: string) => formatEventDate(d),
    },
    {
      title: 'Severity', dataIndex: 'severity', key: 'severity', width: 100,
      render: (s: string) => <Tag color={severityColors[s] ?? 'default'}>{s}</Tag>,
    },
    { title: 'Message', dataIndex: 'message', key: 'message', ellipsis: true },
    { title: 'Path', dataIndex: 'path', key: 'path', width: 200, render: (v: string | undefined) => v ?? '—' },
    { title: 'Method', dataIndex: 'method', key: 'method', width: 80 },
    {
      title: 'Status', dataIndex: 'statusCode', key: 'statusCode', width: 80,
      render: (v: number | undefined) => v ?? '—',
    },
  ];

  return (
    <div>
      <PageHeader title="Dev Logs" subtitle="Application request logs" />
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
          options={['Info', 'Warning', 'Error', 'Debug'].map((s) => ({ label: s, value: s }))}
        />
      </div>

      {isMobile ? (
        <Spin spinning={loading}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.map((log) => (
              <Card key={log.id} size="small" styles={{ body: { padding: 12 } }}>
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
                  <span>{formatEventDate(log.timestamp)}</span>
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
          />
        </div>
      )}
    </div>
  );
}
