import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import { User, Mail, MapPin, Phone, Save } from 'lucide-react';
import { authApi } from '../services/authApi';
import { useAuthStore } from '../stores/authStore';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  phone: string | null;
  optInLocationEmail: boolean;
  hasCompletedOnboarding: boolean;
  createdAt: string;
}

export default function ProfilePage(): React.ReactElement {
  const { fetchMe } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', city: '', state: '', zipCode: '', phone: '', optInLocationEmail: false });

  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<void> {
      try {
        const res = await authApi.getMe<UserProfile>();
        if (cancelled) return;
        setProfile(res.data);
        setForm({
          name: res.data.name ?? '',
          address: res.data.address ?? '',
          city: res.data.city ?? '',
          state: res.data.state ?? '',
          zipCode: res.data.zipCode ?? '',
          phone: res.data.phone ?? '',
          optInLocationEmail: res.data.optInLocationEmail,
        });
      } catch {
        if (!cancelled) toast.error('Failed to load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  async function handleSave(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setSaving(true);
    try {
      await authApi.updateProfile(form);
      toast.success('Profile updated');
      await fetchMe();
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.625rem 0.875rem', borderRadius: '0.5rem',
    border: '1px solid var(--border)', background: 'var(--bg-primary)',
    color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
    fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)',
    textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem', display: 'block',
  };

  if (loading) {
    return (
      <div style={{ paddingTop: '80px', maxWidth: '600px', margin: '0 auto', padding: '80px 1.5rem 2rem' }}>
        <div style={{ height: '400px', borderRadius: '1rem', background: 'var(--bg-secondary)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
    );
  }

  return (
    <>
      <Helmet><title>My Profile — Code829</title></Helmet>
      <div style={{ paddingTop: '80px', maxWidth: '600px', margin: '0 auto', padding: '80px 1.5rem 2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
          My Profile
        </h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          Manage your account details
        </p>

        {/* Email (read-only) */}
        <div style={{
          padding: '1rem', borderRadius: '0.75rem', background: 'var(--bg-secondary)',
          border: '1px solid var(--border)', marginBottom: '1.25rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}>
          <Mail size={18} aria-hidden="true" style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>EMAIL</div>
            <div style={{ color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{profile?.email}</div>
          </div>
          <span style={{
            marginLeft: 'auto', fontSize: '0.6875rem', padding: '0.15rem 0.5rem',
            borderRadius: '999px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
          }}>
            {(profile?.role as string) ?? 'User'}
          </span>
        </div>

        <form onSubmit={(e) => void handleSave(e)} style={{
          padding: '1.25rem', borderRadius: '0.75rem', background: 'var(--bg-secondary)',
          border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem',
        }}>
          {/* Name */}
          <div>
            <label style={labelStyle}><User size={12} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 4 }} />Name</label>
            <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>

          {/* Phone */}
          <div>
            <label style={labelStyle}><Phone size={12} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 4 }} />Phone</label>
            <input style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(555) 123-4567" />
          </div>

          {/* Address */}
          <div>
            <label style={labelStyle}><MapPin size={12} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 4 }} />Address</label>
            <input style={inputStyle} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Main St" />
          </div>

          {/* City / State / Zip */}
          <div className="c829-profile-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>City</label>
              <input style={inputStyle} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>State</label>
              <input style={inputStyle} value={form.state} maxLength={2} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Zip</label>
              <input style={inputStyle} value={form.zipCode} onChange={e => setForm(f => ({ ...f, zipCode: e.target.value }))} />
            </div>
          </div>

          {/* Email opt-in */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={form.optInLocationEmail} onChange={e => setForm(f => ({ ...f, optInLocationEmail: e.target.checked }))} />
            Email me about events in my area
          </label>

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '0.75rem', borderRadius: '0.5rem', border: 'none',
              background: 'var(--accent-primary)', color: 'var(--bg-primary)', fontWeight: 600,
              fontSize: '0.875rem', cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              opacity: saving ? 0.7 : 1,
            }}
          >
            <Save size={16} aria-hidden="true" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
          Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
        </p>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }`}</style>
    </>
  );
}
