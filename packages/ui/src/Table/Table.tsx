import React from 'react';
import './Table.css';

export interface TableColumn<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  accessor?: (row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string | number;
  empty?: React.ReactNode;
  loading?: boolean;
  onRowClick?: (row: T, index: number) => void;
  footer?: React.ReactNode;
  striped?: boolean;
  compact?: boolean;
}

export function Table<T>({
  columns,
  rows,
  rowKey,
  empty = 'No data',
  loading = false,
  onRowClick,
  footer,
  striped = false,
  compact = false,
}: TableProps<T>) {
  const classes = [
    'ui-table',
    striped ? 'ui-table--striped' : '',
    compact ? 'ui-table--compact' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="ui-table__wrapper">
      <table className={classes}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width, textAlign: col.align ?? 'left' }}
                className="ui-table__th"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="ui-table__state">
                Loading…
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="ui-table__state">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={rowKey(row, i)}
                className={onRowClick ? 'ui-table__tr--clickable' : undefined}
                onClick={onRowClick ? () => onRowClick(row, i) : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{ textAlign: col.align ?? 'left' }}
                    className="ui-table__td"
                  >
                    {col.render
                      ? col.render(row, i)
                      : col.accessor
                        ? col.accessor(row)
                        : (row as Record<string, React.ReactNode>)[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {footer && <div className="ui-table__footer">{footer}</div>}
    </div>
  );
}
