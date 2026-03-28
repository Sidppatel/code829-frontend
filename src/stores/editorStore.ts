import { create } from 'zustand';

// ─── Store state ──────────────────────────────────────────────────────────────

interface EditorState {
  selectedIds: string[];
  showGrid: boolean;
  snapToGrid: boolean;

  // Actions
  select: (id: string) => void;
  multiSelect: (id: string) => void;
  clearSelection: () => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useEditorStore = create<EditorState>((set) => ({
  selectedIds: [],
  showGrid: true,
  snapToGrid: true,

  select: (id) => set({ selectedIds: [id] }),

  multiSelect: (id) =>
    set((state) => {
      if (state.selectedIds.includes(id)) {
        return { selectedIds: state.selectedIds.filter((sid) => sid !== id) };
      }
      return { selectedIds: [...state.selectedIds, id] };
    }),

  clearSelection: () => set({ selectedIds: [] }),

  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),

  toggleSnap: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
}));
