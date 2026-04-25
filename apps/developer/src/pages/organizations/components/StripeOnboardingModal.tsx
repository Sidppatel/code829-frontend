import { useEffect, useState } from 'react';
import { App, Button, Form, Modal, Select, Space, Tag, Typography } from 'antd';
import {
  CopyOutlined,
  LinkOutlined,
  MailOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { stripeConnectApi } from '@code829/shared/services/stripeConnectApi';
import type {
  OnboardingLinkScope,
  OrganizationDetail,
  OrganizationMemberSummary,
  StripeOnboardingLinkResponse,
} from '@code829/shared/types/organizations';

interface Props {
  open: boolean;
  organization: OrganizationDetail | null;
  onClose: () => void;
  /** Notify parent so it can re-fetch the org list (state may have moved). */
  onAccountStarted?: () => void;
}

/**
 * Hosts the Stripe onboarding flow for one organization.
 *
 * Two surfaces here:
 *  - "Start onboarding" — only shown when the org has no connected
 *    account yet. Hits `developerStartOnboarding` which is idempotent
 *    on the BE.
 *  - "Generate link" — picks a scope (identity vs bank) and returns
 *    a fresh AccountLink. Stripe links live ~5 min so we always re-mint
 *    rather than caching.
 *
 * The minted URL is rendered + copy-to-clipboard + emailable to a
 * specific member via Resend (BE-templated).
 */
export default function StripeOnboardingModal({
  open,
  organization,
  onClose,
  onAccountStarted,
}: Props) {
  const { message } = App.useApp();
  const [link, setLink] = useState<StripeOnboardingLinkResponse | null>(null);
  const [scope, setScope] = useState<OnboardingLinkScope>('identity');
  const [loading, setLoading] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState<string | undefined>();
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) return;
    void Promise.resolve().then(() => {
      setLink(null);
      setEmailRecipient(undefined);
      setScope('identity');
      form.resetFields();
    });
  }, [open, form]);

  if (!organization) return null;

  const hasAccount = Boolean(organization.stripeConnectedAccountId);

  const startOnboarding = async () => {
    setLoading(true);
    try {
      const { data } = await stripeConnectApi.developerStartOnboarding(organization.id);
      setLink(data);
      message.success('Stripe account created');
      onAccountStarted?.();
    } catch {
      message.error('Failed to start onboarding');
    } finally {
      setLoading(false);
    }
  };

  const generateLink = async () => {
    setLoading(true);
    try {
      const { data } = await stripeConnectApi.developerGetOnboardingLink(
        organization.id,
        scope,
      );
      setLink(data);
      message.success('Fresh onboarding link generated');
    } catch {
      message.error('Failed to generate link');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!link?.url) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link.url);
      } else {
        // Legacy fallback for non-secure contexts.
        const ta = document.createElement('textarea');
        ta.value = link.url;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      message.success('Link copied');
    } catch {
      message.error('Copy failed');
    }
  };

  const emailLink = async () => {
    if (!emailRecipient) {
      message.warning('Pick a member first');
      return;
    }
    setEmailing(true);
    try {
      const { data } = await stripeConnectApi.developerEmailOnboardingLink(
        organization.id,
        emailRecipient,
      );
      message.success(`Sent to ${data.recipientEmail}`);
    } catch {
      message.error('Failed to send email');
    } finally {
      setEmailing(false);
    }
  };

  const memberOptions = organization.members.map((m: OrganizationMemberSummary) => ({
    value: m.businessUserId,
    label: `${m.firstName} ${m.lastName} (${m.email})`,
  }));

  return (
    <Modal
      open={open}
      title={`Stripe Onboarding · ${organization.name}`}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      centered
      width={640}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {!hasAccount && (
          <div>
            <Typography.Paragraph>
              This organization has no Stripe connected account yet. Start
              onboarding to create one and get the first identity link.
            </Typography.Paragraph>
            <Button
              type="primary"
              icon={<LinkOutlined />}
              onClick={() => void startOnboarding()}
              loading={loading}
            >
              Start Onboarding
            </Button>
          </div>
        )}

        {hasAccount && (
          <div>
            <Typography.Paragraph>
              Generate a fresh AccountLink for this org. Stripe links expire
              after roughly 5 minutes — always mint a new one before sharing.
            </Typography.Paragraph>
            <Space>
              <Select<OnboardingLinkScope>
                value={scope}
                onChange={setScope}
                style={{ width: 180 }}
                options={[
                  { value: 'identity', label: 'Identity (KYC)' },
                  { value: 'bank', label: 'Bank Account' },
                ]}
              />
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={() => void generateLink()}
                loading={loading}
              >
                Generate Link
              </Button>
            </Space>
          </div>
        )}

        {link && (
          <div
            style={{
              padding: 12,
              border: '1px solid var(--border)',
              borderRadius: 8,
              background: 'var(--bg-soft)',
            }}
          >
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Onboarding URL — expires {new Date(link.expiresAt).toLocaleString()}
              </Typography.Text>
              <Typography.Text
                copyable={false}
                ellipsis
                style={{ wordBreak: 'break-all' }}
              >
                {link.url}
              </Typography.Text>
              <Space wrap>
                <Button icon={<CopyOutlined />} onClick={() => void copyLink()}>
                  Copy Link
                </Button>
                <Button
                  icon={<LinkOutlined />}
                  onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
                >
                  Open
                </Button>
                <Tag color="blue">{scope === 'bank' ? 'Bank' : 'Identity'}</Tag>
              </Space>
            </Space>
          </div>
        )}

        {hasAccount && (
          <Form form={form} layout="vertical">
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              Or email the link to a member
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
              The BE will mint a fresh link and send it via Resend with your
              configured template. Audit row written to `email_logs`.
            </Typography.Paragraph>
            <Form.Item label="Recipient">
              <Select
                placeholder="Pick a member"
                value={emailRecipient}
                onChange={setEmailRecipient}
                options={memberOptions}
                disabled={memberOptions.length === 0}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Button
              icon={<MailOutlined />}
              onClick={() => void emailLink()}
              loading={emailing}
              disabled={!emailRecipient}
            >
              Send Link by Email
            </Button>
          </Form>
        )}
      </Space>
    </Modal>
  );
}
