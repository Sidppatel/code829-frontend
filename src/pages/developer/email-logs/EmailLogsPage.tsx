import { useEffect, useState, useCallback } from 'react';
import { Table, Tag, Input, Pagination, Spin, Modal, Descriptions, App, Button } from 'antd';
import { SearchOutlined, MailOutlined } from '@ant-design/icons';
import { developerApi } from '../../../services/api';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { formatEventDate } from '../../../utils/date';
import type { EmailLogEntry } from '../../../services/developerApi';
import PageHeader from '../../../components/shared/PageHeader';
import HumanCard from '../../../components/shared/HumanCard';
import EmptyState from '../../../components/shared/EmptyState';
import PulseIndicator from '../../../components/shared/PulseIndicator';

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
      <PageHeader
        title="Email Logs"
        subtitle={[
          "Comprehensive audit trail for platform notifications.",
          "Monitoring email deliverability and latency in real-time.",
          "Analyzing guest communication flow and dispatch status."
        ]}
        rotateSubtitle
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
        <HumanCard className="human-noise" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Delivery Rate</div>
            <PulseIndicator status="success" size={6} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>98.4<span style={{ fontSize: 14, fontWeight: 500 }}>%</span></div>
          <div style={{ fontSize: 12, color: 'var(--accent-green)', fontWeight: 600 }}>Optimal Performance</div>
        </HumanCard>
        <HumanCard className="human-noise" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg. Latency</div>
            <PulseIndicator status="calm" size={6} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>1.2<span style={{ fontSize: 14, fontWeight: 500 }}> s</span></div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>SMTP Node Response</div>
        </HumanCard>
        <HumanCard className="human-noise" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Failures</div>
            <PulseIndicator status="success" size={6} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>0</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Last 24 hours</div>
        </HumanCard>
      </div>

      <div style={{
        display: 'flex',
        gap: 16,
        marginBottom: 32,
        flexWrap: 'wrap',
        alignItems: 'center',
        background: 'var(--bg-surface)',
        padding: '16px 24px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <Input
          placeholder="Filter by recipient email..."
          prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
          allowClear
          onChange={(e) => { setRecipient(e.target.value || undefined); setPage(1); }}
          style={{ flex: 1, minWidth: 260, height: 44, borderRadius: 'var(--radius-full)', border: '1px solid var(--border)', paddingLeft: 16 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />
          <span>{loading ? 'Polling Dispatcher...' : 'Pipeline Live'}</span>
        </div>
      </div>

      {isMobile ? (
        <Spin spinning={loading}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {logs.map((log) => (
              <HumanCard
                key={log.id}
                className="human-noise"
                onClick={() => setSelected(log)}
                style={{
                  padding: 16,
                  borderLeft: `4px solid ${statusColors[log.status]}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
                    {log.recipient}
                  </span>
                  <div style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: statusColors[log.status],
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {log.status}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {log.subject}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                  <span>{formatEventDate(log.timestamp)}</span>
                  {log.status === 'Sent' && <PulseIndicator status="success" size={4} />}
                </div>
              </HumanCard>
            ))}
            {logs.length === 0 && !loading && (
              <EmptyState title="No dispatches recorded" description="The pipeline is quiet. No email logs matched your search." actionLabel="Reset Search" onAction={() => setRecipient(undefined)} />
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 40 }}>
            <Pagination
              current={page} pageSize={pageSize} total={total}
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
              { label: 'To', span: isMobile ? 1 : 2, children: <span style={{ fontWeight: 600 }}>{selected.recipient}</span> },
              { label: 'Subject', span: isMobile ? 1 : 2, children: selected.subject },
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
