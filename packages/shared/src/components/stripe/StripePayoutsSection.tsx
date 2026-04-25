import { useEffect, useRef, useState } from 'react';
import { App, Button, Spin, Tag } from 'antd';
import {
  BankOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleFilled,
  ExportOutlined,
  IdcardOutlined,
  ReloadOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import HumanCard from '../shared/HumanCard';
import { useAdminStripeStatus } from '../../hooks/useAdminStripeStatus';
import { useIsMobile } from '../../hooks/useIsMobile';
import { stripeConnectApi } from '../../services/stripeConnectApi';
import { createLogger } from '../../lib/logger';
import type {
  OrganizationStripeStatus,
  OrganizationStripeState,
} from '../../types/organizations';

const log = createLogger('StripePayoutsSection');

/**
 * Admin Settings → "Payouts" section.
 *
 * Renders one of four states (no-org / identity-pending / bank-needed / active)
 * keyed off `OrganizationStripeStatus.state`. Mobile-first: phones are the
 * primary case (admins check payout status from the field). Desktop layout
 * stretches the same content into a two-column header.
 *
 * The component owns the resume-onboarding interaction (mints a fresh Stripe
 * account-link on click + redirects). Status fetch lives in
 * `useAdminStripeStatus` so the SettingsPage can trigger refetches independently.
 */
export interface StripePayoutsSectionProps {
  /** Triggers a refetch when truthy — set by the parent on mount or when the
   *  Stripe return URL contains `?status=complete`. */
  refreshNonce?: number | string;
}

const PLATFORM_CONTACT_EMAIL = 'support@code829.com';

export default function StripePayoutsSection({ refreshNonce }: StripePayoutsSectionProps) {
  const { data, isLoading, isFetching, isError, error, refresh } = useAdminStripeStatus();
  const isMobile = useIsMobile();
  const { message } = App.useApp();
  const [resumingScope, setResumingScope] = useState<'identity' | 'bank' | null>(null);

  // Refresh the status whenever the parent bumps `refreshNonce`. Refetch logic
  // lives in the hook (`refetchOnMount: 'always'`) so this only matters for
  // manual triggers (e.g. landing on `/settings/stripe/return?status=complete`).
  const lastNonceRef = useRef<typeof refreshNonce>(undefined);
  useEffect(() => {
    if (refreshNonce !== undefined && refreshNonce !== lastNonceRef.current) {
      lastNonceRef.current = refreshNonce;
      void refresh();
    }
  }, [refreshNonce, refresh]);

  // 403 — admin has no Organization yet. The hook returns the error as-is;
  // detect by looking at the axios error response.
  const noOrg = isError && getStatusCode(error) === 403;
  // Org exists but no Stripe account yet — only a developer can create one,
  // so the admin should see the same "contact platform" empty state as no-org
  // rather than a "Resume onboarding" button that 409s.
  const noStripeAccount = !!data && data.state === 'not_started' && !data.stripeAccount;

  const cardStyle: React.CSSProperties = {
    maxWidth: 720,
    width: '100%',
    paddingLeft: isMobile ? 16 : 24,
    paddingRight: isMobile ? 16 : 24,
  };

  return (
    <div
      aria-labelledby="payouts-section-heading"
      style={{
        marginTop: 32,
        marginLeft: 'auto',
        marginRight: 'auto',
      }}
    >
      <HumanCard
        style={cardStyle}
        title={
          <span id="payouts-section-heading" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <BankOutlined aria-hidden="true" /> Payouts
          </span>
        }
        subtitle="Where your ticket revenue lands."
        extra={
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined spin={isFetching && !isLoading} />}
            onClick={() => {
              void refresh();
              message.success('Refreshing payout status…');
            }}
            aria-label="Refresh payout status"
            style={{ minHeight: 44, minWidth: 44 }}
          />
        }
      >
        {isLoading ? (
          <LoadingState />
        ) : noOrg || noStripeAccount ? (
          <NoOrgState />
        ) : isError ? (
          <ErrorState onRetry={() => void refresh()} />
        ) : data ? (
          <ActiveStates
            data={data}
            isMobile={isMobile}
            resumingScope={resumingScope}
            onResume={async (scope) => {
              setResumingScope(scope);
              try {
                const { data: link } = await stripeConnectApi.adminResumeOnboardingLink(scope);
                window.location.href = link.url;
              } catch (err) {
                log.error('Failed to mint Stripe onboarding link', err);
                message.error('Could not open Stripe — please try again.');
                setResumingScope(null);
              }
            }}
          />
        ) : null}
      </HumanCard>
    </div>
  );
}

// ── State sub-views ──────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div
      role="status"
      aria-label="Loading payout status"
      style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}
    >
      <Spin />
    </div>
  );
}

function NoOrgState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <StatusRow
        tone="neutral"
        icon={<ExclamationCircleFilled aria-hidden="true" />}
        label="Payouts not yet enabled"
      />
      <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
        Your account isn't linked to a payout organization yet. Contact the platform team to get
        set up — this is a one-time configuration done by a developer.
      </p>
      <a
        href={`mailto:${PLATFORM_CONTACT_EMAIL}?subject=Enable%20payouts%20for%20my%20organization`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 44,
          padding: '0 20px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--primary)',
          color: 'var(--on-primary, #fff)',
          textDecoration: 'none',
          fontWeight: 600,
          alignSelf: 'flex-start',
        }}
      >
        Email the platform team
      </a>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <StatusRow
        tone="danger"
        icon={<CloseCircleFilled aria-hidden="true" />}
        label="Couldn't load payout status"
      />
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
        Something went wrong reading your Stripe status. Try again — if the problem keeps
        happening, contact the platform team.
      </p>
      <Button onClick={onRetry} style={fullWidthOnMobile()} icon={<ReloadOutlined />}>
        Try again
      </Button>
    </div>
  );
}

function ActiveStates({
  data,
  isMobile,
  resumingScope,
  onResume,
}: {
  data: OrganizationStripeStatus;
  isMobile: boolean;
  resumingScope: 'identity' | 'bank' | null;
  onResume: (scope: 'identity' | 'bank') => Promise<void>;
}) {
  const headerLayout: React.CSSProperties = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'flex-start' : 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={headerLayout}>
        <StateChip state={data.state} />
        <ActionForState
          data={data}
          isMobile={isMobile}
          resumingScope={resumingScope}
          onResume={onResume}
        />
      </div>

      <ExplainerForState state={data.state} bankLast4={data.bankAccountLast4} />

      <MembersList members={data.members} orgName={data.organizationName} />
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

interface StateChipMeta {
  label: string;
  tone: 'success' | 'warning' | 'info' | 'danger' | 'neutral';
  icon: React.ReactNode;
}

const STATE_META: Record<OrganizationStripeState, StateChipMeta> = {
  not_started: {
    label: 'Not started',
    tone: 'neutral',
    icon: <ExclamationCircleFilled aria-hidden="true" />,
  },
  identity_pending: {
    label: 'Identity pending',
    tone: 'warning',
    icon: <IdcardOutlined aria-hidden="true" />,
  },
  needs_bank: {
    label: 'Bank account required',
    tone: 'info',
    icon: <BankOutlined aria-hidden="true" />,
  },
  active: {
    label: 'Payouts active',
    tone: 'success',
    icon: <CheckCircleFilled aria-hidden="true" />,
  },
  rejected: {
    label: 'Account rejected',
    tone: 'danger',
    icon: <CloseCircleFilled aria-hidden="true" />,
  },
};

function StateChip({ state }: { state: OrganizationStripeState }) {
  const meta = STATE_META[state];
  return <StatusRow tone={meta.tone} icon={meta.icon} label={meta.label} />;
}

function StatusRow({
  tone,
  icon,
  label,
}: {
  tone: 'success' | 'warning' | 'info' | 'danger' | 'neutral';
  icon: React.ReactNode;
  label: string;
}) {
  const color = {
    success: 'var(--status-success, #16a34a)',
    warning: 'var(--status-warning, #ca8a04)',
    info: 'var(--status-info, #2563eb)',
    danger: 'var(--status-danger, #dc2626)',
    neutral: 'var(--status-neutral, #6b7280)',
  }[tone];

  return (
    <div
      role="status"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 14px',
        borderRadius: 999,
        background: `${color}15`,
        color,
        fontWeight: 600,
        fontSize: 14,
        minHeight: 32,
      }}
    >
      <span style={{ display: 'inline-flex', fontSize: 16 }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function ActionForState({
  data,
  isMobile,
  resumingScope,
  onResume,
}: {
  data: OrganizationStripeStatus;
  isMobile: boolean;
  resumingScope: 'identity' | 'bank' | null;
  onResume: (scope: 'identity' | 'bank') => Promise<void>;
}) {
  const buttonBaseStyle: React.CSSProperties = {
    minHeight: 44,
    width: isMobile ? '100%' : 'auto',
    fontWeight: 600,
  };

  switch (data.state) {
    case 'not_started':
    case 'identity_pending':
      return (
        <Button
          type="primary"
          onClick={() => void onResume('identity')}
          loading={resumingScope === 'identity'}
          disabled={resumingScope !== null}
          style={buttonBaseStyle}
        >
          Resume onboarding
        </Button>
      );
    case 'needs_bank':
      return (
        <Button
          type="primary"
          icon={<BankOutlined />}
          onClick={() => void onResume('bank')}
          loading={resumingScope === 'bank'}
          disabled={resumingScope !== null}
          style={buttonBaseStyle}
        >
          Add bank account
        </Button>
      );
    case 'active':
      return data.expressDashboardUrl ? (
        <a
          href={data.expressDashboardUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open Stripe Express dashboard in a new tab"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            ...buttonBaseStyle,
            padding: '0 20px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            textDecoration: 'none',
          }}
        >
          <ExportOutlined aria-hidden="true" />
          {isMobile ? 'Open Stripe' : 'Open Stripe Express dashboard'}
        </a>
      ) : null;
    case 'rejected':
      return (
        <Button
          danger
          onClick={() => void onResume('identity')}
          loading={resumingScope === 'identity'}
          disabled={resumingScope !== null}
          style={buttonBaseStyle}
        >
          Contact support
        </Button>
      );
    default:
      return null;
  }
}

function ExplainerForState({
  state,
  bankLast4,
}: {
  state: OrganizationStripeState;
  bankLast4: string | null;
}) {
  const baseTextStyle: React.CSSProperties = {
    fontSize: 14,
    lineHeight: 1.6,
    color: 'var(--text-secondary)',
    margin: 0,
  };

  switch (state) {
    case 'not_started':
      return (
        <p style={baseTextStyle}>
          A payout account hasn't been started yet. Tap "Resume onboarding" to start the Stripe
          flow — it takes about 5 minutes.
        </p>
      );
    case 'identity_pending':
      return (
        <p style={baseTextStyle}>
          Stripe is waiting on more information to verify your identity. Tap "Resume onboarding"
          to pick up where you left off.
        </p>
      );
    case 'needs_bank':
      return (
        <p style={baseTextStyle}>
          Identity verified. Add a bank account so Stripe can send you payouts.
        </p>
      );
    case 'active':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={baseTextStyle}>
            Payouts are sent on Stripe's standard schedule. You can view payouts and update
            details from the Stripe Express dashboard.
          </p>
          {bankLast4 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <BankOutlined aria-hidden="true" style={{ color: 'var(--text-secondary)' }} />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Connected bank</span>
              <span
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  letterSpacing: '0.08em',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginLeft: 'auto',
                }}
              >
                {bankLast4}
              </span>
            </div>
          )}
        </div>
      );
    case 'rejected':
      return (
        <p style={baseTextStyle}>
          Stripe declined this account. Contact platform support to figure out next steps.
        </p>
      );
    default:
      return null;
  }
}

function MembersList({
  members,
  orgName,
}: {
  members: OrganizationStripeStatus['members'];
  orgName: string;
}) {
  if (!members || members.length === 0) return null;

  return (
    <section aria-labelledby="payouts-members-heading" style={{ marginTop: 8 }}>
      <h3
        id="payouts-members-heading"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text-secondary)',
          margin: '0 0 10px 0',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        <TeamOutlined aria-hidden="true" />
        Members sharing this payout account
      </h3>
      <p
        style={{
          fontSize: 12,
          color: 'var(--text-secondary)',
          margin: '0 0 12px 0',
        }}
      >
        Everyone listed here can act on the {orgName} payout account.
      </p>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'grid',
          gap: 8,
          gridTemplateColumns: 'minmax(0, 1fr)',
        }}
      >
        {members.map((m) => (
          <li
            key={m.businessUserId}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              minHeight: 48,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--primary-tint)',
                color: 'var(--primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {initials(m.firstName, m.lastName)}
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {m.firstName} {m.lastName}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {m.email}
              </div>
            </div>
            <Tag style={{ marginInlineEnd: 0, flexShrink: 0 }}>{m.role}</Tag>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function initials(first: string, last: string): string {
  const f = first?.[0] ?? '';
  const l = last?.[0] ?? '';
  return (f + l).toUpperCase() || '?';
}

function fullWidthOnMobile(): React.CSSProperties {
  // Returned style is consumed inside a node that already knows mobile vs desktop,
  // so we always emit `width:100%` and let `max-width` cap it at the parent.
  return { minHeight: 44, width: '100%', maxWidth: 320, fontWeight: 600 };
}

function getStatusCode(err: unknown): number | undefined {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { status?: number } }).response;
    return res?.status;
  }
  return undefined;
}
