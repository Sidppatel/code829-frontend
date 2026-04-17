import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Input, App, Button } from 'antd';
import { ScanOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { checkInApi } from '../../services/api';

import type { CheckInStats, ScanResponse } from '@code829/shared/types/checkin';
import PageHeader from '@code829/shared/components/shared/PageHeader';
import LoadingSpinner from '@code829/shared/components/shared/LoadingSpinner';
import QrCameraScanner from '../../components/checkin/QrCameraScanner';
import HumanCard from '@code829/shared/components/shared/HumanCard';
import { createLogger } from '@code829/shared/lib/logger';

const log = createLogger('Admin/CheckInPage');

export default function CheckInPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [stats, setStats] = useState<CheckInStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const { message } = App.useApp();

  const loadStats = useCallback(async () => {
    if (!eventId) return;
    try {
      const { data } = await checkInApi.getStats(eventId);
      setStats(data);
      log.info('Check-in stats loaded', { eventId, checkedIn: data.checkedIn, total: data.totalTicketsSold });
    } catch (err) {
      log.error('Failed to load check-in stats', err);
      message.error('Failed to load check-in stats');
    } finally {
      setLoading(false);
    }
  }, [eventId, message]);

  useEffect(() => { void loadStats(); }, [loadStats]);

  const handleScan = useCallback(async (value: string) => {
    if (!value.trim() || scanning) return;
    setScanning(true);
    setScanResult(null);
    try {
      const { data } = await checkInApi.scan(value.trim());
      setScanResult(data);
      if (data.success) {
        log.info('Guest checked in', { userName: data.userName, itemCount: data.itemCount });
        message.success(data.message);
        void loadStats();
      } else {
        log.info('Scan rejected', { message: data.message });
        message.error(data.message);
      }
    } catch (err) {
      log.error('Scan failed', err);
      message.error('Scan failed');
    } finally {
      setScanning(false);
    }
  }, [scanning, message, loadStats]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="spring-up">
      <PageHeader 
        title="Check-In" 
        subtitle={[
          stats?.eventTitle ?? 'Event check-in',
          "Scan QR code to welcome your guests.",
          "Keep the camera steady for fastest scanning."
        ]}
        rotateSubtitle
        onBack={() => navigate('/checkin/select')}
      />

      {stats && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Event Progress</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{stats.checkedIn} <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>of {stats.totalTicketsSold} present</span></div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>{Math.round(stats.percentage)}%</div>
            </div>
          </div>
          <div style={{ height: 12, width: '100%', background: 'var(--bg-soft)', borderRadius: 99, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ 
              height: '100%', 
              width: `${stats.percentage}%`, 
              background: 'linear-gradient(90deg, var(--primary) 0%, var(--accent-green) 100%)',
              transition: 'width 0.5s var(--ease-human)'
            }} />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginTop: 24 }}>
            <HumanCard style={{ padding: '20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Remaining</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-gold)' }}>{stats.remaining}</div>
            </HumanCard>
            <HumanCard style={{ padding: '20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Last Seen</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                {stats.lastCheckIn ? new Date(stats.lastCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
              </div>
            </HumanCard>
          </div>
        </div>
      )}

      <HumanCard 
        title="Ready to Scan" 
        className="human-noise"
        style={{ marginBottom: 32, padding: cameraActive ? 12 : 32 }}
      >
        <QrCameraScanner
          active={cameraActive}
          onScan={handleScan}
          onToggle={() => setCameraActive((prev) => !prev)}
        />

        {!cameraActive && (
          <>
            <div style={{ margin: '32px 0', borderTop: '1px solid var(--border)', position: 'relative' }}>
              <span style={{ 
                position: 'absolute', 
                top: '50%', 
                left: '50%', 
                transform: 'translate(-50%, -50%)', 
                background: 'var(--bg-surface)', 
                padding: '0 16px',
                fontSize: 12,
                color: 'var(--text-muted)',
                fontWeight: 600,
                textTransform: 'uppercase'
              }}>
                or manual entry
              </span>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <Input
                placeholder="Enter QR token manually..."
                size="large"
                style={{ borderRadius: 'var(--radius-full)', border: '1px solid var(--border)' }}
                onChange={(e) => { if (e.target.value.length === 8) handleScan(e.target.value); }}
              />
              <Button 
                type="primary" 
                size="large" 
                icon={<ScanOutlined />} 
                loading={scanning}
                onClick={() => { /* Placeholder for manual trigger if needed */ }}
                style={{ borderRadius: 'var(--radius-full)', padding: '0 24px' }}
              >
                Scan
              </Button>
            </div>
          </>
        )}
      </HumanCard>

      {scanResult && (
        <HumanCard 
          style={{ 
            borderLeft: `8px solid ${scanResult.success ? 'var(--accent-green)' : 'var(--accent-rose)'}`,
            background: scanResult.success ? 'var(--status-success-bg)' : 'var(--status-danger-bg)'
          }}
          className="spring-up"
        >
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <div style={{ 
              width: 64, 
              height: 64, 
              borderRadius: '50%', 
              background: scanResult.success ? 'var(--accent-green)' : 'var(--accent-rose)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'white',
              fontSize: 32
            }}>
              {scanResult.success ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Playfair Display', serif" }}>
                {scanResult.message}
              </div>
              {scanResult.success && (
                <div style={{ marginTop: 8, fontSize: 16, color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Welcome, <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{scanResult.userName}</span> 
                  <span style={{ margin: '0 8px', color: 'var(--border)' }}>•</span>
                  {scanResult.itemCount} tickets
                </div>
              )}
            </div>
          </div>
        </HumanCard>
      )}
    </div>
  );
}
