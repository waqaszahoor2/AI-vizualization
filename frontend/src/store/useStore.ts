import { create } from 'zustand';
import type { Dashboard, UploadResponse, ChartConfig, KPIConfig, LayoutItem, DashboardDataFilter } from '../types';

interface AppState {
  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Upload
  uploadData: UploadResponse | null;
  setUploadData: (data: UploadResponse | null) => void;

  // Dashboard
  dashboard: Dashboard | null;
  setDashboard: (d: Dashboard | null) => void;
  updateChart: (chartId: string, updates: Partial<ChartConfig>) => void;
  removeChart: (chartId: string) => void;
  addChart: (chart: ChartConfig) => void;
  updateKPI: (index: number, updates: Partial<KPIConfig>) => void;
  setLayout: (layout: LayoutItem[]) => void;

  /** Global dataset filters (slicers) applied to all charts */
  dashboardFilters: DashboardDataFilter[];
  setDashboardFilters: (filters: DashboardDataFilter[]) => void;

  // Generation state
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;
  generationStep: string;
  setGenerationStep: (s: string) => void;

  // Dashboard history
  dashboardHistory: Dashboard[];
  addToHistory: (d: Dashboard) => void;

  // UI state
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  selectedChartId: string | null;
  setSelectedChartId: (id: string | null) => void;
}

export const useStore = create<AppState>((set, get) => ({
  theme: 'dark',
  toggleTheme: () => set(s => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

  uploadData: null,
  setUploadData: (data) => set({ uploadData: data }),

  dashboard: null,
  setDashboard: (d) => set({ dashboard: d }),
  updateChart: (chartId, updates) => set(s => {
    if (!s.dashboard) return {};
    return {
      dashboard: {
        ...s.dashboard,
        charts: s.dashboard.charts.map(c => c.id === chartId ? { ...c, ...updates } : c),
      },
    };
  }),
  removeChart: (chartId) => set(s => {
    if (!s.dashboard) return {};
    return {
      dashboard: {
        ...s.dashboard,
        charts: s.dashboard.charts.filter(c => c.id !== chartId),
      },
    };
  }),
  addChart: (chart) => set(s => {
    if (!s.dashboard) return {};
    return {
      dashboard: {
        ...s.dashboard,
        charts: [...s.dashboard.charts, chart],
      },
    };
  }),
  updateKPI: (index, updates) => set(s => {
    if (!s.dashboard) return {};
    const kpis = [...s.dashboard.kpis];
    kpis[index] = { ...kpis[index], ...updates };
    return { dashboard: { ...s.dashboard, kpis } };
  }),
  setLayout: (layout) => set(s => {
    if (!s.dashboard) return {};
    return { dashboard: { ...s.dashboard, layout } };
  }),

  dashboardFilters: [],
  setDashboardFilters: (dashboardFilters) => set({ dashboardFilters }),

  isGenerating: false,
  setIsGenerating: (v) => set({ isGenerating: v }),
  generationStep: '',
  setGenerationStep: (s) => set({ generationStep: s }),

  dashboardHistory: [],
  addToHistory: (d) => set(s => ({
    dashboardHistory: [d, ...s.dashboardHistory.slice(0, 19)],
  })),

  sidebarOpen: false,
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  selectedChartId: null,
  setSelectedChartId: (id) => set({ selectedChartId: id }),
}));
