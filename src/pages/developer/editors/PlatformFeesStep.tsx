import { useState } from 'react';
import toast from 'react-hot-toast';
import { Save, Info, Ticket, LayoutGrid } from 'lucide-react';
import apiClient from '../../../lib/axios';

interface TicketType {
  id: string;
  name: string;
  priceCents: number;
  platformFeeCents: number;
}

interface TableTypeInfo {
  id: string;
  name: string;
  defaultPriceCents: number;
  platformFeeCents: number;
}

interface PlatformFeesStepProps {
  eventId: string;
  layoutMode: 'Grid' | 'CapacityOnly' | 'None';
  ticketTypes: TicketType[];
  tableTypes: TableTypeInfo[];
  onRefresh: () => Promise<void>;
}

export default function PlatformFeesStep({
  eventId,
  layoutMode,
  ticketTypes,
  tableTypes,
  onRefresh
}: PlatformFeesStepProps) {
  const [saving, setSaving] = useState(false);

  const [ticketFees, setTicketFees] = useState<Record<string, string>>(
    Object.fromEntries(ticketTypes.map(t => [t.id, (t.platformFeeCents / 100).toString()]))
  );

  const [tableTypeFees, setTableTypeFees] = useState<Record<string, string>>(
    Object.fromEntries(tableTypes.map(t => [t.id, (t.platformFeeCents / 100).toString()]))
  );

  const [globalTicketFee, setGlobalTicketFee] = useState('');

  const handleApplyGlobal = () => {
    if (!globalTicketFee || isNaN(parseFloat(globalTicketFee))) {
      toast.error('Enter a valid fee amount');
      return;
    }
    const newFees = { ...ticketFees };
    ticketTypes.forEach(t => {
      newFees[t.id] = globalTicketFee;
    });
    setTicketFees(newFees);
    toast.success('Applied to all tickets');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ticketFees: Object.entries(ticketFees).map(([id, val]) => ({
          ticketTypeId: id,
          platformFeeCents: Math.round(parseFloat(val || '0') * 100)
        })),
        tableTypeFees: Object.entries(tableTypeFees).map(([id, val]) => ({
          tableTypeId: id,
          platformFeeCents: Math.round(parseFloat(val || '0') * 100)
        }))
      };

      await apiClient.put(`/developer/events/${eventId}/platform-fees`, payload);
      toast.success('Platform fees updated successfully');
      await onRefresh();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update fees';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  return (
    <div style={{ padding: '0.5rem' }}>
      <div style={{
        background: 'color-mix(in srgb, var(--accent-primary) 5%, var(--bg-secondary))',
        border: '1px solid var(--border)',
        borderRadius: '0.75rem',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        gap: '1rem',
        alignItems: 'flex-start'
      }}>
        <Info color="var(--accent-primary)" size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Developer Fee Management
          </h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Configure platform fees for each ticket tier and table type. These fees are added to the base price.
            Attendees see the final summed price ($Price + $Fee).
          </p>
        </div>
      </div>

      {layoutMode === 'None' && (
         <div style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border)',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          marginBottom: '1.5rem',
        }}>
          <h5 style={{ margin: '0 0 1rem', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
            Bulk Update (Optional)
          </h5>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ flex: 1, position: 'relative' }}>
               <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>$</span>
               <input
                type="number"
                placeholder="Apply single fee to all tickets"
                value={globalTicketFee}
                onChange={e => setGlobalTicketFee(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.625rem 0.625rem 1.75rem',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <button
              onClick={handleApplyGlobal}
              style={{
                padding: '0 1.25rem',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Apply All
            </button>
          </div>
        </div>
      )}

      {/* Ticket Types */}
      <h5 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
        <Ticket size={18} />
        Ticket Tier Fees
      </h5>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', marginBottom: '2rem' }}>
        {ticketTypes.map(t => (
          <div key={t.id} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            padding: '1rem',
            borderRadius: '0.75rem'
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{t.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Base Price: {formatCurrency(t.priceCents)}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
               <div style={{ textAlign: 'right' }}>
                 <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Platform Fee</div>
                 <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>$</span>
                    <input
                      type="number"
                      value={ticketFees[t.id] || '0'}
                      onChange={e => setTicketFees(prev => ({ ...prev, [t.id]: e.target.value }))}
                      style={{
                        width: '100px',
                        padding: '0.5rem 0.5rem 0.5rem 1.6rem',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border)',
                        borderRadius: '0.375rem',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem',
                        textAlign: 'right'
                      }}
                    />
                 </div>
               </div>
               <div style={{ width: '80px', textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Total</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                    {formatCurrency(t.priceCents + Math.round(parseFloat(ticketFees[t.id] || '0') * 100))}
                  </div>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table Types (if applicable) */}
      {layoutMode === 'Grid' && tableTypes.length > 0 && (
        <>
          <h5 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '2rem 0 1rem', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            <LayoutGrid size={18} />
            Table Type Fees
          </h5>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {tableTypes.map(t => (
              <div key={t.id} style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                padding: '1rem',
                borderRadius: '0.75rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                   <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</div>
                   <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{formatCurrency(t.defaultPriceCents)} base</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                   <div style={{ flex: 1, position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>$</span>
                      <input
                        type="number"
                        placeholder="Fee"
                        value={tableTypeFees[t.id] || '0'}
                        onChange={e => setTableTypeFees(prev => ({ ...prev, [t.id]: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: '0.5rem 0.5rem 0.5rem 1.6rem',
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border)',
                          borderRadius: '0.375rem',
                          color: 'var(--text-primary)',
                          fontSize: '0.875rem'
                        }}
                      />
                   </div>
                   <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Total</div>
                      <div style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                        {formatCurrency(t.defaultPriceCents + Math.round(parseFloat(tableTypeFees[t.id] || '0') * 100))}
                      </div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Save Button */}
      <div style={{
        marginTop: '3rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'flex-end'
      }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 2rem',
            background: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)'
          }}
        >
          {saving ? 'Saving Fees...' : <><Save size={18} /> Save All Fees</>}
        </button>
      </div>
    </div>
  );
}
