import { Info, Ticket, LayoutGrid } from 'lucide-react';

interface TicketType {
  id: string;
  name: string;
  priceCents: number;
  platformFeeCents: number;
}

interface LayoutTable {
  id: string;
  label: string;
  priceCents: number;
  platformFeeCents: number;
}

interface ReadOnlyPlatformFeesProps {
  layoutMode: 'Grid' | 'CapacityOnly' | 'None';
  ticketTypes: TicketType[];
  tables: LayoutTable[];
}

export default function ReadOnlyPlatformFees({
  layoutMode,
  ticketTypes,
  tables
}: ReadOnlyPlatformFeesProps) {
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  return (
    <div style={{ padding: '0.5rem' }}>
      <div style={{ 
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border)',
        borderRadius: '0.75rem',
        padding: '1rem',
        marginBottom: '1.5rem',
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'center'
      }}>
        <Info size={16} color="var(--text-tertiary)" />
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Platform fees are managed by the Developer and are read-only for Administrators.
        </p>
      </div>

      <h5 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
        <Ticket size={18} />
        Ticket Tier Pricing
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
               <div style={{ textAlign: 'right' }}>
                 <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Fee</div>
                 <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>+{formatCurrency(t.platformFeeCents)}</div>
               </div>
               <div style={{ textAlign: 'right', minWidth: '80px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Final Price</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                    {formatCurrency(t.priceCents + t.platformFeeCents)}
                  </div>
               </div>
            </div>
          </div>
        ))}
      </div>

      {layoutMode === 'Grid' && tables.length > 0 && (
        <>
          <h5 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '2rem 0 1rem', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            <LayoutGrid size={18} />
            Table Specific Pricing
          </h5>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {tables.map(t => (
              <div key={t.id} style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                padding: '1rem',
                borderRadius: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                   <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Table {t.label}</div>
                   <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{formatCurrency(t.priceCents)} base</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                   <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Total</div>
                   <div style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                     {formatCurrency(t.priceCents + t.platformFeeCents)}
                   </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
