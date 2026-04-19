import { Button } from 'antd';
import { DollarOutlined, UndoOutlined, UserOutlined } from '@ant-design/icons';
import { adminPurchasesApi } from '../../services/api';
import { usePagedTable } from '@code829/shared/hooks/usePagedTable';
import { useAsyncAction, useConfirm, useExport } from '@code829/shared/hooks';
import { centsToUSD } from '@code829/shared/utils/currency';
import { formatEventDate } from '@code829/shared/utils/date';
import type { Purchase, PurchaseStatus } from '@code829/shared/types/purchase';
import type { AdminPurchaseListParams } from '@code829/shared/services/adminPurchasesApi';
import PurchaseStatusTag from '../../components/purchases/PurchaseStatusTag';
import {
  DataTableSection,
  ExportButtons,
  FilterBar,
  PageShell,
} from '@code829/shared/components/ui';
import HumanCard from '@code829/shared/components/shared/HumanCard';
import { createLogger } from '@code829/shared/lib/logger';

const log = createLogger('Admin/PurchasesPage');

const STATUS_CHIPS: PurchaseStatus[] = ['Pending', 'Paid', 'CheckedIn', 'Refunded'];

export default function AdminPurchasesPage() {
  const paged = usePagedTable<Purchase, AdminPurchaseListParams>({
    fetcher: adminPurchasesApi.list,
    defaultPageSize: 15,
  });

  const refund = useAsyncAction(
    (id: string) => adminPurchasesApi.refund(id),
    {
      successMessage: 'Purchase refunded',
      onSuccess: () => {
        log.info('Purchase refunded');
        paged.refresh();
      },
    },
  );
  const confirm = useConfirm();

  const exporter = useExport({
    csv: () => adminPurchasesApi.exportCsv().then((r) => r.data as Blob),
    xlsx: () => adminPurchasesApi.exportXlsx().then((r) => r.data as Blob),
    filenameBase: 'purchases',
  });

  return (
    <PageShell
      title="Sales"
      subtitle={[
        'Track and manage every guest purchase with ease.',
        'Process refunds and oversee entry status in real-time.',
        'Monitor your revenue and guest list at a glance.',
      ]}
      rotateSubtitle
      extra={<ExportButtons onExportCsv={exporter.exportCsv} onExportXlsx={exporter.exportXlsx} />}
    >
      <FilterBar
        search={{
          placeholder: 'Search customer or purchase number...',
          onChange: (v) => paged.setFilters({ search: v }),
        }}
        chips={STATUS_CHIPS.map((status) => ({
          key: status,
          label: status,
          active: paged.filters.status === status,
          onClick: () =>
            paged.setFilters({ status: paged.filters.status === status ? undefined : status }),
        }))}
      />
      <DataTableSection<Purchase>
        data={paged.data}
        total={paged.total}
        page={paged.page}
        pageSize={paged.pageSize}
        loading={paged.loading}
        onPageChange={paged.onPageChange}
        rowKey="id"
        scrollX={600}
        columns={[
          { title: 'Purchase #', dataIndex: 'purchaseNumber', key: 'purchaseNumber' },
          { title: 'Event', dataIndex: 'eventTitle', key: 'eventTitle' },
          { title: 'Customer', dataIndex: 'userName', key: 'userName' },
          {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: PurchaseStatus) => <PurchaseStatusTag status={status} />,
          },
          {
            title: 'Total',
            dataIndex: 'totalCents',
            key: 'totalCents',
            render: (cents: number) => centsToUSD(cents),
          },
          {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (d: string) => formatEventDate(d),
          },
        ]}
        mobileCard={(booking) => (
          <HumanCard
            className="human-noise"
            style={{
              borderLeft: `4px solid ${booking.status === 'Paid' ? 'var(--accent-green)' : 'var(--border)'}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 16,
                    color: 'var(--text-primary)',
                    fontFamily: "'Playfair Display', serif",
                  }}
                >
                  {booking.eventTitle}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }}>
                  #{booking.purchaseNumber}
                </div>
              </div>
              <PurchaseStatusTag status={booking.status} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                <UserOutlined style={{ color: 'var(--primary)', opacity: 0.7 }} />
                <span style={{ fontWeight: 600 }}>{booking.userName}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                <DollarOutlined style={{ color: 'var(--accent-gold)' }} />
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{centsToUSD(booking.totalCents)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                Captured {formatEventDate(booking.createdAt)}
              </div>
            </div>
          </HumanCard>
        )}
        empty={{
          title: 'No purchases found',
          description: "It looks like no one has reserved a spot under these filters yet.",
          actionLabel: 'Clear Filters',
          onAction: () => paged.setFilters({}),
        }}
      />
    </PageShell>
  );
}
