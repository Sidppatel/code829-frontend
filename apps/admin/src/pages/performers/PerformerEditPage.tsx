import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Form, Input, message, Upload } from 'antd';
import type { UploadProps } from 'antd';
import { ArrowLeftOutlined, UploadOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { performerService } from '../../services/api';
import type { Performer, PerformerMetaItem } from '@code829/shared/types/performer';
import { PageShell } from '@code829/shared/components/ui';
import MetaListEditor from '../../components/performers/MetaListEditor';
import { createLogger } from '@code829/shared/lib/logger';

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

  const load = useCallback(async () => {
    if (isNew) return;
    setLoading(true);
    try {
      const { data } = await performerService.getAdminById(id!);
      setPerformer(data);
      form.setFieldsValue({ name: data.name, slug: data.slug });
      setMeta(data.meta);
      setSlugTouched(true);
    } catch (err) {
      log.error('load performer failed', err);
      message.error('Failed to load performer');
    } finally {
      setLoading(false);
    }
  }, [id, isNew, form]);

  useEffect(() => { void load(); }, [load]);

  const slugify = (input: string) =>
    input.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  const onNameChange = (val: string) => {
    if (!slugTouched && isNew) {
      form.setFieldValue('slug', slugify(val));
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
        message.success('Performer created');
        navigate(`/performers/${data.id}`, { replace: true });
      } else {
        const { data } = await performerService.update(id!, {
          name: values.name,
          slug: values.slug,
          meta: cleanedMeta,
        });
        setPerformer(data);
        message.success('Saved');
      }
    } catch (err) {
      log.error('save performer failed', err);
      message.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const uploadProps: UploadProps = useMemo(() => ({
    name: 'file',
    accept: 'image/*',
    showUploadList: false,
    beforeUpload: async (file) => {
      if (isNew || !performer) {
        message.warning('Save the performer first to upload a photo');
        return Upload.LIST_IGNORE;
      }
      try {
        const { data } = await performerService.uploadImage(performer.id, file);
        setPerformer(data);
        message.success('Photo uploaded');
      } catch {
        message.error('Upload failed');
      }
      return Upload.LIST_IGNORE;
    },
  }), [isNew, performer]);

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
              <div
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: 16,
                  background: 'var(--bg-soft)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border)',
                }}
              >
                {performer?.primaryImageUrl ? (
                  <img src={performer.primaryImageUrl} alt={performer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <UserOutlined style={{ fontSize: 48, color: 'var(--text-muted)' }} />
                )}
              </div>
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />} disabled={isNew}>Upload photo</Button>
              </Upload>
              {isNew && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Save first to upload photo</div>}
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
              >
                <Input
                  placeholder="david-j"
                  onChange={() => setSlugTouched(true)}
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
