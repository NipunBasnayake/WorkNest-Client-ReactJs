import { create } from 'zustand';
import type { AnalyticsFilters } from '@/modules/analytics/types';

const dateInput = (date: Date) => date.toISOString().slice(0, 10);
function defaults(): AnalyticsFilters {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 29);
  return { fromDate: dateInput(from), toDate: dateInput(to), department: '', projectId: '', teamId: '', employeeId: '', status: '', recruitmentStatus: '', attendancePeriod: 'daily', leaveType: '' };
}

interface State {
  filters: AnalyticsFilters;
  setFilter: <K extends keyof AnalyticsFilters>(key: K, value: AnalyticsFilters[K]) => void;
  setDatePreset: (days: number) => void;
  setNamedPreset: (preset: 'today' | 'week' | 'month' | 'quarter' | 'year') => void;
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
  setNamedPreset: (preset) => set((state) => {
    const to = new Date(); const from = new Date(to);
    if (preset === 'today') from.setTime(to.getTime());
    if (preset === 'week') from.setDate(to.getDate() - 6);
    if (preset === 'month') from.setDate(1);
    if (preset === 'quarter') from.setMonth(Math.floor(to.getMonth() / 3) * 3, 1);
    if (preset === 'year') from.setMonth(0, 1);
    return { filters: { ...state.filters, fromDate: dateInput(from), toDate: dateInput(to) } };
  }),
  reset: () => set({ filters: defaults() }),
}));
