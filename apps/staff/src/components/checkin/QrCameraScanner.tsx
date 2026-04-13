import { useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button, Typography } from 'antd';
import { CameraOutlined, StopOutlined } from '@ant-design/icons';

interface Props {
  active: boolean;
  onScan: (token: string) => void;
  onToggle: () => void;
}

export default function QrCameraScanner({ active, onScan, onToggle }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<string>('');
  const containerId = 'qr-camera-reader';

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING
          await scannerRef.current.stop();
        }
      } catch { /* ignore stop errors */ }
      scannerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!active) {
      void stopScanner();
      return;
    }

    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        // Debounce: don't fire the same token within 3 seconds
        if (decodedText === lastScannedRef.current) return;
        lastScannedRef.current = decodedText;
        onScan(decodedText);
        setTimeout(() => { lastScannedRef.current = ''; }, 3000);
      },
      () => { /* ignore scan failures (no QR in frame) */ },
    ).catch(() => {
      // Camera permission denied or not available
    });

    return () => { void stopScanner(); };
  }, [active, onScan, stopScanner]);

  return (
    <div style={{ textAlign: 'center' }}>
      <Button
        type={active ? 'default' : 'primary'}
        icon={active ? <StopOutlined /> : <CameraOutlined />}
        onClick={onToggle}
        size="large"
        danger={active}
        style={{ marginBottom: 16 }}
      >
        {active ? 'Stop Camera' : 'Open Camera Scanner'}
      </Button>

      {active && (
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
          Point camera at the QR code on the guest&apos;s ticket
        </Typography.Text>
      )}

      <div
        id={containerId}
        style={{
          display: active ? 'block' : 'none',
          maxWidth: 400,
          margin: '0 auto',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      />
    </div>
  );
}
