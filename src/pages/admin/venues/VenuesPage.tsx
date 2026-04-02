import { useState, useEffect } from 'react';
import { Table, Button, Space, App, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { adminVenuesApi } from '../../../services/api';
import type { Venue } from '../../../types/venue';
import PageHeader from '../../../components/shared/PageHeader';

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const { message } = App.useApp();
  const navigate = useNavigate();

  const loadVenues = async (p = page, ps = pageSize) => {
    setLoading(true);
    try {
      const { data } = await adminVenuesApi.list(p, ps);
      setVenues(data.items);
      setTotal(data.total);
    } catch {
      message.error('Failed to load venues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadVenues(); }, [page, pageSize]);

  const handleDelete = async (id: string) => {
    try {
      await adminVenuesApi.delete(id);
      message.success('Venue deleted');
      void loadVenues();
    } catch {
      message.error('Failed to delete venue');
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name',
      render: (text: string, record: Venue) => (
        <a onClick={() => navigate(`/admin/venues/${record.id}`)}>{text}</a>
      ),
    },
    { title: 'City', dataIndex: 'city', key: 'city' },
    { title: 'State', dataIndex: 'state', key: 'state' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone', render: (v: string | undefined) => v ?? '—' },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, record: Venue) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/admin/venues/${record.id}`)} />
          <Popconfirm title="Delete this venue?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Venues" subtitle="Manage event venues"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/admin/venues/new')}>Add Venue</Button>}
      />
      <div className="responsive-table">
        <Table dataSource={venues} columns={columns} rowKey="id" loading={loading}
          scroll={{ x: 600 }}
          pagination={{ current: page, pageSize, total, onChange: (p, ps) => { setPage(p); setPageSize(ps); }, showSizeChanger: true }}
        />
      </div>
    </div>
  );
}
