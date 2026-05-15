/**
 * ECharts Renderer — converts ChartConfig + ChartData into ECharts options.
 * Includes Power BI–style types (column, clustered, 100% stacked, combo, matrix, etc.).
 */
import type { ChartConfig, ChartData } from '../types';

const COLORS = [
  '#818cf8', '#a78bfa', '#c084fc', '#f472b6', '#fb7185',
  '#f97316', '#facc15', '#34d399', '#22d3ee', '#60a5fa',
  '#e879f9', '#f43f5e', '#14b8a6', '#8b5cf6', '#06b6d4',
];

/** Power BI and common BI aliases → internal builders */
const TYPE_ALIASES: Record<string, string> = {
  clustered_column: 'bar',
  column: 'bar',
  stacked_column: 'stacked_bar',
  '100_stacked_column': 'percent_stacked_bar',
  '100_stacked_bar': 'percent_stacked_bar',
  percent_stacked_column: 'percent_stacked_bar',
  line_and_column: 'combo',
  line_clustered_column: 'combo',
  data_table: 'table',
  matrix: 'heatmap',
  filled_map: 'map',
  shape_map: 'map',
  ribbon_chart: 'ribbon',
  area_chart: 'area',
  line_chart: 'line',
  pie_chart: 'pie',
  donut_chart: 'donut',
  scatter_chart: 'scatter',
  waterfall_chart: 'waterfall',
  funnel_chart: 'funnel',
  treemap_chart: 'treemap',
  gauge_chart: 'gauge',
  radar_chart: 'radar',
};

export function buildEChartsOption(chart: ChartConfig, data?: ChartData): Record<string, any> {
  if (!data || !data.categories) return buildPlaceholderOption(chart);

  const raw = chart.type.toLowerCase().replace(/\s+/g, '_');
  const type = TYPE_ALIASES[raw] || raw;
  const builders: Record<string, () => Record<string, any>> = {
    line: () => buildLine(chart, data),
    area: () => buildArea(chart, data),
    stacked_area: () => buildStackedArea(chart, data),
    ribbon: () => buildRibbon(chart, data),
    bar: () => buildBar(chart, data, false),
    horizontal_bar: () => buildBar(chart, data, true),
    stacked_bar: () => buildStackedBar(chart, data, false),
    percent_stacked_bar: () => buildPercentStackedBar(chart, data, false),
    combo: () => buildCombo(chart, data),
    pareto: () => buildPareto(chart, data),
    pie: () => buildPie(chart, data),
    donut: () => buildPie(chart, data, true),
    scatter: () => buildScatter(chart, data),
    bubble: () => buildScatter(chart, data, true),
    heatmap: () => buildHeatmap(chart, data),
    histogram: () => buildHistogram(chart, data),
    box: () => buildBox(chart, data),
    waterfall: () => buildWaterfall(chart, data),
    funnel: () => buildFunnel(chart, data),
    treemap: () => buildTreemap(chart, data),
    sunburst: () => buildSunburst(chart, data),
    sankey: () => buildSankey(chart, data),
    gauge: () => buildGauge(chart, data),
    radar: () => buildRadar(chart, data),
    candlestick: () => buildCandlestick(chart, data),
    map: () => buildThematicMap(chart, data),
    table: () => buildTableChart(chart, data),
  };

  const builder = builders[type] || builders['bar'];
  return applyChartStyle(builder(), chart);
}

function paletteForChart(chart: ChartConfig): string[] {
  const cfg = chart.config || {};
  if (Array.isArray(cfg.colors) && cfg.colors.length) return cfg.colors;
  if (cfg.primaryColor) return [cfg.primaryColor, ...COLORS.filter(c => c !== cfg.primaryColor)];
  return COLORS;
}

function applyChartStyle(opt: Record<string, any>, chart: ChartConfig): Record<string, any> {
  const cfg = chart.config || {};
  const colors = paletteForChart(chart);
  opt.color = colors;

  // Background
  if (cfg.background === 'solid' && cfg.cardBgColor) {
    opt.backgroundColor = cfg.cardBgColor;
  } else {
    opt.backgroundColor = 'transparent';
  }

  // Animation & Tooltips
  opt.animation = cfg.animations !== false;
  if (cfg.tooltips === false) {
    opt.tooltip = { show: false };
  }

  const fs = cfg.axisFontSize ?? cfg.fontSize;
  if (typeof fs === 'number' && fs > 0) {
    opt.textStyle = { ...opt.textStyle, fontSize: fs };
    const axStyle = { fontSize: fs, color: opt.textStyle?.color || '#94a3b8' };
    if (opt.xAxis && !Array.isArray(opt.xAxis)) {
      opt.xAxis = { ...opt.xAxis, axisLabel: { ...opt.xAxis.axisLabel, ...axStyle } };
    } else if (Array.isArray(opt.xAxis)) {
      opt.xAxis = opt.xAxis.map((a: any) => ({ ...a, axisLabel: { ...a.axisLabel, ...axStyle } }));
    }
    if (opt.yAxis && !Array.isArray(opt.yAxis)) {
      opt.yAxis = { ...opt.yAxis, axisLabel: { ...opt.yAxis.axisLabel, ...axStyle } };
    } else if (Array.isArray(opt.yAxis)) {
      opt.yAxis = opt.yAxis.map((a: any) => ({ ...a, axisLabel: { ...a.axisLabel, ...axStyle } }));
    }
    if (opt.legend) opt.legend = { ...opt.legend, textStyle: { ...opt.legend.textStyle, fontSize: fs - 1 } };
  }

  // Labels
  if (cfg.showLabels) {
    if (opt.series && Array.isArray(opt.series)) {
      opt.series = opt.series.map((s: any) => ({
        ...s,
        label: { show: true, position: s.type === 'bar' ? (chart.type.includes('horizontal') ? 'right' : 'top') : 'top', color: '#fff', fontSize: (fs || 11) - 2 }
      }));
    }
  }

  // Cross-filtering selection highlighting
  const activeFilter = chart.config?.activeFilterValue;
  if (activeFilter && opt.series && Array.isArray(opt.series)) {
    opt.series = opt.series.map((s: any) => {
      if (s.type === 'bar' || s.type === 'line' || s.type === 'pie') {
        const data = Array.isArray(s.data) ? s.data : [];
        return {
          ...s,
          data: data.map((item: any) => {
            const val = typeof item === 'object' && item !== null ? (item.name || item.value) : item;
            // Note: This logic depends on the chart type. For simple charts, categories index matches data index.
            // But ECharts often uses name in params.
            return item; // Simplified for now, real implementation would need category mapping
          }),
          itemStyle: {
            ...s.itemStyle,
            // Add emphasis for selection
          },
          emphasis: {
            focus: 'self',
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0,0,0,0.3)'
            }
          }
        };
      }
      return s;
    });
  }

  const lw = cfg.lineWidth;
  if (typeof lw === 'number' && opt.series && Array.isArray(opt.series)) {
    opt.series = opt.series.map((s: any) => {
      if (s.type === 'line') return { ...s, lineStyle: { ...s.lineStyle, width: lw } };
      return s;
    });
  }

  const bmw = cfg.barMaxWidth;
  if (typeof bmw === 'number' && opt.series && Array.isArray(opt.series)) {
    opt.series = opt.series.map((s: any) =>
      s.type === 'bar' ? { ...s, barMaxWidth: bmw } : s
    );
  }

  const donutInner = cfg.donutInnerRadius;
  if (typeof donutInner === 'string' && opt.series?.[0]?.type === 'pie') {
    opt.series[0].radius = [donutInner, '75%'];
  }

  return opt;
}

function baseOption(chart: ChartConfig): Record<string, any> {
  return {
    backgroundColor: 'transparent',
    textStyle: { color: '#e2e8f0', fontFamily: 'Inter, sans-serif' },
    title: { show: false },
    tooltip: { 
      show: true,
      trigger: 'axis', 
      backgroundColor: 'rgba(15,23,42,0.95)', 
      borderColor: 'rgba(255,255,255,0.1)', 
      textStyle: { color: '#e2e8f0' },
      padding: [10, 15],
      borderRadius: 12,
      shadowBlur: 20,
      shadowColor: 'rgba(0,0,0,0.5)'
    },
    legend: { show: true, textStyle: { color: '#94a3b8' }, bottom: 0, type: 'scroll' },
    grid: { top: 40, right: 20, bottom: 40, left: 50, containLabel: true },
    color: COLORS,
    animationDuration: 1200,
    animationEasing: 'elasticOut',
  };
}

function buildLine(chart: ChartConfig, data: ChartData): Record<string, any> {
  const pal = paletteForChart(chart);
  const opt = baseOption(chart);
  opt.xAxis = { type: 'category', data: data.categories, axisLine: { lineStyle: { color: '#334155' } }, axisLabel: { color: '#94a3b8', rotate: data.categories.length > 10 ? 30 : 0 } };
  opt.yAxis = { type: 'value', splitLine: { lineStyle: { color: '#1e293b' } }, axisLabel: { color: '#94a3b8' } };
  opt.series = Object.entries(data.series).map(([name, values], i) => ({
    name, type: 'line', data: values, smooth: true, lineStyle: { width: 3 }, itemStyle: { color: pal[i % pal.length] }, symbol: 'circle', symbolSize: 6,
  }));
  return opt;
}

function buildArea(chart: ChartConfig, data: ChartData): Record<string, any> {
  const pal = paletteForChart(chart);
  const opt = buildLine(chart, data);
  opt.series = opt.series.map((s: any, i: number) => ({
    ...s,
    areaStyle: {
      color: {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: pal[i % pal.length] + '40' },
          { offset: 1, color: pal[i % pal.length] + '05' },
        ],
      },
    },
  }));
  return opt;
}

function buildStackedArea(chart: ChartConfig, data: ChartData): Record<string, any> {
  const pal = paletteForChart(chart);
  const opt = baseOption(chart);
  opt.xAxis = { type: 'category', data: data.categories, axisLine: { lineStyle: { color: '#334155' } }, axisLabel: { color: '#94a3b8', rotate: data.categories.length > 10 ? 30 : 0 } };
  opt.yAxis = { type: 'value', splitLine: { lineStyle: { color: '#1e293b' } }, axisLabel: { color: '#94a3b8' } };
  opt.series = Object.entries(data.series).map(([name, values], i) => ({
    name,
    type: 'line',
    data: values,
    smooth: true,
    stack: 'sa',
    lineStyle: { width: 0 },
    symbol: 'none',
    areaStyle: {
      color: {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: pal[i % pal.length] + 'cc' },
          { offset: 1, color: pal[i % pal.length] + '18' },
        ],
      },
    },
  }));
  return opt;
}

function buildRibbon(chart: ChartConfig, data: ChartData): Record<string, any> {
  const opt = buildStackedArea(chart, data);
  const pal = paletteForChart(chart);
  opt.series = opt.series.map((s: any, i: number) => ({
    ...s,
    lineStyle: { width: 2, color: pal[i % pal.length] },
    symbol: 'circle',
    symbolSize: 3,
  }));
  return opt;
}

function buildBar(chart: ChartConfig, data: ChartData, horizontal: boolean): Record<string, any> {
  const pal = paletteForChart(chart);
  const opt = baseOption(chart);
  const catAxis = { type: 'category' as const, data: data.categories, axisLine: { lineStyle: { color: '#334155' } }, axisLabel: { color: '#94a3b8', rotate: !horizontal && data.categories.length > 8 ? 30 : 0 } };
  const valAxis = { type: 'value' as const, splitLine: { lineStyle: { color: '#1e293b' } }, axisLabel: { color: '#94a3b8' } };
  opt.xAxis = horizontal ? valAxis : catAxis;
  opt.yAxis = horizontal ? catAxis : valAxis;
  opt.series = Object.entries(data.series).map(([name, values], i) => ({
    name,
    type: 'bar',
    data: values,
    barMaxWidth: 40,
    itemStyle: { borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0], color: pal[i % pal.length] },
  }));
  return opt;
}

function buildStackedBar(chart: ChartConfig, data: ChartData, pct: boolean): Record<string, any> {
  const opt = buildBar(chart, data, false);
  opt.series = opt.series.map((s: any) => ({ ...s, stack: 'total' }));
  return opt;
}

function buildPercentStackedBar(chart: ChartConfig, data: ChartData, horizontal: boolean): Record<string, any> {
  const entries = Object.entries(data.series);
  const n = data.categories.length;
  const normalized: Record<string, number[]> = {};
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (const [, vals] of entries) sum += Math.abs(vals[i] || 0);
    if (sum === 0) sum = 1;
    for (const [name, vals] of entries) {
      if (!normalized[name]) normalized[name] = [];
      normalized[name].push(Math.round(((vals[i] || 0) / sum) * 10000) / 100);
    }
  }
  const nd: ChartData = { categories: data.categories, series: normalized, total_rows: data.total_rows };
  const opt = buildBar(chart, nd, horizontal);
  opt.series = opt.series.map((s: any) => ({ ...s, stack: 'total' }));
  if (!horizontal) {
    opt.yAxis = { ...opt.yAxis, max: 100, axisLabel: { ...opt.yAxis.axisLabel, formatter: '{value} %' } };
  } else {
    opt.xAxis = { ...opt.xAxis, max: 100, axisLabel: { ...opt.xAxis.axisLabel, formatter: '{value} %' } };
  }
  return opt;
}

function buildCombo(chart: ChartConfig, data: ChartData): Record<string, any> {
  const opt = baseOption(chart);
  const keys = Object.keys(data.series);
  opt.xAxis = { type: 'category', data: data.categories, axisLine: { lineStyle: { color: '#334155' } }, axisLabel: { color: '#94a3b8', rotate: data.categories.length > 8 ? 30 : 0 } };
  opt.yAxis = [
    { type: 'value', splitLine: { lineStyle: { color: '#1e293b' } }, axisLabel: { color: '#94a3b8' } },
    { type: 'value', splitLine: { show: false }, axisLabel: { color: '#94a3b8' } },
  ];
  const series: any[] = [];
  keys.forEach((name, i) => {
    const vals = data.series[name];
    if (i === 0) {
      series.push({ name, type: 'bar', data: vals, yAxisIndex: 0, barMaxWidth: 36 });
    } else {
      series.push({ name, type: 'line', data: vals, yAxisIndex: 1, smooth: true, lineStyle: { width: 3 } });
    }
  });
  if (keys.length === 1) {
    series.push({ name: 'Trend', type: 'line', data: data.series[keys[0]], yAxisIndex: 1, smooth: true, lineStyle: { width: 3 } });
  }
  opt.series = series;
  opt.tooltip = { trigger: 'axis', backgroundColor: 'rgba(15,23,42,0.95)', borderColor: 'rgba(255,255,255,0.1)', textStyle: { color: '#e2e8f0' } };
  return opt;
}

function buildPareto(chart: ChartConfig, data: ChartData): Record<string, any> {
  const firstKey = Object.keys(data.series)[0];
  const vals = data.series[firstKey] || [];
  const pairs = data.categories.map((c, i) => ({ c, v: vals[i] || 0 }));
  pairs.sort((a, b) => b.v - a.v);
  const sortedCats = pairs.map(p => p.c);
  const sortedVals = pairs.map(p => p.v);
  let cum = 0;
  const total = sortedVals.reduce((a, b) => a + b, 0) || 1;
  const cumulative = sortedVals.map(v => {
    cum += v;
    return Math.round((cum / total) * 10000) / 100;
  });
  const opt = baseOption(chart);
  opt.legend = { ...opt.legend, data: [firstKey || 'Measure', 'Cumulative %'] };
  opt.xAxis = { type: 'category', data: sortedCats, axisLabel: { color: '#94a3b8', rotate: sortedCats.length > 8 ? 30 : 0 } };
  opt.yAxis = [
    { type: 'value', splitLine: { lineStyle: { color: '#1e293b' } }, axisLabel: { color: '#94a3b8' } },
    { type: 'value', max: 100, splitLine: { show: false }, axisLabel: { color: '#94a3b8', formatter: '{value}%' } },
  ];
  opt.series = [
    { name: firstKey || 'Measure', type: 'bar', data: sortedVals, yAxisIndex: 0, barMaxWidth: 40 },
    { name: 'Cumulative %', type: 'line', data: cumulative, yAxisIndex: 1, smooth: false, lineStyle: { width: 3 } },
  ];
  return opt;
}

function buildThematicMap(chart: ChartConfig, data: ChartData): Record<string, any> {
  const pal = paletteForChart(chart);
  const vals = Object.values(data.series)[0] || [];
  const opt = buildBar(chart, data, true);
  if (opt.series[0]) {
    opt.series[0].data = data.categories.map((_, i) => ({
      value: vals[i] || 0,
      itemStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: pal[i % pal.length] + 'aa' },
            { offset: 1, color: pal[(i + 1) % pal.length] },
          ],
        },
      },
    }));
  }
  return opt;
}

function buildTableChart(_chart: ChartConfig, _data: ChartData): Record<string, any> {
  return { backgroundColor: 'transparent', title: { show: false } };
}

function buildPie(chart: ChartConfig, data: ChartData, isDonut = false): Record<string, any> {
  const opt = baseOption(chart);
  delete opt.grid; delete opt.xAxis; delete opt.yAxis;
  opt.tooltip = { trigger: 'item', backgroundColor: 'rgba(15,23,42,0.95)', borderColor: 'rgba(255,255,255,0.1)', textStyle: { color: '#e2e8f0' } };
  const firstSeries = Object.values(data.series)[0] || [];
  opt.series = [{
    type: 'pie', radius: isDonut ? ['45%', '75%'] : '70%', center: ['50%', '45%'],
    data: data.categories.map((name, i) => ({ name, value: firstSeries[i] || 0 })),
    label: { color: '#94a3b8', fontSize: 11 }, itemStyle: { borderRadius: 6, borderColor: '#0f172a', borderWidth: 2 },
    emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' } },
  }];
  return opt;
}

function buildScatter(chart: ChartConfig, data: ChartData, isBubble = false): Record<string, any> {
  const opt = baseOption(chart);
  opt.xAxis = { type: 'value', splitLine: { lineStyle: { color: '#1e293b' } }, axisLabel: { color: '#94a3b8' } };
  opt.yAxis = { type: 'value', splitLine: { lineStyle: { color: '#1e293b' } }, axisLabel: { color: '#94a3b8' } };
  const keys = Object.keys(data.series);
  const xVals = data.series[keys[0]] || [];
  const yVals = data.series[keys[1]] || data.series[keys[0]] || [];
  opt.series = [{ type: 'scatter', data: xVals.map((x, i) => [x, yVals[i] || 0]), symbolSize: isBubble ? (v: any) => Math.max(8, Math.min(40, Math.abs(v[1]) / 10)) : 10, itemStyle: { color: paletteForChart(chart)[0] } }];
  return opt;
}

function buildHeatmap(chart: ChartConfig, data: ChartData): Record<string, any> {
  const opt = baseOption(chart);
  const keys = Object.keys(data.series);
  const vals = data.series[keys[0]] || [];
  const heatData = data.categories.map((cat, i) => [i, 0, vals[i] || 0]);
  opt.xAxis = { type: 'category', data: data.categories, axisLabel: { color: '#94a3b8', rotate: 30 } };
  opt.yAxis = { type: 'category', data: [keys[0] || 'Value'], axisLabel: { color: '#94a3b8' } };
  opt.visualMap = { min: Math.min(...vals), max: Math.max(...vals), calculable: true, orient: 'horizontal', left: 'center', bottom: 0, inRange: { color: ['#312e81', '#4338ca', '#818cf8', '#c084fc', '#f472b6'] }, textStyle: { color: '#94a3b8' } };
  opt.series = [{ type: 'heatmap', data: heatData, label: { show: true, color: '#fff' } }];
  return opt;
}

function buildHistogram(chart: ChartConfig, data: ChartData): Record<string, any> {
  return buildBar(chart, data, false);
}

function buildBox(chart: ChartConfig, data: ChartData): Record<string, any> {
  const opt = baseOption(chart);
  opt.xAxis = { type: 'category', data: data.categories, axisLabel: { color: '#94a3b8' } };
  opt.yAxis = { type: 'value', splitLine: { lineStyle: { color: '#1e293b' } }, axisLabel: { color: '#94a3b8' } };
  const vals = Object.values(data.series)[0] || [];
  const p0 = paletteForChart(chart)[0];
  opt.series = [{ type: 'boxplot', data: [vals], itemStyle: { borderColor: p0, color: p0 + '30' } }];
  return opt;
}

function buildWaterfall(chart: ChartConfig, data: ChartData): Record<string, any> {
  const opt = baseOption(chart);
  const vals = Object.values(data.series)[0] || [];
  let cumulative = 0;
  const invisibleData: number[] = [];
  const visibleData: number[] = [];
  vals.forEach(v => { invisibleData.push(v >= 0 ? cumulative : cumulative + v); visibleData.push(Math.abs(v)); cumulative += v; });
  opt.xAxis = { type: 'category', data: data.categories, axisLabel: { color: '#94a3b8', rotate: 30 } };
  opt.yAxis = { type: 'value', splitLine: { lineStyle: { color: '#1e293b' } }, axisLabel: { color: '#94a3b8' } };
  opt.series = [
    { type: 'bar', stack: 'w', data: invisibleData, itemStyle: { color: 'transparent' }, emphasis: { itemStyle: { color: 'transparent' } } },
    { type: 'bar', stack: 'w', data: visibleData.map((v, i) => ({ value: v, itemStyle: { color: vals[i] >= 0 ? '#34d399' : '#f43f5e', borderRadius: [4, 4, 0, 0] } })) },
  ];
  return opt;
}

function buildFunnel(chart: ChartConfig, data: ChartData): Record<string, any> {
  const opt = baseOption(chart);
  delete opt.grid;
  opt.tooltip = { trigger: 'item', backgroundColor: 'rgba(15,23,42,0.95)', borderColor: 'rgba(255,255,255,0.1)', textStyle: { color: '#e2e8f0' } };
  const vals = Object.values(data.series)[0] || [];
  opt.series = [{ type: 'funnel', left: '10%', width: '80%', data: data.categories.map((name, i) => ({ name, value: vals[i] || 0 })), label: { color: '#e2e8f0' }, itemStyle: { borderColor: '#0f172a', borderWidth: 2 } }];
  return opt;
}

function buildTreemap(chart: ChartConfig, data: ChartData): Record<string, any> {
  const opt = baseOption(chart);
  delete opt.grid;
  const vals = Object.values(data.series)[0] || [];
  opt.series = [{ type: 'treemap', data: data.categories.map((name, i) => ({ name, value: vals[i] || 0 })), label: { color: '#fff', fontSize: 12 }, breadcrumb: { show: false } }];
  return opt;
}

function buildSunburst(chart: ChartConfig, data: ChartData): Record<string, any> {
  const opt = baseOption(chart);
  delete opt.grid;
  const vals = Object.values(data.series)[0] || [];
  opt.series = [{ type: 'sunburst', radius: ['15%', '80%'], data: data.categories.map((name, i) => ({ name, value: vals[i] || 0 })), label: { color: '#e2e8f0', fontSize: 10 } }];
  return opt;
}

function buildSankey(chart: ChartConfig, data: ChartData): Record<string, any> {
  const opt = baseOption(chart);
  delete opt.grid;
  const vals = Object.values(data.series)[0] || [];
  const nodes = data.categories.map(name => ({ name }));
  const links = data.categories.slice(0, -1).map((src, i) => ({ source: src, target: data.categories[i + 1], value: vals[i] || 1 }));
  opt.series = [{ type: 'sankey', data: nodes, links, emphasis: { focus: 'adjacency' }, lineStyle: { color: 'gradient', curveness: 0.5 }, label: { color: '#e2e8f0' } }];
  return opt;
}

function buildGauge(chart: ChartConfig, data: ChartData): Record<string, any> {
  const opt = baseOption(chart);
  delete opt.grid;
  const vals = Object.values(data.series)[0] || [];
  const val = vals.length > 0 ? vals[0] : 50;
  opt.series = [{ type: 'gauge', progress: { show: true, width: 12 }, axisLine: { lineStyle: { width: 12, color: [[0.3, '#f43f5e'], [0.7, '#facc15'], [1, '#34d399']] } }, detail: { fontSize: 24, color: '#e2e8f0', formatter: '{value}' }, data: [{ value: val, name: chart.title }], title: { color: '#94a3b8' } }];
  return opt;
}

function buildRadar(chart: ChartConfig, data: ChartData): Record<string, any> {
  const opt = baseOption(chart);
  delete opt.grid;
  const vals = Object.values(data.series)[0] || [];
  const maxVal = Math.max(...vals, 1);
  opt.radar = { indicator: data.categories.map(name => ({ name, max: maxVal })), axisName: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1e293b' } }, splitArea: { areaStyle: { color: ['transparent'] } } };
  const p0 = paletteForChart(chart)[0];
  opt.series = [{ type: 'radar', data: [{ value: vals, name: Object.keys(data.series)[0] || 'Data', areaStyle: { color: p0 + '30' }, lineStyle: { color: p0 } }] }];
  return opt;
}

function buildCandlestick(chart: ChartConfig, data: ChartData): Record<string, any> {
  const opt = baseOption(chart);
  opt.xAxis = { type: 'category', data: data.categories, axisLabel: { color: '#94a3b8' } };
  opt.yAxis = { type: 'value', splitLine: { lineStyle: { color: '#1e293b' } }, axisLabel: { color: '#94a3b8' } };
  const vals = Object.values(data.series)[0] || [];
  opt.series = [{ type: 'candlestick', data: vals.map(v => [v, v * 1.1, v * 0.95, v * 1.05]), itemStyle: { color: '#34d399', color0: '#f43f5e', borderColor: '#34d399', borderColor0: '#f43f5e' } }];
  return opt;
}

function buildPlaceholderOption(chart: ChartConfig): Record<string, any> {
  return {
    backgroundColor: 'transparent',
    graphic: { type: 'text', left: 'center', top: 'center', style: { text: `Loading ${chart.title}...`, fill: '#64748b', fontSize: 14, fontFamily: 'Inter' } },
  };
}

export function resolveChartType(type: string): string {
  const raw = type.toLowerCase().replace(/\s+/g, '_');
  return TYPE_ALIASES[raw] || raw;
}

export function isTableChartType(type: string): boolean {
  return resolveChartType(type) === 'table';
}
