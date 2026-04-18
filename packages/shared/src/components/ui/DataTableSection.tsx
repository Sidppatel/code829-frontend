import type { ReactNode } from 'react';
import { Pagination, Spin, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useIsMobile } from '../../hooks/useIsMobile';
import EmptyState from '../shared/EmptyState';

export type RowKey<T> = keyof T | ((record: T) => string);

interface EmptyOpts {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface Props<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  onPageChange: (page: number, pageSize: number) => void;
  columns: ColumnsType<T>;
  rowKey: RowKey<T>;
  onRowClick?: (record: T) => void;
  mobileCard?: (record: T) => ReactNode;
  empty?: EmptyOpts;
  toolbar?: ReactNode;
  scrollX?: number | 'max-content';
  size?: 'small' | 'middle' | 'large';
  showSizeChanger?: boolean;
}

function resolveRowKey<T>(rowKey: RowKey<T>, record: T, index: number): string {
  if (typeof rowKey === 'function') return rowKey(record);
  const v = record[rowKey];
  return v !== undefined && v !== null ? String(v) : String(index);
}

export function defineColumns<T>(cols: ColumnsType<T>): ColumnsType<T> {
  return cols;
}

export default function DataTableSection<T>({
  data,
  total,
  page,
  pageSize,
  loading,
  onPageChange,
  columns,
  rowKey,
  onRowClick,
  mobileCard,
  empty,
  toolbar,
  scrollX = 'max-content',
  size = 'middle',
  showSizeChanger = true,
}: Props<T>) {
  const isMobile = useIsMobile();
  const showEmpty = !loading && data.length === 0;

  if (isMobile && mobileCard) {
    return (
      <>
        {toolbar}
        <Spin spinning={loading}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.map((record, i) => (
              <div
                key={resolveRowKey(rowKey, record, i)}
                onClick={onRowClick ? () => onRowClick(record) : undefined}
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {mobileCard(record)}
              </div>
            ))}
            {showEmpty && empty && <EmptyState {...empty} />}
          </div>
          {data.length > 0 && (
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                size="small"
                onChange={onPageChange}
                showSizeChanger={showSizeChanger}
                className="human-pagination"
              />
            </div>
          )}
        </Spin>
      </>
    );
  }

  return (
    <>
      {toolbar}
      <div className="responsive-table">
        <Table<T>
          dataSource={data}
          columns={columns}
          rowKey={(record, i) => resolveRowKey(rowKey, record, i ?? 0)}
          loading={loading}
          size={size}
          scroll={{ x: scrollX }}
          locale={{
            emptyText: showEmpty && empty ? <EmptyState {...empty} /> : undefined,
          }}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: onPageChange,
            showSizeChanger,
            className: 'human-pagination',
          }}
          onRow={
            onRowClick
              ? (record) => ({
                  onClick: () => onRowClick(record),
                  style: { cursor: 'pointer' },
                })
              : undefined
          }
        />
      </div>
    </>
  );
}
