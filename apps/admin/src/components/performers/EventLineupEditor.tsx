import { useCallback, useEffect, useState } from 'react';
import { Avatar, Button, Collapse, Empty, message, Spin } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, SaveOutlined, UserOutlined } from '@ant-design/icons';
import type { EventPerformer, PerformerMetaItem, Performer } from '@code829/shared/types/performer';
import { performerService } from '../../services/api';
import PerformerSelect from './PerformerSelect';
import MetaListEditor from './MetaListEditor';
import { createLogger } from '@code829/shared/lib/logger';

const log = createLogger('Admin/EventLineupEditor');

interface LineupEntry {
  performerId: string;
  name: string;
  slug: string;
  primaryImageUrl: string | null;
  sortOrder: number;
  baseMeta: PerformerMetaItem[];
  override: PerformerMetaItem[];
}

interface Props {
  eventId: string;
}

export default function EventLineupEditor({ eventId }: Props) {
  const [entries, setEntries] = useState<LineupEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await performerService.getEventLineup(eventId);
      setEntries(await hydrate(data));
      setDirty(false);
    } catch (err) {
      log.error('load lineup failed', err);
      message.error('Failed to load performers');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { void load(); }, [load]);

  const hydrate = async (linkRows: EventPerformer[]): Promise<LineupEntry[]> => {
    const sorted = [...linkRows].sort((a, b) => a.sortOrder - b.sortOrder);
    return Promise.all(sorted.map(async (row) => {
      const { data: full } = await performerService.getAdminById(row.performerId);
      const baseKeys = new Set(full.meta.map((m) => m.key.toLowerCase()));
      const overrides: PerformerMetaItem[] = [];
      for (const item of row.effectiveMeta) {
        const baseEq = full.meta.find((b) => b.key.toLowerCase() === item.key.toLowerCase());
        if (!baseEq || baseEq.value !== item.value || baseEq.isPublic !== item.isPublic) {
          overrides.push(item);
        }
      }
      for (const item of row.effectiveMeta) {
        if (!baseKeys.has(item.key.toLowerCase()) && !overrides.find((o) => o.key.toLowerCase() === item.key.toLowerCase())) {
          overrides.push(item);
        }
      }
      return {
        performerId: row.performerId,
        name: row.name,
        slug: row.slug,
        primaryImageUrl: row.primaryImageUrl,
        sortOrder: row.sortOrder,
        baseMeta: full.meta,
        override: overrides,
      };
    }));
  };

  const addPerformer = (_id: string | string[] | undefined, performer?: Performer | Performer[]) => {
    const p = Array.isArray(performer) ? performer[0] : performer;
    if (!p) return;
    if (entries.find((e) => e.performerId === p.id)) {
      message.info(`${p.name} already in performers`);
      return;
    }
    setEntries((prev) => [
      ...prev,
      {
        performerId: p.id,
        name: p.name,
        slug: p.slug,
        primaryImageUrl: p.primaryImageUrl,
        sortOrder: prev.length,
        baseMeta: p.meta,
        override: [],
      },
    ]);
    setDirty(true);
  };

  const removeEntry = (idx: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== idx).map((e, i) => ({ ...e, sortOrder: i })));
    setDirty(true);
  };

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= entries.length) return;
    setEntries((prev) => {
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next.map((e, i) => ({ ...e, sortOrder: i }));
    });
    setDirty(true);
  };

  const updateOverride = (idx: number, override: PerformerMetaItem[]) => {
    setEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, override } : e)));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await performerService.setEventLineup(eventId, {
        performers: entries.map((e, idx) => ({
          performerId: e.performerId,
          sortOrder: idx,
          eventMeta: e.override
            .filter((m) => m.key.trim().length > 0)
            .map((m, i) => ({ ...m, key: m.key.trim(), sortOrder: i })),
        })),
      });
      message.success('Performers saved');
      await load();
    } catch (err) {
      log.error('save lineup failed', err);
      message.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 24, textAlign: 'center' }}><Spin /></div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <PerformerSelect
          onChange={addPerformer}
          placeholder="Search and add a performer"
          excludeIds={entries.map((e) => e.performerId)}
        />
      </div>

      {entries.length === 0 ? (
        <Empty description="No performers added yet. Search above to add the first one." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {entries.map((e, idx) => (
            <div
              key={e.performerId}
              style={{
                background: 'var(--bg-elevated, #fff)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 12,
              }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <Button type="text" size="small" icon={<ArrowUpOutlined />} onClick={() => move(idx, -1)} disabled={idx === 0} />
                  <Button type="text" size="small" icon={<ArrowDownOutlined />} onClick={() => move(idx, 1)} disabled={idx === entries.length - 1} />
                </div>
                <Avatar size={48} src={e.primaryImageUrl ?? undefined}>
                  {e.primaryImageUrl ? null : <UserOutlined />}
                </Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{e.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {e.override.length > 0 ? `${e.override.length} per-event override${e.override.length === 1 ? '' : 's'}` : 'Using default profile'}
                  </div>
                </div>
                <Button danger type="text" icon={<DeleteOutlined />} onClick={() => removeEntry(idx)} aria-label="Remove" />
              </div>
              <Collapse
                ghost
                style={{ marginTop: 8 }}
                items={[{
                  key: '1',
                  label: 'Override metadata for this event',
                  children: (
                    <MetaListEditor
                      value={e.override}
                      onChange={(next) => updateOverride(idx, next)}
                      placeholders={e.baseMeta}
                      emptyHint="No event-specific overrides. The performer's default metadata will be used."
                    />
                  ),
                }]}
              />
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, gap: 8 }}>
        <Button onClick={load} disabled={saving || !dirty}>Discard</Button>
        <Button type="primary" icon={<SaveOutlined />} onClick={save} loading={saving} disabled={!dirty}>
          Save performers
        </Button>
      </div>
    </div>
  );
}
