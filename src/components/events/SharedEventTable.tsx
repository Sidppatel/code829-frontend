import { Table, Spin, Pagination } from 'antd';
import type { TableProps } from 'antd';
import { useIsMobile } from '../../hooks/useIsMobile';
import EmptyState from '../shared/EmptyState';
import HumanCard from '../shared/HumanCard';

type BaseRecord = { id: string };

interface SharedEventTableProps<T extends BaseRecord> {
  dataSource: T[];
  loading: boolean;
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
  columns: TableProps<T>['columns'];
  onRowClick?: (record: T) => void;
  renderMobileCard: (record: T) => React.ReactNode;
  emptyProps?: {
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
  };
}

export default function SharedEventTable<T extends BaseRecord>({
  dataSource,
  loading,
  total,
  page,
  pageSize,
  onPageChange,
  columns,
  onRowClick,
  renderMobileCard,
  emptyProps = {
    title: 'No events found',
    description: 'No events match the current criteria.'
  }
}: SharedEventTableProps<T>) {
  const isMobile = useIsMobile();

  if (loading && dataSource.length === 0) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}><Spin size="large" /></div>;
  }

  if (!loading && dataSource.length === 0) {
    return (
      <EmptyState
        title={emptyProps.title}
        description={emptyProps.description}
        actionLabel={emptyProps.actionLabel}
        onAction={emptyProps.onAction}
      />
    );
  }

  return (
    <>
      {isMobile ? (
        <Spin spinning={loading}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {dataSource.map((record) => (
              <div key={record.id} onClick={() => onRowClick?.(record)}>
                {renderMobileCard(record)}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
            <Pagination 
              current={page} 
              pageSize={pageSize} 
              total={total} 
              size="small" 
              onChange={onPageChange} 
              className="human-pagination" 
            />
          </div>
        </Spin>
      ) : (
        <HumanCard>
          <div className="responsive-table">
            <Table
              dataSource={dataSource}
              columns={columns}
              rowKey="id"
              loading={loading}
              size="middle"
              scroll={{ x: 700 }}
              pagination={{
                current: page,
                pageSize,
                total,
                showSizeChanger: true,
                onChange: onPageChange,
                className: 'human-pagination'
              }}
              onRow={onRowClick ? (record) => ({ 
                onClick: () => onRowClick(record), 
                style: { cursor: 'pointer' } 
              }) : undefined}
            />
          </div>
        </HumanCard>
      )}
    </>
  );
}
