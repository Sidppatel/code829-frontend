import { useEffect, useState } from 'react';
import { List, Input, Button, App, Tag } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { developerApi, imagesApi } from '../../services/api';
import { useIsMobile } from '@code829/shared/hooks/useIsMobile';
import type { AppSetting } from '@code829/shared/services/developerApi';
import PageHeader from '@code829/shared/components/shared/PageHeader';
import HumanCard from '@code829/shared/components/shared/HumanCard';
import PulseIndicator from '@code829/shared/components/shared/PulseIndicator';
import LoadingSpinner from '@code829/shared/components/shared/LoadingSpinner';
import AvatarUpload from '@code829/shared/components/shared/AvatarUpload';

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
          title="Infrastructure Security" 
          subtitle="Real-time connectivity and secrets"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-soft)', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <PulseIndicator status="success" size={6} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>JWT Middleware</span>
              </div>
              <Tag color="success" style={{ margin: 0, borderRadius: 6, fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}>Active</Tag>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-soft)', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <PulseIndicator status="success" size={6} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Stripe Gateway</span>
              </div>
              <Tag color="success" style={{ margin: 0, borderRadius: 6, fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}>Verified</Tag>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-soft)', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <PulseIndicator status="warning" size={6} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>SMTP Node</span>
              </div>
              <Tag color="warning" style={{ margin: 0, borderRadius: 6, fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}>Sandbox</Tag>
            </div>
          </div>
        </HumanCard>
      </div>

      <HumanCard title="System Variables" subtitle="Application state registry">
        <List
          className="responsive-list"
          dataSource={settings}
          renderItem={(item) => {
            const isSensitive = SENSITIVE_KEYS.has(item.key);
            return (
              <List.Item style={{ flexDirection: 'column', alignItems: 'stretch', gap: 16, padding: '24px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', wordBreak: 'break-all', fontFamily: 'monospace', letterSpacing: '-0.02em' }}>{item.key}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                      {item.description ?? 'System-generated environment variable.'}
                    </div>
                  </div>
                  {isSensitive && (
                     <Tag color="gold" style={{ borderRadius: 6, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>Protected</Tag>
                  )}
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: 12, 
                  width: '100%', 
                  alignItems: isMobile ? 'stretch' : 'center' 
                }}>
                  {isSensitive ? (
                    <Input.Password
                      value={editValues[item.key] ?? ''}
                      placeholder="Input new secret value..."
                      size="large"
                      style={{ flex: 1, borderRadius: 12, background: 'var(--bg-soft)' }}
                      onChange={(e) => handleChange(item.key, e.target.value)}
                    />
                  ) : (
                    <Input
                      value={editValues[item.key] ?? ''}
                      size="large"
                      style={{ flex: 1, borderRadius: 12, background: 'var(--bg-soft)' }}
                      onChange={(e) => handleChange(item.key, e.target.value)}
                    />
                  )}
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
                {isSensitive && item.value && item.value !== 'MOCK_DEV' && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-soft)', padding: '6px 16px', borderRadius: 8, display: 'inline-block', border: '1px solid var(--border)', fontWeight: 600 }}>
                    Active Mask: <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{item.value}</span>
                  </div>
                )}
              </List.Item>
            );
          }}
        />
      </HumanCard>
    </div>
  );
}

function maskValue(val: string): string {
  if (val.length <= 4) return '****';
  return '*'.repeat(val.length - 4) + val.slice(-4);
}
