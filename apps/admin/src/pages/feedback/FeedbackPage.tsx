import { useCallback, useState } from 'react';
import { Button, Tag, Typography, Drawer, Select } from 'antd';
import { DeleteOutlined, EyeOutlined, BugOutlined } from '@ant-design/icons';
import apiClient from '@code829/shared/lib/axios';
import {
  DataTableSection,
  PageShell,
} from '@code829/shared/components/ui';
import { useAsyncAction, useConfirm, usePagedTable } from '@code829/shared/hooks';
import type { PagedResponse } from '@code829/shared/types/shared';
import type { AxiosResponse } from 'axios';

interface Feedback {
  id: string;
  name: string;
  email?: string;
  type: string;
  message: string;
  rating: number;
  userId?: string;
  userName?: string;
  createdAt: string;
  diagnostics?: string;
}

interface DiagnosticsPayload {
  pageUrl?: string;
  stepsToReproduce?: string;
  client?: {
    userAgent?: string;
    url?: string;
    appVersion?: string;
    capturedAt?: string;
    consoleLog?: { t: string; level: string; msg: string }[];
  };
}

const TYPE_COLORS: Record<string, string> = {
  Bug: 'red',
  Suggestion: 'blue',
  Compliment: 'green',
  Complaint: 'orange',
  General: 'default',
};

const STARS = ['', '★', '★★', '★★★', '★★★★', '★★★★★'];

type FeedbackFilters = Record<string, unknown> & { type?: string };

export default function FeedbackPage() {
  const confirm = useConfirm();
  const [detail, setDetail] = useState<Feedback | null>(null);

  const fetcher = useCallback(
    (params: FeedbackFilters & { page?: number; pageSize?: number }) =>
      apiClient.get<PagedResponse<Feedback>>('/feedback', {
        params: { page: params.page, pageSize: params.pageSize, type: params.type || undefined },
      }) as Promise<AxiosResponse<PagedResponse<Feedback>>>,
    [],
  );
  const paged = usePagedTable<Feedback, FeedbackFilters>({ fetcher, defaultPageSize: 25 });

  const deleteFeedback = useAsyncAction(
    (id: string) => apiClient.delete(`/feedback/${id}`),
    { successMessage: 'Feedback deleted', onSuccess: () => { setDetail(null); paged.refresh(); } },
  );

  const parsedDiagnostics = (raw?: string): DiagnosticsPayload | null => {
    if (!raw) return null;
    try { return JSON.parse(raw) as DiagnosticsPayload; } catch { return null; }
  };

  return (
    <PageShell
      title="Feedback"
      subtitle="User-submitted feedback and bug reports"
    >
      <div style={{ marginBottom: 16 }}>
        <Select
          placeholder="All types"
          allowClear
          value={(paged.filters.type as string) || undefined}
          onChange={(v: string | undefined) => paged.setFilters({ type: v })}
          style={{ width: 160 }}
          options={[
            { label: 'Bug', value: 'Bug' },
            { label: 'Suggestion', value: 'Suggestion' },
            { label: 'Compliment', value: 'Compliment' },
            { label: 'Complaint', value: 'Complaint' },
            { label: 'General', value: 'General' },
          ]}
        />
      </div>

      <DataTableSection<Feedback>
        data={paged.data}
        total={paged.total}
        page={paged.page}
        pageSize={paged.pageSize}
        loading={paged.loading}
        onPageChange={paged.onPageChange}
        rowKey="id"
        columns={[
          {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            width: 110,
            render: (t: string) => <Tag color={TYPE_COLORS[t] ?? 'default'}>{t}</Tag>,
          },
          { title: 'Name', dataIndex: 'name', key: 'name', width: 140 },
          { title: 'Email', dataIndex: 'email', key: 'email', width: 180, render: (e?: string) => e ?? '—' },
          {
            title: 'Message',
            dataIndex: 'message',
            key: 'message',
            render: (msg: string) => (
              <Typography.Text ellipsis={{ tooltip: msg }} style={{ maxWidth: 320 }}>
                {msg}
              </Typography.Text>
            ),
          },
          {
            title: 'Rating',
            dataIndex: 'rating',
            key: 'rating',
            width: 100,
            render: (r: number) => r ? <span style={{ color: '#faad14' }}>{STARS[r]}</span> : <Typography.Text type="secondary">—</Typography.Text>,
          },
          {
            title: 'Diag',
            key: 'hasDiag',
            width: 60,
            render: (_: unknown, r: Feedback) =>
              r.diagnostics ? <BugOutlined style={{ color: 'var(--primary)' }} title="Has diagnostics" /> : null,
          },
          {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 120,
            render: (d: string) => new Date(d).toLocaleDateString(),
          },
          {
            title: 'Actions',
            key: 'actions',
            width: 100,
            render: (_: unknown, r: Feedback) => (
              <div style={{ display: 'flex', gap: 8 }}>
                <Button size="small" icon={<EyeOutlined />} onClick={() => setDetail(r)} />
                <Button
                  size="small"
                  icon={<DeleteOutlined />}
                  danger
                  onClick={() =>
                    confirm({
                      title: 'Delete feedback?',
                      description: 'This cannot be undone.',
                      tone: 'danger',
                      confirmLabel: 'Delete',
                      onConfirm: () => deleteFeedback.run(r.id),
                    })
                  }
                />
              </div>
            ),
          },
        ]}
        empty={{ title: 'No feedback yet', description: 'Feedback from users will appear here.' }}
      />

      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {detail && <Tag color={TYPE_COLORS[detail.type] ?? 'default'}>{detail.type}</Tag>}
            <span>{detail?.name}</span>
          </div>
        }
        open={!!detail}
        onClose={() => setDetail(null)}
        width={520}
        extra={
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            loading={deleteFeedback.loading}
            onClick={() =>
              confirm({
                title: 'Delete feedback?',
                description: 'This cannot be undone.',
                tone: 'danger',
                confirmLabel: 'Delete',
                onConfirm: () => deleteFeedback.run(detail!.id),
              })
            }
          >
            Delete
          </Button>
        }
      >
        {detail && (() => {
          const diag = parsedDiagnostics(detail.diagnostics);
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Meta */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {detail.rating > 0 && <span style={{ color: '#faad14', fontSize: 18 }}>{STARS[detail.rating]}</span>}
                <Typography.Text type="secondary">{new Date(detail.createdAt).toLocaleString()}</Typography.Text>
                {detail.email && <Typography.Text copyable>{detail.email}</Typography.Text>}
              </div>

              {/* Message */}
              <div>
                <Typography.Text strong>Message</Typography.Text>
                <div style={{ marginTop: 8, padding: '12px 16px', background: 'var(--bg-soft)', borderRadius: 10, lineHeight: 1.6 }}>
                  {detail.message}
                </div>
              </div>

              {/* Bug-specific fields */}
              {diag?.pageUrl && (
                <div>
                  <Typography.Text strong>Page URL</Typography.Text>
                  <div style={{ marginTop: 6 }}>
                    <Typography.Text copyable code>{diag.pageUrl}</Typography.Text>
                  </div>
                </div>
              )}
              {diag?.stepsToReproduce && (
                <div>
                  <Typography.Text strong>Steps to Reproduce</Typography.Text>
                  <pre style={{ marginTop: 8, padding: '12px 16px', background: 'var(--bg-soft)', borderRadius: 10, whiteSpace: 'pre-wrap', fontSize: 13 }}>
                    {diag.stepsToReproduce}
                  </pre>
                </div>
              )}

              {/* Client diagnostics */}
              {diag?.client && (
                <div>
                  <Typography.Text strong>Client Info</Typography.Text>
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
                    {diag.client.url && <span><b>URL:</b> {diag.client.url}</span>}
                    {diag.client.appVersion && <span><b>Version:</b> {diag.client.appVersion}</span>}
                    {diag.client.capturedAt && <span><b>Captured:</b> {new Date(diag.client.capturedAt).toLocaleString()}</span>}
                    {diag.client.userAgent && <Typography.Text ellipsis={{ tooltip: diag.client.userAgent }} style={{ fontSize: 12, color: 'var(--text-muted)' }}><b>UA:</b> {diag.client.userAgent}</Typography.Text>}
                  </div>
                </div>
              )}

              {/* Console log */}
              {diag?.client?.consoleLog && diag.client.consoleLog.length > 0 && (
                <div>
                  <Typography.Text strong>Console Log ({diag.client.consoleLog.length} entries)</Typography.Text>
                  <div style={{ marginTop: 8, maxHeight: 280, overflowY: 'auto', background: '#111', borderRadius: 10, padding: '12px 16px' }}>
                    {diag.client.consoleLog.map((entry, i) => (
                      <div key={i} style={{ fontSize: 11, fontFamily: 'monospace', marginBottom: 4, color: entry.level === 'error' || entry.level === 'uncaught' ? '#f87171' : entry.level === 'warn' ? '#fbbf24' : '#a3e635' }}>
                        <span style={{ opacity: 0.5 }}>{new Date(entry.t).toLocaleTimeString()} </span>
                        <span style={{ fontWeight: 700 }}>[{entry.level.toUpperCase()}] </span>
                        {entry.msg}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw diagnostics fallback (old format) */}
              {detail.diagnostics && !diag && (
                <div>
                  <Typography.Text strong>Raw Diagnostics</Typography.Text>
                  <pre style={{ marginTop: 8, padding: '12px 16px', background: 'var(--bg-soft)', borderRadius: 10, fontSize: 11, maxHeight: 200, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                    {detail.diagnostics}
                  </pre>
                </div>
              )}
            </div>
          );
        })()}
      </Drawer>
    </PageShell>
  );
}
