import { useState } from 'react';
import { Card, Button, Space, Tag, Modal, Form, Select, Input, InputNumber, ColorPicker, App } from 'antd';
import { PlusOutlined, AimOutlined, EditOutlined } from '@ant-design/icons';
import type { EventTableType, TableTemplate } from '@code829/shared/types/layout';
import type { EditorMode } from '../LayoutEditorPage';
import { adminLayoutApi } from '../../../services/api';
import { centsToUSD } from '@code829/shared/utils/currency';

const SHAPES = ['Round', 'Rectangle', 'Square', 'Cocktail'].map((s) => ({ label: s, value: s }));

interface EventTableTypesControlProps {
  eventId: string;
  templates: TableTemplate[];
  activeEventTables: EventTableType[];
  selectedEventTableId: string | null;
  onSelectEventTable: (id: string | null) => void;
  onEditorModeChange: (mode: EditorMode) => void;
  onEventTableCreated: (et: EventTableType) => void;
  onEventTableUpdated: (et: EventTableType) => void;
}

export default function EventTableTypesControl({
  eventId,
  templates,
  activeEventTables,
  selectedEventTableId,
  onSelectEventTable,
  onEditorModeChange,
  onEventTableCreated,
  onEventTableUpdated,
}: EventTableTypesControlProps) {
  const { message } = App.useApp();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEventTable, setEditingEventTable] = useState<EventTableType | null>(null);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [editModalSaving, setEditModalSaving] = useState(false);

  const handleAddFromTemplate = async () => {
    try {
      const values = await addForm.validateFields();
      const template = templates.find((t) => t.id === values.templateId);
      const color = typeof values.color === 'string' ? values.color : values.color?.toHexString?.();
      const pending: EventTableType = {
        id: crypto.randomUUID(),
        eventId,
        tableTemplateId: values.templateId,
        tableTemplateName: template?.name,
        label: values.label || template?.name || 'Table Type',
        capacity: values.capacity ?? template?.defaultCapacity ?? 4,
        shape: values.shape || template?.defaultShape || 'Round',
        color: color || template?.defaultColor,
        priceCents: values.priceDollars != null ? Math.round(values.priceDollars * 100) : (template?.defaultPriceCents ?? 0),
        isActive: true,
        isPending: true,
      };
      onEventTableCreated(pending);
      setAddModalOpen(false);
      addForm.resetFields();
      message.success('Table type ready — place it on the grid to save');
    } catch {
      message.error('Failed to add event table type');
    }
  };

  const openEditEventTable = (et: EventTableType) => {
    setEditingEventTable(et);
    editForm.setFieldsValue({
      label: et.label,
      capacity: et.capacity,
      shape: et.shape,
      color: et.color,
      priceDollars: et.priceCents / 100,
    });
    setEditModalOpen(true);
  };

  const handleEditEventTable = async () => {
    if (!editingEventTable) return;
    try {
      const values = await editForm.validateFields();
      const color = typeof values.color === 'string' ? values.color : values.color?.toHexString?.();
      
      if (editingEventTable.isPending) {
        onEventTableUpdated({
          ...editingEventTable,
          label: values.label,
          capacity: values.capacity,
          shape: values.shape,
          color,
          priceCents: Math.round((values.priceDollars ?? 0) * 100),
        });
        setEditModalOpen(false);
        return;
      }
      
      setEditModalSaving(true);
      const res = await adminLayoutApi.updateEventTable(eventId, editingEventTable.id, {
        label: values.label,
        capacity: values.capacity,
        shape: values.shape,
        color,
        priceCents: Math.round((values.priceDollars ?? 0) * 100),
      });
      onEventTableUpdated(res.data);
      setEditModalOpen(false);
      message.success('Event table type updated');
    } catch {
      message.error('Failed to update event table type');
    } finally {
      setEditModalSaving(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const t = templates.find((tt) => tt.id === templateId);
    if (t) {
      addForm.setFieldsValue({
        label: t.name,
        capacity: t.defaultCapacity,
        shape: t.defaultShape,
        color: t.defaultColor,
        priceDollars: t.defaultPriceCents / 100,
      });
    }
  };

  return (
    <>
      <Card
        size="small"
        title="Event Table Types"
        extra={
          <Space size="small">
            {selectedEventTableId && (
              <Button size="small" type="link" onClick={() => onSelectEventTable(null)}>
                <AimOutlined /> Deselect
              </Button>
            )}
            <Button size="small" type="link" onClick={() => {
              addForm.resetFields();
              const first = templates.find((t) => t.isActive);
              if (first) {
                addForm.setFieldsValue({
                  templateId: first.id,
                  label: first.name,
                  capacity: first.defaultCapacity,
                  shape: first.defaultShape,
                  color: first.defaultColor,
                  priceDollars: first.defaultPriceCents / 100,
                });
              }
              setAddModalOpen(true);
            }}>
              <PlusOutlined /> Add
            </Button>
          </Space>
        }
        style={{ marginBottom: 12 }}
      >
        <div style={{ maxHeight: 280, overflowY: 'auto' }}>
          {activeEventTables.map((et) => (
            <div
              key={et.id}
              className={`table-type-palette-item${selectedEventTableId === et.id ? ' active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
              onClick={() => {
                onSelectEventTable(selectedEventTableId === et.id ? null : et.id);
                if (selectedEventTableId !== et.id) onEditorModeChange('add');
              }}
            >
              <div
                className="table-type-swatch"
                style={{ background: et.color ?? 'var(--accent-violet)' }}
              />
              <div className="table-type-info" style={{ flex: 1 }}>
                <div className="table-type-name">
                  {et.label}
                  {et.isPending && (
                    <Tag color="orange" style={{ marginLeft: 6, fontSize: 10, padding: '0 4px', lineHeight: '16px' }}>
                      unsaved
                    </Tag>
                  )}
                </div>
                <div className="table-type-meta">
                  {et.capacity} seats · {et.shape} · {centsToUSD(et.priceCents)}
                </div>
              </div>
              <Button
                size="small"
                type="text"
                icon={<EditOutlined />}
                onClick={(e) => { e.stopPropagation(); openEditEventTable(et); }}
              />
            </div>
          ))}
          {activeEventTables.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 8 }}>
              No event table types. Click &quot;Add&quot; to create one from a template.
            </div>
          )}
        </div>
      </Card>

      {/* Add Modal */}
      <Modal
        title="Add Event Table Type"
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        onOk={handleAddFromTemplate}
        confirmLoading={false}
        width="100%"
        style={{ top: 16, maxWidth: 480 }}
      >
        <Form form={addForm} layout="vertical">
          <Form.Item name="templateId" label="From Template (optional)">
            <Select
              allowClear
              placeholder="Pick a template to pre-fill..."
              options={templates.filter((t) => t.isActive).map((t) => ({
                label: `${t.name} (${t.defaultCapacity}p · ${centsToUSD(t.defaultPriceCents)})`,
                value: t.id,
              }))}
              onChange={handleTemplateSelect}
            />
          </Form.Item>
          <Form.Item name="label" label="Label" rules={[{ required: true }]}>
            <Input placeholder="e.g. VIP Table" />
          </Form.Item>
          <Form.Item name="capacity" label="Capacity" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="shape" label="Shape" rules={[{ required: true }]}>
            <Select options={SHAPES} />
          </Form.Item>
          <Form.Item name="color" label="Color" getValueFromEvent={(color) => color?.toHexString?.() ?? color}>
            <ColorPicker
              format="hex"
              showText
              presets={[{
                label: 'Recommended',
                colors: ['#7C3AED', '#5B21B6', '#2563EB', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#8B5CF6'],
              }]}
            />
          </Form.Item>
          <Form.Item name="priceDollars" label="Price ($)" rules={[{ required: true }]}>
            <InputNumber min={0} step={0.01} prefix="$" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title={`Edit: ${editingEventTable?.label ?? ''}`}
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={handleEditEventTable}
        confirmLoading={editModalSaving}
        width="100%"
        style={{ top: 16, maxWidth: 480 }}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="label" label="Label" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="capacity" label="Capacity" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="shape" label="Shape" rules={[{ required: true }]}>
            <Select options={SHAPES} />
          </Form.Item>
          <Form.Item name="color" label="Color" getValueFromEvent={(color) => color?.toHexString?.() ?? color}>
            <ColorPicker
              format="hex"
              showText
              presets={[{
                label: 'Recommended',
                colors: ['#7C3AED', '#5B21B6', '#2563EB', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#8B5CF6'],
              }]}
            />
          </Form.Item>
          <Form.Item name="priceDollars" label="Price ($)" rules={[{ required: true }]}>
            <InputNumber min={0} step={0.01} prefix="$" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
