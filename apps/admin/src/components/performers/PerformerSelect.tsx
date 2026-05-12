import { useEffect, useRef, useState } from 'react';
import { Avatar, Select, Spin } from 'antd';
import type { Performer } from '@code829/shared/types/performer';
import { performerService } from '../../services/api';

interface Props {
  value?: string | string[];
  onChange?: (next: string | string[] | undefined, performer?: Performer | Performer[]) => void;
  mode?: 'multiple';
  placeholder?: string;
  excludeIds?: string[];
}

export default function PerformerSelect({ value, onChange, mode, placeholder = 'Search performers', excludeIds }: Props) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<Performer[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await performerService.listAdmin(query || undefined, 1, 25);
        setOptions(data.items);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const opts = options
    .filter((p) => !excludeIds || !excludeIds.includes(p.id))
    .map((p) => ({
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Avatar size={24} src={p.primaryImageUrl ?? undefined}>
            {p.name.slice(0, 1).toUpperCase()}
          </Avatar>
          <span>{p.name}</span>
        </span>
      ),
      value: p.id,
      data: p,
    }));

  return (
    <Select
      mode={mode}
      value={value}
      placeholder={placeholder}
      filterOption={false}
      showSearch
      onSearch={setQuery}
      notFoundContent={loading ? <Spin size="small" /> : 'No performers'}
      onChange={(v) => {
        if (mode === 'multiple') {
          const ids = (v as string[]) ?? [];
          const matched = ids
            .map((id) => options.find((o) => o.id === id))
            .filter((x): x is Performer => Boolean(x));
          onChange?.(ids, matched);
        } else {
          const id = v as string | undefined;
          onChange?.(id, id ? options.find((o) => o.id === id) : undefined);
        }
      }}
      options={opts}
      style={{ width: '100%' }}
      allowClear
    />
  );
}
