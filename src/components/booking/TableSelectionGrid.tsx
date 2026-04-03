import { Tooltip, theme } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import type { EventTableDto } from '../../types/event';
import { centsToUSD } from '../../utils/currency';

interface Props {
  tables: EventTableDto[];
  gridRows: number;
  gridCols: number;
  onSelectTable: (table: EventTableDto) => void;
}

function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return hex;
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function TableSelectionGrid({ tables, gridRows, gridCols, onSelectTable }: Props) {
  const { token } = theme.useToken();

  const grid: (EventTableDto | null)[][] = Array.from({ length: gridRows }, () =>
    Array.from({ length: gridCols }, () => null),
  );

  for (const t of tables) {
    if (t.gridRow != null && t.gridCol != null && t.gridRow < gridRows && t.gridCol < gridCols) {
      grid[t.gridRow][t.gridCol] = t;
    }
  }

  const getStatusClass = (status: string): string => {
    switch (status) {
      case 'Booked': return 'booked';
      case 'Held': return 'held';
      case 'HeldByYou': return 'held';
      default: return 'available';
    }
  };

  const getTooltip = (t: EventTableDto): string => {
    const price = centsToUSD(t.priceCents);
    switch (t.status) {
      case 'Booked': return `${t.label} — Booked`;
      case 'Held': return `${t.label} — Reserved by another user`;
      case 'HeldByYou': return `${t.label} — Reserved by you`;
      default: return `${t.label} — ${t.capacity} seats — ${price} — Click to select`;
    }
  };

  return (
    <div className="seating-grid-container" style={{ maxWidth: gridCols * 80 }}>
      <div
        className="seating-grid"
        style={{
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          gridTemplateRows: `repeat(${gridRows}, 1fr)`,
        }}
      >
        {grid.flat().map((t, idx) => {
          if (!t) {
            return <div key={idx} className="seat-cell empty" />;
          }

          const isClickable = t.status === 'Available';
          const cellStyle: React.CSSProperties = { cursor: isClickable ? 'pointer' : 'not-allowed' };

          if (t.color) {
            const alpha = t.status === 'Available' ? 0.3 : t.status === 'Booked' ? 0.15 : 0.2;
            cellStyle.background = hexToRgba(t.color, alpha);
            cellStyle.borderColor = t.color;
          }

          if (t.isLockedByYou) {
            cellStyle.borderColor = token.colorPrimary;
            cellStyle.boxShadow = `0 0 0 2px ${token.colorPrimaryBg}`;
          }

          return (
            <Tooltip key={t.id} title={getTooltip(t)} mouseEnterDelay={0.3}>
              <div
                className={`seat-cell ${getStatusClass(t.status)}${t.isLockedByYou ? ' selected' : ''}`}
                style={cellStyle}
                onClick={() => isClickable && onSelectTable(t)}
              >
                <span className="seat-cell-label">{t.label}</span>
                <span className="seat-cell-cap">x{t.capacity}</span>
                {(t.status === 'Booked' || t.status === 'Held') && (
                  <LockOutlined style={{ fontSize: 10, opacity: 0.6 }} />
                )}
              </div>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
