import React, { useEffect, useState } from 'react';
import { getDatasetProfile } from '../services/api';
import { FiFilter, FiX, FiCheck } from 'react-icons/fi';
import type { ColumnInfo, DashboardDataFilter } from '../types';

interface Props {
  filePath?: string;
  filters: DashboardDataFilter[];
  onChange: (filters: DashboardDataFilter[]) => void;
}

export default function DashboardFilters({ filePath, filters, onChange }: Props) {
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!filePath) {
      setColumns([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getDatasetProfile(filePath)
      .then(profile => {
        if (!cancelled) {
          // Find categorical columns suitable for slicers
          const cat = (profile.columns_info || []).filter(
            c => c.is_categorical && !c.is_datetime && (c.top_values && Object.keys(c.top_values).length > 0 && Object.keys(c.top_values).length <= 15)
          );
          setColumns(cat.slice(0, 5)); // Limit to 5 slicers for clean UI
        }
      })
      .catch(() => {
        if (!cancelled) setColumns([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filePath]);

  const toggleSelection = (column: string, value: string) => {
    const existing = filters.find(f => f.column === column);
    const rest = filters.filter(f => f.column !== column);

    if (existing && Array.isArray(existing.value)) {
      const values = existing.value as string[];
      if (values.includes(value)) {
        const next = values.filter(v => v !== value);
        if (next.length === 0) {
          onChange(rest);
        } else {
          onChange([...rest, { column, operator: 'in', value: next }]);
        }
      } else {
        onChange([...rest, { column, operator: 'in', value: [...values, value] }]);
      }
    } else {
      onChange([...rest, { column, operator: 'in', value: [value] }]);
    }
  };

  const isSelected = (column: string, value: string) => {
    const f = filters.find(x => x.column === column);
    if (!f || !Array.isArray(f.value)) return false;
    return (f.value as string[]).includes(value);
  };

  if (!filePath || (columns.length === 0 && filters.length === 0)) return null;

  return (
    <div className="space-y-6">
      {/* Slicer Buttons Grid */}
      {columns.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {columns.map(col => {
            const options = Object.keys(col.top_values || {}).sort();
            return (
              <div key={col.name} className="glass-card p-4 border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-400">
                    {col.name}
                  </span>
                  {filters.some(f => f.column === col.name) && (
                    <button 
                      onClick={() => onChange(filters.filter(f => f.column !== col.name))}
                      className="text-[10px] text-white/20 hover:text-white"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {options.map(opt => {
                    const active = isSelected(col.name, opt);
                    return (
                      <button
                        key={opt}
                        onClick={() => toggleSelection(col.name, opt)}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                          active 
                            ? 'bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-500/20' 
                            : 'bg-white/[0.03] border-white/5 text-white/50 hover:bg-white/[0.08] hover:text-white'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Active Filters Bar (Cross-filtering feedback) */}
      {filters.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-brand-500/5 border border-brand-500/20 rounded-2xl animate-fade-in">
          <div className="flex items-center gap-2 px-3 border-r border-brand-500/20">
            <FiFilter className="text-brand-400" size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-400">Active Filters</span>
          </div>
          <div className="flex flex-wrap gap-2 flex-1">
            {filters.map((f, i) => (
              <div key={i} className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-medium group">
                <span className="text-white/30 uppercase">{f.column}:</span>
                <span className="text-white">
                  {Array.isArray(f.value) ? f.value.join(', ') : String(f.value)}
                </span>
                <button 
                  onClick={() => onChange(filters.filter((_, idx) => idx !== i))}
                  className="p-0.5 hover:bg-white/10 rounded transition-colors text-white/30 hover:text-red-400"
                >
                  <FiX size={10} />
                </button>
              </div>
            ))}
          </div>
          <button 
            onClick={() => onChange([])}
            className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white transition-colors"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}
