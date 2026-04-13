import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Switch, App, Tooltip, Modal, Form, Input, InputNumber, Select, ColorPicker } from 'antd';
import { PlusOutlined, EditOutlined, TeamOutlined } from '@ant-design/icons';
import { adminLayoutApi } from '../../services/api';
import { centsToUSD } from '@code829/shared/utils/currency';
import type { TableTemplate } from '@code829/shared/types/layout';
import type { CreateTableTemplatePayload } from '../../services/adminLayoutApi';
import PageHeader from '@code829/shared/components/shared/PageHeader';
import LoadingSpinner from '@code829/shared/components/shared/LoadingSpinner';
import HumanCard from '@code829/shared/components/shared/HumanCard';

export default function TableTypesPage() {
  const [types, setTypes] = useState<TableTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminLayoutApi.listTableTemplates();
      setTypes(data);
    } catch {
      message.error('Failed to load table templates');
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => { void load(); }, [load]);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            className="tt-swatch human-noise"
            style={{ 
              background: record.defaultColor || 'var(--primary)',
              width: 40,
              height: 40,
              borderRadius: 10,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 16, fontFamily: "'Playfair Display', serif" }}>
              {record.name}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {record.defaultShape}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Capacity',
      dataIndex: 'defaultCapacity',
      key: 'defaultCapacity',
      width: 120,
      render: (v: number) => (
        <span style={{ 
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontWeight: 600
        }}>
          <TeamOutlined style={{ color: 'var(--primary)' }} />{v} seats
        </span>
      ),
    },
    {
      title: 'Default Price',
      dataIndex: 'defaultPriceCents',
      key: 'defaultPriceCents',
      width: 140,
      render: (v: number) => (
        <span style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: 15 }}>{centsToUSD(v)}</span>
      ),
    },
    {
      title: 'Status',
      key: 'isActive',
      width: 120,
      render: (_: unknown, record: TableTemplate) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ 
            fontSize: 11, 
            fontWeight: 700, 
            color: record.isActive ? 'var(--accent-green)' : 'var(--text-muted)',
            textTransform: 'uppercase'
          }}>
            {record.isActive ? 'Active' : 'Off'}
          </span>
          <Switch
            checked={record.isActive}
            onChange={() => handleToggleActive(record)}
            size="small"
          />
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: unknown, record: TableTemplate) => (
        <Tooltip title="Edit Template">
          <Button 
            shape="circle" 
            icon={<EditOutlined />} 
            onClick={() => openEdit(record)} 
            style={{ 
              border: '1px solid var(--border)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }} 
          />
        </Tooltip>
      ),
    },
  ];

  if (loading) return <LoadingSpinner skeleton="card" />;

  return (
    <div className="spring-up">
      <PageHeader 
        title="Table Templates" 
        subtitle={[
          "Define reusable configurations for your event layouts.",
          "Standardize seating, pricing, and visual styles across venues.",
          "Consistency is the bedrock of premium guest experiences."
        ]}
        rotateSubtitle
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={openCreate}
            style={{
              borderRadius: 'var(--radius-full)',
              height: 48,
              padding: '0 32px',
              fontWeight: 700,
              boxShadow: '0 8px 16px hsla(var(--p-h), var(--p-s), var(--p-l), 0.3)'
            }}
          >
            Add Template
          </Button>
        }
      />

      {/* Mobile view using HumanCards */}
      <div className="mobile-only-block" style={{ marginBottom: 40 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {types.map((tt) => (
            <HumanCard
              key={tt.id}
              className="human-noise"
              style={{
                opacity: tt.isActive ? 1 : 0.7,
                border: tt.isActive ? '1px solid var(--border)' : '1px dashed var(--border)',
              }}
              title={tt.name}
              subtitle={`${tt.defaultShape} • ${tt.defaultCapacity} seats`}
              extra={<Switch checked={tt.isActive} onChange={() => handleToggleActive(tt)} size="small" />}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="tt-swatch" style={{ background: tt.defaultColor || 'var(--primary)', width: 24, height: 24, borderRadius: 6 }} />
                  <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>
                    {centsToUSD(tt.defaultPriceCents)}
                  </span>
                </div>
                <Button 
                  size="small"
                  icon={<EditOutlined />} 
                  onClick={() => openEdit(tt)}
                  style={{ borderRadius: 'var(--radius-full)', fontWeight: 600 }}
                >
                  Edit
                </Button>
              </div>
            </HumanCard>
          ))}
        </div>
      </div>

      {/* Desktop view using responsive table */}
      <div className="desktop-only-block" style={{ marginBottom: 40 }}>
        <div className="glass-card" style={{ padding: '0px', overflow: 'hidden' }}>
          <div className="responsive-table">
            <Table 
              dataSource={types} 
              columns={columns} 
              rowKey="id" 
              pagination={false}
              style={{ background: 'transparent' }}
            />
          </div>
        </div>
      </div>

      <Modal 
        title={editingId ? 'Edit Table Template' : 'Create New Template'} 
        open={modalOpen}
        onCancel={() => setModalOpen(false)} 
        onOk={handleSave} 
        confirmLoading={saving}
        width="100%"
        style={{ top: 16, maxWidth: 520 }}
        okText="Save Configuration"
        cancelText="Discard"
        className="human-modal"
        okButtonProps={{
          style: { borderRadius: 'var(--radius-full)', fontWeight: 700, padding: '0 24px' }
        }}
        cancelButtonProps={{
          style: { borderRadius: 'var(--radius-full)', fontWeight: 600 }
        }}
      >
        <div style={{ padding: '8px 0' }}>
          <Form form={form} layout="vertical" requiredMark={false}>
            <Form.Item name="name" label="Template Name" rules={[{ required: true }]}><Input placeholder="e.g. VIP Circular" /></Form.Item>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item name="defaultCapacity" label="Guest Capacity" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="defaultShape" label="Table Shape" rules={[{ required: true }]}>
                <Select options={['Round', 'Rectangle', 'Square', 'Cocktail'].map((s) => ({ label: s, value: s }))} />
              </Form.Item>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item name="defaultPriceCents" label="Default Price (USD)">
                <InputNumber min={0} step={0.01} precision={2} placeholder="0.00" prefix="$" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="defaultColor" label="Visual Marker">
                <ColorPicker
                  format="hex"
                  onChange={(color) => form.setFieldValue('defaultColor', color.toHexString())}
                  showText
                  presets={[
                    {
                      label: 'Theme Colors',
                      colors: [
                        '#7C3AED', '#2563EB', '#10B981', '#F59E0B', 
                        '#EF4444', '#EC4899', '#6366F1', '#14B8A6'
                      ],
                    },
                  ]}
                />
              </Form.Item>
            </div>
          </Form>
        </div>
      </Modal>
    </div>
  );
}
