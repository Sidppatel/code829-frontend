import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type LayoutMode = 'Grid' | 'Open' | 'None';

export interface WizardFormData {
  title: string;
  description: string;
  category: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  venueId: string;
  bannerImageUrl: string;
  layoutMode: LayoutMode | '';
  maxCapacity: string;
  platformFeePercent: string;
  pricePerPersonCents: string;
  isFeatured: boolean;
}

const DEFAULT_FORM_DATA: WizardFormData = {
  title: '',
  description: '',
  category: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  venueId: '',
  bannerImageUrl: '',
  layoutMode: '',
  maxCapacity: '',
  platformFeePercent: '',
  pricePerPersonCents: '',
  isFeatured: false,
};

interface EventWizardState {
  step: number;
  formData: WizardFormData;
  editingEventId: string | null;
  editingEventTitle: string | null;
  setStep: (step: number) => void;
  setFormData: (data: Partial<WizardFormData>) => void;
  setEditingEvent: (id: string, title: string) => void;
  reset: () => void;
}

export const useEventWizardStore = create<EventWizardState>()(
  persist(
    (set) => ({
      step: 1,
      formData: { ...DEFAULT_FORM_DATA },
      editingEventId: null,
      editingEventTitle: null,

      setStep: (step) => set({ step }),

      setFormData: (data) =>
        set((state) => ({
          formData: { ...state.formData, ...data },
        })),

      setEditingEvent: (id, title) =>
        set({ editingEventId: id, editingEventTitle: title }),

      reset: () =>
        set({
          step: 1,
          formData: { ...DEFAULT_FORM_DATA },
          editingEventId: null,
          editingEventTitle: null,
        }),
    }),
    {
      name: 'event-wizard',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
