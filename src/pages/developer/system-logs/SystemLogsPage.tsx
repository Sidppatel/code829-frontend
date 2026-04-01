import { useEffect, useState, useCallback } from 'react';
import { Table, Select, Space, App } from 'antd';
import { developerApi } from '../../../services/api';
import { formatEventDate } from '../../../utils/date';
import PageHeader from '../../../components/shared/PageHeader';

interface SystemLog {
  id: string;
  timestamp: string;
  category: string;
  entityType: string;
  entityId: string;
  action: string;
  details?: string;
  userId?: string;
}

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>();
  const [entityType, setEntityType] = useState<string>();
  const { message } = App.useApp();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await developerApi.getSystemLogs({ pageSize: 100, category, entityType });
      setLogs(Array.isArray(data) ? data : data.items ?? []);
    } catch {
      message.error('Failed to load system logs');
    } finally {
      setLoading(false);
    }
  }, [category, entityType, message]);

  useEffect(() => { void load(); }, [load]);

  const columns = [
    {
      title: 'Timestamp', dataIndex: 'timestamp', key: 'timestamp', width: 200,
      render: (d: string) => formatEventDate(d),
    },
    { title: 'Category', dataIndex: 'category', key: 'category', width: 120 },
    { title: 'Entity', dataIndex: 'entityType', key: 'entityType', width: 120 },
    { title: 'Action', dataIndex: 'action', key: 'action', width: 140 },
    { title: 'Details', dataIndex: 'details', key: 'details', ellipsis: true },
  ];

  return (
    <div>
      <PageHeader title="System Logs" subtitle="Audit trail and system events" />
      <Space style={{ marginBottom: 16 }}>
        <Select placeholder="Category" allowClear style={{ width: 160 }}
          onChange={setCategory}
          options={['Auth', 'Booking', 'Event', 'Payment', 'System'].map((s) => ({ label: s, value: s }))}
        />
        <Select placeholder="Entity Type" allowClear style={{ width: 160 }}
          onChange={setEntityType}
          options={['Event', 'Booking', 'User', 'Venue', 'Payment'].map((s) => ({ label: s, value: s }))}
        />
      </Space>
      <Table dataSource={logs} columns={columns} rowKey="id" loading={loading} size="small"
        pagination={{ pageSize: 50, showSizeChanger: true }}
      />
    </div>
  );
}
