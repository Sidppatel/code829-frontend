import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Input, App, Button } from 'antd';
import {
  ScanOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { checkInApi } from '../../services/api';

import type { CheckInStats, ScanResponse } from '@code829/shared/types/checkin';
import LoadingSpinner from '@code829/shared/components/shared/LoadingSpinner';
import QrCameraScanner from '../../components/checkin/QrCameraScanner';
import { useIsMobile } from '@code829/shared/hooks/useIsMobile';
import { DisplayHeading, MiniStat } from '@code829/shared/components/ui';
import { createLogger } from '@code829/shared/lib/logger';

const log = createLogger('Staff/CheckInPage');

export default function CheckInPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [stats, setStats] = useState<CheckInStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const { message } = App.useApp();
  const isMobile = useIsMobile();

  const loadStats = useCallback(async () => {
    if (!eventId) return;
    try {
      const { data } = await checkInApi.getStats(eventId);
      setStats(data);
      log.info('Check-in stats loaded', {
        eventId,
        checkedIn: data.checkedIn,
        total: data.totalTicketsSold,
      });
    } catch (err) {
      log.error('Failed to load check-in stats', err);
      message.error('Failed to load check-in stats');
    } finally {
      setLoading(false);
    }
  }, [eventId, message]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const handleScan = useCallback(
    async (value: string) => {
      if (!value.trim() || scanning) return;
      setScanning(true);
      setScanResult(null);
      try {
        const { data } = await checkInApi.scan(value.trim());
        setScanResult(data);
        if (data.success) {
          log.info('Check-in scan succeeded', {
            userName: data.userName,
            itemCount: data.itemCount,
          });
          message.success(data.message);
          void loadStats();
        } else {
          log.info('Check-in scan rejected', { message: data.message });
          message.error(data.message);
        }
      } catch (err) {
        log.error('Check-in scan failed', err);
        message.error('Scan failed');
      } finally {
        setScanning(false);
      }
    },
    [scanning, message, loadStats]
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ padding: isMobile ? 20 : '32px 40px', maxWidth: 960, margin: '0 auto' }}>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/checkin/select')}
        style={{
          color: 'var(--text-secondary)',
          fontWeight: 500,
          padding: 0,
          marginBottom: 12,
        }}
      >
        Back
      </Button>

      <div style={{ marginBottom: 8, fontSize: 13, color: 'var(--text-muted)' }}>
        {stats?.eventTitle ?? 'Event check-in'}
      </div>
      <DisplayHeading as="h1" size={isMobile ? 'md' : 'lg'} style={{ margin: '0 0 24px' }}>
        Check-in
      </DisplayHeading>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.2fr) minmax(0, 1fr)',
          gap: 20,
        }}
      >
        {/* Scanner column */}
        <div>
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
              padding: cameraActive ? 0 : 20,
            }}
          >
            <QrCameraScanner
              active={cameraActive}
              onScan={handleScan}
              onToggle={() => setCameraActive((prev) => !prev)}
            />

            {!cameraActive && (
              <>
                <div
                  style={{
                    margin: '20px 0',
                    borderTop: '1px solid var(--border-subtle)',
                    position: 'relative',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      background: 'var(--bg-surface)',
                      padding: '0 14px',
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      fontWeight: 600,
                      letterSpacing: 1.5,
                      textTransform: 'uppercase',
                    }}
                  >
                    or manual entry
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <Input
                    placeholder="Enter QR token…"
                    size="large"
                    style={{
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                    }}
                    onChange={(e) => {
                      if (e.target.value.length === 8) handleScan(e.target.value);
                    }}
                  />
                  <Button
                    type="primary"
                    size="large"
                    icon={<ScanOutlined />}
                    loading={scanning}
                    style={{
                      borderRadius: 'var(--radius-md)',
                      padding: '0 22px',
                      background: 'var(--primary)',
                      border: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Scan
                  </Button>
                </div>
              </>
            )}
          </div>

          {stats && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10,
                marginTop: 14,
              }}
            >
              <MiniStat label="Checked in" value={stats.checkedIn} />
              <MiniStat label="Expected" value={stats.totalTicketsSold} />
              <MiniStat label="Remaining" value={stats.remaining} />
            </div>
          )}
        </div>

        {/* Recent scans column */}
        <div>
          <DisplayHeading as="h2" size="sm" style={{ marginBottom: 10 }}>
            Most recent scan
          </DisplayHeading>

          {scanResult ? (
            <div
              className="c829-fade-up"
              style={{
                background: 'var(--bg-surface)',
                border: `1px solid ${
                  scanResult.success ? 'var(--status-success)' : 'var(--status-danger)'
                }`,
                borderRadius: 'var(--radius-lg)',
                padding: 18,
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: scanResult.success
                      ? 'var(--status-success-bg)'
                      : 'var(--status-danger-bg)',
                    color: scanResult.success ? 'var(--status-success)' : 'var(--status-danger)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  {scanResult.success ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      fontSize: 14,
                    }}
                  >
                    {scanResult.success ? scanResult.userName : scanResult.message}
                  </div>
                  {scanResult.success && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {scanResult.itemCount} ticket{scanResult.itemCount === 1 ? '' : 's'} ·{' '}
                      {new Date().toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: '28px 20px',
                textAlign: 'center',
                background: 'var(--bg-soft)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border)',
                color: 'var(--text-muted)',
                fontSize: 13,
              }}
            >
              No scans yet.
            </div>
          )}

          {stats?.lastCheckIn && (
            <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
              Last confirmed scan:{' '}
              {new Date(stats.lastCheckIn).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
