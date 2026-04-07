import { useEffect, useState, useCallback } from 'react';
import { Table, Tag, Input, Card, Pagination, Spin, Modal, Descriptions, App } from 'antd';
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
  const [selected, setSelected] = useState<EmailLogEntry | null>(null);
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
      title: 'Sent At', dataIndex: 'timestamp', key: 'timestamp',
      render: (d: string) => formatEventDate(d),
    },
  ];

  return (
    <div>
      <PageHeader title="Email Logs" subtitle="Sent email history — click a row for full details" />
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
              <Card
                key={log.id}
                size="small"
                styles={{ body: { padding: 12 } }}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelected(log)}
              >
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
                  {formatEventDate(log.timestamp)}
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
            onRow={(record) => ({ onClick: () => setSelected(record), style: { cursor: 'pointer' } })}
          />
        </div>
      )}

      <Modal
        open={!!selected}
        onCancel={() => setSelected(null)}
        footer={null}
        title={
          <span>
            <Tag color={statusColors[selected?.status ?? ''] ?? 'default'} style={{ marginRight: 8 }}>
              {selected?.status}
            </Tag>
            Email Details
          </span>
        }
        width={isMobile ? '95vw' : 700}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        {selected && (
          <div>
            <Descriptions column={isMobile ? 1 : 2} size="small" bordered style={{ marginBottom: 12 }}>
              <Descriptions.Item label="Recipient" span={isMobile ? 1 : 2}>{selected.recipient}</Descriptions.Item>
              <Descriptions.Item label="Subject" span={isMobile ? 1 : 2}>{selected.subject}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={statusColors[selected.status] ?? 'default'}>{selected.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Sent At">
                <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{formatEventDate(selected.timestamp)}</span>
              </Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Body</div>
              <div
                style={{
                  background: 'var(--bg-elevated, rgba(0,0,0,0.2))',
                  borderRadius: 8,
                  padding: '12px 14px',
                  fontSize: 13,
                  overflowX: 'auto',
                  maxHeight: 300,
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border, rgba(255,255,255,0.08))',
                  lineHeight: 1.6,
                }}
                dangerouslySetInnerHTML={{ __html: selected.body }}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
