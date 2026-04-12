import { useEffect } from 'react';
import { Card, Button, Form, Input, Select, Divider, Popconfirm, Tag } from 'antd';
import { DeleteOutlined, CheckCircleOutlined, LockOutlined } from '@ant-design/icons';
import type { LayoutTable } from '../LayoutEditorPage';
import type { EventTableType } from '../../../../types/layout';
import { centsToUSD } from '../../../../utils/currency';

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
      });
    }
  }, [selectedTable, form]);

  const handleFieldChange = (_changed: Record<string, unknown>, all: Record<string, unknown>) => {
    if (disabled) return;
    const patch: Partial<LayoutTable> = {
      label: all.label as string,
    };
    const newEtId = all.eventTableId as string | undefined;
    if (newEtId && newEtId !== selectedTable?.eventTableId) {
      const et = activeEventTables.find((e) => e.id === newEtId);
      if (et) {
        patch.eventTableId = et.id;
        patch.eventTableLabel = et.label;
        patch.capacity = et.capacity;
        patch.shape = et.shape;
        patch.color = et.color;
        patch.priceCents = et.priceCents;
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
                  label: `${et.label} (${et.capacity}p · ${centsToUSD(et.priceCents)})`,
                  value: et.id,
                }))}
              />
            </Form.Item>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
              {selectedTable.capacity} seats · {selectedTable.shape} · {centsToUSD(selectedTable.priceCents)}
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
