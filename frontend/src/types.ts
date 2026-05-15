/** Shared TypeScript types for the AI Dashboard Platform */

export interface ColumnInfo {
  name: string;
  dtype: string;
  null_count: number;
  unique_count: number;
  is_numeric: boolean;
  is_datetime: boolean;
  is_categorical: boolean;
  min_value?: any;
  max_value?: any;
  mean?: number;
  median?: number;
  std?: number;
  top_values?: Record<string, number>;
}

export interface DatasetProfile {
  rows_count: number;
  columns_count: number;
  columns_info: ColumnInfo[];
  memory_usage_mb: number;
  missing_values: Record<string, number>;
  duplicates: number;
}

export interface UploadResponse {
  success: boolean;
  dataset_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  metadata: DatasetProfile;
  sample_data: Record<string, any>[];
}

export interface KPIConfig {
  label: string;
  value: string | number;
  format: 'currency' | 'percentage' | 'number';
  change?: number;
  change_type?: 'up' | 'down' | 'neutral';
  icon?: string;
}

export interface ChartConfig {
  id: string;
  type: string;
  title: string;
  description?: string;
  x_axis?: string;
  y_axis?: string[];
  aggregation?: string;
  config?: Record<string, any>;
  filters?: Record<string, any>;
}

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export interface Dashboard {
  id: string;
  title: string;
  description?: string;
  summary?: string;
  prompt?: string;
  file_path?: string;
  dataset_id: string;
  insights: string[];
  kpis: KPIConfig[];
  charts: ChartConfig[];
  layout: (LayoutItem | string)[];
  theme?: string;
  version: number;
  share_token?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChartData {
  categories: string[];
  series: Record<string, number[]>;
  total_rows: number;
}

export interface DashboardTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface PresetPrompt {
  id: number;
  title: string;
  prompt: string;
}

/** Power BI–style slicer filter sent to /chart-data */
export interface DashboardDataFilter {
  column: string;
  operator: '==' | '!=' | 'in' | 'contains' | '>' | '<' | '>=' | '<=';
  value: unknown;
}

export interface CustomPromptEntry {
  id: string;
  title: string;
  prompt: string;
}
