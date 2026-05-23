import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Form, Input, message } from 'antd';
import { ArrowLeftOutlined, CheckCircleTwoTone, WarningTwoTone } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { performerService } from '../../services/api';
import type { Performer, PerformerMetaItem } from '@code829/shared/types/performer';
import { PageShell } from '@code829/shared/components/ui';
import AvatarUpload from '@code829/shared/components/shared/AvatarUpload';
import MetaListEditor from '../../components/performers/MetaListEditor';
import { createLogger } from '@code829/shared/lib/logger';

type SlugStatus =
  | { kind: 'idle' }
  | { kind: 'available' }
  | { kind: 'taken'; suggested: string };

const SLUG_REGEX = /^[a-z0-9-]+$/;

const log = createLogger('Admin/PerformerEditPage');

interface FormValues {
  name: string;
  slug: string;
}

export default function PerformerEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [meta, setMeta] = useState<PerformerMetaItem[]>([]);
  const [performer, setPerformer] = useState<Performer | null>(null);
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
      const { data } = await performerService.getAdminById(id!);
      setPerformer(data);
      form.setFieldsValue({ name: data.name, slug: data.slug });
      setMeta(data.meta);
      setSlugTouched(true);
      setSlugStatus({ kind: 'available' });
    } catch (err) {
      log.error('load performer failed', err);
      message.error('Failed to load performer');
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
    if (!isNew && performer && slug === performer.slug) {
      setSlugStatus({ kind: 'available' });
      return;
    }
    const seq = ++slugCheckSeq.current;
    slugCheckTimer.current = setTimeout(async () => {
      try {
        const excludeId = !isNew && id ? id : undefined;
        const { data } = await performerService.checkSlug(slug, excludeId);
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
  }, [id, isNew, performer]);

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
        const { data } = await performerService.create({
          name: values.name,
          slug: values.slug || undefined,
          meta: cleanedMeta,
        });
        
        if (pendingFile) {
          await performerService.uploadImage(data.id, pendingFile);
        }

        message.success('Performer created');
        navigate(`/performers/${data.id}`, { replace: true });
      } else {
        const { data } = await performerService.update(id!, {
          name: values.name,
          slug: values.slug,
          meta: cleanedMeta,
        });
        
        if (pendingFile) {
          const res = await performerService.uploadImage(data.id, pendingFile);
          setPerformer(res.data);
          setPendingFile(null);
          setPreviewUrl(null);
        } else {
          setPerformer(data);
        }

        message.success('Saved');
      }
    } catch (err) {
      log.error('save performer failed', err);
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
      const { data } = await performerService.uploadImage(performer!.id, file);
      setPerformer(data);
      return data.primaryImageUrl || undefined;
    }
  };



  return (
    <PageShell
      title={isNew ? 'New Performer' : performer?.name ?? 'Performer'}
      subtitle={isNew ? 'Create a performer to attach to events' : 'Manage performer details and metadata'}
      extra={
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/performers')}>
          Back to list
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
          <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 700 }}>Profile</h3>

          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <AvatarUpload
                currentUrl={previewUrl || performer?.primaryImageUrl}
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
                  placeholder="e.g. David J"
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
                  placeholder="david-j"
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
          <h3 style={{ margin: '0 0 4px 0', fontSize: 18, fontWeight: 700 }}>Metadata</h3>
          <p style={{ margin: '0 0 16px 0', color: 'var(--text-muted)', fontSize: 13 }}>
            Add social handles, website, bio, or anything else. Each item can be public or admin-only.
            Public items appear on the performer&apos;s profile page.
          </p>
          <MetaListEditor value={meta} onChange={setMeta} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button onClick={() => navigate('/performers')}>Cancel</Button>
          <Button type="primary" onClick={onSubmit} loading={saving}>
            {isNew ? 'Create performer' : 'Save changes'}
          </Button>
        </div>
      </Form>
    </PageShell>
  );
}
