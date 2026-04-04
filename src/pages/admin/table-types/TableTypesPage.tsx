import { useEffect, useState } from 'react';
import { Table, Button, Switch, App, Tooltip, Modal, Form, Input, InputNumber, Select, ColorPicker } from 'antd';
import { PlusOutlined, EditOutlined, TeamOutlined } from '@ant-design/icons';
import { adminLayoutApi } from '../../../services/api';
import { centsToUSD } from '../../../utils/currency';
import type { TableTemplate } from '../../../types/layout';
import type { CreateTableTemplatePayload } from '../../../services/adminLayoutApi';
import PageHeader from '../../../components/shared/PageHeader';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';

export default function TableTypesPage() {
  const [types, setTypes] = useState<TableTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await adminLayoutApi.listTableTemplates();
      setTypes(data);
    } catch {
      message.error('Failed to load table templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record: TableTemplate) => {
    setEditingId(record.id);
    form.setFieldsValue({
      name: record.name,
      defaultCapacity: record.defaultCapacity,
      defaultShape: record.defaultShape,
      defaultColor: record.defaultColor ?? '#7C3AED',
      defaultPriceCents: record.defaultPriceCents / 100,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload: CreateTableTemplatePayload = {
        name: values.name,
        defaultCapacity: values.defaultCapacity,
        defaultShape: values.defaultShape,
        defaultColor: typeof values.defaultColor === 'string'
          ? values.defaultColor
          : values.defaultColor?.toHexString?.() ?? '#7C3AED',
        defaultPriceCents: values.defaultPriceCents != null
          ? Math.round(values.defaultPriceCents * 100)
          : undefined,
      };
      if (editingId) {
        await adminLayoutApi.updateTableTemplate(editingId, payload);
        message.success('Template updated');
      } else {
        await adminLayoutApi.createTableTemplate(payload);
        message.success('Template created');
      }
      setModalOpen(false);
      void load();
    } catch {
      message.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (record: TableTemplate) => {
    try {
      await adminLayoutApi.updateTableTemplate(record.id, {
        name: record.name,
        defaultCapacity: record.defaultCapacity,
        defaultShape: record.defaultShape,
        defaultColor: record.defaultColor,
        defaultPriceCents: record.defaultPriceCents,
        isActive: !record.isActive,
      });
      message.success(`Template ${record.isActive ? 'deactivated' : 'activated'}`);
      void load();
    } catch {
      message.error('Failed to update template');
    }
  };

  const columns = [
    {
      title: 'Template',
      key: 'type',
      render: (_: unknown, record: TableTemplate) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            className="tt-swatch"
            style={{ background: record.defaultColor || '#7C3AED' }}
          />
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{record.name}</span>
        </div>
      ),
    },
    {
      title: 'Capacity',
      dataIndex: 'defaultCapacity',
      key: 'defaultCapacity',
      width: 100,
      render: (v: number) => (
        <span style={{ color: 'var(--text-secondary)' }}>
          <TeamOutlined style={{ marginRight: 4 }} />{v}
        </span>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'defaultPriceCents',
      key: 'defaultPriceCents',
      width: 110,
      render: (v: number) => (
        <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>{centsToUSD(v)}</span>
      ),
    },
    {
      title: 'Status',
      key: 'isActive',
      width: 100,
      render: (_: unknown, record: TableTemplate) => (
        <Switch
          checked={record.isActive}
          onChange={() => handleToggleActive(record)}
          checkedChildren="On"
          unCheckedChildren="Off"
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: unknown, record: TableTemplate) => (
        <Tooltip title="Edit">
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} style={{ borderRadius: 8 }} />
        </Tooltip>
      ),
    },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Table Templates" subtitle="Define reusable table configurations"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Template</Button>}
      />

      {/* Mobile card grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}
           className="mobile-card-list">
        {types.map((tt) => (
          <div
            key={tt.id}
            className={`admin-section${tt.isActive ? '' : ' inactive'}`}
            style={{ padding: 14, cursor: 'pointer', position: 'relative' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div className="tt-swatch" style={{ background: tt.defaultColor || '#7C3AED', width: 32, height: 32 }} />
              <Switch checked={tt.isActive} onChange={() => handleToggleActive(tt)} size="small" />
            </div>

            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {tt.name}
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
              <TeamOutlined style={{ marginRight: 3 }} />{tt.defaultCapacity} seats
              <span style={{ marginLeft: 8, color: 'var(--accent-gold)', fontWeight: 600 }}>
                {centsToUSD(tt.defaultPriceCents)}
              </span>
            </div>

            <Button
              size="small"
              block
              icon={<EditOutlined />}
              onClick={() => openEdit(tt)}
              style={{ borderRadius: 8 }}
            >
              Edit
            </Button>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="desktop-table">
        <div className="responsive-table">
          <Table dataSource={types} columns={columns} rowKey="id" pagination={false} />
        </div>
      </div>

      <Modal title={editingId ? 'Edit Template' : 'Add Template'} open={modalOpen}
        onCancel={() => setModalOpen(false)} onOk={handleSave} confirmLoading={saving}
        width="100%"
        style={{ top: 16, maxWidth: 520 }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="defaultCapacity" label="Default Capacity" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="defaultShape" label="Shape" rules={[{ required: true }]}>
            <Select options={['Round', 'Rectangle', 'Square', 'Cocktail'].map((s) => ({ label: s, value: s }))} />
          </Form.Item>
          <Form.Item name="defaultColor" label="Color">
            <ColorPicker
              format="hex"
              onChange={(color) => form.setFieldValue('defaultColor', color.toHexString())}
              showText
              presets={[
                {
                  label: 'Recommended',
                  colors: [
                    '#7C3AED', '#5B21B6', '#2563EB', '#0EA5E9',
                    '#10B981', '#F59E0B', '#EF4444', '#EC4899',
                    '#6366F1', '#14B8A6', '#F97316', '#8B5CF6',
                  ],
                },
              ]}
            />
          </Form.Item>
          <Form.Item name="defaultPriceCents" label="Price (USD)">
            <InputNumber min={0} step={0.01} precision={2} placeholder="0.00" prefix="$" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
