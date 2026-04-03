import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Input, Row, Col, Statistic, App, Result, Progress, Divider } from 'antd';
import { ScanOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { checkInApi } from '../../../services/api';
import { formatEventDate } from '../../../utils/date';
import type { CheckInStats, ScanResponse } from '../../../types/checkin';
import PageHeader from '../../../components/shared/PageHeader';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import QrCameraScanner from '../../../components/checkin/QrCameraScanner';

export default function CheckInPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [stats, setStats] = useState<CheckInStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const { message } = App.useApp();

  const loadStats = async () => {
    if (!eventId) return;
    try {
      const { data } = await checkInApi.getStats(eventId);
      setStats(data);
    } catch {
      message.error('Failed to load check-in stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadStats(); }, [eventId]);

  const handleScan = useCallback(async (value: string) => {
    if (!value.trim() || scanning) return;
    setScanning(true);
    setScanResult(null);
    try {
      const { data } = await checkInApi.scan(value.trim());
      setScanResult(data);
      if (data.success) {
        message.success(data.message);
        void loadStats();
      } else {
        message.error(data.message);
      }
    } catch {
      message.error('Scan failed');
    } finally {
      setScanning(false);
    }
  }, [scanning, message]);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Check-In" subtitle={stats?.eventTitle ?? 'Event check-in'} />
      {stats && (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={12} md={6}>
              <Card className="stat-card">
                <Statistic title="Total Tickets" value={stats.totalTicketsSold} />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card className="stat-card">
                <Statistic title="Checked In" value={stats.checkedIn} valueStyle={{ color: 'var(--ant-color-success)' }} />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card className="stat-card">
                <Statistic title="Pending" value={stats.pending} />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card className="stat-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Progress type="circle" percent={Math.round(stats.percentage)} size={64} />
              </Card>
            </Col>
          </Row>
          {stats.lastCheckIn && (
            <div style={{ marginBottom: 16, color: 'var(--text-muted)', fontSize: 13 }}>
              Last check-in: {formatEventDate(stats.lastCheckIn)}
            </div>
          )}
        </>
      )}

      <Card title="Scan QR Code" style={{ marginBottom: 24 }}>
        {/* Camera scanner */}
        <QrCameraScanner
          active={cameraActive}
          onScan={handleScan}
          onToggle={() => setCameraActive((prev) => !prev)}
        />

        <Divider>or enter manually</Divider>

        {/* Manual text input (works with hardware scanners too) */}
        <Input.Search
          placeholder="Enter QR token..."
          enterButton={<><ScanOutlined /> Scan</>}
          size="large"
          loading={scanning}
          onSearch={handleScan}
          allowClear
        />
      </Card>

      {scanResult && (
        <Card>
          <Result
            status={scanResult.success ? 'success' : 'error'}
            icon={scanResult.success ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
            title={scanResult.message}
            subTitle={
              scanResult.success
                ? `${scanResult.userName} — Booking #${scanResult.bookingNumber} — ${scanResult.itemCount} ticket(s)`
                : undefined
            }
          />
        </Card>
      )}
    </div>
  );
}
