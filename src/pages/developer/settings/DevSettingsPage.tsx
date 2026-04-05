import { useEffect, useState } from 'react';
import { Card, List, Input, Button, App } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { developerApi, imagesApi } from '../../../services/api';
import { useIsMobile } from '../../../hooks/useIsMobile';
import type { AppSetting } from '../../../services/developerApi';
import PageHeader from '../../../components/shared/PageHeader';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AvatarUpload from '../../../components/shared/AvatarUpload';

const SENSITIVE_KEYS = new Set([
  'jwt_secret',
  'stripe_secret_key',
  'stripe_publishable_key',
  'stripe_webhook_secret',
  'resend_api_key',
  'email_api_key',
  'smtp_password',
]);

export default function DevSettingsPage() {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { message } = App.useApp();

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await developerApi.getSettings();
        setSettings(data);
        const vals: Record<string, string> = {};
        data.forEach((s) => {
          vals[s.key] = SENSITIVE_KEYS.has(s.key) ? '' : s.value;
        });
        setEditValues(vals);
        // Load company logo
        try {
          const { data: logo } = await imagesApi.getLogo();
          setLogoUrl(logo.url);
        } catch { /* no logo yet */ }
      } catch {
        message.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [message]);

  const handleSave = async (key: string) => {
    const value = editValues[key];
    if (!value) return;
    setSavingKey(key);
    try {
      await developerApi.updateSetting(key, value);
      message.success(`Setting "${key}" updated`);
      const updated = settings.map((s) =>
        s.key === key ? { ...s, value: SENSITIVE_KEYS.has(key) ? maskValue(value) : value } : s,
      );
      setSettings(updated);
      if (SENSITIVE_KEYS.has(key)) {
        setEditValues((prev) => ({ ...prev, [key]: '' }));
      }
      setDirty((prev) => ({ ...prev, [key]: false }));
    } catch {
      message.error('Failed to update setting');
    } finally {
      setSavingKey(null);
    }
  };

  const handleChange = (key: string, value: string) => {
    setEditValues((prev) => ({ ...prev, [key]: value }));
    setDirty((prev) => ({ ...prev, [key]: true }));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Developer Settings" subtitle="Application configuration" />
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>Company Logo</div>
        <AvatarUpload
          currentUrl={logoUrl}
          size={80}
          shape="square"
          onUpload={async (file) => {
            const { data } = await imagesApi.uploadLogo(file);
            setLogoUrl(data.url);
            return data.url;
          }}
        />
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Used in emails, public pages, and branding. Only developers can change this.
        </div>
      </Card>

      <Card styles={isMobile ? { body: { padding: '8px 12px' } } : undefined}>
        <List
          className="responsive-list"
          dataSource={settings}
          renderItem={(item) => {
            const isSensitive = SENSITIVE_KEYS.has(item.key);
            return (
              <List.Item style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8, padding: '12px 0' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{item.key}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {item.description ?? 'No description'}
                    {isSensitive && item.value && item.value !== 'MOCK_DEV' && (
                      <span style={{ marginLeft: 8, fontFamily: 'monospace' }}>Current: {item.value}</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                  {isSensitive ? (
                    <Input.Password
                      value={editValues[item.key] ?? ''}
                      placeholder="Enter new value"
                      size="middle"
                      style={{ flex: 1 }}
                      onChange={(e) => handleChange(item.key, e.target.value)}
                    />
                  ) : (
                    <Input
                      value={editValues[item.key] ?? ''}
                      size="middle"
                      style={{ flex: 1 }}
                      onChange={(e) => handleChange(item.key, e.target.value)}
                    />
                  )}
                  <Button
                    type="primary"
                    size="small"
                    icon={<SaveOutlined />}
                    loading={savingKey === item.key}
                    onClick={() => handleSave(item.key)}
                    disabled={!dirty[item.key] || !editValues[item.key]}
                  >
                    Save
                  </Button>
                </div>
              </List.Item>
            );
          }}
        />
      </Card>
    </div>
  );
}

function maskValue(val: string): string {
  if (val.length <= 4) return '****';
  return '*'.repeat(val.length - 4) + val.slice(-4);
}
