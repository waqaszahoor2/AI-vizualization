import React from 'react';
import type { KPIConfig } from '../types';

interface Props {
  kpis: KPIConfig[];
}

function formatValue(value: string | number, format: string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);

  switch (format) {
    case 'currency':
      return num >= 1_000_000 ? `$${(num / 1_000_000).toFixed(1)}M`
           : num >= 1_000 ? `$${(num / 1_000).toFixed(1)}K`
           : `$${num.toLocaleString()}`;
    case 'percentage':
      return `${num.toFixed(1)}%`;
    default:
      return num >= 1_000_000 ? `${(num / 1_000_000).toFixed(1)}M`
           : num >= 1_000 ? `${(num / 1_000).toFixed(1)}K`
           : num.toLocaleString();
  }
}

const ICONS: Record<string, string> = {
  currency: '💰',
  percentage: '📈',
  number: '📊',
};

export default function KPICards({ kpis }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {kpis.map((kpi, i) => (
        <div
          key={i}
          className="kpi-card group"
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 dark:text-white/40 uppercase tracking-wider">
              {kpi.label}
            </span>
            <span className="text-lg opacity-60 group-hover:opacity-100 transition-opacity">
              {ICONS[kpi.format] || '📊'}
            </span>
          </div>
          <div className="text-2xl font-bold gradient-text">
            {formatValue(kpi.value, kpi.format)}
          </div>
          {kpi.change !== undefined && (
            <div className={`text-xs font-medium ${(kpi.change || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {(kpi.change || 0) >= 0 ? '↑' : '↓'} {Math.abs(kpi.change || 0).toFixed(1)}%
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
