import { useEffect } from 'react';
import { Card, Form, Input, InputNumber, Select, Button, Popconfirm, Alert } from 'antd';
import { DeleteOutlined, LockOutlined } from '@ant-design/icons';
import type { FloorPlanElement } from '../../../../stores/floorPlanStore';
import { centsToUSD } from '../../../../utils/currency';

interface TableDetailPanelProps {
  selectedTable: FloorPlanElement | null;
  isLocked: boolean;
  onUpdate: (patch: Partial<FloorPlanElement>) => void;
  onDelete: () => void;
  onClose: () => void;
}

const SHAPES = ['Round', 'Rectangle', 'Square', 'Cocktail'].map((s) => ({ label: s, value: s }));
const PRICE_TYPES = [
  { label: 'Per Table', value: 'PerTable' },
  { label: 'Per Seat', value: 'PerSeat' },
];

export default function TableDetailPanel({
  selectedTable,
  isLocked,
  onUpdate,
  onDelete,
  onClose,
}: TableDetailPanelProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (selectedTable) {
      form.setFieldsValue({
        ...selectedTable,
        priceDollars: (selectedTable.priceCents ?? 0) / 100,
      });
    }
  }, [selectedTable, form]);

  if (!selectedTable) {
    return (
      <div className="grid-editor-detail">
        <Card size="small" title="Table Details">
          <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '24px 8px' }}>
            Click a table on the grid to edit its details
          </div>
        </Card>
      </div>
    );
  }

  const handleFieldChange = (_changed: Record<string, unknown>, all: Record<string, unknown>) => {
    if (isLocked) return;
    // Convert dollars back to cents for the store
    const priceDollars = all.priceDollars as number | undefined;
    const patch: Partial<FloorPlanElement> = {
      label: all.label as string,
      capacity: all.capacity as number,
      shape: all.shape as FloorPlanElement['shape'],
      section: all.section as string | undefined,
      priceType: all.priceType as FloorPlanElement['priceType'],
      priceCents: Math.round((priceDollars ?? 0) * 100),
    };
    onUpdate(patch);
  };

  return (
    <div className="grid-editor-detail">
      <Card
        size="small"
        title={`Edit: ${selectedTable.label}`}
        extra={<Button type="link" size="small" onClick={onClose}>Close</Button>}
      >
        {isLocked && (
          <Alert
            type="warning"
            showIcon
            icon={<LockOutlined />}
            message="This table has active bookings or holds and cannot be modified."
            style={{ marginBottom: 12 }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          size="small"
          onValuesChange={handleFieldChange}
          disabled={isLocked}
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
          <Form.Item name="section" label="Section">
            <Input />
          </Form.Item>
          <Form.Item name="priceType" label="Price Type" rules={[{ required: true }]}>
            <Select options={PRICE_TYPES} />
          </Form.Item>
          <Form.Item name="priceDollars" label="Price ($)" rules={[{ required: true }]}>
            <InputNumber min={0} step={0.01} prefix="$" style={{ width: '100%' }} />
          </Form.Item>
        </Form>

        {selectedTable.priceCents > 0 && (
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
            Stored as: {centsToUSD(selectedTable.priceCents)}
          </div>
        )}

        {!isLocked && (
          <Popconfirm
            title="Remove this table from the grid?"
            onConfirm={onDelete}
            okText="Remove"
            okButtonProps={{ danger: true }}
          >
            <Button danger block icon={<DeleteOutlined />}>
              Remove Table
            </Button>
          </Popconfirm>
        )}
      </Card>
    </div>
  );
}
