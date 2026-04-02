import { Card, Row, Col, Statistic } from 'antd';
import { TableOutlined, TeamOutlined, DollarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { LayoutStatsResponse } from '../../../../types/layout';
import { centsToUSD } from '../../../../utils/currency';

interface LayoutStatsBarProps {
  stats: LayoutStatsResponse | null;
  loading: boolean;
}

export default function LayoutStatsBar({ stats, loading }: LayoutStatsBarProps) {
  return (
    <Row gutter={16} style={{ marginBottom: 16 }}>
      <Col span={6}>
        <Card size="small" loading={loading}>
          <Statistic
            title="Total Tables"
            value={stats?.totalTables ?? 0}
            prefix={<TableOutlined />}
            styles={{ content: { color: 'var(--accent-violet)' } }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card size="small" loading={loading}>
          <Statistic
            title="Total Capacity"
            value={stats?.totalCapacity ?? 0}
            prefix={<TeamOutlined />}
            styles={{ content: { color: 'var(--accent-violet)' } }}
            suffix="seats"
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card size="small" loading={loading}>
          <Statistic
            title="Potential Revenue"
            value={centsToUSD(stats?.totalPotentialRevenueCents ?? 0)}
            prefix={<DollarOutlined />}
            styles={{ content: { color: 'var(--accent-green)' } }}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card size="small" loading={loading}>
          <Statistic
            title="Booked Revenue"
            value={centsToUSD(stats?.totalBookedRevenueCents ?? 0)}
            prefix={<CheckCircleOutlined />}
            styles={{ content: { color: 'var(--accent-green)' } }}
          />
        </Card>
      </Col>
    </Row>
  );
}
