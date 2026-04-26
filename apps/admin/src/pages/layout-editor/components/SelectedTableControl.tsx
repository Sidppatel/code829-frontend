import { useEffect } from 'react';
import { Card, Button, Form, Input, InputNumber, Select, Divider, Popconfirm, Tag } from 'antd';
import { DeleteOutlined, CheckCircleOutlined, LockOutlined } from '@ant-design/icons';
import type { LayoutTable, EventTableType } from '@code829/shared/types/layout';
import { centsToUSD } from '@code829/shared/utils/currency';

interface SelectedTableControlProps {
  selectedTable: LayoutTable | null;
  isSelectedTableLocked: boolean;
  disabled: boolean;
  activeEventTables: EventTableType[];
  onDeselectTable: () => void;
  onTableUpdate: (patch: Partial<LayoutTable>) => void;
  onTableDelete: () => void;
}

export default function SelectedTableControl({
  selectedTable,
  isSelectedTableLocked,
  disabled,
  activeEventTables,
  onDeselectTable,
  onTableUpdate,
  onTableDelete,
}: SelectedTableControlProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (selectedTable) {
      form.setFieldsValue({
        label: selectedTable.label,
        eventTableId: selectedTable.eventTableId,
        rowSpan: selectedTable.rowSpan,
        colSpan: selectedTable.colSpan,
      });
    }
  }, [selectedTable, form]);

  const handleFieldChange = (_changed: Record<string, unknown>, all: Record<string, unknown>) => {
    if (disabled) return;
    const patch: Partial<LayoutTable> = {
      label: all.label as string,
    };
    const rowSpan = all.rowSpan as number | undefined;
    const colSpan = all.colSpan as number | undefined;
    if (typeof rowSpan === 'number' && rowSpan >= 1) patch.rowSpan = rowSpan;
    if (typeof colSpan === 'number' && colSpan >= 1) patch.colSpan = colSpan;
    const newEtId = all.eventTableId as string | undefined;
    if (newEtId && newEtId !== selectedTable?.eventTableId) {
      const et = activeEventTables.find((e) => e.id === newEtId);
      if (et) {
        patch.eventTableId = et.id;
        patch.eventTableLabel = et.label;
        patch.capacity = et.capacity;
        patch.shape = et.shape;
        patch.color = et.color;
        patch.priceCents = et.priceCents ?? 0;
        if (et.rowSpan != null) patch.rowSpan = et.rowSpan;
        if (et.colSpan != null) patch.colSpan = et.colSpan;
      }
    }
    onTableUpdate(patch);
  };

  return (
    <Card
      size="small"
      title={selectedTable ? `Edit: ${String.fromCharCode(65 + (selectedTable.gridCol % 26))}${selectedTable.gridRow + 1}` : 'Table Details'}
      extra={selectedTable ? <Button type="link" size="small" onClick={onDeselectTable}>Close</Button> : null}
    >
      {!selectedTable ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '16px 8px' }}>
          Click a table on the grid to edit
        </div>
      ) : (
        <>
          {isSelectedTableLocked && (
            <div style={{ marginBottom: 12 }}>
              {selectedTable.status === 'Booked' ? (
                <Tag icon={<CheckCircleOutlined />} color="error" style={{ fontSize: 12 }}>
                  Booked — position locked
                </Tag>
              ) : (
                <Tag icon={<LockOutlined />} color="warning" style={{ fontSize: 12 }}>
                  Locked by user — position locked
                </Tag>
              )}
            </div>
          )}

          <Form
            form={form}
            layout="vertical"
            size="small"
            onValuesChange={handleFieldChange}
            disabled={disabled || isSelectedTableLocked}
          >
            <Form.Item name="label" label="Label" rules={[{ required: true }]}>
              <Input maxLength={20} />
            </Form.Item>
            <Form.Item name="eventTableId" label="Table Type">
              <Select
                options={activeEventTables.map((et) => ({
                  label: `${et.label} (${et.capacity}p · ${centsToUSD(et.priceCents ?? 0)})`,
                  value: et.id,
                }))}
              />
            </Form.Item>
            <div style={{ display: 'flex', gap: 8 }}>
              <Form.Item name="rowSpan" label="Row span" style={{ flex: 1 }}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="colSpan" label="Col span" style={{ flex: 1 }}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
              {selectedTable.capacity} seats · {selectedTable.shape} · {centsToUSD(selectedTable.priceCents ?? 0)}
            </div>
          </Form>

          <Divider style={{ margin: '8px 0' }} />

          {!isSelectedTableLocked && (
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
  );
}
