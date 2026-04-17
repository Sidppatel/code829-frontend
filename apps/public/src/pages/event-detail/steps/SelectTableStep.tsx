import { Button, Col, Row, Skeleton, Space, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { EventDetail, EventTableDto, EventTablesResponse } from '@code829/shared/types/event';
import TableSelectionCanvas from '../../../components/booking/TableSelectionCanvas';

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
  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      <Button icon={<ArrowLeftOutlined />} onClick={onBack}>Back to Event</Button>
      <Typography.Title level={3}>Select a Table &mdash; {event.title}</Typography.Title>
      {!tablesData ? (
        <Row justify="center"><Col xs={24}><Skeleton.Node active style={{ width: '100%', height: 400 }} /></Col></Row>
      ) : (
        <TableSelectionCanvas
          eventId={event.id}
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
