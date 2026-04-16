import { useEffect, useState } from 'react';
import { List, Input, Button, App, Tag } from 'antd';
import { SaveOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { developerApi, imagesApi } from '../../services/api';
import { useIsMobile } from '@code829/shared/hooks/useIsMobile';
import type { AppSetting, SecretStatus } from '@code829/shared/services/developerApi';
import PageHeader from '@code829/shared/components/shared/PageHeader';
import HumanCard from '@code829/shared/components/shared/HumanCard';
import PulseIndicator from '@code829/shared/components/shared/PulseIndicator';
import LoadingSpinner from '@code829/shared/components/shared/LoadingSpinner';
import AvatarUpload from '@code829/shared/components/shared/AvatarUpload';
import { createLogger } from '@code829/shared/lib/logger';

const log = createLogger('Developer/SettingsPage');

export default function DevSettingsPage() {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [secrets, setSecrets] = useState<SecretStatus[]>([]);
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
        setSettings(data.settings);
        setSecrets(data.secrets);
        const vals: Record<string, string> = {};
        data.settings.forEach((s) => {
          vals[s.key] = s.value;
        });
        setEditValues(vals);
        log.info('Settings loaded', { settings: data.settings.length, secrets: data.secrets.length });
        try {
          const { data: logo } = await imagesApi.getLogo();
          setLogoUrl(logo.url);
        } catch (err) { log.error('Failed to load company logo', err); }
      } catch (err) {
        log.error('Failed to load settings', err);
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
      log.info('Setting updated', { key });
      message.success(`Setting "${key}" updated`);
      const updated = settings.map((s) =>
        s.key === key ? { ...s, value } : s,
      );
      setSettings(updated);
      setDirty((prev) => ({ ...prev, [key]: false }));
    } catch (err) {
      log.error('Failed to update setting', err);
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

  const configuredCount = secrets.filter((s) => s.configured).length;

  return (
    <div className="spring-up">
      <PageHeader
        title="Global Settings"
        subtitle={[
          "Global application configuration and security protocols.",
          "Changes propagate across all environment nodes immediately.",
          "Security alert: Ensure API keys are rotated every 90 days."
        ]}
        rotateSubtitle
      />

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 48 }}>
        <HumanCard
          title="Branding Context"
          subtitle="Platform identification and assets"
          className="human-noise"
        >
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: 24,
            marginBottom: 16
          }}>
            <AvatarUpload
              currentUrl={logoUrl}
              size={isMobile ? 120 : 100}
              shape="square"
              onUpload={async (file) => {
                const { data } = await imagesApi.uploadLogo(file);
                setLogoUrl(data.url);
                return data.url;
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Platform Logo</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Updating this asset will refresh the branding on all emails, public booking routes, and the developer console.
              </div>
            </div>
          </div>
        </HumanCard>

        <HumanCard
          title="Environment Secrets"
          subtitle={`${configuredCount}/${secrets.length} configured via environment variables`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {secrets.map((secret) => (
              <div key={secret.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-soft)', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <PulseIndicator status={secret.configured ? 'success' : 'critical'} size={6} />
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{secret.key}</span>
                    {secret.description && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{secret.description}</div>
                    )}
                  </div>
                </div>
                <Tag
                  icon={secret.configured ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                  color={secret.configured ? 'success' : 'error'}
                  style={{ margin: 0, borderRadius: 6, fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}
                >
                  {secret.configured ? 'Set' : 'Missing'}
                </Tag>
              </div>
            ))}
            <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '8px 0', lineHeight: 1.6 }}>
              Secrets are managed via environment variables and cannot be changed through the UI.
              Update them in your deployment environment and restart the application.
            </div>
          </div>
        </HumanCard>
      </div>

      <HumanCard title="Runtime Configuration" subtitle="Editable application settings stored in the database">
        <List
          className="responsive-list"
          dataSource={settings}
          renderItem={(item) => (
            <List.Item style={{ flexDirection: 'column', alignItems: 'stretch', gap: 16, padding: '24px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', wordBreak: 'break-all', fontFamily: 'monospace', letterSpacing: '-0.02em' }}>{item.key}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                    {item.description ?? 'System-generated configuration value.'}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: 12,
                width: '100%',
                alignItems: isMobile ? 'stretch' : 'center'
              }}>
                <Input
                  value={editValues[item.key] ?? ''}
                  size="large"
                  style={{ flex: 1, borderRadius: 12, background: 'var(--bg-soft)' }}
                  onChange={(e) => handleChange(item.key, e.target.value)}
                />
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={savingKey === item.key}
                  onClick={() => handleSave(item.key)}
                  disabled={!dirty[item.key] || !editValues[item.key]}
                  style={{
                    borderRadius: 12,
                    height: 44,
                    padding: '0 24px',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                    border: 'none',
                    width: isMobile ? '100%' : 'auto'
                  }}
                >
                  Update
                </Button>
              </div>
            </List.Item>
          )}
        />
      </HumanCard>
    </div>
  );
}
