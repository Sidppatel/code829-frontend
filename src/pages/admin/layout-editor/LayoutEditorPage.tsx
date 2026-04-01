import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Button, Space, App, Table, Modal, Form, Input, InputNumber, Select, Tag, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, LockOutlined } from '@ant-design/icons';
import { adminLayoutApi } from '../../../services/api';
import { centsToUSD } from '../../../utils/currency';
import type { LayoutTable } from '../../../types/layout';
import PageHeader from '../../../components/shared/PageHeader';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';

export default function LayoutEditorPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [tables, setTables] = useState<LayoutTable[]>([]);
  const [lockedIds, setLockedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<LayoutTable | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const load = async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const [layoutRes, lockedRes] = await Promise.all([
        adminLayoutApi.getLayout(eventId),
        adminLayoutApi.getLockedTables(eventId),
      ]);
      setTables(layoutRes.data.tables ?? []);
      setLockedIds(lockedRes.data.lockedTableIds ?? []);
    } catch {
      message.error('Failed to load layout');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [eventId]);

  const openAdd = () => {
    setEditingTable(null);
    form.resetFields();
    form.setFieldsValue({ capacity: 4, shape: 'Round', priceType: 'Fixed', priceCents: 0, isActive: true });
    setModalOpen(true);
  };

  const openEdit = (t: LayoutTable) => {
    setEditingTable(t);
    form.setFieldsValue(t);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!eventId) return;
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (editingTable) {
        await adminLayoutApi.updateTable(eventId, editingTable.id, values);
        message.success('Table updated');
      } else {
        await adminLayoutApi.addTable(eventId, values);
        message.success('Table added');
      }
      setModalOpen(false);
      void load();
    } catch {
      message.error('Failed to save table');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tableId: string) => {
    if (!eventId) return;
    try {
      await adminLayoutApi.deleteTable(eventId, tableId);
      message.success('Table removed');
      void load();
    } catch {
      message.error('Failed to delete table');
    }
  };

  const isLocked = (id: string) => lockedIds.includes(id);

  const columns = [
    { title: 'Label', dataIndex: 'label', key: 'label',
      render: (text: string, record: LayoutTable) => (
        <Space>{text}{isLocked(record.id) && <LockOutlined />}</Space>
      ),
    },
    { title: 'Capacity', dataIndex: 'capacity', key: 'capacity' },
    { title: 'Shape', dataIndex: 'shape', key: 'shape' },
    { title: 'Section', dataIndex: 'section', key: 'section', render: (v: string | undefined) => v ?? '—' },
    { title: 'Price', dataIndex: 'priceCents', key: 'priceCents', render: (v: number) => centsToUSD(v) },
    { title: 'Active', dataIndex: 'isActive', key: 'isActive',
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Yes' : 'No'}</Tag>,
    },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, record: LayoutTable) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} disabled={isLocked(record.id)} />
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} disabled={isLocked(record.id)} />
        </Space>
      ),
    },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Layout Editor" subtitle={`${tables.length} tables configured`}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>Add Table</Button>}
      />
      {lockedIds.length > 0 && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <LockOutlined /> {lockedIds.length} table(s) locked due to active bookings
        </Card>
      )}
      <Table dataSource={tables} columns={columns} rowKey="id" pagination={false} />
      <Modal title={editingTable ? 'Edit Table' : 'Add Table'} open={modalOpen}
        onCancel={() => setModalOpen(false)} onOk={handleSave} confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="label" label="Label" rules={[{ required: true }]}><Input /></Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="capacity" label="Capacity" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="shape" label="Shape" rules={[{ required: true }]}>
                <Select options={['Round', 'Rectangle', 'Square', 'Booth'].map((s) => ({ label: s, value: s }))} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="section" label="Section"><Input /></Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="priceType" label="Price Type" rules={[{ required: true }]}>
                <Select options={['Fixed', 'PerSeat', 'Override'].map((s) => ({ label: s, value: s }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priceCents" label="Price (cents)" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
