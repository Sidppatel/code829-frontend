import { create } from 'zustand';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TableShape = 'Round' | 'Rectangle' | 'Square' | 'Cocktail';

export interface FloorPlanElement {
  id: string;
  label: string;
  capacity: number;
  shape: TableShape;
  color?: string;
  priceCents: number;
  isActive: boolean;
  posX: number;
  posY: number;
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
  priceCents: number;
  isActive: boolean;
  posX: number;
  posY: number;
  sortOrder: number;
  tableTypeId?: string;
  tableTypeName?: string;
}

export interface ApiLayoutResponse {
  eventId: string;
  tables: ApiTable[];
}

// ─── Store state ──────────────────────────────────────────────────────────────

interface FloorPlanState {
  elements: Record<string, FloorPlanElement>;
  elementOrder: string[];
  isDirty: boolean;

  // Actions
  addElement: (element: FloorPlanElement) => void;
  updateElement: (id: string, patch: Partial<FloorPlanElement>) => void;
  deleteElement: (id: string) => void;
  moveElement: (id: string, posX: number, posY: number) => void;
  loadFromApi: (response: ApiLayoutResponse) => void;
  markClean: () => void;
  clearAll: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useFloorPlanStore = create<FloorPlanState>((set) => ({
  elements: {},
  elementOrder: [],
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

  moveElement: (id, posX, posY) =>
    set((state) => {
      if (!state.elements[id]) return state;
      return {
        elements: {
          ...state.elements,
          [id]: { ...state.elements[id], posX, posY },
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
        priceCents: t.priceCents,
        isActive: t.isActive,
        posX: t.posX,
        posY: t.posY,
        sortOrder: t.sortOrder,
        tableTypeId: t.tableTypeId,
        tableTypeName: t.tableTypeName,
      };
      elementOrder.push(t.id);
    }
    set({
      elements,
      elementOrder,
      isDirty: false,
    });
  },

  markClean: () => set({ isDirty: false }),

  clearAll: () =>
    set({
      elements: {},
      elementOrder: [],
      isDirty: true,
    }),
}));
