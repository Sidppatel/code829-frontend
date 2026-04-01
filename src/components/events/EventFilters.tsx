import { Input, Select, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { EventFacets } from '../../types/event';

export interface FilterValues {
  search?: string;
  category?: string;
  city?: string;
  dateFilter?: 'today' | 'this-week' | 'this-month';
}

interface Props {
  facets: EventFacets | null;
  values: FilterValues;
  onChange: (values: FilterValues) => void;
}

export default function EventFilters({ facets, values, onChange }: Props) {
  return (
    <Space wrap style={{ marginBottom: 24 }}>
      <Input
        placeholder="Search events..."
        prefix={<SearchOutlined />}
        value={values.search}
        onChange={(e) => onChange({ ...values, search: e.target.value })}
        style={{ width: 240 }}
        allowClear
      />
      <Select
        placeholder="Category"
        value={values.category}
        onChange={(val) => onChange({ ...values, category: val })}
        allowClear
        style={{ width: 160 }}
        options={facets?.categories.map((c) => ({ label: c, value: c })) ?? []}
      />
      <Select
        placeholder="City"
        value={values.city}
        onChange={(val) => onChange({ ...values, city: val })}
        allowClear
        style={{ width: 160 }}
        options={facets?.cities.map((c) => ({ label: c, value: c })) ?? []}
      />
      <Select
        placeholder="Date"
        value={values.dateFilter}
        onChange={(val) => onChange({ ...values, dateFilter: val })}
        allowClear
        style={{ width: 160 }}
        options={[
          { label: 'Today', value: 'today' },
          { label: 'This Week', value: 'this-week' },
          { label: 'This Month', value: 'this-month' },
        ]}
      />
    </Space>
  );
}
