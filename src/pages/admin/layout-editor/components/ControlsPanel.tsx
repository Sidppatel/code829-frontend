import { useEffect, useState } from 'react';
import {
  Card,
  ColorPicker,
  InputNumber,
  Button,
  Space,
  Form,
  Input,
  Select,
  Popconfirm,
  Divider,
  Badge,
  Tag,
  Modal,
  App,
} from 'antd';
import {
  AppstoreOutlined,
  PlusOutlined,
  DeleteOutlined,
  SelectOutlined,
  AimOutlined,
  LockOutlined,
  CheckCircleOutlined,
  EditOutlined,
} from '@ant-design/icons';
import type { TableTemplate, EventTableType } from '../../../../types/layout';
import type { LayoutTable, EditorMode } from '../LayoutEditorPage';
import { adminLayoutApi } from '../../../../services/api';
import { centsToUSD } from '../../../../utils/currency';

interface ControlsPanelProps {
  eventId: string;
  gridRows: number;
  gridCols: number;
  onGridRowsChange: (v: number) => void;
  onGridColsChange: (v: number) => void;
  templates: TableTemplate[];
  eventTables: EventTableType[];
  selectedEventTableId: string | null;
  onSelectEventTable: (id: string | null) => void;
  editorMode: EditorMode;
  onEditorModeChange: (mode: EditorMode) => void;
  selectedTable: LayoutTable | null;
  onTableUpdate: (patch: Partial<LayoutTable>) => void;
  onTableDelete: () => void;
  onDeselectTable: () => void;
  disabled: boolean;
  isSelectedTableLocked: boolean;
  onEventTableCreated: (et: EventTableType) => void;
  onEventTableUpdated: (et: EventTableType) => void;
}

const SHAPES = ['Round', 'Rectangle', 'Square', 'Cocktail'].map((s) => ({ label: s, value: s }));

const MODE_OPTIONS: { mode: EditorMode; icon: React.ReactNode; label: string }[] = [
  { mode: 'select', icon: <SelectOutlined />, label: 'Select' },
  { mode: 'add', icon: <PlusOutlined />, label: 'Add' },
  { mode: 'delete', icon: <DeleteOutlined />, label: 'Delete' },
];

export default function ControlsPanel({
  eventId,
  gridRows,
  gridCols,
  onGridRowsChange,
  onGridColsChange,
  templates,
  eventTables,
  selectedEventTableId,
  onSelectEventTable,
  editorMode,
  onEditorModeChange,
  selectedTable,
  onTableUpdate,
  onTableDelete,
  onDeselectTable,
  disabled,
  isSelectedTableLocked,
  onEventTableCreated,
  onEventTableUpdated,
}: ControlsPanelProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEventTable, setEditingEventTable] = useState<EventTableType | null>(null);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [modalSaving, setModalSaving] = useState(false);

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
    // If event table assignment changed, update joined fields
    const newEtId = all.eventTableId as string | undefined;
    if (newEtId && newEtId !== selectedTable?.eventTableId) {
      const et = eventTables.find((e) => e.id === newEtId);
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

  const activeEventTables = eventTables.filter((t) => t.isActive);

  const handleAddFromTemplate = async () => {
    try {
      const values = await addForm.validateFields();
      setModalSaving(true);
      const template = templates.find((t) => t.id === values.templateId);
      const res = await adminLayoutApi.createEventTable(eventId, {
        tableTemplateId: values.templateId,
        label: values.label || template?.name || 'Table Type',
        capacity: values.capacity ?? template?.defaultCapacity ?? 4,
        shape: values.shape || template?.defaultShape || 'Round',
        color: (typeof values.color === 'string' ? values.color : values.color?.toHexString?.()) || template?.defaultColor,
        priceCents: values.priceDollars != null ? Math.round(values.priceDollars * 100) : (template?.defaultPriceCents ?? 0),
      });
      onEventTableCreated(res.data);
      setAddModalOpen(false);
      addForm.resetFields();
      message.success('Event table type added');
    } catch {
      message.error('Failed to add event table type');
    } finally {
      setModalSaving(false);
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
      setModalSaving(true);
      const res = await adminLayoutApi.updateEventTable(eventId, editingEventTable.id, {
        label: values.label,
        capacity: values.capacity,
        shape: values.shape,
        color: typeof values.color === 'string' ? values.color : values.color?.toHexString?.(),
        priceCents: Math.round((values.priceDollars ?? 0) * 100),
      });
      onEventTableUpdated(res.data);
      setEditModalOpen(false);
      message.success('Event table type updated');
    } catch {
      message.error('Failed to update event table type');
    } finally {
      setModalSaving(false);
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

      {/* Event Table Types */}
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
            <Button size="small" type="link" onClick={() => { addForm.resetFields(); setAddModalOpen(true); }}>
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
                  <Badge status="default" style={{ marginLeft: 6 }} />
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

      {/* Selected Table Properties */}
      <Card
        size="small"
        title={selectedTable ? `Edit: ${selectedTable.label}` : 'Table Details'}
        extra={selectedTable ? <Button type="link" size="small" onClick={onDeselectTable}>Close</Button> : null}
      >
        {!selectedTable ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '16px 8px' }}>
            Click a table on the grid to edit
          </div>
        ) : (
          <>
            {/* Status indicator for locked/booked tables */}
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

      {/* Add Event Table Modal */}
      <Modal
        title="Add Event Table Type"
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        onOk={handleAddFromTemplate}
        confirmLoading={modalSaving}
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

      {/* Edit Event Table Modal */}
      <Modal
        title={`Edit: ${editingEventTable?.label ?? ''}`}
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={handleEditEventTable}
        confirmLoading={modalSaving}
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
    </div>
  );
}
