import { create } from 'zustand';
import type { SeatHold, TableLock } from '../types/layout';

interface BookingState {
  holds: SeatHold[];
  lockedTables: TableLock[];
  setHolds: (holds: SeatHold[]) => void;
  addHold: (hold: SeatHold) => void;
  removeHold: (seatId: string) => void;
  clearHolds: () => void;
  setLockedTables: (tables: TableLock[]) => void;
  addLockedTable: (lock: TableLock) => void;
  removeLockedTable: (tableId: string) => void;
  clearLockedTables: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  holds: [],
  lockedTables: [],
  setHolds: (holds) => set({ holds }),
  addHold: (hold) => set((state) => ({ holds: [...state.holds, hold] })),
  removeHold: (seatId) =>
    set((state) => ({ holds: state.holds.filter((h) => h.seatId !== seatId) })),
  clearHolds: () => set({ holds: [] }),
  setLockedTables: (lockedTables) => set({ lockedTables }),
  addLockedTable: (lock) =>
    set((state) => ({ lockedTables: [...state.lockedTables, lock] })),
  removeLockedTable: (tableId) =>
    set((state) => ({ lockedTables: state.lockedTables.filter((t) => t.tableId !== tableId) })),
  clearLockedTables: () => set({ lockedTables: [] }),
}));
