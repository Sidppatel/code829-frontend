import { useEffect, useState, useCallback } from 'react';
import { Tag, Descriptions, Select, Button, Spin, Empty } from 'antd';
import { ReloadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { developerApi } from '../../services/api';
import { usePagedTable } from '@code829/shared/hooks/usePagedTable';
import HumanCard from '@code829/shared/components/shared/HumanCard';
import {
  DataTableSection,
  DetailModal,
  FilterBar,
  PageShell,
  StatsRow,
} from '@code829/shared/components/ui';
import type { StatsCell } from '@code829/shared/components/ui';
import type { SiteVisitEntry, VisitorStats, VisitorChartPoint, VisitorStatItem } from '@code829/shared/services/developerApi';
import type { AxiosResponse } from 'axios';
import type { PagedResponse } from '@code829/shared/types/shared';

const t = (s: string) => s;

function getPortalColor(portal: string): string {
  switch (portal) {
    case 'public': return 'default';
    case 'user': return 'blue';
    case 'admin': return 'red';
    case 'staff': return 'orange';
    case 'developer': return 'magenta';
    default: return 'default';
  }
}

const PORTALS = ['public', 'user', 'admin', 'staff', 'developer'];

function formatTs(ts: string) {
  return dayjs(ts).format('MMM D, YYYY h:mm:ss A');
}

// Premium SVG Chart Component
function VisitorChart({ data }: { data: VisitorChartPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Empty description={t('No chart data available')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  const width = 1000;
  const height = 220;
  const paddingX = 50;
  const paddingY = 25;

  const maxVal = Math.max(...data.map((d) => d.count), 5);
  const pointsLen = data.length;

  const points = data.map((d, i) => {
    const { count: val } = d;
    const x = paddingX + (i / (pointsLen - 1)) * (width - 2 * paddingX);
    const y = height - paddingY - (val / maxVal) * (height - 2 * paddingY);
    return { x, y, date: d.date, count: val };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = points.length > 0
    ? `${linePath} L ${points.at(-1)!.x.toFixed(1)} ${(height - paddingY).toFixed(1)} L ${points.at(0)!.x.toFixed(1)} ${(height - paddingY).toFixed(1)} Z`
    : '';

  const gridlines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const y = paddingY + ratio * (height - 2 * paddingY);
    const value = Math.round(maxVal * (1 - ratio));
    return { y, value };
  });

  return (
    <div style={{ width: '100%', position: 'relative', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 20px 16px 20px', marginBottom: 24 }}>
      <style>{`
        .chart-dot-group circle {
          transition: r 0.2s cubic-bezier(0.4, 0, 0.2, 1), stroke-width 0.2s ease;
        }
        .chart-dot-group:hover circle {
          r: 6px !important;
          stroke-width: 3px !important;
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{t('Traffic Trend')}</h3>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t('Daily page views over the last 30 days')}</span>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{t('Page Views')}</span>
          </div>
        </div>
      </div>
      <div style={{ width: '100%', overflow: 'hidden' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Gridlines & Y-Axis Labels */}
          {gridlines.map((g, i) => (
            <g key={i}>
              <line
                x1={paddingX}
                y1={g.y}
                x2={width - paddingX}
                y2={g.y}
                stroke="var(--border)"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <text
                x={paddingX - 10}
                y={g.y + 4}
                textAnchor="end"
                fill="var(--text-secondary)"
                fontSize={10}
                fontFamily="monospace"
              >
                {g.value}
              </text>
            </g>
          ))}

          {/* Area under line */}
          {areaPath && <path d={areaPath} fill="url(#chartGradient)" />}

          {/* Trend Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="var(--primary)"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Points */}
          {points.map((p, i) => (
            <g key={i} className="chart-dot-group">
              <circle
                cx={p.x}
                cy={p.y}
                r={3.5}
                fill="var(--bg-elevated)"
                stroke="var(--primary)"
                strokeWidth={2}
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={12}
                fill="transparent"
                style={{ cursor: 'pointer' }}
              />
              <title>{`${dayjs(p.date).format('MMMM D, YYYY')}: ${p.count} views`}</title>
            </g>
          ))}

          {/* X-Axis Dates */}
          {points.length > 1 && (
            <>
              <text x={points.at(0)!.x} y={height - 2} textAnchor="middle" fill="var(--text-secondary)" fontSize={10} fontFamily="monospace">
                {dayjs(points.at(0)!.date).format('MMM D')}
              </text>
              <text x={points.at(Math.floor(points.length / 2))!.x} y={height - 2} textAnchor="middle" fill="var(--text-secondary)" fontSize={10} fontFamily="monospace">
                {dayjs(points.at(Math.floor(points.length / 2))!.date).format('MMM D')}
              </text>
              <text x={points.at(-1)!.x} y={height - 2} textAnchor="middle" fill="var(--text-secondary)" fontSize={10} fontFamily="monospace">
                {dayjs(points.at(-1)!.date).format('MMM D')}
              </text>
            </>
          )}
        </svg>
      </div>
    </div>
  );
}

// Progress Breakdown Component for Distribution Breakdown
function ProgressBreakdown({ title, items, total }: { title: string; items: VisitorStatItem[]; total: number }) {
  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        flex: 1,
        minWidth: 260,
      }}
    >
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((item, idx) => {
          const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
                <span style={{ color: 'var(--text-primary)' }}>
                  {item.count} <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>({percentage}%)</span>
                </span>
              </div>
              <div style={{ height: 6, width: '100%', background: 'var(--bg-soft)', borderRadius: 3, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${percentage}%`,
                    background: 'var(--primary)',
                    borderRadius: 3,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <div style={{ color: 'var(--text-secondary)', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>
            {t('No breakdown data')}
          </div>
        )}
      </div>
    </div>
  );
}

export default function VisitorLogsPage() {
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selected, setSelected] = useState<SiteVisitEntry | null>(null);

  const paged = usePagedTable<SiteVisitEntry, { search?: string; portal?: string }>({
    fetcher: (params) =>
      developerApi.getVisitorLogs(params) as Promise<AxiosResponse<PagedResponse<SiteVisitEntry>>>,
    defaultPageSize: 20,
  });

  const loadStats = useCallback(async () => {
    try {
      const { data } = await developerApi.getVisitorStats();
      setStats(data);
    } catch {
      // Silent error fallback
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadStats();
  }, [loadStats]);

  const handleRefresh = () => {
    setStatsLoading(true);
    void loadStats();
    paged.refresh();
  };

  const statsCells: StatsCell[] = [
    {
      label: 'Page Views (30d)',
      value: statsLoading ? <Spin size="small" /> : stats?.totalPageViews ?? 0,
      trend: 'Total traffic recorded',
      tone: 'neutral',
    },
    {
      label: 'Unique Visitors (30d)',
      value: statsLoading ? <Spin size="small" /> : stats?.uniqueVisitors ?? 0,
      trend: 'Distinct visitor IPs',
      tone: 'success',
    },
    {
      label: 'Views (Today vs Yesterday)',
      value: statsLoading ? (
        <Spin size="small" />
      ) : (
        <>
          {stats?.pageViewsToday ?? 0}
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
            {' '}/ {stats?.pageViewsYesterday ?? 0}
          </span>
        </>
      ),
      trend: stats
        ? stats.pageViewsToday >= stats.pageViewsYesterday
          ? 'Nominal or growing traffic'
          : 'Slower than yesterday'
        : '',
      tone: stats
        ? stats.pageViewsToday >= stats.pageViewsYesterday
          ? 'success'
          : 'warning'
        : 'neutral',
    },
  ];

  return (
    <PageShell
      title="Visitor logs"
      subtitle="Auditing frontend route transitions and visitor analytics"
      stats={<StatsRow items={statsCells} variant="kpi" columns={3} />}
    >
      {/* 30 Day Trend Chart */}
      {statsLoading ? (
        <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 24 }}>
          <Spin tip="Loading analytics..." />
        </div>
      ) : (
        <VisitorChart data={stats?.visitsByDate ?? []} />
      )}

      {/* Breakdowns Row */}
      {!statsLoading && stats && (
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 24 }}>
          <ProgressBreakdown
            title="Views by Portal"
            items={stats.visitsByPortal}
            total={stats.totalPageViews}
          />
          <ProgressBreakdown
            title="Top Browsers"
            items={stats.visitsByBrowser}
            total={stats.totalPageViews}
          />
          <ProgressBreakdown
            title="Top Operating Systems"
            items={stats.visitsByOs}
            total={stats.totalPageViews}
          />
        </div>
      )}

      {/* Filter Bar */}
      <FilterBar
        search={{
          placeholder: 'Search by URL, IP, user email or name...',
          onChange: (v) => paged.setFilters({ search: v }),
        }}
        actions={
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <Select
              placeholder="All Portals"
              allowClear
              style={{ minWidth: 150 }}
              value={paged.filters.portal}
              onChange={(v) => paged.setFilters({ portal: v })}
              options={PORTALS.map((p) => ({ label: p.toUpperCase(), value: p }))}
            />
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              {t('Refresh')}
            </Button>
          </div>
        }
      />

      {/* Main Visitor Logs Data Table */}
      <DataTableSection<SiteVisitEntry>
        data={paged.data}
        total={paged.total}
        page={paged.page}
        pageSize={paged.pageSize}
        loading={paged.loading}
        onPageChange={paged.onPageChange}
        rowKey="id"
        onRowClick={setSelected}
        scrollX={900}
        columns={[
          {
            title: 'Timestamp',
            dataIndex: 'timestamp',
            key: 'timestamp',
            width: 190,
            render: (ts: string) => (
              <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{formatTs(ts)}</span>
            ),
          },
          {
            title: 'Portal',
            dataIndex: 'portal',
            key: 'portal',
            width: 110,
            render: (portal: string) => (
              <Tag color={getPortalColor(portal)}>{(portal || 'public').toUpperCase()}</Tag>
            ),
          },
          {
            title: 'Path',
            dataIndex: 'path',
            key: 'path',
            ellipsis: true,
            render: (path: string) => (
              <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{path}</span>
            ),
          },
          {
            title: 'Visitor / User',
            key: 'visitor',
            width: 240,
            ellipsis: true,
            render: (_, record) => {
              if (record.userEmail) {
                return (
                  <div style={{ lineHeight: 1.3 }}>
                    <div style={{ fontWeight: 600 }}>{record.userFullName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      {record.userEmail} ({record.userRole})
                    </div>
                  </div>
                );
              }
              return (
                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 12 }}>
                  {t('Guest (Anonymous)')}
                </span>
              );
            },
          },
          {
            title: 'Client',
            key: 'client',
            width: 160,
            render: (_, record) => (
              <span style={{ fontSize: 12 }}>
                {record.browser ?? 'Unknown'} on {record.os ?? 'Unknown'}
              </span>
            ),
          },
          {
            title: 'IP Address',
            dataIndex: 'ipAddress',
            key: 'ipAddress',
            width: 130,
            render: (ip: string) => (
              <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{ip || '—'}</span>
            ),
          },
        ]}
        mobileCard={(entry) => {
          const pColor = getPortalColor(entry.portal ?? 'public');
          return (
            <HumanCard
              onClick={() => setSelected(entry)}
              style={{
                padding: 16,
                borderLeft: pColor === 'default' ? '4px solid var(--border)' : `4px solid var(--ant-${pColor})`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <Tag color={pColor}>
                  {(entry.portal || 'public').toUpperCase()}
                </Tag>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {formatTs(entry.timestamp)}
                </span>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  fontFamily: 'monospace',
                  marginBottom: 8,
                  wordBreak: 'break-word',
                }}
              >
                {entry.path}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {entry.userEmail ? entry.userFullName : 'Guest'}
                </span>
                <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                  {entry.ipAddress}
                </span>
              </div>
            </HumanCard>
          );
        }}
        empty={{
          title: 'No visits logged',
          description: 'No telemetry page visits match the search / portal filter.',
          actionLabel: 'Reset Filters',
          onAction: () => paged.setFilters({ search: undefined, portal: undefined }),
        }}
      />

      {/* Visit Details Modal */}
      <DetailModal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Page Visit Audit Details"
        subtitle={selected?.path}
        width={680}
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="Timestamp" span={2}>
                <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
                  {formatTs(selected.timestamp)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Visited Path" span={2}>
                <span style={{ fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>
                  {selected.path}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Portal">
                <Tag color={getPortalColor(selected.portal ?? 'public')}>
                  {(selected.portal || 'public').toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="IP Address">
                <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{selected.ipAddress || '—'}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Browser">{selected.browser || '—'}</Descriptions.Item>
              <Descriptions.Item label="Operating System">{selected.os || '—'}</Descriptions.Item>
              <Descriptions.Item label="Screen Resolution">{selected.screenResolution || '—'}</Descriptions.Item>
              <Descriptions.Item label="Referrer" span={2}>
                <span style={{ fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all', color: 'var(--text-secondary)' }}>
                  {selected.referrer || 'Direct / None'}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="User Agent" span={2}>
                <span style={{ fontSize: 11, wordBreak: 'break-all', color: 'var(--text-secondary)' }}>
                  {selected.userAgent}
                </span>
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <InfoCircleOutlined /> User Information
              </div>
              {selected.userId || selected.businessUserId ? (
                <Descriptions column={2} size="small" bordered>
                  <Descriptions.Item label="Full Name">{selected.userFullName}</Descriptions.Item>
                  <Descriptions.Item label="Email">{selected.userEmail}</Descriptions.Item>
                  <Descriptions.Item label="Role">{selected.userRole}</Descriptions.Item>
                  <Descriptions.Item label="Account ID">
                    <span style={{ fontFamily: 'monospace', fontSize: 11 }}>
                      {selected.userId || selected.businessUserId}
                    </span>
                  </Descriptions.Item>
                </Descriptions>
              ) : (
                <div style={{ padding: '16px', background: 'var(--bg-soft)', borderRadius: 8, border: '1px dashed var(--border)', textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>
                  {t('Anonymous visitor — no authenticated user session was active.')}
                </div>
              )}
            </div>
          </div>
        )}
      </DetailModal>
    </PageShell>
  );
}
