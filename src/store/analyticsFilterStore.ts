import { create } from 'zustand';
import type { AnalyticsFilters } from '@/modules/analytics/types';

const dateInput = (date: Date) => date.toISOString().slice(0, 10);
function defaults(): AnalyticsFilters {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 29);
  return { fromDate: dateInput(from), toDate: dateInput(to), department: '', projectId: '', teamId: '', employeeId: '', status: '' };
}

interface State {
  filters: AnalyticsFilters;
  setFilter: <K extends keyof AnalyticsFilters>(key: K, value: AnalyticsFilters[K]) => void;
  setDatePreset: (days: number) => void;
  reset: () => void;
}

export const useAnalyticsFilterStore = create<State>((set) => ({
  filters: defaults(),
  setFilter: (key, value) => set((state) => ({ filters: { ...state.filters, [key]: value } })),
  setDatePreset: (days) => set((state) => {
    const to = new Date(); const from = new Date(to);
    from.setDate(from.getDate() - Math.max(days - 1, 0));
    return { filters: { ...state.filters, fromDate: dateInput(from), toDate: dateInput(to) } };
  }),
  reset: () => set({ filters: defaults() }),
}));
