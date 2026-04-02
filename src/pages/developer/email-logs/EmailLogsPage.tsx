import { useEffect, useState, useCallback } from 'react';
import { Table, Tag, Input, App } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { developerApi } from '../../../services/api';
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
      setTotal(data.total);
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
        style={{ width: 300, marginBottom: 16 }}
      />
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
    </div>
  );
}
