import { useEffect, useState, useCallback } from 'react';
import { Table, Tag, Input, Card, Pagination, Spin, App } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { developerApi } from '../../../services/api';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { formatEventDate } from '../../../utils/date';
import type { EmailLogEntry } from '../../../services/developerApi';
import PageHeader from '../../../components/shared/PageHeader';

const statusColors: Record<string, string> = {
  Sent: 'green',
  Failed: 'red',
  Pending: 'gold',
  Queued: 'blue',
};

export default function EmailLogsPage() {
  const isMobile = useIsMobile();
  const [logs, setLogs] = useState<EmailLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [recipient, setRecipient] = useState<string>();
  const [loading, setLoading] = useState(true);
  const { message } = App.useApp();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await developerApi.getEmailLogs({ page, pageSize, recipient });
      setLogs(data.items);
      setTotal(data.totalCount);
    } catch {
      message.error('Failed to load email logs');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, recipient, message]);

  useEffect(() => { void load(); }, [load]);

  const columns = [
    { title: 'Recipient', dataIndex: 'recipient', key: 'recipient' },
    { title: 'Subject', dataIndex: 'subject', key: 'subject', ellipsis: true },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string) => <Tag color={statusColors[s] ?? 'default'}>{s}</Tag>,
    },
    {
      title: 'Sent At', dataIndex: 'sentAt', key: 'sentAt',
      render: (d: string) => formatEventDate(d),
    },
  ];

  return (
    <div>
      <PageHeader title="Email Logs" subtitle="Sent email history" />
      <Input
        placeholder="Filter by recipient..."
        prefix={<SearchOutlined />}
        allowClear
        onChange={(e) => { setRecipient(e.target.value || undefined); setPage(1); }}
        style={{ maxWidth: 300, width: '100%', marginBottom: 16 }}
      />

      {isMobile ? (
        <Spin spinning={loading}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {logs.map((log) => (
              <Card key={log.id} size="small" styles={{ body: { padding: 12 } }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
                    {log.recipient}
                  </span>
                  <Tag color={statusColors[log.status] ?? 'default'}>{log.status}</Tag>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {log.subject}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {formatEventDate(log.sentAt)}
                </div>
              </Card>
            ))}
            {logs.length === 0 && !loading && (
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
            dataSource={logs}
            columns={columns}
            rowKey="id"
            loading={loading}
            size="small"
            scroll={{ x: 600 }}
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
