import { useEffect, useState } from 'react';
import { App, Form, Input, Modal, Select } from 'antd';
import apiClient from '@code829/shared/lib/axios';
import { organizationsApi } from '@code829/shared/services/organizationsApi';
import type {
  OrganizationCreateRequest,
  OrganizationDetail,
} from '@code829/shared/types/organizations';
import type { BusinessUserListItem } from '@code829/shared/types/auth';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (org: OrganizationDetail) => void;
}

interface FormValues {
  name: string;
  legalName?: string;
  countryCode: string;
  initialMemberBusinessUserId: string;
}

/**
 * Two-purpose modal:
 *   1. Capture name + (optional) legal name + country
 *   2. Pick the seed BusinessUser — required by the BE so an org never
 *      lives orphaned. Defaults country to "US" matching the BE default.
 *
 * On success we hand the freshly created `OrganizationDetail` to the
 * parent so it can pivot the user straight into the detail drawer
 * without a second list refetch.
 */
export default function NewOrganizationModal({ open, onClose, onCreated }: Props) {
  const [form] = Form.useForm<FormValues>();
  const { message } = App.useApp();
  const [members, setMembers] = useState<BusinessUserListItem[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    Promise.resolve()
      .then(() => { if (!cancelled) setMembersLoading(true); })
      .then(() =>
        apiClient.get<{ items: BusinessUserListItem[] }>('/admin/staff', {
          params: { page: 1, pageSize: 200 },
        }),
      )
      .then(({ data }) => {
        if (!cancelled) setMembers(data.items ?? []);
      })
      .catch(() => {
        if (!cancelled) message.error('Failed to load potential members');
      })
      .finally(() => {
        if (!cancelled) setMembersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, message]);

  useEffect(() => {
    if (!open) return;
    void Promise.resolve().then(() => {
      form.resetFields();
      form.setFieldsValue({ countryCode: 'US' } as Partial<FormValues>);
    });
  }, [open, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const payload: OrganizationCreateRequest = {
        name: values.name,
        legalName: values.legalName?.trim() ? values.legalName : null,
        countryCode: values.countryCode,
        initialMemberBusinessUserId: values.initialMemberBusinessUserId,
      };
      const { data } = await organizationsApi.create(payload);
      message.success('Organization created');
      onCreated(data);
    } catch {
      message.error('Failed to create organization');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title="New Organization"
      onCancel={onClose}
      onOk={handleOk}
      okText="Create"
      confirmLoading={saving}
      destroyOnHidden
      centered
      width={520}
    >
      <Form<FormValues> form={form} layout="vertical" preserve={false}>
        <Form.Item
          name="name"
          label="Display Name"
          rules={[{ required: true, message: 'Display name is required' }]}
        >
          <Input placeholder="Acme Events" />
        </Form.Item>

        <Form.Item name="legalName" label="Legal Name (optional)">
          <Input placeholder="Acme Events, LLC" />
        </Form.Item>

        <Form.Item
          name="countryCode"
          label="Country"
          rules={[{ required: true, message: 'Country is required' }]}
          tooltip="ISO 3166-1 alpha-2 country code (US, CA, GB, ...)."
        >
          <Select
            showSearch
            options={[
              { value: 'US', label: 'United States (US)' },
              { value: 'CA', label: 'Canada (CA)' },
              { value: 'GB', label: 'United Kingdom (GB)' },
              { value: 'AU', label: 'Australia (AU)' },
              { value: 'DE', label: 'Germany (DE)' },
              { value: 'FR', label: 'France (FR)' },
              { value: 'IE', label: 'Ireland (IE)' },
              { value: 'NL', label: 'Netherlands (NL)' },
              { value: 'SG', label: 'Singapore (SG)' },
              { value: 'JP', label: 'Japan (JP)' },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="initialMemberBusinessUserId"
          label="Initial Member"
          rules={[{ required: true, message: 'Pick a starting member' }]}
          tooltip="Required so the new org isn't created without a member."
        >
          <Select
            showSearch
            placeholder="Pick an admin or staff user"
            loading={membersLoading}
            optionFilterProp="label"
            options={members.map((m) => ({
              value: m.businessUserId,
              label: `${m.firstName} ${m.lastName} (${m.email})`,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
