import { Card, Row, Col, Statistic } from 'antd';
import { TableOutlined, TeamOutlined, DollarOutlined } from '@ant-design/icons';
import type { LayoutStatsResponse } from '../../../../types/layout';
import { centsToUSD } from '../../../../utils/currency';

interface LayoutStatsBarProps {
  stats: LayoutStatsResponse | null;
  loading: boolean;
}

export default function LayoutStatsBar({ stats, loading }: LayoutStatsBarProps) {
  return (
    <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
      <Col xs={8}>
        <Card size="small" loading={loading}>
          <Statistic
            title="Total Tables"
            value={stats?.totalTables ?? 0}
            prefix={<TableOutlined />}
            styles={{ content: { color: 'var(--accent-violet)' } }}
          />
        </Card>
      </Col>
      <Col xs={8}>
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
      <Col xs={8}>
        <Card size="small" loading={loading}>
          <Statistic
            title="Potential Revenue"
            value={centsToUSD(stats?.totalPotentialRevenueCents ?? 0)}
            prefix={<DollarOutlined />}
            styles={{ content: { color: 'var(--accent-green)' } }}
          />
        </Card>
      </Col>
    </Row>
  );
}
