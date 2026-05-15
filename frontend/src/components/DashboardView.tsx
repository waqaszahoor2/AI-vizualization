import React, { useState, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { Responsive, WidthProvider } from 'react-grid-layout';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { 
  FiArrowLeft, 
  FiDownload, 
  FiShare2, 
  FiCode, 
  FiEye, 
  FiPlus, 
  FiCpu, 
  FiMaximize,
  FiFileText,
  FiImage
} from 'react-icons/fi';
import { useStore } from '../store/useStore';
import KPICards from './KPICards';
import ChartWidget from './ChartWidget';
import ShareModal from './ShareModal';
import CodeModal from './CodeModal';
import ChatPanel from './ChatPanel';
import DashboardFilters from './DashboardFilters';
import ChartEditorSidebar from './ChartEditorSidebar';
import AiChartGenerator from './AiChartGenerator';
import type { Dashboard } from '../types';

// Required CSS for react-grid-layout
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface Props {
  onBack?: () => void;
  readOnly?: boolean;
}

export default function DashboardView({ onBack, readOnly }: Props) {
  const { 
    dashboard, 
    setLayout, 
    dashboardFilters, 
    setDashboardFilters, 
    selectedChartId, 
    setSelectedChartId 
  } = useStore();
  
  const [showShare, setShowShare] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showAiGen, setShowAiGen] = useState(false);
  const [previewAsViewer, setPreviewAsViewer] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  if (!dashboard) return null;

  const layout = useMemo(() => {
    if (!dashboard.layout) return [];
    return dashboard.layout.map((item, idx) => {
      if (typeof item === 'string') {
        if (item === 'kpi_row') return null;
        return { i: item, x: (idx % 2) * 6, y: Math.floor(idx / 2) * 4, w: 6, h: 4, minW: 3, minH: 3 };
      }
      return item;
    }).filter(Boolean) as any[];
  }, [dashboard.layout]);

  const onLayoutChange = (currentLayout: any[]) => {
    if (readOnly || previewAsViewer) return;
    if (JSON.stringify(currentLayout) !== JSON.stringify(layout)) {
      setLayout(currentLayout);
    }
  };

  const handleExport = async (format: 'pdf' | 'png') => {
    if (!dashboardRef.current) return;
    try {
      setIsExporting(true);
      toast.loading(`Preparing ${format.toUpperCase()} export...`, { id: 'export' });
      
      const canvas = await html2canvas(dashboardRef.current, {
        useCORS: true,
        backgroundColor: '#0f172a', // Match bg-surface-950
        scale: 2,
      });

      if (format === 'png') {
        const link = document.createElement('a');
        link.download = `${dashboard.title.replace(/\s+/g, '_')}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? 'l' : 'p',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${dashboard.title.replace(/\s+/g, '_')}.pdf`);
      }
      toast.success(`${format.toUpperCase()} exported successfully!`, { id: 'export' });
    } catch (err) {
      toast.error('Export failed', { id: 'export' });
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const allowEditing = !readOnly && !previewAsViewer;

  return (
    <div className={`min-h-screen transition-all duration-500 ${selectedChartId ? 'pr-80' : ''}`}>
      {/* Top Action Bar */}
      <div className="sticky top-0 z-30 bg-surface-900/80 backdrop-blur-md border-b border-white/5 py-3 px-6">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button 
                onClick={onBack} 
                className="p-2 hover:bg-white/5 rounded-xl text-white/50 hover:text-white transition-all"
              >
                <FiArrowLeft size={20} />
              </button>
            )}
            <div>
              <h1 className="text-xl font-bold tracking-tight">{dashboard.title}</h1>
              <div className="text-[9px] uppercase tracking-widest text-white/30 font-bold flex items-center gap-1.5 mt-0.5">
                <FiClock size={10} /> 
                Generated {new Date(dashboard.created_at).toLocaleDateString()} at {new Date(dashboard.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!readOnly && (
              <>
                <button
                  onClick={() => setShowAiGen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500/10 text-brand-400 hover:bg-brand-500 hover:text-white transition-all text-sm font-bold"
                >
                  <FiCpu /> Add via AI
                </button>
                <div className="h-6 w-px bg-white/10 mx-1" />
              </>
            )}

            <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/5">
              <button
                onClick={() => handleExport('png')}
                className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-all"
                title="Export as PNG"
              >
                <FiImage size={18} />
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-all"
                title="Export as PDF"
              >
                <FiFileText size={18} />
              </button>
            </div>

            <div className="h-6 w-px bg-white/10 mx-1" />

            <button
              onClick={() => setPreviewAsViewer(!previewAsViewer)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                previewAsViewer ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/50 hover:text-white'
              }`}
            >
              {previewAsViewer ? <FiMaximize /> : <FiEye />}
              {previewAsViewer ? 'Previewing' : 'Preview'}
            </button>

            {!previewAsViewer && !readOnly && (
              <>
                <button onClick={() => setShowCode(true)} className="p-2.5 hover:bg-white/5 rounded-xl text-white/50 hover:text-white transition-all" title="View Source">
                  <FiCode size={20} />
                </button>
                <button onClick={() => setShowShare(true)} className="p-2.5 hover:bg-white/5 rounded-xl text-white/50 hover:text-white transition-all" title="Share Dashboard">
                  <FiShare2 size={20} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div ref={dashboardRef} className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Insights Summary */}
        {dashboard.insights.length > 0 && (
          <div className="glass-card p-6 mb-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <FiCpu size={120} />
            </div>
            <h3 className="text-sm font-bold text-brand-400 uppercase tracking-widest mb-4">AI Intelligence Report</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboard.insights.map((insight, i) => (
                <div key={i} className="flex gap-3 text-sm text-white/60 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/5">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-2 shrink-0" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KPI Section */}
        {dashboard.kpis.length > 0 && <KPICards kpis={dashboard.kpis} />}

        {/* Global Filters */}
        {dashboard.file_path && (
          <div className="mb-8">
            <DashboardFilters
              filePath={dashboard.file_path}
              filters={dashboardFilters}
              onChange={setDashboardFilters}
            />
          </div>
        )}

        {/* Responsive Chart Grid */}
        <div className="relative">
          <ResponsiveGridLayout
            className="layout"
            layouts={{ lg: layout }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={100}
            draggableHandle=".chart-drag-handle"
            isDraggable={allowEditing}
            isResizable={allowEditing}
            onLayoutChange={onLayoutChange}
            margin={[24, 24]}
          >
            {dashboard.charts.map(chart => (
              <div 
                key={chart.id} 
                className={`relative group rounded-3xl transition-all duration-300 ${
                  selectedChartId === chart.id ? 'ring-2 ring-brand-500 shadow-2xl shadow-brand-500/20' : 'hover:ring-1 hover:ring-white/10'
                }`}
                onClick={(e) => {
                  if (allowEditing) {
                    e.stopPropagation();
                    setSelectedChartId(chart.id);
                  }
                }}
              >
                <div className="glass-card h-full p-4 overflow-hidden">
                  <ChartWidget
                    chart={chart}
                    filePath={dashboard.file_path}
                    readOnly={readOnly}
                    allowEditing={allowEditing}
                  />
                </div>
                
                {allowEditing && (
                  <div className="chart-drag-handle absolute top-4 right-4 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1.5 rounded-lg bg-white/10 text-white/40 hover:text-white transition-all z-10">
                    <FiMaximize size={14} />
                  </div>
                )}
              </div>
            ))}
          </ResponsiveGridLayout>

          {allowEditing && dashboard.charts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-white/5 rounded-3xl">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl mb-4">✨</div>
              <h3 className="text-lg font-bold mb-2">No charts yet</h3>
              <p className="text-white/30 text-sm mb-6">Use the AI generator or add a chart manually to get started.</p>
              <button 
                onClick={() => setShowAiGen(true)}
                className="btn-primary px-8 py-3"
              >
                Create First Chart
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals & Overlays */}
      {showShare && <ShareModal dashboardId={dashboard.id} onClose={() => setShowShare(false)} />}
      {showCode && <CodeModal onClose={() => setShowCode(false)} />}
      {showAiGen && <AiChartGenerator onClose={() => setShowAiGen(false)} />}
      <ChartEditorSidebar />

      {/* Floating Chat Panel */}
      {!readOnly && !previewAsViewer && dashboard.file_path && (
        <ChatPanel
          filePath={dashboard.file_path}
          dashboardId={dashboard.id}
        />
      )}
    </div>
  );
}
