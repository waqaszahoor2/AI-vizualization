import React, { useEffect, useState, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { FiFilter } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getChartData } from '../services/api';
import { buildEChartsOption, isTableChartType } from '../utils/chartBuilder';
import { useStore } from '../store/useStore';
import type { ChartConfig, ChartData } from '../types';

interface Props {
  chart: ChartConfig;
  filePath?: string;
  readOnly?: boolean;
  allowEditing?: boolean;
}

function generateAutoTitle(chart: ChartConfig): string {
  const capitalize = (s: string) =>
    s.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const xLabel = chart.x_axis ? capitalize(chart.x_axis) : '';
  const yLabels = (chart.y_axis || []).map(capitalize);
  const yJoined = yLabels.length > 2
    ? yLabels.slice(0, 2).join(', ') + ` +${yLabels.length - 2}`
    : yLabels.join(' & ');

  const type = chart.type?.toLowerCase() || 'bar';

  if (!xLabel && yLabels.length === 0) return 'Chart';

  switch (type) {
    case 'pie':
    case 'donut':
      if (xLabel && yJoined) return `${xLabel} Distribution (${yJoined})`;
      return xLabel ? `${xLabel} Distribution` : `${yJoined} Distribution`;
    case 'line':
    case 'area':
      if (yJoined && xLabel) return `${yJoined} over ${xLabel}`;
      return yJoined || xLabel || 'Trend';
    case 'scatter':
    case 'bubble':
      if (yJoined && xLabel) return `${xLabel} vs ${yJoined}`;
      return yJoined || xLabel || 'Correlation';
    default:
      if (yJoined && xLabel) return `${yJoined} by ${xLabel}`;
      return yJoined || xLabel || 'Chart';
  }
}

export default function ChartWidget({ chart, filePath, readOnly, allowEditing = true }: Props) {
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const { selectedChartId, setSelectedChartId, dashboardFilters, setDashboardFilters } = useStore();
  const chartRef = useRef<any>(null);

  const isSelected = selectedChartId === chart.id;
  const canEdit = !readOnly && allowEditing;

  const onChartClick = (params: any) => {
    if (readOnly || !chart.x_axis) return;
    
    // params.name usually contains the category (x-axis value)
    const clickedValue = params.name;
    if (!clickedValue) return;

    // Toggle filter logic
    const existing = dashboardFilters.find(f => f.column === chart.x_axis);
    
    if (existing && existing.value === clickedValue) {
      // If clicking same value, remove the filter
      setDashboardFilters(dashboardFilters.filter(f => f.column !== chart.x_axis));
      toast.success(`Cleared filter: ${chart.x_axis}`, { icon: '🧹', duration: 2000 });
    } else {
      // Add or update filter
      const newFilter = { column: chart.x_axis, value: clickedValue, operator: '==' as const };
      const otherFilters = dashboardFilters.filter(f => f.column !== chart.x_axis);
      setDashboardFilters([...otherFilters, newFilter]);
      toast.success(`Filtering by ${clickedValue}`, { icon: '🔍', duration: 2000 });
    }
  };

  const onEvents = {
    'click': onChartClick
  };

  const displayTitle = (() => {
    const genericTitles = ['Chart', 'New Chart', 'Data Distribution', '', 'undefined'];
    const hasGenericTitle = !chart.title || genericTitles.includes(chart.title);
    if (hasGenericTitle) return generateAutoTitle(chart);
    return chart.title;
  })();

  const filterKey = JSON.stringify(dashboardFilters);

  useEffect(() => {
    loadData();
  }, [chart.x_axis, chart.y_axis, chart.aggregation, filePath, filterKey]);

  useEffect(() => {
    if (!chartRef.current) return;
    const observer = new ResizeObserver(() => {
      const instance = chartRef.current.getEchartsInstance();
      instance.resize();
    });
    const element = document.getElementById(`chart-body-${chart.id}`);
    if (element) observer.observe(element);
    return () => observer.disconnect();
  }, [chart.id]);

  const loadData = async () => {
    if (!filePath || !chart.x_axis || !chart.y_axis?.length) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const result = await getChartData(
        filePath,
        chart.x_axis,
        chart.y_axis.join(','),
        chart.aggregation || 'sum',
        dashboardFilters.length ? dashboardFilters : undefined
      );
      setData(result);
    } catch (err) {
      console.error('Chart data load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const isTable = isTableChartType(chart.type);
  
  // Inject active filter value into chart config for builder to highlight
  const activeFilter = dashboardFilters.find(f => f.column === chart.x_axis);
  const chartWithFilterInfo = {
    ...chart,
    config: {
      ...chart.config,
      activeFilterValue: activeFilter?.value
    }
  };

  const option = !isTable ? buildEChartsOption(chartWithFilterInfo, data || undefined) : {};

  return (
    <div 
      className={`h-full flex flex-col transition-all duration-300 ${isSelected ? 'scale-[1.01]' : ''}`}
    >
      <div className="flex items-center justify-between mb-4 px-2 flex-shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white truncate" title={displayTitle}>
              {displayTitle}
            </h3>
            {activeFilter && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-brand-500/20 border border-brand-500/30 text-[9px] font-bold text-brand-400 animate-pulse">
                <FiFilter size={8} /> FILTERED
              </div>
            )}
          </div>
          {chart.description && (
            <p className="text-[10px] text-white/30 mt-0.5 truncate uppercase tracking-wider">{chart.description}</p>
          )}
        </div>
      </div>

      <div id={`chart-body-${chart.id}`} className="relative flex-1 min-h-0">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : isTable && data?.categories ? (
          <div className="h-full overflow-auto rounded-2xl border border-white/5 bg-white/[0.02]">
            <table className="w-full text-xs text-left text-white/80">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.04]">
                  <th className="p-3 font-bold text-brand-400 uppercase tracking-widest">{chart.x_axis || 'Category'}</th>
                  {Object.keys(data.series).map(k => (
                    <th key={k} className="p-3 font-bold text-brand-400 uppercase tracking-widest">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.categories.map((cat, i) => (
                  <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                    <td className="p-3 text-white/70 font-medium">{cat}</td>
                    {Object.keys(data.series).map(k => (
                      <td key={k} className="p-3 tabular-nums text-white/90">{data.series[k][i] ?? '—'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <ReactECharts
            ref={chartRef}
            option={option}
            onEvents={onEvents}
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'canvas' }}
            notMerge
            lazyUpdate
          />
        )}
      </div>

      <div className="flex items-center justify-between px-2 mt-4 flex-shrink-0 border-t border-white/5 pt-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest bg-brand-500/10 px-2 py-0.5 rounded-md">
            {chart.type.replace(/_/g, ' ')}
          </span>
          {data?.total_rows !== undefined && (
            <span className="text-[10px] text-white/20 font-medium">{data.total_rows.toLocaleString()} records</span>
          )}
        </div>
        
        {canEdit && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setSelectedChartId(chart.id);
            }}
            className="text-[10px] font-bold text-white/30 hover:text-white uppercase tracking-widest transition-colors"
          >
            Edit Format
          </button>
        )}
      </div>
    </div>
  );
}
