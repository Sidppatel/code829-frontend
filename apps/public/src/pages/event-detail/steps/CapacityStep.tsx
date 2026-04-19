import { Button, Col, Row, Skeleton, Space, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { EventDetail, EventTicketType } from '@code829/shared/types/event';
import { useIsMobile } from '@code829/shared/hooks/useIsMobile';
import CapacityPurchaseForm from '../../../components/purchase/CapacityPurchaseForm';

interface Props {
  event: EventDetail;
  ticketTypes: EventTicketType[];
  ticketTypesLoading: boolean;
  onProceed: (seats: number, ticketTypeId?: string) => void;
  onBack: () => void;
}

export default function CapacityStep({ event, ticketTypes, ticketTypesLoading, onProceed, onBack }: Props) {
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
        Reserve Seats &mdash; {event.title}
      </Typography.Title>
      <Row gutter={[24, 24]} justify="center">
        <Col xs={24} sm={16} md={12} lg={8}>
          {ticketTypesLoading ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : (
            <CapacityPurchaseForm
              eventId={event.eventId}
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
