import { create } from 'zustand';
import type { SeatHold } from '../types/layout';

interface BookingState {
  holds: SeatHold[];
  setHolds: (holds: SeatHold[]) => void;
  addHold: (hold: SeatHold) => void;
  removeHold: (seatId: string) => void;
  clearHolds: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  holds: [],
  setHolds: (holds) => set({ holds }),
  addHold: (hold) => set((state) => ({ holds: [...state.holds, hold] })),
  removeHold: (seatId) =>
    set((state) => ({ holds: state.holds.filter((h) => h.seatId !== seatId) })),
  clearHolds: () => set({ holds: [] }),
}));
