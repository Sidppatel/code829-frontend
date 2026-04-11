import { useEffect, useState, useCallback } from 'react';
import { Table, Tag, Input, Pagination, Spin, Modal, Descriptions, App, Button } from 'antd';
import { SearchOutlined, MailOutlined } from '@ant-design/icons';
import { developerApi } from '../../../services/api';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { formatEventDate } from '../../../utils/date';
import type { EmailLogEntry } from '../../../services/developerApi';
import PageHeader from '../../../components/shared/PageHeader';
import HumanCard from '../../../components/shared/HumanCard';

const statusColors: Record<string, string> = {
  Sent: '#10B981',
  Failed: '#EF4444',
  Pending: '#F59E0B',
  Queued: '#3B82F6',
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
    { 
      title: 'Recipient', 
      dataIndex: 'recipient', 
      key: 'recipient',
      render: (v: string) => <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{v}</span>
    },
    { title: 'Subject', dataIndex: 'subject', key: 'subject', ellipsis: true },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string) => (
        <Tag 
          color={statusColors[s] + '15'} 
          style={{ 
            color: statusColors[s], 
            borderColor: statusColors[s] + '30',
            fontWeight: 700,
            borderRadius: 6,
            textTransform: 'uppercase',
            fontSize: 10
          }}
        >
          {s}
        </Tag>
      ),
    },
    {
      title: 'Sent At', dataIndex: 'timestamp', key: 'timestamp',
      render: (d: string) => (
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          {formatEventDate(d)}
        </span>
      ),
    },
  ];

  return (
    <div className="spring-up">
      <PageHeader title="Email Delivery" subtitle="Comprehensive audit trail for platform notifications and guest communications." />
      
      <Input
        placeholder="Search by recipient email..."
        prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
        allowClear
        onChange={(e) => { setRecipient(e.target.value || undefined); setPage(1); }}
        style={{ maxWidth: 360, width: '100%', marginBottom: 24, height: 44, borderRadius: 'var(--radius-md)' }}
      />

      {isMobile ? (
        <Spin spinning={loading}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {logs.map((log) => (
              <HumanCard
                key={log.id}
                onClick={() => setSelected(log)}
                style={{ padding: 16 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
                    {log.recipient}
                  </span>
                  <Tag 
                    color={statusColors[log.status] + '15'} 
                    style={{ 
                      color: statusColors[log.status], 
                      borderColor: statusColors[log.status] + '30',
                      fontWeight: 700,
                      borderRadius: 6,
                      textTransform: 'uppercase',
                      fontSize: 10
                    }}
                  >
                    {log.status}
                  </Tag>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {log.subject}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {formatEventDate(log.timestamp)}
                </div>
              </HumanCard>
            ))}
            {logs.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>No communication logs found</div>
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
            dataSource={logs}
            columns={columns}
            rowKey="id"
            loading={loading}
            size="middle"
            scroll={{ x: 700 }}
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
              width: 32, height: 32, borderRadius: 8, background: (statusColors[selected?.status ?? ''] || 'var(--primary)') + '15',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: statusColors[selected?.status ?? ''] || 'var(--primary)'
            }}>
              <MailOutlined />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>Communication Detail</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>Status ID: {selected?.id.slice(0, 8)}</div>
            </div>
          </div>
        }
        width={isMobile ? '95vw' : 760}
        centered
        styles={{ body: { maxHeight: '75vh', overflowY: 'auto', padding: '24px' } }}
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Descriptions column={isMobile ? 1 : 2} size="small" bordered items={[
              { label: 'To', span: 2, children: <span style={{ fontWeight: 600 }}>{selected.recipient}</span> },
              { label: 'Subject', span: 2, children: selected.subject },
              { label: 'Delivery Status', children: <Tag color={statusColors[selected.status] + '15'} style={{ color: statusColors[selected.status], borderColor: statusColors[selected.status] + '30', fontWeight: 700 }}>{selected.status}</Tag> },
              { label: 'Timestamp', children: <span style={{ fontFamily: 'monospace' }}>{formatEventDate(selected.timestamp)}</span> },
            ]} />
            
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Message Content</div>
              <div
                style={{
                  background: 'var(--bg-soft)',
                  borderRadius: 12,
                  padding: '20px',
                  fontSize: 14,
                  overflowX: 'auto',
                  maxHeight: 400,
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  lineHeight: 1.7,
                  fontFamily: "'Inter', sans-serif"
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
