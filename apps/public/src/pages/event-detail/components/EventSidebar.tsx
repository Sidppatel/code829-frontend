import { motion, type Variants } from 'framer-motion';
import { Button } from 'antd';
import { ShareAltOutlined } from '@ant-design/icons';
import type { EventDetail } from '@code829/shared/types/event';
import { useIsMobile } from '@code829/shared/hooks/useIsMobile';
import { DisplayHeading, Kicker } from '@code829/shared/components/ui';

interface EventSidebarProps {
  event: EventDetail;
  isSoldOut: boolean;
  remaining: number;
  handleBookNow: () => void;
  isStartingBooking?: boolean;
  itemVariants: Variants;
}

export default function EventSidebar({
  event,
  isSoldOut,
  remaining,
  handleBookNow,
  isStartingBooking,
  itemVariants,
}: EventSidebarProps) {
  const isMobile = useIsMobile();
  const availabilityLabel = !isSoldOut
    ? event.layoutMode === 'Grid'
      ? `${event.noOfAvailableTables} tables available`
      : `${remaining} spots remaining`
    : 'Sold out';

  return (
    <motion.div
      variants={itemVariants}
      style={{ position: isMobile ? 'relative' : 'sticky', top: isMobile ? 0 : 90 }}
    >
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: isMobile ? 20 : 28,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <DisplayHeading as="div" size="sm" style={{ marginBottom: 4 }}>
          {event.layoutMode === 'Grid' ? 'Your tables' : 'Select tickets'}
        </DisplayHeading>
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            marginBottom: 20,
          }}
        >
          Held for 10 minutes once you continue
        </div>

        <div style={{ marginBottom: 20 }}>
          <Kicker color="var(--text-muted)" style={{ marginBottom: 4 }}>From</Kicker>
          <DisplayHeading as="div" size="lg">
            {event.displayFromFormatted ?? 'Complimentary'}
          </DisplayHeading>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            color: isSoldOut ? 'var(--status-danger)' : 'var(--text-secondary)',
            fontWeight: 500,
            marginBottom: 20,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: isSoldOut ? 'var(--status-danger)' : 'var(--status-success)',
            }}
          />
          {availabilityLabel}
        </div>

        <Button
          type="primary"
          size="large"
          block
          onClick={handleBookNow}
          loading={isStartingBooking}
          disabled={isSoldOut || isStartingBooking}
          style={{
            height: 56,
            borderRadius: 'var(--radius-md)',
            fontSize: 15,
            fontWeight: 600,
            background: isSoldOut ? 'var(--bg-muted)' : 'var(--primary)',
            border: 'none',
            boxShadow: isSoldOut ? 'none' : 'var(--shadow-hover)',
            color: isSoldOut ? 'var(--text-muted)' : 'var(--text-on-brand)',
          }}
        >
          {isSoldOut ? 'Sold out' : event.layoutMode === 'Grid' ? 'Reserve & pay' : 'Continue to payment'}
        </Button>

        <div
          style={{
            textAlign: 'center',
            marginTop: 12,
            fontSize: 11,
            color: 'var(--text-muted)',
            letterSpacing: 0.4,
          }}
        >
          Seats held for 10:00 once you continue
        </div>

        <div
          style={{
            marginTop: 24,
            paddingTop: 20,
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              color: 'var(--text-muted)',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              fontWeight: 600,
            }}
          >
            Share
          </span>
          <Button
            shape="circle"
            icon={<ShareAltOutlined />}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-secondary)',
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}
