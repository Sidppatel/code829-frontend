import { Button, Col, Row, Skeleton, Space, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { EventDetail, EventTicketType } from '@code829/shared/types/event';
import CapacityPurchaseForm from '../../../components/purchase/CapacityPurchaseForm';

interface Props {
  event: EventDetail;
  ticketTypes: EventTicketType[];
  ticketTypesLoading: boolean;
  onProceed: (seats: number, ticketTypeId?: string) => void;
  onBack: () => void;
}

export default function CapacityStep({ event, ticketTypes, ticketTypesLoading, onProceed, onBack }: Props) {
  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      <Button icon={<ArrowLeftOutlined />} onClick={onBack}>Back to Event</Button>
      <Typography.Title level={3}>Reserve Seats &mdash; {event.title}</Typography.Title>
      <Row gutter={[24, 24]} justify="center">
        <Col xs={24} sm={16} md={12} lg={8}>
          {ticketTypesLoading ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : (
            <CapacityPurchaseForm
              eventId={event.id}
              maxCapacity={event.maxCapacity ?? 0}
              availableCount={event.availableCount}
              pricePerPersonCents={event.displayFromAmountCents ?? 0}
              ticketTypes={ticketTypes.length > 0 ? ticketTypes : undefined}
              onProceed={onProceed}
            />
          )}
        </Col>
      </Row>
    </Space>
  );
}
