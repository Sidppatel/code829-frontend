import { LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { LayoutTable, EditorMode } from '@code829/shared/types/layout';
import { centsToUSD } from '@code829/shared/utils/currency';

interface TableElementProps {
  table: LayoutTable;
  editorMode: EditorMode;
  isLocked: boolean;
}

function gridLabel(gridRow: number, gridCol: number): string {
  const col = String.fromCharCode(65 + (gridCol % 26));
  return `${col}${gridRow + 1}`;
}

export default function TableElement({ table, editorMode, isLocked }: TableElementProps) {
  const status = table.status ?? 'Available';

  return (
    <>
      {status !== 'Available' && (
        <div
          className={`fp-table-badge${status === 'Booked' ? ' booked' : ' locked'}`}
          title={status === 'Booked' ? 'Booked' : 'Locked by user'}
        >
          {status === 'Booked' ? <CheckCircleOutlined /> : <LockOutlined />}
        </div>
      )}

      <div className="fp-table-label">{table.label || gridLabel(table.gridRow, table.gridCol)}</div>
      <div className="fp-table-meta">
        {table.capacity}p &middot; {centsToUSD(table.priceCents ?? 0)}
      </div>

      {editorMode === 'delete' && !isLocked && (
        <div className="fp-table-delete-overlay" aria-hidden />
      )}
    </>
  );
}
