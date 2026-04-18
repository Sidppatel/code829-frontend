import { useState } from 'react';
import type { AxiosResponse } from 'axios';
import DOMPurify from 'dompurify';
import { Tag } from 'antd';
import type { DescriptionsItemType } from 'antd/es/descriptions';
import { MailOutlined } from '@ant-design/icons';
import { developerApi } from '../../services/api';
import { usePagedTable } from '@code829/shared/hooks/usePagedTable';
import { formatEventDate } from '@code829/shared/utils/date';
import type { EmailLogEntry } from '@code829/shared/services/developerApi';
import type { PagedResponse } from '@code829/shared/types/shared';
import HumanCard from '@code829/shared/components/shared/HumanCard';
import PulseIndicator from '@code829/shared/components/shared/PulseIndicator';
import {
  DataTableSection,
  DetailModal,
  FilterBar,
  PageShell,
  StatsRow,
} from '@code829/shared/components/ui';
import type { StatsCell } from '@code829/shared/components/ui';
import { EMAIL_STATUS_COLORS } from '@code829/shared/theme/statusColors';

interface EmailLogListParams extends Record<string, unknown> {
  recipient?: string;
}

const STATS: StatsCell[] = [
  {
    label: 'Delivery Rate',
    value: (
      <>
        98.4<span style={{ fontSize: 14, fontWeight: 500 }}>%</span>
      </>
    ),
    trend: 'Optimal Performance',
    tone: 'success',
    icon: <PulseIndicator status="success" size={6} />,
  },
  {
    label: 'Avg. Latency',
    value: (
      <>
        1.2<span style={{ fontSize: 14, fontWeight: 500 }}> s</span>
      </>
    ),
    trend: 'SMTP Node Response',
    tone: 'neutral',
    icon: <PulseIndicator status="calm" size={6} />,
  },
  {
    label: 'Failures',
    value: '0',
    trend: 'Last 24 hours',
    tone: 'success',
    icon: <PulseIndicator status="success" size={6} />,
  },
];

export default function EmailLogsPage() {
  const [selected, setSelected] = useState<EmailLogEntry | null>(null);

  const paged = usePagedTable<EmailLogEntry, EmailLogListParams>({
    fetcher: (params) =>
      developerApi.getEmailLogs(params) as Promise<AxiosResponse<PagedResponse<EmailLogEntry>>>,
    defaultPageSize: 25,
  });

  const descriptions: DescriptionsItemType[] | undefined = selected
    ? [
        { key: 'to', label: 'To', span: 2, children: <span style={{ fontWeight: 600 }}>{selected.recipient}</span> },
        { key: 'subject', label: 'Subject', span: 2, children: selected.subject },
        {
          key: 'status',
          label: 'Delivery Status',
          children: (
            <Tag
              color={EMAIL_STATUS_COLORS[selected.status] + '15'}
              style={{
                color: EMAIL_STATUS_COLORS[selected.status],
                borderColor: EMAIL_STATUS_COLORS[selected.status] + '30',
                fontWeight: 700,
              }}
            >
              {selected.status}
            </Tag>
          ),
        },
        {
          key: 'ts',
          label: 'Timestamp',
          children: <span style={{ fontFamily: 'monospace' }}>{formatEventDate(selected.timestamp)}</span>,
        },
      ]
    : undefined;

  return (
    <PageShell
      title="Email Logs"
      subtitle={[
        'Comprehensive audit trail for platform notifications.',
        'Monitoring email deliverability and latency in real-time.',
        'Analyzing guest communication flow and dispatch status.',
      ]}
      rotateSubtitle
      stats={<StatsRow items={STATS} variant="kpi" columns={3} />}
    >
      <FilterBar
        search={{
          placeholder: 'Filter by recipient email...',
          onChange: (v) => paged.setFilters({ recipient: v }),
        }}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />
            <span>{paged.loading ? 'Polling Dispatcher...' : 'Pipeline Live'}</span>
          </div>
        }
      />
      <DataTableSection<EmailLogEntry>
        data={paged.data}
        total={paged.total}
        page={paged.page}
        pageSize={paged.pageSize}
        loading={paged.loading}
        onPageChange={paged.onPageChange}
        rowKey="id"
        onRowClick={setSelected}
        columns={[
          {
            title: 'Recipient',
            dataIndex: 'recipient',
            key: 'recipient',
            render: (v: string) => <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{v}</span>,
          },
          { title: 'Subject', dataIndex: 'subject', key: 'subject', ellipsis: true },
          {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (s: string) => (
              <Tag
                color={EMAIL_STATUS_COLORS[s] + '15'}
                style={{
                  color: EMAIL_STATUS_COLORS[s],
                  borderColor: EMAIL_STATUS_COLORS[s] + '30',
                  fontWeight: 700,
                  borderRadius: 6,
                  textTransform: 'uppercase',
                  fontSize: 10,
                }}
              >
                {s}
              </Tag>
            ),
          },
          {
            title: 'Sent At',
            dataIndex: 'timestamp',
            key: 'timestamp',
            render: (d: string) => <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{formatEventDate(d)}</span>,
          },
        ]}
        mobileCard={(entry) => (
          <HumanCard
            onClick={() => setSelected(entry)}
            style={{ padding: 16, borderLeft: `4px solid ${EMAIL_STATUS_COLORS[entry.status]}` }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
                {entry.recipient}
              </span>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: EMAIL_STATUS_COLORS[entry.status],
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {entry.status}
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {entry.subject}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
              <span>{formatEventDate(entry.timestamp)}</span>
              {entry.status === 'Sent' && <PulseIndicator status="success" size={4} />}
            </div>
          </HumanCard>
        )}
        empty={{
          title: 'No dispatches recorded',
          description: 'The pipeline is quiet. No email logs matched your search.',
          actionLabel: 'Reset Search',
          onAction: () => paged.setFilters({}),
        }}
      />

      <DetailModal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Communication Detail"
        subtitle={selected ? `Status ID: ${selected.id.slice(0, 8)}` : undefined}
        tone={selected ? EMAIL_STATUS_COLORS[selected.status] : 'var(--primary)'}
        icon={<MailOutlined />}
        width={760}
        descriptions={descriptions}
      >
        {selected && (
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Message Content</div>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 8 }}>
              <iframe
                title="Email Content"
                sandbox=""
                srcDoc={DOMPurify.sanitize(selected.body)}
                style={{
                  width: '100%',
                  height: '400px',
                  border: '1px solid var(--border)',
                  background: 'white',
                  borderRadius: 10,
                  padding: '4px',
                }}
              />
            </div>
          </div>
        )}
      </DetailModal>
    </PageShell>
  );
}
