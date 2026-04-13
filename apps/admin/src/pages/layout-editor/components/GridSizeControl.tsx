import { Card, InputNumber } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';

interface GridSizeControlProps {
  gridRows: number;
  gridCols: number;
  onGridRowsChange: (v: number) => void;
  onGridColsChange: (v: number) => void;
  disabled: boolean;
}

export default function GridSizeControl({
  gridRows,
  gridCols,
  onGridRowsChange,
  onGridColsChange,
  disabled,
}: GridSizeControlProps) {
  return (
    <Card size="small" title={<><AppstoreOutlined /> Grid Size</>} style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Rows</div>
          <InputNumber
            min={1}
            max={30}
            value={gridRows}
            onChange={(v: number | null) => onGridRowsChange(v ?? 1)}
            style={{ width: '100%' }}
            disabled={disabled}
          />
        </div>
        <span style={{ color: 'var(--text-muted)', marginTop: 18 }}>&times;</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Cols</div>
          <InputNumber
            min={1}
            max={30}
            value={gridCols}
            onChange={(v: number | null) => onGridColsChange(v ?? 1)}
            style={{ width: '100%' }}
            disabled={disabled}
          />
        </div>
      </div>
    </Card>
  );
}
