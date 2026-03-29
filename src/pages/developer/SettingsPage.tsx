import React, { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import apiClient from '../../lib/axios';
import { SkeletonLine } from '../../components/Skeleton';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BrandConfig {
  brandName: string;
  tagline: string;
  defaultFeePercent: number;
  supportEmail?: string;
  timezone?: string;
}

// ─── Read-only field ──────────────────────────────────────────────────────────

function ReadField({
  label,
  value,
  loading,
}: {
  label: string;
  value: string;
  loading: boolean;
}): React.ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <label
        style={{
          fontSize: '0.7rem',
          fontWeight: 600,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </label>
      {loading ? (
        <SkeletonLine className="w-48 h-9" />
      ) : (
        <div
          style={{
            padding: '0.5rem 0.75rem',
            borderRadius: '0.375rem',
            border: '1px solid var(--border)',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.9rem',
            minHeight: '38px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {value || <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
        </div>
      )}
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-card)',
        marginBottom: '1rem',
      }}
    >
      <div style={{ marginBottom: '1.25rem' }}>
        <h2
          style={{
            margin: '0 0 0.25rem',
            fontFamily: 'var(--font-display)',
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}
        >
          {title}
        </h2>
        {description && (
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
            {description}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {children}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage(): React.ReactElement {
  const [config, setConfig] = useState<BrandConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchConfig(): Promise<void> {
      try {
        const res = await apiClient.get<BrandConfig>('/brand/config');
        if (!cancelled) setConfig(res.data);
      } catch {
        // silently fail — show empty values
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void fetchConfig();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ maxWidth: '640px' }}>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.75rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          margin: '0 0 1.5rem',
        }}
      >
        Settings
      </h1>

      {/* Platform Settings */}
      <SettingsSection
        title="Platform Settings"
        description="Read-only brand configuration. Edit via environment or API."
      >
        <ReadField label="Brand Name" value={config?.brandName ?? ''} loading={loading} />
        <ReadField label="Tagline" value={config?.tagline ?? ''} loading={loading} />
        {config?.supportEmail !== undefined && (
          <ReadField label="Support Email" value={config.supportEmail} loading={loading} />
        )}
        {config?.timezone !== undefined && (
          <ReadField label="Timezone" value={config.timezone} loading={loading} />
        )}
      </SettingsSection>

      {/* Fee Configuration */}
      <SettingsSection
        title="Fee Configuration"
        description="Platform fee applied to all bookings. Contact support to change."
      >
        <ReadField
          label="Default Platform Fee"
          value={
            loading || !config
              ? ''
              : `${config.defaultFeePercent}%`
          }
          loading={loading}
        />
      </SettingsSection>

      {/* Developer Settings */}
      <SettingsSection
        title="Developer Settings"
        description="API keys, webhooks, and integration documentation."
      >
        <div>
          <a
            href="/developer/developer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-primary)';
              e.currentTarget.style.color = 'var(--accent-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <ExternalLink size={15} />
            Developer Portal
          </a>
        </div>
      </SettingsSection>
    </div>
  );
}

