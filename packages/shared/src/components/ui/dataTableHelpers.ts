import type { ColumnsType } from 'antd/es/table';

export function defineColumns<T>(cols: ColumnsType<T>): ColumnsType<T> {
  return cols;
}
