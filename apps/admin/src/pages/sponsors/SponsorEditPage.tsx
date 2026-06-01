import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Form, Input, message } from 'antd';
import { ArrowLeftOutlined, CheckCircleTwoTone, WarningTwoTone } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { sponsorService } from '../../services/api';
import type { Sponsor, SponsorMetaItem } from '@code829/shared';
import { PageShell } from '@code829/shared/components/ui';
import AvatarUpload from '@code829/shared/components/shared/AvatarUpload';
import MetaListEditor from '../../components/sponsors/MetaListEditor';
import { createLogger } from '@code829/shared/lib/logger';

type SlugStatus =
  | { kind: 'idle' }
  | { kind: 'available' }
  | { kind: 'taken'; suggested: string };

const SLUG_REGEX = /^[a-z0-9-]+$/;

const log = createLogger('Admin/SponsorEditPage');

const BACK_TO_LIST_TEXT = 'Back to list';
const PROFILE_TEXT = 'Profile';
const METADATA_TEXT = 'Metadata';
const METADATA_DESC_TEXT = 'Add website link, sponsorship tier (e.g. key: "Tier", value: "Gold"), or descriptions. Public items appear on the event detail pages.';
const CANCEL_TEXT = 'Cancel';
const CREATE_SPONSOR_TEXT = 'Create sponsor';
const SAVE_CHANGES_TEXT = 'Save changes';

interface FormValues {
  name: string;
  slug: string;
}

export default function SponsorEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [meta, setMeta] = useState<SponsorMetaItem[]>([]);
  const [sponsor, setSponsor] = useState<Sponsor | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>({ kind: 'idle' });
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const slugCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slugCheckSeq = useRef(0);

  const load = useCallback(async () => {
    if (isNew) return;
    setLoading(true);
    try {
      const { data } = await sponsorService.getAdminById(id!);
      setSponsor(data);
      form.setFieldsValue({ name: data.name, slug: data.slug });
      setMeta(data.meta);
      setSlugTouched(true);
      setSlugStatus({ kind: 'available' });
    } catch (err) {
      log.error('load sponsor failed', err);
      message.error('Failed to load sponsor');
    } finally {
      setLoading(false);
    }
  }, [id, isNew, form]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const slugify = (input: string) =>
    input.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  const scheduleSlugCheck = useCallback((slug: string) => {
    if (slugCheckTimer.current) {
      clearTimeout(slugCheckTimer.current);
      slugCheckTimer.current = null;
    }
    if (!slug || !SLUG_REGEX.test(slug)) {
      setSlugStatus({ kind: 'idle' });
      return;
    }
    if (!isNew && sponsor && slug === sponsor.slug) {
      setSlugStatus({ kind: 'available' });
      return;
    }
    const seq = ++slugCheckSeq.current;
    slugCheckTimer.current = setTimeout(async () => {
      try {
        const excludeId = !isNew && id ? id : undefined;
        const { data } = await sponsorService.checkSlug(slug, excludeId);
        if (seq !== slugCheckSeq.current) return;
        if (data.available) {
          setSlugStatus({ kind: 'available' });
        } else {
          setSlugStatus({ kind: 'taken', suggested: data.suggested });
        }
      } catch (err) {
        if (seq !== slugCheckSeq.current) return;
        log.error('slug check failed', err);
        setSlugStatus({ kind: 'idle' });
      }
    }, 300);
  }, [id, isNew, sponsor]);

  useEffect(() => () => {
    if (slugCheckTimer.current) clearTimeout(slugCheckTimer.current);
  }, []);

  const onNameChange = (val: string) => {
    if (!slugTouched && isNew) {
      const next = slugify(val);
      form.setFieldValue('slug', next);
      scheduleSlugCheck(next);
    }
  };

  const onSubmit = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const cleanedMeta = meta
        .filter((m) => m.key.trim().length > 0)
        .map((m, idx) => ({ ...m, key: m.key.trim(), sortOrder: idx }));
      if (isNew) {
        const { data } = await sponsorService.create({
          name: values.name,
          slug: values.slug || undefined,
          meta: cleanedMeta,
        });
        
        if (pendingFile) {
          await sponsorService.uploadImage(data.id, pendingFile);
        }

        message.success('Sponsor created');
        navigate(`/sponsors/${data.id}`, { replace: true });
      } else {
        const { data } = await sponsorService.update(id!, {
          name: values.name,
          slug: values.slug,
          meta: cleanedMeta,
        });
        
        if (pendingFile) {
          const res = await sponsorService.uploadImage(data.id, pendingFile);
          setSponsor(res.data);
          setPendingFile(null);
          setPreviewUrl(null);
        } else {
          setSponsor(data);
        }

        message.success('Saved');
      }
    } catch (err) {
      log.error('save sponsor failed', err);
      message.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (isNew) {
      setPendingFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return url;
    } else {
      const { data } = await sponsorService.uploadImage(sponsor!.id, file);
      setSponsor(data);
      return data.primaryImageUrl || undefined;
    }
  };

  return (
    <PageShell
      title={isNew ? 'New Sponsor' : sponsor?.name ?? 'Sponsor'}
      subtitle={isNew ? 'Create a sponsor to link to events' : 'Manage sponsor details and metadata'}
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/sponsors')}>
          {BACK_TO_LIST_TEXT}
        </Button>
      }
    >
      <Form form={form} layout="vertical" disabled={loading || saving}>
        <div
          style={{
            background: 'var(--bg-elevated, #fff)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 700 }}>{PROFILE_TEXT}</h3>

          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <AvatarUpload
                currentUrl={previewUrl || sponsor?.primaryImageUrl}
                shape="square"
                size={160}
                onUpload={handleAvatarUpload}
              />
            </div>

            <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Form.Item
                name="name"
                label="Name"
                rules={[{ required: true, message: 'Name is required' }, { max: 200 }]}
              >
                <Input
                  placeholder="e.g. Acme Corp"
                  onChange={(e) => onNameChange(e.target.value)}
                  maxLength={200}
                />
              </Form.Item>

              <Form.Item
                name="slug"
                label="URL slug"
                tooltip="Auto-generated from name. Edit only if you need a custom URL."
                rules={[{ pattern: /^[a-z0-9-]*$/, message: 'Lowercase letters, numbers, and hyphens only' }, { max: 220 }]}
                validateStatus={
                  slugStatus.kind === 'available'
                    ? 'success'
                    : slugStatus.kind === 'taken'
                      ? 'warning'
                      : undefined
                }
                help={
                  slugStatus.kind === 'available' ? (
                    <span style={{ color: '#52c41a', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircleTwoTone twoToneColor="#52c41a" />
                      Available
                    </span>
                  ) : slugStatus.kind === 'taken' ? (
                    <span style={{ color: '#faad14', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <WarningTwoTone twoToneColor="#faad14" />
                      Already in use. We&apos;ll save as <code>{slugStatus.suggested}</code>.
                    </span>
                  ) : undefined
                }
              >
                <Input
                  placeholder="acme-corp"
                  onChange={(e) => {
                    setSlugTouched(true);
                    scheduleSlugCheck(e.target.value);
                  }}
                  maxLength={220}
                />
              </Form.Item>
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-elevated, #fff)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h3 style={{ margin: '0 0 4px 0', fontSize: 18, fontWeight: 700 }}>{METADATA_TEXT}</h3>
          <p style={{ margin: '0 0 16px 0', color: 'var(--text-muted)', fontSize: 13 }}>
            {METADATA_DESC_TEXT}
          </p>
          <MetaListEditor value={meta} onChange={setMeta} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button onClick={() => navigate('/sponsors')}>{CANCEL_TEXT}</Button>
          <Button type="primary" onClick={onSubmit} loading={saving}>
            {isNew ? CREATE_SPONSOR_TEXT : SAVE_CHANGES_TEXT}
          </Button>
        </div>
      </Form>
    </PageShell>
  );
}
