import { motion } from 'framer-motion';
import { Typography, Button, Space } from 'antd';
import { ShareAltOutlined, MessageOutlined } from '@ant-design/icons';
import type { EventDetail } from '../../../types/event';
import { centsToUSD } from '../../../utils/currency';
import { useIsMobile } from '../../../hooks/useIsMobile';

interface EventSidebarProps {
  event: EventDetail;
  isSoldOut: boolean;
  remaining: number;
  handleBookNow: () => void;
  itemVariants: any;
}

export default function EventSidebar({ event, isSoldOut, remaining, handleBookNow, itemVariants }: EventSidebarProps) {
  const isMobile = useIsMobile();

  return (
    <>
      <motion.div variants={itemVariants} style={{ position: isMobile ? 'relative' : 'sticky', top: isMobile ? 0 : 130 }}>
        <div className="glass-card" style={{ padding: isMobile ? '24px 32px' : 48, borderRadius: 32 }}>
          <div style={{ marginBottom: isMobile ? 24 : 40 }}>
            <Typography.Text style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 800, fontSize: 11 }}>Starting at</Typography.Text>
            <div style={{
              fontSize: isMobile ? 'clamp(24px, 8vw, 36px)' : 48,
              fontWeight: 900,
              color: 'var(--text-primary)',
              marginTop: 8,
              letterSpacing: '-1px',
              lineHeight: 1.1
            }}>
              {(event.minPricePerTableCents ?? event.pricePerPersonCents) ? centsToUSD(event.minPricePerTableCents ?? event.pricePerPersonCents!) : 'Complimentary'}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Button
              type="primary"
              size="large"
              block
              onClick={handleBookNow}
              disabled={isSoldOut}
              style={{
                height: 72,
                borderRadius: 18,
                fontSize: 18,
                fontWeight: 800,
                background: isSoldOut ? 'var(--bg-soft)' : 'linear-gradient(135deg, var(--accent-violet), var(--accent-rose))',
                border: 'none',
                boxShadow: isSoldOut ? 'none' : '0 15px 35px rgba(99, 102, 241, 0.35)',
                color: isSoldOut ? 'var(--text-muted)' : 'white'
              }}
            >
              {isSoldOut ? 'Sold Out' : 'Reserve tickets'}
            </Button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              color: 'var(--text-secondary)',
              fontSize: 14,
              fontWeight: 600
            }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: !isSoldOut ? '#22c55e' : 'var(--accent-rose)'
              }} />
              {!isSoldOut
                ? (event.layoutMode === 'Grid'
                  ? `${event.noOfAvailableTables} tables available`
                  : `${remaining} spots remaining`)
                : 'Sold Out'}
            </div>
          </div>

          <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
            <Typography.Text style={{ color: 'var(--text-muted)', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5, display: 'block', marginBottom: 20 }}>Spread the Word</Typography.Text>
            <Space size={16}>
              <Button shape="circle" icon={<ShareAltOutlined />} style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid var(--border)', background: 'transparent' }} className="hover-lift" />
              <Button shape="circle" icon={<MessageOutlined />} style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid var(--border)', background: 'transparent' }} className="hover-lift" />
            </Space>
          </div>
        </div>
      </motion.div>
    </>
  );
}
