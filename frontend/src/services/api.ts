import axios from 'axios';
import type { UploadResponse, Dashboard, ChartData, DashboardTemplate, PresetPrompt, DashboardDataFilter, DatasetProfile } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 300000, // 5 min for AI generation
});

// ── Upload ──────────────────────────────────────────────

export async function uploadFile(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post('/upload/file', form);
  return data;
}

export async function listDatasets() {
  const { data } = await api.get('/upload/datasets');
  return data.datasets;
}

// ── Dashboard ───────────────────────────────────────────

export async function generateDashboard(filePath: string, prompt: string, title?: string): Promise<{ dashboard: Dashboard }> {
  const { data } = await api.post('/dashboards/generate', {
    file_path: filePath,
    prompt,
    title,
  });
  return data;
}

export async function generateDashboardFromImage(
  filePath: string,
  imageBase64: string,
  prompt = '',
  title?: string
): Promise<{ dashboard: Dashboard }> {
  const { data } = await api.post('/dashboards/generate-from-image', {
    file_path: filePath,
    image_base64: imageBase64,
    prompt,
    title,
  });
  return data;
}

export async function getDatasetProfile(filePath: string): Promise<DatasetProfile> {
  const { data } = await api.get('/dashboards/dataset-profile', {
    params: { file_path: filePath },
  });
  return data.profile;
}

export async function getChartData(
  filePath: string,
  xAxis: string,
  yAxis: string,
  aggregation = 'sum',
  filters?: DashboardDataFilter[]
): Promise<ChartData> {
  const params: Record<string, string> = {
    file_path: filePath,
    x_axis: xAxis,
    y_axis: yAxis,
    aggregation,
  };
  if (filters && filters.length > 0) {
    params.filters = JSON.stringify(filters);
  }
  const { data } = await api.get('/dashboards/chart-data', { params });
  return data.data;
}

export async function listDashboards(): Promise<Dashboard[]> {
  const { data } = await api.get('/dashboards/');
  return data.items;
}

export async function getDashboard(id: string): Promise<Dashboard> {
  const { data } = await api.get(`/dashboards/${id}`);
  return data.dashboard;
}

export async function updateDashboard(id: string, updates: Partial<Dashboard>): Promise<Dashboard> {
  const { data } = await api.put(`/dashboards/${id}`, updates);
  return data.dashboard;
}

export async function deleteDashboard(id: string) {
  await api.delete(`/dashboards/${id}`);
}

export async function shareDashboard(id: string, shareType = 'public') {
  const { data } = await api.post(`/dashboards/${id}/share`, null, { params: { share_type: shareType } });
  return data;
}

export async function getSharedDashboard(token: string): Promise<Dashboard> {
  const { data } = await api.get(`/dashboards/shared/${token}`);
  return data.dashboard;
}

export async function exportDashboard(id: string, format: string) {
  const { data } = await api.post(`/dashboards/${id}/export`, null, { params: { format } });
  return data;
}

// ── Templates & Prompts ─────────────────────────────────

export async function getTemplates(): Promise<DashboardTemplate[]> {
  const { data } = await api.get('/dashboards/templates');
  return data.templates;
}

export async function getPresetPrompts(): Promise<PresetPrompt[]> {
  const { data } = await api.get('/dashboards/preset-prompts');
  return data.prompts;
}

// ── AI ──────────────────────────────────────────────────

export async function aiHealth() {
  const { data } = await api.get('/ai/health');
  return data;
}

// ── Dashboard Chat ──────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  actions?: any[];
  timestamp?: string;
}

export async function chatWithDashboard(
  message: string,
  filePath: string,
  dashboardId?: string,
  currentCharts?: any[],
  currentKpis?: any[],
  history?: ChatMessage[],
  model?: string
): Promise<{ reply: string; actions: any[] }> {
  const { data } = await api.post('/chat/message', {
    message,
    file_path: filePath,
    dashboard_id: dashboardId,
    current_charts: currentCharts,
    current_kpis: currentKpis,
    history: history?.map(h => ({ role: h.role, content: h.content })),
    model: model || undefined,
  });
  return data;
}

export async function getChatSuggestions(filePath: string): Promise<string[]> {
  const { data } = await api.get('/chat/suggestions', { params: { file_path: filePath } });
  return data.suggestions;
}

export async function getChatModels(): Promise<{ models: string[]; default: string; status: string }> {
  const { data } = await api.get('/chat/models');
  return data;
}

export async function setKimiKey(key: string): Promise<{ success: boolean; message: string }> {
  const { data } = await api.post('/chat/set-kimi-key', { key });
  return data;
}
