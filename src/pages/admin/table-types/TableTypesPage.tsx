import { useEffect, useState } from 'react';
import { Table, Button, Space, App, Popconfirm, Modal, Form, Input, InputNumber, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { adminLayoutApi } from '../../../services/api';
import { centsToUSD } from '../../../utils/currency';
import type { TableType } from '../../../types/layout';
import type { CreateTableTypePayload } from '../../../services/adminLayoutApi';
import PageHeader from '../../../components/shared/PageHeader';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';

export default function TableTypesPage() {
  const [types, setTypes] = useState<TableType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await adminLayoutApi.listTableTypes();
      setTypes(data);
    } catch {
      message.error('Failed to load table types');
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

  const openEdit = (record: TableType) => {
    setEditingId(record.id);
    form.setFieldsValue({
      name: record.name,
      defaultCapacity: record.defaultCapacity,
      defaultShape: record.defaultShape,
      defaultColor: record.defaultColor,
      defaultPriceCents: record.defaultPriceCents,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload: CreateTableTypePayload = {
        name: values.name,
        defaultCapacity: values.defaultCapacity,
        defaultShape: values.defaultShape,
        defaultColor: values.defaultColor,
        defaultPriceCents: values.defaultPriceCents,
      };
      if (editingId) {
        await adminLayoutApi.updateTableType(editingId, payload);
        message.success('Table type updated');
      } else {
        await adminLayoutApi.createTableType(payload);
        message.success('Table type created');
      }
      setModalOpen(false);
      void load();
    } catch {
      message.error('Failed to save table type');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminLayoutApi.deleteTableType(id);
      message.success('Table type deleted');
      void load();
    } catch {
      message.error('Failed to delete table type');
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Capacity', dataIndex: 'defaultCapacity', key: 'defaultCapacity' },
    { title: 'Shape', dataIndex: 'defaultShape', key: 'defaultShape' },
    { title: 'Default Price', dataIndex: 'defaultPriceCents', key: 'defaultPriceCents',
      render: (v: number | undefined) => v != null ? centsToUSD(v) : '—',
    },
    { title: 'Active', dataIndex: 'isActive', key: 'isActive', render: (v: boolean) => v ? 'Yes' : 'No' },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, record: TableType) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm title="Delete this table type?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Table Types" subtitle="Define reusable table configurations"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Type</Button>}
      />
      <div className="responsive-table">
        <Table dataSource={types} columns={columns} rowKey="id" pagination={false} scroll={{ x: 600 }} />
      </div>
      <Modal title={editingId ? 'Edit Table Type' : 'Add Table Type'} open={modalOpen}
        onCancel={() => setModalOpen(false)} onOk={handleSave} confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="defaultCapacity" label="Default Capacity" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="defaultShape" label="Shape" rules={[{ required: true }]}>
            <Select options={['Round', 'Rectangle', 'Square', 'Booth'].map((s) => ({ label: s, value: s }))} />
          </Form.Item>
          <Form.Item name="defaultColor" label="Color"><Input placeholder="Optional" /></Form.Item>
          <Form.Item name="defaultPriceCents" label="Default Price (cents)">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
