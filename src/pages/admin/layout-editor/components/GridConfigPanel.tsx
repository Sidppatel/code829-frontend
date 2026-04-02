import { useState } from 'react';
import { Card, InputNumber, Button, Space, App, Divider, Badge } from 'antd';
import { AppstoreOutlined, ThunderboltOutlined, AimOutlined } from '@ant-design/icons';
import { useFloorPlanStore } from '../../../../stores/floorPlanStore';
import type { TableType } from '../../../../types/layout';
import { centsToUSD } from '../../../../utils/currency';

interface GridConfigPanelProps {
  tableTypes: TableType[];
  selectedTypeId: string | null;
  onSelectType: (id: string | null) => void;
  onBulkInsert: () => void;
  bulkInsertLoading: boolean;
  placedTypeIds: Set<string>;
}

export default function GridConfigPanel({
  tableTypes,
  selectedTypeId,
  onSelectType,
  onBulkInsert,
  bulkInsertLoading,
  placedTypeIds,
}: GridConfigPanelProps) {
  const gridDimensions = useFloorPlanStore((s) => s.gridDimensions);
  const setGridDimensions = useFloorPlanStore((s) => s.setGridDimensions);
  const elements = useFloorPlanStore((s) => s.elements);

  const [rows, setRows] = useState(gridDimensions?.rows ?? 5);
  const [cols, setCols] = useState(gridDimensions?.cols ?? 5);
  const { message } = App.useApp();

  const handleApplyGrid = () => {
    if (rows < 1 || cols < 1) {
      message.warning('Rows and columns must be at least 1');
      return;
    }

    // Check if any tables would be orphaned
    const orphaned = Object.values(elements).filter(
      (el) => (el.gridRow != null && el.gridRow >= rows) || (el.gridCol != null && el.gridCol >= cols),
    );

    if (orphaned.length > 0) {
      message.warning(`${orphaned.length} table(s) are outside the new grid bounds. Remove them first or increase dimensions.`);
      return;
    }

    setGridDimensions(rows, cols);
    message.success(`Grid set to ${rows} x ${cols}`);
  };

  const activeTypes = tableTypes.filter((t) => t.isActive);
  const unlinkedCount = activeTypes.filter((t) => !placedTypeIds.has(t.id)).length;

  return (
    <div className="grid-editor-sidebar">
      <Card size="small" title={<><AppstoreOutlined /> Grid Dimensions</>} style={{ marginBottom: 12 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <InputNumber
              min={1}
              max={30}
              value={rows}
              onChange={(v) => setRows(v ?? 1)}
              addonBefore="Rows"
              style={{ flex: 1 }}
            />
            <InputNumber
              min={1}
              max={30}
              value={cols}
              onChange={(v) => setCols(v ?? 1)}
              addonBefore="Cols"
              style={{ flex: 1 }}
            />
          </div>
          <Button block onClick={handleApplyGrid}>
            Apply Grid
          </Button>
        </Space>
      </Card>

      <Card
        size="small"
        title="Table Types"
        extra={
          selectedTypeId ? (
            <Button size="small" type="link" onClick={() => onSelectType(null)}>
              <AimOutlined /> Deselect
            </Button>
          ) : null
        }
      >
        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
          {activeTypes.map((tt) => {
            const isPlaced = placedTypeIds.has(tt.id);
            return (
              <div
                key={tt.id}
                className={`table-type-palette-item${selectedTypeId === tt.id ? ' active' : ''}`}
                onClick={() => onSelectType(selectedTypeId === tt.id ? null : tt.id)}
              >
                <div
                  className="table-type-swatch"
                  style={{ background: tt.defaultColor ?? 'var(--accent-violet)' }}
                />
                <div className="table-type-info">
                  <div className="table-type-name">
                    {tt.name}
                    {isPlaced && <Badge status="success" style={{ marginLeft: 6 }} />}
                  </div>
                  <div className="table-type-meta">
                    {tt.defaultCapacity} seats &middot; {tt.defaultShape} &middot; {centsToUSD(tt.defaultPriceCents ?? 0)}
                  </div>
                </div>
              </div>
            );
          })}
          {activeTypes.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 8 }}>
              No active table types. Create some in Table Types settings.
            </div>
          )}
        </div>

        {unlinkedCount > 0 && (
          <>
            <Divider style={{ margin: '8px 0' }} />
            <Button
              block
              icon={<ThunderboltOutlined />}
              onClick={onBulkInsert}
              loading={bulkInsertLoading}
            >
              Auto-place {unlinkedCount} unlinked type{unlinkedCount > 1 ? 's' : ''}
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
