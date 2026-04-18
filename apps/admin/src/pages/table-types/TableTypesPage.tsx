import { useCallback } from 'react';
import { Button, ColorPicker, Input, InputNumber, Select, Switch, Tooltip } from 'antd';
import { EditOutlined, PlusOutlined, TeamOutlined } from '@ant-design/icons';
import { adminLayoutApi } from '../../services/api';
import { centsToDollars, centsToUSD } from '@code829/shared/utils/currency';
import type { TableTemplate } from '@code829/shared/types/layout';
import type { CreateTableTemplatePayload } from '@code829/shared/services/adminLayoutApi';
import {
  CrudModal,
  DataTableSection,
  FormField,
  LoadingBoundary,
  PageShell,
} from '@code829/shared/components/ui';
import HumanCard from '@code829/shared/components/shared/HumanCard';
import { semantic, tablePickerPresets } from '@code829/shared/theme/colors';
import {
  useAsyncAction,
  useAsyncResource,
  useCrudModal,
} from '@code829/shared/hooks';

interface TemplateFormValues {
  name: string;
  defaultCapacity: number;
  defaultShape: string;
  defaultColor: string | { toHexString?: () => string };
  defaultPriceCents?: number;
}

function normalizeColor(v: TemplateFormValues['defaultColor']): string {
  if (typeof v === 'string') return v;
  return v?.toHexString?.() ?? semantic.brand;
}

export default function TableTypesPage() {
  const fetchTypes = useCallback(async () => {
    const { data } = await adminLayoutApi.listTableTemplates();
    return data;
  }, []);
  const { data: types, loading, refresh } = useAsyncResource(fetchTypes);

  const crud = useCrudModal<TableTemplate>();

  const save = useAsyncAction(
    async (values: TemplateFormValues) => {
      const payload: CreateTableTemplatePayload = {
        name: values.name,
        defaultCapacity: values.defaultCapacity,
        defaultShape: values.defaultShape,
        defaultColor: normalizeColor(values.defaultColor),
        defaultPriceCents:
          values.defaultPriceCents != null ? Math.round(values.defaultPriceCents * 100) : undefined,
      };
      if (crud.mode === 'edit' && crud.entity) {
        return adminLayoutApi.updateTableTemplate(crud.entity.id, payload);
      }
      return adminLayoutApi.createTableTemplate(payload);
    },
    {
      successMessage: 'Template saved',
      onSuccess: () => { crud.close(); refresh(); },
    },
  );

  const toggle = useAsyncAction(
    (r: TableTemplate) =>
      adminLayoutApi.updateTableTemplate(r.id, {
        name: r.name,
        defaultCapacity: r.defaultCapacity,
        defaultShape: r.defaultShape,
        defaultColor: r.defaultColor,
        defaultPriceCents: r.defaultPriceCents,
        isActive: !r.isActive,
      }),
    { successMessage: 'Template updated', onSuccess: refresh },
  );

  const initialValues: Partial<TemplateFormValues> | undefined = crud.entity
    ? {
        name: crud.entity.name,
        defaultCapacity: crud.entity.defaultCapacity,
        defaultShape: crud.entity.defaultShape,
        defaultColor: crud.entity.defaultColor ?? semantic.brand,
        defaultPriceCents: centsToDollars(crud.entity.defaultPriceCents),
      }
    : undefined;

  return (
    <PageShell
      title="Table Templates"
      subtitle={[
        'Define reusable configurations for your event layouts.',
        'Standardize seating, pricing, and visual styles across venues.',
        'Consistency is the bedrock of premium guest experiences.',
      ]}
      rotateSubtitle
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={crud.openCreate}
          style={{
            borderRadius: 'var(--radius-full)',
            height: 48,
            padding: '0 32px',
            fontWeight: 700,
            boxShadow: 'var(--shadow-md)',
          }}
        >
          Add Template
        </Button>
      }
    >
      <LoadingBoundary
        loading={loading}
        data={types}
        skeleton="card"
        empty={{
          title: 'No templates yet',
          description: 'Create your first table template to standardize layouts.',
          actionLabel: 'Add Template',
          onAction: crud.openCreate,
        }}
      >
        {(items) => (
          <DataTableSection<TableTemplate>
            data={items}
            total={items.length}
            page={1}
            pageSize={items.length || 10}
            loading={false}
            onPageChange={() => {}}
            rowKey="id"
            showSizeChanger={false}
            columns={[
              {
                title: 'Template',
                key: 'type',
                render: (_: unknown, record: TableTemplate) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      className="tt-swatch human-noise"
                      style={{
                        background: record.defaultColor || 'var(--primary)',
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          fontSize: 16,
                          fontFamily: "'Playfair Display', serif",
                        }}
                      >
                        {record.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{record.defaultShape}</div>
                    </div>
                  </div>
                ),
              },
              {
                title: 'Capacity',
                dataIndex: 'defaultCapacity',
                key: 'defaultCapacity',
                width: 120,
                render: (v: number) => (
                  <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                    <TeamOutlined style={{ color: 'var(--primary)' }} />
                    {v} seats
                  </span>
                ),
              },
              {
                title: 'Default Price',
                dataIndex: 'defaultPriceCents',
                key: 'defaultPriceCents',
                width: 140,
                render: (v: number) => (
                  <span style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: 15 }}>{centsToUSD(v)}</span>
                ),
              },
              {
                title: 'Status',
                key: 'isActive',
                width: 120,
                render: (_: unknown, record: TableTemplate) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: record.isActive ? 'var(--accent-green)' : 'var(--text-muted)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {record.isActive ? 'Active' : 'Off'}
                    </span>
                    <Switch checked={record.isActive} onChange={() => { void toggle.run(record); }} size="small" />
                  </div>
                ),
              },
              {
                title: 'Actions',
                key: 'actions',
                width: 100,
                render: (_: unknown, record: TableTemplate) => (
                  <Tooltip title="Edit Template">
                    <Button
                      shape="circle"
                      icon={<EditOutlined />}
                      onClick={() => crud.openEdit(record)}
                      style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
                    />
                  </Tooltip>
                ),
              },
            ]}
            mobileCard={(tt) => (
              <HumanCard
                className="human-noise"
                style={{
                  opacity: tt.isActive ? 1 : 0.7,
                  border: tt.isActive ? '1px solid var(--border)' : '1px dashed var(--border)',
                }}
                title={tt.name}
                subtitle={`${tt.defaultShape} • ${tt.defaultCapacity} seats`}
                extra={<Switch checked={tt.isActive} onChange={() => { void toggle.run(tt); }} size="small" />}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="tt-swatch" style={{ background: tt.defaultColor || 'var(--primary)', width: 24, height: 24, borderRadius: 6 }} />
                    <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>{centsToUSD(tt.defaultPriceCents)}</span>
                  </div>
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => crud.openEdit(tt)}
                    style={{ borderRadius: 'var(--radius-full)', fontWeight: 600 }}
                  >
                    Edit
                  </Button>
                </div>
              </HumanCard>
            )}
          />
        )}
      </LoadingBoundary>

      <CrudModal<TemplateFormValues>
        open={crud.open}
        mode={crud.mode}
        onClose={crud.close}
        saving={save.loading}
        initialValues={initialValues}
        onSubmit={async (v) => { await save.run(v); }}
        titles={{ create: 'Create New Template', edit: 'Edit Table Template' }}
        submitLabel={{ create: 'Create', edit: 'Save Configuration' }}
        cancelLabel="Discard"
      >
        {(form) => (
          <>
            <FormField name="name" label="Template Name" required>
              <Input placeholder="e.g. VIP Circular" />
            </FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FormField name="defaultCapacity" label="Guest Capacity" required>
                <InputNumber min={1} style={{ width: '100%' }} />
              </FormField>
              <FormField name="defaultShape" label="Table Shape" required>
                <Select options={['Round', 'Rectangle', 'Square', 'Cocktail'].map((s) => ({ label: s, value: s }))} />
              </FormField>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <FormField name="defaultPriceCents" label="Default Price (USD)">
                <InputNumber min={0} step={0.01} precision={2} placeholder="0.00" prefix="$" style={{ width: '100%' }} />
              </FormField>
              <FormField name="defaultColor" label="Visual Marker">
                <ColorPicker
                  format="hex"
                  onChange={(color) => form.setFieldValue('defaultColor', color.toHexString())}
                  showText
                  presets={[{ label: 'Theme Colors', colors: [...tablePickerPresets] }]}
                />
              </FormField>
            </div>
          </>
        )}
      </CrudModal>
    </PageShell>
  );
}
