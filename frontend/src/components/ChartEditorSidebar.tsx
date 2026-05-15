import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { 
  FiX, 
  FiType, 
  FiDroplet, 
  FiSettings, 
  FiTrash2, 
  FiCopy,
  FiChevronDown,
  FiChevronUp,
  FiDatabase,
  FiActivity
} from 'react-icons/fi';

const CHART_TYPES = [
  { id: 'bar', label: 'Bar Chart' },
  { id: 'line', label: 'Line Chart' },
  { id: 'area', label: 'Area Chart' },
  { id: 'pie', label: 'Pie Chart' },
  { id: 'donut', label: 'Donut Chart' },
  { id: 'scatter', label: 'Scatter Plot' },
  { id: 'heatmap', label: 'Heatmap' },
  { id: 'gauge', label: 'Gauge' },
  { id: 'radar', label: 'Radar' },
  { id: 'funnel', label: 'Funnel' },
  { id: 'treemap', label: 'Treemap' },
  { id: 'sankey', label: 'Sankey' },
];

const AGGREGATIONS = [
  { id: 'sum', label: 'Sum' },
  { id: 'avg', label: 'Average' },
  { id: 'count', label: 'Count' },
  { id: 'min', label: 'Minimum' },
  { id: 'max', label: 'Maximum' },
];

export default function ChartEditorSidebar() {
  const { dashboard, selectedChartId, setSelectedChartId, updateChart, removeChart } = useStore();
  const [activeTab, setActiveTab] = useState<'data' | 'style' | 'advanced'>('data');
  const [expandedSection, setExpandedSection] = useState<string | null>('general');

  const chart = dashboard?.charts.find(c => c.id === selectedChartId);

  if (!chart || !selectedChartId) return null;

  const config = chart.config || {};

  const handleUpdate = (updates: any) => {
    updateChart(selectedChartId, updates);
  };

  const handleConfigUpdate = (updates: any) => {
    updateChart(selectedChartId, { config: { ...config, ...updates } });
  };

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const Section = ({ id, title, icon: Icon, children }: any) => (
    <div className="border-b border-white/5 last:border-0">
      <button 
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="text-brand-400" size={16} />
          <span className="text-sm font-medium">{title}</span>
        </div>
        {expandedSection === id ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
      </button>
      {expandedSection === id && (
        <div className="p-4 pt-0 space-y-4 animate-slide-down">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed right-0 top-16 bottom-0 w-80 bg-surface-900 border-l border-white/10 shadow-2xl z-40 flex flex-col animate-slide-left">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-surface-800/50">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <FiSettings className="text-brand-400" /> Format Chart
        </h2>
        <button 
          onClick={() => setSelectedChartId(null)}
          className="p-1 hover:bg-white/10 rounded-full transition-colors"
        >
          <FiX size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-white/5 m-4 rounded-xl">
        {(['data', 'style', 'advanced'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === tab ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'text-white/40 hover:text-white/60'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'data' && (
          <>
            <Section id="general" title="General Info" icon={FiType}>
              <div className="space-y-3">
                <label className="block">
                  <span className="text-[10px] uppercase font-bold text-white/30 mb-1.5 block">Title</span>
                  <input 
                    type="text" 
                    value={chart.title || ''} 
                    onChange={e => handleUpdate({ title: e.target.value })}
                    className="input-field w-full text-sm"
                    placeholder="Enter chart title..."
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] uppercase font-bold text-white/30 mb-1.5 block">Description</span>
                  <textarea 
                    value={chart.description || ''} 
                    onChange={e => handleUpdate({ description: e.target.value })}
                    className="input-field w-full text-sm h-20 resize-none"
                    placeholder="Brief summary..."
                  />
                </label>
              </div>
            </Section>

            <Section id="source" title="Data Mapping" icon={FiDatabase}>
              <div className="space-y-3">
                <label className="block">
                  <span className="text-[10px] uppercase font-bold text-white/30 mb-1.5 block">Visualization Type</span>
                  <select 
                    value={chart.type} 
                    onChange={e => handleUpdate({ type: e.target.value })}
                    className="input-field w-full text-sm bg-surface-800"
                  >
                    {CHART_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[10px] uppercase font-bold text-white/30 mb-1.5 block">Aggregation</span>
                  <select 
                    value={chart.aggregation || 'sum'} 
                    onChange={e => handleUpdate({ aggregation: e.target.value })}
                    className="input-field w-full text-sm bg-surface-800"
                  >
                    {AGGREGATIONS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </label>
              </div>
            </Section>
          </>
        )}

        {activeTab === 'style' && (
          <>
            <Section id="colors" title="Colors & Background" icon={FiDroplet}>
              <div className="space-y-4">
                <label className="block">
                  <span className="text-[10px] uppercase font-bold text-white/30 mb-1.5 block">Primary Color</span>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={config.primaryColor || '#818cf8'} 
                      onChange={e => handleConfigUpdate({ primaryColor: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-white/10"
                    />
                    <input 
                      type="text" 
                      value={config.primaryColor || '#818cf8'} 
                      onChange={e => handleConfigUpdate({ primaryColor: e.target.value })}
                      className="input-field flex-1 text-sm font-mono"
                    />
                  </div>
                </label>
                
                <label className="block">
                  <span className="text-[10px] uppercase font-bold text-white/30 mb-1.5 block">Background Style</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleConfigUpdate({ background: 'transparent' })}
                      className={`flex-1 py-2 text-xs rounded-lg border ${!config.background || config.background === 'transparent' ? 'border-brand-500 bg-brand-500/10 text-brand-300' : 'border-white/10 text-white/40'}`}
                    >
                      Glass
                    </button>
                    <button 
                      onClick={() => handleConfigUpdate({ background: 'solid' })}
                      className={`flex-1 py-2 text-xs rounded-lg border ${config.background === 'solid' ? 'border-brand-500 bg-brand-500/10 text-brand-300' : 'border-white/10 text-white/40'}`}
                    >
                      Solid
                    </button>
                  </div>
                </label>

                {config.background === 'solid' && (
                  <label className="block">
                    <span className="text-[10px] uppercase font-bold text-white/30 mb-1.5 block">Card Background</span>
                    <input 
                      type="color" 
                      value={config.cardBgColor || '#1e293b'} 
                      onChange={e => handleConfigUpdate({ cardBgColor: e.target.value })}
                      className="w-full h-8 rounded-lg cursor-pointer bg-transparent border border-white/10"
                    />
                  </label>
                )}
              </div>
            </Section>

            <Section id="typography" title="Typography" icon={FiType}>
              <div className="space-y-4">
                <label className="block">
                  <span className="text-[10px] uppercase font-bold text-white/30 mb-1.5 block">Axis Font Size ({config.axisFontSize || 11}px)</span>
                  <input 
                    type="range" 
                    min="8" max="24" 
                    value={config.axisFontSize || 11} 
                    onChange={e => handleConfigUpdate({ axisFontSize: Number(e.target.value) })}
                    className="w-full accent-brand-500"
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] uppercase font-bold text-white/30 mb-1.5 block">Show Labels</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={config.showLabels !== false} 
                      onChange={e => handleConfigUpdate({ showLabels: e.target.checked })}
                      className="w-4 h-4 rounded border-white/10 bg-surface-800 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="text-xs text-white/60">Display data values on chart</span>
                  </div>
                </label>
              </div>
            </Section>
          </>
        )}

        {activeTab === 'advanced' && (
          <>
            <Section id="interactions" title="Interactions" icon={FiActivity}>
              <div className="space-y-4">
                <label className="block">
                  <span className="text-[10px] uppercase font-bold text-white/30 mb-1.5 block">Animations</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={config.animations !== false} 
                      onChange={e => handleConfigUpdate({ animations: e.target.checked })}
                      className="w-4 h-4 rounded border-white/10 bg-surface-800 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="text-xs text-white/60">Enable entry animations</span>
                  </div>
                </label>
                <label className="block">
                  <span className="text-[10px] uppercase font-bold text-white/30 mb-1.5 block">Tooltips</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={config.tooltips !== false} 
                      onChange={e => handleConfigUpdate({ tooltips: e.target.checked })}
                      className="w-4 h-4 rounded border-white/10 bg-surface-800 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="text-xs text-white/60">Show info on hover</span>
                  </div>
                </label>
              </div>
            </Section>

            <div className="p-4 space-y-3">
              <button 
                onClick={() => {
                  const newId = `chart_${Date.now()}`;
                  updateChart(newId, { ...chart, id: newId });
                  // This is a simplified clone, would need better logic in store
                }}
                className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
              >
                <FiCopy size={14} /> Duplicate Chart
              </button>
              <button 
                onClick={() => {
                  removeChart(selectedChartId);
                  setSelectedChartId(null);
                }}
                className="w-full py-3 px-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm font-medium text-red-400 flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors"
              >
                <FiTrash2 size={14} /> Delete Chart
              </button>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 bg-surface-800/50 border-t border-white/10">
        <button 
          onClick={() => setSelectedChartId(null)}
          className="btn-primary w-full py-3"
        >
          Close Editor
        </button>
      </div>
    </div>
  );
}
