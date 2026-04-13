import { Card, Statistic } from 'antd';
import { TableOutlined, TeamOutlined, DollarOutlined } from '@ant-design/icons';
import type { LayoutStatsResponse } from '@code829/shared/types/layout';
import { centsToUSD } from '@code829/shared/utils/currency';

interface LayoutStatsBarProps {
  stats: LayoutStatsResponse | null;
  loading: boolean;
}

export default function LayoutStatsBar({ stats, loading }: LayoutStatsBarProps) {
  const items = [
    {
      title: 'Tables',
      value: stats?.totalTables ?? 0,
      icon: <TableOutlined />,
      color: 'var(--accent-violet)',
    },
    {
      title: 'Capacity',
      value: stats?.totalCapacity ?? 0,
      icon: <TeamOutlined />,
      color: 'var(--accent-violet)',
      suffix: 'seats',
    },
    {
      title: 'Revenue',
      value: centsToUSD(stats?.totalPotentialRevenueCents ?? 0),
      icon: <DollarOutlined />,
      color: 'var(--accent-green)',
    },
  ];

  return (
    <div className="layout-stats-bar">
      {items.map((item) => (
        <Card key={item.title} size="small" loading={loading} className="layout-stats-card">
          <Statistic
            title={item.title}
            value={item.value}
            prefix={item.icon}
            suffix={item.suffix}
            styles={{ content: { color: item.color, fontSize: 20 } }}
          />
        </Card>
      ))}
    </div>
  );
}
