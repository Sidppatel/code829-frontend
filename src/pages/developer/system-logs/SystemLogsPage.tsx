import { useEffect, useState, useCallback } from 'react';
import { Table, Select, Card, Tag, Spin, App } from 'antd';
import { developerApi } from '../../../services/api';
import { useIsMobile } from '../../../hooks/useIsMobile';
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

const categoryColors: Record<string, string> = {
  Auth: 'purple',
  Booking: 'blue',
  Event: 'green',
  Payment: 'gold',
  System: 'default',
};

export default function SystemLogsPage() {
  const isMobile = useIsMobile();
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <Select placeholder="Category" allowClear style={{ flex: '1 1 140px', maxWidth: 200 }}
          onChange={setCategory}
          options={['Auth', 'Booking', 'Event', 'Payment', 'System'].map((s) => ({ label: s, value: s }))}
        />
        <Select placeholder="Entity Type" allowClear style={{ flex: '1 1 140px', maxWidth: 200 }}
          onChange={setEntityType}
          options={['Event', 'Booking', 'User', 'Venue', 'Payment'].map((s) => ({ label: s, value: s }))}
        />
      </div>

      {isMobile ? (
        <Spin spinning={loading}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {logs.map((log) => (
              <Card key={log.id} size="small" styles={{ body: { padding: 12 } }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Tag color={categoryColors[log.category] ?? 'default'}>{log.category}</Tag>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{log.entityType}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {log.action}
                </div>
                {log.details && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, wordBreak: 'break-word' }}>
                    {log.details}
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {formatEventDate(log.timestamp)}
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
          <Table dataSource={logs} columns={columns} rowKey="id" loading={loading} size="small"
            scroll={{ x: 700 }}
            pagination={{ pageSize: 50, showSizeChanger: true }}
          />
        </div>
      )}
    </div>
  );
}
