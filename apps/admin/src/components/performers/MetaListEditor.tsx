import { Button, Card, Input, Switch, Tooltip } from 'antd';
import { DeleteOutlined, PlusOutlined, HolderOutlined } from '@ant-design/icons';
import type { PerformerMetaItem } from '@code829/shared/types/performer';

const COMMON_KEYS = ['Instagram', 'Twitter / X', 'Facebook', 'YouTube', 'TikTok', 'Spotify', 'Website', 'Bio', 'Role'];

interface Props {
  value: PerformerMetaItem[];
  onChange: (next: PerformerMetaItem[]) => void;
  placeholders?: PerformerMetaItem[];
  emptyHint?: string;
}

export default function MetaListEditor({ value, onChange, placeholders, emptyHint }: Props) {
  const items = value ?? [];

  const update = (index: number, patch: Partial<PerformerMetaItem>) => {
    const next = items.map((it, i) => (i === index ? { ...it, ...patch } : it));
    onChange(next);
  };

  const removeAt = (index: number) => {
    onChange(items.filter((_, i) => i !== index).map((it, i) => ({ ...it, sortOrder: i })));
  };

  const addItem = (key = '') => {
    onChange([
      ...items,
      { key, value: '', isPublic: true, sortOrder: items.length },
    ]);
  };

  const moveItem = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((it, i) => ({ ...it, sortOrder: i })));
  };

  const placeholderFor = (key: string) => placeholders?.find((p) => p.key.toLowerCase() === key.toLowerCase());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.length === 0 && (
        <div
          style={{
            padding: '24px 16px',
            border: '1px dashed var(--border)',
            borderRadius: 12,
            color: 'var(--text-muted)',
            textAlign: 'center',
            fontSize: 14,
          }}
        >
          {emptyHint ?? 'No metadata yet. Add social handles, bio, agent contact, or anything else. Each item can be hidden from the public profile.'}
        </div>
      )}

      {items.map((item, idx) => {
        const ph = placeholderFor(item.key);
        return (
          <Card
            key={idx}
            size="small"
            style={{ background: 'var(--bg-soft)', borderRadius: 12 }}
            styles={{ body: { padding: 12 } }}
          >
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 6 }}>
                <Tooltip title="Move up">
                  <Button type="text" size="small" icon={<HolderOutlined style={{ transform: 'rotate(90deg)' }} />} onClick={() => moveItem(idx, -1)} disabled={idx === 0} />
                </Tooltip>
                <Tooltip title="Move down">
                  <Button type="text" size="small" icon={<HolderOutlined style={{ transform: 'rotate(90deg)' }} />} onClick={() => moveItem(idx, 1)} disabled={idx === items.length - 1} />
                </Tooltip>
              </div>
              <Input
                placeholder="Label (e.g. Instagram)"
                value={item.key}
                onChange={(e) => update(idx, { key: e.target.value })}
                style={{ flex: '1 1 180px', minWidth: 140 }}
                maxLength={50}
              />
              <Input.TextArea
                placeholder={ph?.value ?? 'Value (URL, text, etc.)'}
                value={item.value ?? ''}
                onChange={(e) => update(idx, { value: e.target.value })}
                autoSize={{ minRows: 1, maxRows: 3 }}
                style={{ flex: '2 1 260px' }}
                maxLength={2000}
              />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '0 4px',
                  minWidth: 130,
                  whiteSpace: 'nowrap',
                }}
              >
                <Switch
                  checked={item.isPublic}
                  onChange={(checked) => update(idx, { isPublic: checked })}
                  size="small"
                />
                <span style={{ fontSize: 12, fontWeight: 600, color: item.isPublic ? 'var(--accent-green, #10b981)' : 'var(--text-muted)' }}>
                  {item.isPublic ? 'Public' : 'Admin only'}
                </span>
              </div>
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => removeAt(idx)}
                aria-label="Remove"
              />
            </div>
          </Card>
        );
      })}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {COMMON_KEYS.map((k) => (
          <Button
            key={k}
            size="small"
            type="default"
            onClick={() => addItem(k)}
            style={{ borderRadius: 'var(--radius-full)' }}
          >
            + {k}
          </Button>
        ))}
      </div>

      <Button
        type="dashed"
        block
        icon={<PlusOutlined />}
        onClick={() => addItem('')}
        style={{ height: 44, borderRadius: 12 }}
      >
        Add metadata
      </Button>
    </div>
  );
}
