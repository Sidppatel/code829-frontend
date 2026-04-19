import { Button, Col, Row, Skeleton, Space, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { EventDetail, EventTableDto, EventTablesResponse } from '@code829/shared/types/event';
import { useIsMobile } from '@code829/shared/hooks/useIsMobile';
import TableSelectionCanvas from '../../../components/purchase/TableSelectionCanvas';

interface Props {
  event: EventDetail;
  tablesData: EventTablesResponse | null;
  lockingTableId: string | null;
  lockedTables: EventTableDto[];
  onLockTable: (table: EventTableDto) => void;
  onUnlockTable: (table: EventTableDto) => void;
  onProceedToCheckout: () => void;
  onLockExpired: () => void;
  onBack: () => void;
}

export default function SelectTableStep({
  event, tablesData, lockingTableId, lockedTables,
  onLockTable, onUnlockTable, onProceedToCheckout, onLockExpired, onBack,
}: Props) {
  const isMobile = useIsMobile();
  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      <Button 
        type="text"
        icon={<ArrowLeftOutlined />} 
        onClick={onBack}
        style={{ 
          color: 'var(--text-secondary)',
          padding: 0,
          height: 'auto',
          fontWeight: 600,
          fontSize: isMobile ? 14 : 15
        }}
      >
        Back to Event
      </Button>
      <Typography.Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>
        Select a Table &mdash; {event.title}
      </Typography.Title>
      {!tablesData ? (
        <Row justify="center"><Col xs={24}><Skeleton.Node active style={{ width: '100%', height: 400 }} /></Col></Row>
      ) : (
        <TableSelectionCanvas
          eventId={event.eventId}
          tables={tablesData.tables}
          eventTableTypes={tablesData.eventTableTypes ?? []}
          gridRows={tablesData.gridRows ?? 10}
          gridCols={tablesData.gridCols ?? 10}
          lockedTables={lockedTables}
          onLockTable={onLockTable}
          onUnlockTable={onUnlockTable}
          onProceedToCheckout={onProceedToCheckout}
          lockingTableId={lockingTableId}
          onLockExpired={onLockExpired}
        />
      )}
    </Space>
  );
}
