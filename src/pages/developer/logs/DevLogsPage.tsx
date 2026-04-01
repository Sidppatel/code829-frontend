import { Table, Tag, Input, Select, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { developerApi } from '../../../services/api';
import { usePagedTable } from '../../../hooks/usePagedTable';
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
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Filter by path..."
          prefix={<SearchOutlined />}
          allowClear
          onChange={(e) => setFilters({ path: e.target.value || undefined })}
          style={{ width: 240 }}
        />
        <Select
          placeholder="Severity"
          allowClear
          style={{ width: 140 }}
          onChange={(val) => setFilters({ severity: val })}
          options={['Info', 'Warning', 'Error', 'Debug'].map((s) => ({ label: s, value: s }))}
        />
      </Space>
      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="small"
        pagination={{
          current: page, pageSize, total,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          showSizeChanger: true,
        }}
      />
    </div>
  );
}
