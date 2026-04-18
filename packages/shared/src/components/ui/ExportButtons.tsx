import { useState } from 'react';
import { Button, Space } from 'antd';
import { DownloadOutlined, FileExcelOutlined } from '@ant-design/icons';

interface Props {
  onExportCsv?: () => Promise<void> | void;
  onExportXlsx?: () => Promise<void> | void;
  disabled?: boolean;
  size?: 'small' | 'middle' | 'large';
}

export default function ExportButtons({ onExportCsv, onExportXlsx, disabled, size = 'middle' }: Props) {
  const [csvBusy, setCsvBusy] = useState(false);
  const [xlsxBusy, setXlsxBusy] = useState(false);

  const run = async (fn: (() => Promise<void> | void) | undefined, setBusy: (b: boolean) => void) => {
    if (!fn) return;
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Space>
      {onExportCsv && (
        <Button
          icon={<DownloadOutlined />}
          loading={csvBusy}
          disabled={disabled}
          size={size}
          onClick={() => run(onExportCsv, setCsvBusy)}
        >
          CSV
        </Button>
      )}
      {onExportXlsx && (
        <Button
          icon={<FileExcelOutlined />}
          loading={xlsxBusy}
          disabled={disabled}
          size={size}
          onClick={() => run(onExportXlsx, setXlsxBusy)}
        >
          Excel
        </Button>
      )}
    </Space>
  );
}
