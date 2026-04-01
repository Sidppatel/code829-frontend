import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Table, Button, Space, App, Popconfirm, Modal, Form, Input, InputNumber, Select, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { adminPricingApi } from '../../../services/api';
import type { PricingRule } from '../../../types/pricing';
import PageHeader from '../../../components/shared/PageHeader';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';

export default function PricingPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const load = async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const { data } = await adminPricingApi.list(eventId);
      setRules(data);
    } catch {
      message.error('Failed to load pricing rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [eventId]);

  const openCreate = () => {
    setEditingRule(null);
    form.resetFields();
    form.setFieldsValue({ priority: rules.length + 1, isActive: true });
    setModalOpen(true);
  };

  const openEdit = (rule: PricingRule) => {
    setEditingRule(rule);
    form.setFieldsValue(rule);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!eventId) return;
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editingRule) {
        await adminPricingApi.update(eventId, editingRule.id, values);
        message.success('Rule updated');
      } else {
        await adminPricingApi.create(eventId, values);
        message.success('Rule created');
      }
      setModalOpen(false);
      void load();
    } catch {
      message.error('Failed to save rule');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!eventId) return;
    try {
      await adminPricingApi.delete(eventId, ruleId);
      message.success('Rule deleted');
      void load();
    } catch {
      message.error('Failed to delete rule');
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Type', dataIndex: 'ruleType', key: 'ruleType' },
    { title: 'Adjustment', key: 'adjustment',
      render: (_: unknown, r: PricingRule) =>
        `${r.adjustmentType === 'Percentage' ? r.adjustmentValue + '%' : '$' + (r.adjustmentValue / 100).toFixed(2)}`,
    },
    { title: 'Priority', dataIndex: 'priority', key: 'priority' },
    { title: 'Active', dataIndex: 'isActive', key: 'isActive',
      render: (v: boolean) => v ? 'Yes' : 'No',
    },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, record: PricingRule) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm title="Delete?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Pricing Rules" subtitle={`${rules.length} rules configured`}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Rule</Button>}
      />
      <Table dataSource={rules} columns={columns} rowKey="id" pagination={false} />
      <Modal title={editingRule ? 'Edit Rule' : 'Add Rule'} open={modalOpen}
        onCancel={() => setModalOpen(false)} onOk={handleSave} confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="ruleType" label="Rule Type" rules={[{ required: true }]}>
            <Select options={['EarlyBird', 'LastMinute', 'GroupDiscount', 'PromoCode', 'Custom'].map((s) => ({ label: s, value: s }))} />
          </Form.Item>
          <Form.Item name="adjustmentType" label="Adjustment Type" rules={[{ required: true }]}>
            <Select options={['Percentage', 'FixedAmount'].map((s) => ({ label: s, value: s }))} />
          </Form.Item>
          <Form.Item name="adjustmentValue" label="Value" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="priority" label="Priority" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
