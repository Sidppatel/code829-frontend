import React, { useEffect, useState } from 'react';
import { CalendarDays, MapPin, Ticket, DollarSign } from 'lucide-react';
import apiClient from '../../lib/axios';
import { SkeletonLine } from '../../components/Skeleton';

interface DashboardStats {
  totalEvents: number;
  totalVenues: number;
  totalBookings: number;
  revenue: number;
}

interface StatCardProps {
  label: string;
  value: string | number;
  Icon: React.ComponentType<{ size: number }>;
  loading: boolean;
  color: string;
}

function StatCard({ label, value, Icon, loading, color }: StatCardProps): React.ReactElement {
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '0.75rem',
        padding: '1.25rem',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem',
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '0.5rem',
          background: `color-mix(in srgb, ${color} 15%, transparent)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
          flexShrink: 0,
        }}
      >
        <Icon size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: '0.8125rem',
            color: 'var(--text-tertiary)',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {label}
        </p>
        {loading ? (
          <SkeletonLine className="w-24 h-7 mt-1" />
        ) : (
          <p
            style={{
              margin: '0.25rem 0 0',
              fontSize: '1.75rem',
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)',
              lineHeight: 1.1,
            }}
          >
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboardPage(): React.ReactElement {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchStats(): Promise<void> {
      try {
        const res = await apiClient.get<DashboardStats>('/admin/dashboard');
        if (!cancelled) setStats(res.data);
      } catch {
        // silently fail — stats remain null
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void fetchStats();
    return () => { cancelled = true; };
  }, []);

  const formatCurrency = (val: number): string =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  const CARDS: Omit<StatCardProps, 'loading'>[] = [
    {
      label: 'Total Events',
      value: stats?.totalEvents ?? 0,
      Icon: CalendarDays,
      color: 'var(--accent-primary)',
    },
    {
      label: 'Total Venues',
      value: stats?.totalVenues ?? 0,
      Icon: MapPin,
      color: 'var(--accent-secondary)',
    },
    {
      label: 'Total Bookings',
      value: stats?.totalBookings ?? 0,
      Icon: Ticket,
      color: 'var(--color-info)',
    },
    {
      label: 'Revenue',
      value: stats ? formatCurrency(stats.revenue) : '$0',
      Icon: DollarSign,
      color: 'var(--color-success)',
    },
  ];

  return (
    <div>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.75rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          margin: '0 0 1.5rem',
        }}
      >
        Dashboard
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        {CARDS.map((card) => (
          <StatCard key={card.label} {...card} loading={loading} />
        ))}
      </div>
    </div>
  );
}
