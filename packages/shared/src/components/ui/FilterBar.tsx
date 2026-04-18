import type { ReactNode } from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import Chip from './Chip';

export interface FilterChip {
  key: string;
  label: ReactNode;
  active: boolean;
  onClick: () => void;
  dot?: string;
}

interface Props {
  search?: {
    value?: string;
    placeholder: string;
    onChange: (v: string | undefined) => void;
    width?: number;
  };
  chips?: FilterChip[];
  actions?: ReactNode;
  onReset?: () => void;
}

export default function FilterBar({ search, chips, actions }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        marginBottom: 20,
        flexWrap: 'wrap',
        alignItems: 'center',
        padding: 12,
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        background: 'var(--bg-soft)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {search && (
        <Input
          placeholder={search.placeholder}
          prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
          variant="borderless"
          allowClear
          value={search.value}
          onChange={(e) => search.onChange(e.target.value || undefined)}
          style={{
            flex: 1,
            minWidth: search.width ?? 200,
            height: 40,
            fontSize: 14,
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
          }}
        />
      )}
      {chips && chips.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {chips.map((chip) => (
            <Chip key={chip.key} active={chip.active} onClick={chip.onClick} dot={chip.dot}>
              {chip.label}
            </Chip>
          ))}
        </div>
      )}
      {actions && <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{actions}</div>}
    </div>
  );
}
