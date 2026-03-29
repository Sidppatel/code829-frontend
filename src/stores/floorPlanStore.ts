import { create } from 'zustand';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TableShape = 'Round' | 'Rectangle' | 'Square' | 'Cocktail';
export type PriceType = 'PerTable' | 'PerSeat';

export interface FloorPlanElement {
  id: string;
  label: string;
  capacity: number;
  shape: TableShape;
  color?: string;
  section?: string;
  priceType: PriceType;
  priceCents: number;
  priceOverrideCents?: number;
  isActive: boolean;
  gridRow?: number;
  gridCol?: number;
  sortOrder: number;
  tableTypeId?: string;
  tableTypeName?: string;
}

// API response shape for a single table from GET /admin/events/{id}/layout
interface ApiTable {
  id: string;
  label: string;
  capacity: number;
  shape: TableShape;
  color?: string;
  section?: string;
  priceType: PriceType;
  priceCents: number;
  priceOverrideCents?: number;
  isActive: boolean;
  gridRow?: number;
  gridCol?: number;
  sortOrder: number;
  tableTypeId?: string;
  tableTypeName?: string;
}

export interface ApiLayoutResponse {
  eventId: string;
  editorMode: 'grid';
  gridRows: number;
  gridCols: number;
  tables: ApiTable[];
}

// ─── Store state ──────────────────────────────────────────────────────────────

interface FloorPlanState {
  elements: Record<string, FloorPlanElement>;
  elementOrder: string[];
  gridDimensions: { rows: number; cols: number } | null;
  editorMode: 'grid';
  isDirty: boolean;

  // Actions
  addElement: (element: FloorPlanElement) => void;
  updateElement: (id: string, patch: Partial<FloorPlanElement>) => void;
  deleteElement: (id: string) => void;
  moveElement: (id: string, gridRow: number, gridCol: number) => void;
  loadFromApi: (response: ApiLayoutResponse) => void;
  setGridDimensions: (rows: number, cols: number) => void;
  markClean: () => void;
  clearAll: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useFloorPlanStore = create<FloorPlanState>((set) => ({
  elements: {},
  elementOrder: [],
  gridDimensions: null,
  editorMode: 'grid',
  isDirty: false,

  addElement: (element) =>
    set((state) => ({
      elements: { ...state.elements, [element.id]: element },
      elementOrder: [...state.elementOrder, element.id],
      isDirty: true,
    })),

  updateElement: (id, patch) =>
    set((state) => {
      if (!state.elements[id]) return state;
      return {
        elements: {
          ...state.elements,
          [id]: { ...state.elements[id], ...patch },
        },
        isDirty: true,
      };
    }),

  deleteElement: (id) =>
    set((state) => {
      const next = { ...state.elements };
      delete next[id];
      return {
        elements: next,
        elementOrder: state.elementOrder.filter((eid) => eid !== id),
        isDirty: true,
      };
    }),

  moveElement: (id, gridRow, gridCol) =>
    set((state) => {
      if (!state.elements[id]) return state;
      return {
        elements: {
          ...state.elements,
          [id]: { ...state.elements[id], gridRow, gridCol },
        },
        isDirty: true,
      };
    }),

  loadFromApi: (response) => {
    const elements: Record<string, FloorPlanElement> = {};
    const elementOrder: string[] = [];
    for (const t of response.tables) {
      elements[t.id] = {
        id: t.id,
        label: t.label,
        capacity: t.capacity,
        shape: t.shape,
        color: t.color,
        section: t.section,
        priceType: t.priceType,
        priceCents: t.priceCents,
        priceOverrideCents: t.priceOverrideCents,
        isActive: t.isActive,
        gridRow: t.gridRow,
        gridCol: t.gridCol,
        sortOrder: t.sortOrder,
        tableTypeId: t.tableTypeId,
        tableTypeName: t.tableTypeName,
      };
      elementOrder.push(t.id);
    }
    set({
      elements,
      elementOrder,
      gridDimensions: { rows: response.gridRows, cols: response.gridCols },
      editorMode: response.editorMode,
      isDirty: false,
    });
  },

  setGridDimensions: (rows, cols) =>
    set({ gridDimensions: { rows, cols }, isDirty: true }),


  markClean: () => set({ isDirty: false }),

  clearAll: () =>
    set({
      elements: {},
      elementOrder: [],
      isDirty: true,
    }),
}));
