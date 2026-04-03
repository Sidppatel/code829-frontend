import { useEffect } from 'react';
import {
  Card,
  InputNumber,
  Button,
  Space,
  Form,
  Input,
  Select,
  Popconfirm,
  Divider,
  Badge,
} from 'antd';
import {
  AppstoreOutlined,
  PlusOutlined,
  DragOutlined,
  DeleteOutlined,
  SelectOutlined,
  AimOutlined,
} from '@ant-design/icons';
import type { TableType } from '../../../../types/layout';
import type { LayoutTable, EditorMode } from '../LayoutEditorPage';
import { centsToUSD } from '../../../../utils/currency';

interface ControlsPanelProps {
  gridRows: number;
  gridCols: number;
  onGridRowsChange: (v: number) => void;
  onGridColsChange: (v: number) => void;
  tableTypes: TableType[];
  selectedTypeId: string | null;
  onSelectType: (id: string | null) => void;
  editorMode: EditorMode;
  onEditorModeChange: (mode: EditorMode) => void;
  selectedTable: LayoutTable | null;
  onTableUpdate: (patch: Partial<LayoutTable>) => void;
  onTableDelete: () => void;
  onDeselectTable: () => void;
  disabled: boolean;
}

const SHAPES = ['Round', 'Rectangle', 'Square', 'Cocktail'].map((s) => ({ label: s, value: s }));

const MODE_OPTIONS: { mode: EditorMode; icon: React.ReactNode; label: string }[] = [
  { mode: 'select', icon: <SelectOutlined />, label: 'Select' },
  { mode: 'add', icon: <PlusOutlined />, label: 'Add' },
  { mode: 'move', icon: <DragOutlined />, label: 'Move' },
  { mode: 'delete', icon: <DeleteOutlined />, label: 'Delete' },
];

export default function ControlsPanel({
  gridRows,
  gridCols,
  onGridRowsChange,
  onGridColsChange,
  tableTypes,
  selectedTypeId,
  onSelectType,
  editorMode,
  onEditorModeChange,
  selectedTable,
  onTableUpdate,
  onTableDelete,
  onDeselectTable,
  disabled,
}: ControlsPanelProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (selectedTable) {
      form.setFieldsValue({
        label: selectedTable.label,
        capacity: selectedTable.capacity,
        shape: selectedTable.shape,
        priceDollars: selectedTable.priceCents / 100,
        color: selectedTable.color,
      });
    }
  }, [selectedTable, form]);

  const handleFieldChange = (_changed: Record<string, unknown>, all: Record<string, unknown>) => {
    if (disabled) return;
    const priceDollars = all.priceDollars as number | undefined;
    onTableUpdate({
      label: all.label as string,
      capacity: all.capacity as number,
      shape: all.shape as string,
      priceCents: Math.round((priceDollars ?? 0) * 100),
      color: all.color as string | undefined,
    });
  };

  const activeTypes = tableTypes.filter((t) => t.isActive);

  return (
    <div className="layout-editor-controls">
      {/* Grid Size */}
      <Card size="small" title={<><AppstoreOutlined /> Grid Size</>} style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Rows</div>
            <InputNumber
              min={1}
              max={30}
              value={gridRows}
              onChange={(v) => onGridRowsChange(v ?? 1)}
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
              onChange={(v) => onGridColsChange(v ?? 1)}
              style={{ width: '100%' }}
              disabled={disabled}
            />
          </div>
        </div>
      </Card>

      {/* Mode Buttons */}
      <Card size="small" title="Mode" style={{ marginBottom: 12 }}>
        <Space wrap style={{ width: '100%' }}>
          {MODE_OPTIONS.map((opt) => (
            <Button
              key={opt.mode}
              type={editorMode === opt.mode ? 'primary' : 'default'}
              icon={opt.icon}
              onClick={() => onEditorModeChange(opt.mode)}
              disabled={disabled}
              style={{ borderRadius: 8 }}
            >
              {opt.label}
            </Button>
          ))}
        </Space>
      </Card>

      {/* Table Types */}
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
        style={{ marginBottom: 12 }}
      >
        <div style={{ maxHeight: 240, overflowY: 'auto' }}>
          {activeTypes.map((tt) => (
            <div
              key={tt.id}
              className={`table-type-palette-item${selectedTypeId === tt.id ? ' active' : ''}`}
              onClick={() => {
                onSelectType(selectedTypeId === tt.id ? null : tt.id);
                if (selectedTypeId !== tt.id) onEditorModeChange('add');
              }}
            >
              <div
                className="table-type-swatch"
                style={{ background: tt.defaultColor ?? 'var(--accent-violet)' }}
              />
              <div className="table-type-info">
                <div className="table-type-name">
                  {tt.name}
                  <Badge status="default" style={{ marginLeft: 6 }} />
                </div>
                <div className="table-type-meta">
                  {tt.defaultCapacity} seats · {tt.defaultShape} · {centsToUSD(tt.defaultPriceCents ?? 0)}
                </div>
              </div>
            </div>
          ))}
          {activeTypes.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 8 }}>
              No active table types. Create some in Table Types settings.
            </div>
          )}
        </div>
      </Card>

      {/* Selected Table Properties */}
      <Card
        size="small"
        title={selectedTable ? `Edit: ${selectedTable.label}` : 'Table Details'}
        extra={selectedTable ? <Button type="link" size="small" onClick={onDeselectTable}>Close</Button> : null}
      >
        {!selectedTable ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '16px 8px' }}>
            Click a table on the canvas to edit
          </div>
        ) : (
          <>
            <Form
              form={form}
              layout="vertical"
              size="small"
              onValuesChange={handleFieldChange}
              disabled={disabled}
            >
              <Form.Item name="label" label="Label" rules={[{ required: true }]}>
                <Input maxLength={20} />
              </Form.Item>
              <Form.Item name="capacity" label="Capacity" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="shape" label="Shape" rules={[{ required: true }]}>
                <Select options={SHAPES} />
              </Form.Item>
              <Form.Item name="priceDollars" label="Price ($)" rules={[{ required: true }]}>
                <InputNumber min={0} step={0.01} prefix="$" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="color" label="Color">
                <Input placeholder="var(--accent-violet)" />
              </Form.Item>
            </Form>

            <Divider style={{ margin: '8px 0' }} />

            {!disabled && (
              <Popconfirm
                title="Remove this table?"
                onConfirm={onTableDelete}
                okText="Remove"
                okButtonProps={{ danger: true }}
              >
                <Button danger block icon={<DeleteOutlined />}>
                  Remove Table
                </Button>
              </Popconfirm>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
