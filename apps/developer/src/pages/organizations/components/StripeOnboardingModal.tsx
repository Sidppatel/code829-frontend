import { useEffect, useMemo, useState } from 'react';
import { App, AutoComplete, Button, Collapse, Form, Input, Modal, Select, Space, Tag, Typography } from 'antd';
import {
  CopyOutlined,
  LinkOutlined,
  MailOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useIsMobile } from '@code829/shared/hooks/useIsMobile';
import { stripeConnectApi } from '@code829/shared/services/stripeConnectApi';
import type {
  OnboardingLinkScope,
  OrganizationDetail,
  OrganizationMemberSummary,
  StartStripeOnboardingRequest,
  StripeOnboardingLinkResponse,
} from '@code829/shared/types/organizations';

const DEFAULT_MCC = '7922';
const DEFAULT_BUSINESS_TYPE: 'individual' | 'company' = 'individual';
const APP_BRAND_FOR_PRODUCT_DESCRIPTION = 'Code829';

interface Props {
  open: boolean;
  organization: OrganizationDetail | null;
  onClose: () => void;
  onAccountStarted?: () => void;
}

export default function StripeOnboardingModal({
  open,
  organization,
  onClose,
  onAccountStarted,
}: Props) {
  const { message } = App.useApp();
  const isMobile = useIsMobile();
  const [link, setLink] = useState<StripeOnboardingLinkResponse | null>(null);
  const [scope, setScope] = useState<OnboardingLinkScope>('identity');
  const [loading, setLoading] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState<string | undefined>();
  const [prefillForm] = Form.useForm<StartStripeOnboardingRequest>();

  const prefillDefaults = useMemo<StartStripeOnboardingRequest>(() => {
    const legalName = organization?.legalName ?? organization?.name ?? '';
    return {
      businessType: DEFAULT_BUSINESS_TYPE,
      legalName,
      productDescription: legalName
        ? `Event tickets and admissions sold via the ${APP_BRAND_FOR_PRODUCT_DESCRIPTION} platform on behalf of ${legalName}.`
        : '',
      mcc: DEFAULT_MCC,
    };
  }, [organization?.legalName, organization?.name]);

  useEffect(() => {
    if (open) {
      prefillForm.setFieldsValue(prefillDefaults);
      return;
    }
    void Promise.resolve().then(() => {
      setLink(null);
      setEmailRecipient(undefined);
      setScope('identity');
      prefillForm.resetFields();
    });
  }, [open, prefillForm, prefillDefaults]);

  if (!organization) return null;

  const hasAccount = Boolean(organization.stripeConnectedAccountId);

  const startOnboarding = async () => {
    let values: StartStripeOnboardingRequest;
    try {
      values = await prefillForm.validateFields();
    } catch {
      return;
    }

    setLoading(true);
    try {
      const { data } = await stripeConnectApi.developerStartOnboarding(
        organization.id,
        values,
      );
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
    const trimmed = emailRecipient?.trim();
    if (!trimmed) {
      message.warning('Enter a contact email');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      message.warning('Enter a valid email address');
      return;
    }

    const memberMatch = (organization.members ?? []).find(
      (m: OrganizationMemberSummary) => m.email.toLowerCase() === trimmed.toLowerCase(),
    );

    setEmailing(true);
    try {
      const { data } = await stripeConnectApi.developerEmailOnboardingLink(
        organization.id,
        memberMatch
          ? { businessUserId: memberMatch.businessUserId }
          : { recipientEmail: trimmed },
      );
      message.success(`Sent to ${data.recipientEmail}`);
    } catch {
      message.error('Failed to send email');
    } finally {
      setEmailing(false);
    }
  };

  const memberOptions = (organization.members ?? []).map((m: OrganizationMemberSummary) => ({
    value: m.email,
    label: `${m.firstName} ${m.lastName} <${m.email}>`,
  }));

  return (
    <Modal
      open={open}
      title={`Stripe Onboarding · ${organization.name}`}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      centered
      width={isMobile ? '95vw' : 640}
      style={isMobile ? { maxWidth: '100vw', top: 16 } : undefined}
    >
      <Form
        form={prefillForm}
        layout="vertical"
        initialValues={prefillDefaults}
        requiredMark={false}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {!hasAccount && (
          <div>
            <Typography.Paragraph>
              Confirm the details below before creating the Stripe account.
              These pre-fill <code>business_profile</code> on Stripe so the
              organizer skips the &quot;Business details&quot; onboarding step
              and only needs to complete identity (KYC) + bank.
            </Typography.Paragraph>
            <div>
              <Form.Item
                name="businessType"
                label="Business type"
                rules={[{ required: true, message: 'Pick a business type' }]}
              >
                <Select
                  options={[
                    { value: 'individual', label: 'Individual / sole organizer' },
                    { value: 'company', label: 'Registered company' },
                  ]}
                />
              </Form.Item>
              <Form.Item
                name="legalName"
                label="Legal name"
                rules={[
                  { required: true, message: 'Legal name is required' },
                  { max: 200, message: 'Max 200 characters' },
                ]}
              >
                <Input placeholder="Organization legal name" />
              </Form.Item>
              <Form.Item
                name="productDescription"
                label="Product description"
                tooltip="Shown to Stripe instead of a website URL. 10–500 characters."
                rules={[
                  { required: true, message: 'Product description is required' },
                  { min: 10, max: 500, message: 'Must be 10–500 characters' },
                ]}
              >
                <Input.TextArea rows={2} />
              </Form.Item>
              <Collapse
                ghost
                items={[
                  {
                    key: 'advanced',
                    label: 'Advanced',
                    children: (
                      <Form.Item
                        name="mcc"
                        label="MCC (Merchant Category Code)"
                        tooltip="4-digit Stripe code. 7922 = Theatrical Producers / Ticket Agencies."
                        rules={[
                          {
                            pattern: /^[0-9]{4}$/,
                            message: 'Must be a 4-digit code',
                          },
                        ]}
                      >
                        <Input maxLength={4} />
                      </Form.Item>
                    ),
                  },
                ]}
              />
            </div>
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
              after roughly 5 minutes - always mint a new one before sharing.
            </Typography.Paragraph>
            <Space
              direction={isMobile ? 'vertical' : 'horizontal'}
              style={isMobile ? { width: '100%' } : undefined}
            >
              <Select<OnboardingLinkScope>
                value={scope}
                onChange={setScope}
                style={{ width: isMobile ? '100%' : 180 }}
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
                block={isMobile}
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
                Onboarding URL - expires {new Date(link.expiresAt).toLocaleString()}
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
          <div>
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              Or email the link to a contact
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
              Type any email - picks from existing members are suggested but
              not required. BE mints a fresh link and sends via Resend; audit
              row written to <code>email_logs</code>.
            </Typography.Paragraph>
            <Form.Item label="Contact email">
              <AutoComplete
                value={emailRecipient}
                onChange={setEmailRecipient}
                options={memberOptions}
                filterOption={(input, option) =>
                  (option?.value ?? '').toString().toLowerCase().includes(input.toLowerCase())
                }
                style={{ width: '100%' }}
              >
                <Input
                  type="email"
                  placeholder="organizer@example.com"
                  autoComplete="off"
                />
              </AutoComplete>
            </Form.Item>
            <Button
              icon={<MailOutlined />}
              onClick={() => void emailLink()}
              loading={emailing}
              disabled={!emailRecipient?.trim()}
            >
              Send Link by Email
            </Button>
          </div>
        )}
        </Space>
      </Form>
    </Modal>
  );
}
