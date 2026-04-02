import { useEffect, useState } from 'react';
import { Card, List, Input, Button, App } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { developerApi } from '../../../services/api';
import type { AppSetting } from '../../../services/developerApi';
import PageHeader from '../../../components/shared/PageHeader';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';

export default function DevSettingsPage() {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
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
      <Card>
        <List
          className="responsive-list"
          dataSource={settings}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button key="save" type="primary" size="small" icon={<SaveOutlined />}
                  loading={savingKey === item.key} onClick={() => handleSave(item.key)}
                  disabled={editValues[item.key] === item.value}
                >Save</Button>,
              ]}
            >
              <List.Item.Meta title={item.key} description={item.description ?? 'No description'} />
              <Input value={editValues[item.key] ?? ''} style={{ width: '100%', maxWidth: 300 }}
                onChange={(e) => setEditValues((prev) => ({ ...prev, [item.key]: e.target.value }))}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
