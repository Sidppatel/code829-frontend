import { useCallback, useState } from 'react';
import { App } from 'antd';

export interface UseExportFetchers {
  csv?: () => Promise<Blob>;
  xlsx?: () => Promise<Blob>;
  filenameBase?: string;
}

export interface UseExportResult {
  exportCsv?: () => Promise<void>;
  exportXlsx?: () => Promise<void>;
  exporting: boolean;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function useExport(fetchers: UseExportFetchers): UseExportResult {
  const { message } = App.useApp();
  const [exporting, setExporting] = useState(false);
  const base = fetchers.filenameBase ?? 'export';

  const run = useCallback(
    async (kind: 'csv' | 'xlsx') => {
      const fn = kind === 'csv' ? fetchers.csv : fetchers.xlsx;
      if (!fn) return;
      setExporting(true);
      try {
        const blob = await fn();
        triggerDownload(blob, `${base}.${kind}`);
      } catch (err) {
        void message.error(err instanceof Error ? err.message : 'Export failed');
      } finally {
        setExporting(false);
      }
    },
    [fetchers, base, message],
  );

  return {
    exportCsv: fetchers.csv ? () => run('csv') : undefined,
    exportXlsx: fetchers.xlsx ? () => run('xlsx') : undefined,
    exporting,
  };
}
