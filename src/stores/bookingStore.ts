import { create } from 'zustand';
import type { TableLock } from '../types/layout';

interface BookingState {
  lockedTables: TableLock[];
  setLockedTables: (tables: TableLock[]) => void;
  addLockedTable: (lock: TableLock) => void;
  removeLockedTable: (tableId: string) => void;
  clearLockedTables: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  lockedTables: [],
  setLockedTables: (lockedTables) => set({ lockedTables }),
  addLockedTable: (lock) =>
    set((state) => ({ lockedTables: [...state.lockedTables, lock] })),
  removeLockedTable: (tableId) =>
    set((state) => ({ lockedTables: state.lockedTables.filter((t) => t.tableId !== tableId) })),
  clearLockedTables: () => set({ lockedTables: [] }),
}));
