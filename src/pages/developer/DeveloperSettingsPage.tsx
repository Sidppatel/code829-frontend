import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { Save, Users, Settings, Key, Search } from 'lucide-react';
import apiClient from '../../lib/axios';

interface SettingItem {
  key: string;
  value: string;
  description: string;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function DeveloperSettingsPage(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<'general' | 'users'>('general');
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({});
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetchData(): Promise<void> {
      try {
        if (activeTab === 'general') {
          const res = await apiClient.get<SettingItem[]>('/developer/settings');
          if (!cancelled) setSettings(res.data);
        } else {
          const res = await apiClient.get<UserItem[]>('/developer/users');
          if (!cancelled) setUsers(res.data);
        }
      } catch {
        if (!cancelled) toast.error('Failed to load data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    setLoading(true);
    void fetchData();
    return () => { cancelled = true; };
  }, [activeTab]);

  async function handleSettingUpdate(key: string, value: string): Promise<void> {
    if (!value.trim()) return;
    setSavingKeys(prev => ({ ...prev, [key]: true }));
    try {
      await apiClient.put('/developer/settings', { key, value });
      toast.success('Setting updated successfully. Masked in UI for security.');
      // Refresh to get masked value
      const res = await apiClient.get<SettingItem[]>('/developer/settings');
      setSettings(res.data);
    } catch {
      toast.error('Failed to update setting');
    } finally {
      setSavingKeys(prev => ({ ...prev, [key]: false }));
    }
  }

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const q = userSearch.toLowerCase();
    return users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  async function handleRoleChange(userId: string, newRole: string): Promise<void> {
    try {
      await apiClient.put(`/developer/users/${userId}/role`, { role: newRole });
      toast.success(`User role updated to ${newRole}`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update user role');
    }
  }

  return (
    <>
      <Helmet>
        <title>Developer Settings — Code829</title>
      </Helmet>

      <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Developer Settings
            </h1>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
              Manage system configuration, API keys, and user privileges.
            </p>
          </div>
        </div>

        {/* Custom Tabs */}
        <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--border)', marginBottom: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('general')}
            style={{
              padding: '0.75rem 0',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${activeTab === 'general' ? 'var(--accent-primary)' : 'transparent'}`,
              color: activeTab === 'general' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'general' ? 600 : 400,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
            }}
          >
            <Settings size={16} />
            System & API Keys
          </button>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '0.75rem 0',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${activeTab === 'users' ? 'var(--accent-primary)' : 'transparent'}`,
              color: activeTab === 'users' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'users' ? 600 : 400,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
            }}
          >
            <Users size={16} />
            User Roles
          </button>
        </div>

        {loading ? (
          <div style={{ height: '200px', borderRadius: '0.75rem', background: 'var(--bg-secondary)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        ) : activeTab === 'general' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {settings.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                No database settings found. (The standard schema requires adding keys via migrations/SQL).
              </div>
            ) : (
              settings.map(s => (
                <div key={s.key} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <Key size={16} style={{ color: 'var(--text-tertiary)' }} />
                      <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{s.key}</h3>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{s.description}</p>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const newVal = formData.get('value') as string;
                      void handleSettingUpdate(s.key, newVal);
                      e.currentTarget.reset();
                    }}
                    style={{ display: 'flex', gap: '0.75rem' }}
                  >
                    <input
                      name="value"
                      type="text"
                      placeholder={`Current: ${s.value}`}
                      style={{
                        flex: 1,
                        padding: '0.625rem 0.875rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-body)',
                        fontSize: '0.875rem',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={savingKeys[s.key]}
                      style={{
                        padding: '0 1.25rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        background: 'var(--accent-primary)',
                        color: 'var(--bg-primary)',
                        fontWeight: 600,
                        cursor: savingKeys[s.key] ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        fontSize: '0.875rem',
                        opacity: savingKeys[s.key] ? 0.7 : 1,
                      }}
                    >
                      <Save size={16} />
                      {savingKeys[s.key] ? 'Saving…' : 'Update'}
                    </button>
                  </form>
                </div>
              ))
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Search bar */}
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                placeholder="Search users by name, email, or role..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem 0.625rem 2.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '0.75rem', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-tertiary)' }}>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>Name</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>Email</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>Role</th>
                  <th style={{ padding: '0.875rem 1.25rem', fontWeight: 600, color: 'var(--text-tertiary)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {u.name}
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', color: 'var(--text-secondary)' }}>
                      {u.email}
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem' }}>
                      <span style={{
                        padding: '0.15rem 0.5rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: u.role === 'Admin' || u.role === 'Developer' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                        color: u.role === 'Admin' || u.role === 'Developer' ? 'var(--bg-primary)' : 'var(--text-secondary)'
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', textAlign: 'right' }}>
                      <select
                        value={u.role}
                        onChange={(e) => void handleRoleChange(u.id, e.target.value)}
                        disabled={u.role === 'Developer'}
                        style={{
                          padding: '0.375rem 0.75rem',
                          borderRadius: '0.375rem',
                          border: '1px solid var(--border)',
                          background: 'var(--bg-primary)',
                          color: 'var(--text-primary)',
                          fontSize: '0.8125rem',
                          cursor: u.role === 'Developer' ? 'not-allowed' : 'pointer',
                          outline: 'none',
                        }}
                      >
                        <option value="User">User</option>
                        <option value="Staff">Staff</option>
                        <option value="Admin">Admin</option>
                        <option value="Developer" disabled>Developer</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                      {userSearch ? `No users matching "${userSearch}"` : 'No users found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          </div>
        )}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }`}</style>
    </>
  );
}
