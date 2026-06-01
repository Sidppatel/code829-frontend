import { useCallback, useEffect, useState } from 'react';
import { Avatar, Button, Collapse, Empty, message, Spin } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, SaveOutlined, ShopOutlined } from '@ant-design/icons';
import type { EventSponsor, SponsorMetaItem, Sponsor } from '@code829/shared';
import { sponsorService } from '../../services/api';
import SponsorSelect from './SponsorSelect';
import MetaListEditor from './MetaListEditor';
import { createLogger } from '@code829/shared/lib/logger';

const log = createLogger('Admin/EventSponsorsEditor');
const DISCARD_TEXT = 'Discard';
const SAVE_SPONSORS_TEXT = 'Save sponsors';

interface SponsorEntry {
  sponsorId: string;
  name: string;
  slug: string;
  primaryImageUrl: string | null;
  sortOrder: number;
  baseMeta: SponsorMetaItem[];
  override: SponsorMetaItem[];
}

interface Props {
  eventId: string;
}

export default function EventSponsorsEditor({ eventId }: Props) {
  const [entries, setEntries] = useState<SponsorEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const hydrate = async (linkRows: EventSponsor[]): Promise<SponsorEntry[]> => {
    const sorted = [...linkRows].sort((a, b) => a.sortOrder - b.sortOrder);
    return Promise.all(sorted.map(async (row) => {
      const { data: full } = await sponsorService.getAdminById(row.sponsorId);
      const baseKeys = new Set(full.meta.map((m) => m.key.toLowerCase()));
      const overrides: SponsorMetaItem[] = [];
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
        sponsorId: row.sponsorId,
        name: row.name,
        slug: row.slug,
        primaryImageUrl: row.primaryImageUrl,
        sortOrder: row.sortOrder,
        baseMeta: full.meta,
        override: overrides,
      };
    }));
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await sponsorService.getEventSponsors(eventId);
      setEntries(await hydrate(data));
      setDirty(false);
    } catch (err) {
      log.error('load sponsors failed', err);
      message.error('Failed to load sponsors');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const addSponsor = (_id: string | string[] | undefined, sponsor?: Sponsor | Sponsor[]) => {
    const p = Array.isArray(sponsor) ? sponsor[0] : sponsor;
    if (!p) return;
    if (entries.find((e) => e.sponsorId === p.id)) {
      message.info(`${p.name} already in sponsors`);
      return;
    }
    setEntries((prev) => [
      ...prev,
      {
        sponsorId: p.id,
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
      const temp = next.find((_, i) => i === idx);
      const targetItem = next.find((_, i) => i === target);
      if (temp && targetItem) {
        return next
          .map((item, i) => (i === idx ? targetItem : i === target ? temp : item))
          .map((e, i) => ({ ...e, sortOrder: i }));
      }
      return next;
    });
    setDirty(true);
  };

  const updateOverride = (idx: number, override: SponsorMetaItem[]) => {
    setEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, override } : e)));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await sponsorService.setEventSponsors(eventId, {
        sponsors: entries.map((e, idx) => ({
          sponsorId: e.sponsorId,
          sortOrder: idx,
          eventMeta: e.override
            .filter((m) => m.key.trim().length > 0)
            .map((m, i) => ({ ...m, key: m.key.trim(), sortOrder: i })),
        })),
      });
      message.success('Sponsors saved');
      await load();
    } catch (err) {
      log.error('save sponsors failed', err);
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
        <SponsorSelect
          onChange={addSponsor}
          placeholder="Search and add a sponsor"
          excludeIds={entries.map((e) => e.sponsorId)}
        />
      </div>

      {entries.length === 0 ? (
        <Empty description="No sponsors added yet. Search above to add the first one." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {entries.map((e, idx) => (
            <div
              key={e.sponsorId}
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
                <Avatar size={48} src={e.primaryImageUrl ?? undefined} icon={e.primaryImageUrl ? null : <ShopOutlined />}>
                  {e.primaryImageUrl ? null : <ShopOutlined />}
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
                      emptyHint="No event-specific overrides. The sponsor's default metadata will be used."
                    />
                  ),
                }]}
              />
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, gap: 8 }}>
        <Button onClick={load} disabled={saving || !dirty}>{DISCARD_TEXT}</Button>
        <Button type="primary" icon={<SaveOutlined />} onClick={save} loading={saving} disabled={!dirty}>
          {SAVE_SPONSORS_TEXT}
        </Button>
      </div>
    </div>
  );
}
