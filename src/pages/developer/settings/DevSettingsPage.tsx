import { useEffect, useState } from 'react';
import { Card, List, Input, Button, App } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { developerApi } from '../../../services/api';
import { useIsMobile } from '../../../hooks/useIsMobile';
import type { AppSetting } from '../../../services/developerApi';
import PageHeader from '../../../components/shared/PageHeader';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';

export default function DevSettingsPage() {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const isMobile = useIsMobile();
  const { message } = App.useApp();

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await developerApi.getSettings();
        setSettings(data);
        const vals: Record<string, string> = {};
        data.forEach((s) => { vals[s.key] = s.value; });
        setEditValues(vals);
      } catch {
        message.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [message]);

  const handleSave = async (key: string) => {
    setSavingKey(key);
    try {
      await developerApi.updateSetting(key, editValues[key]);
      message.success(`Setting "${key}" updated`);
      const updated = settings.map((s) => s.key === key ? { ...s, value: editValues[key] } : s);
      setSettings(updated);
    } catch {
      message.error('Failed to update setting');
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Developer Settings" subtitle="Application configuration" />
      <Card styles={isMobile ? { body: { padding: '8px 12px' } } : undefined}>
        <List
          className="responsive-list"
          dataSource={settings}
          renderItem={(item) => (
            <List.Item style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8, padding: '12px 0' }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{item.key}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.description ?? 'No description'}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                <Input value={editValues[item.key] ?? ''} size={isMobile ? 'middle' : 'middle'} style={{ flex: 1 }}
                  onChange={(e) => setEditValues((prev) => ({ ...prev, [item.key]: e.target.value }))}
                />
                <Button type="primary" size="small" icon={<SaveOutlined />}
                  loading={savingKey === item.key} onClick={() => handleSave(item.key)}
                  disabled={editValues[item.key] === item.value}
                >Save</Button>
              </div>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
