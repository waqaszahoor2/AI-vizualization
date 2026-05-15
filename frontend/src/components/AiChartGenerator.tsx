import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiCpu, FiX, FiActivity } from 'react-icons/fi';
import { generateDashboard } from '../services/api';
import { useStore } from '../store/useStore';

interface Props {
  onClose: () => void;
}

export default function AiChartGenerator({ onClose }: Props) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { dashboard, addChart } = useStore();

  const handleGenerate = async () => {
    if (!prompt.trim() || !dashboard?.file_path) return;

    try {
      setIsGenerating(true);
      const result = await generateDashboard(
        dashboard.file_path, 
        `Create ONLY ONE chart: ${prompt}`
      );
      
      const newChart = result.dashboard.charts[0];
      if (newChart) {
        // Ensure unique ID
        newChart.id = `chart_${Date.now()}`;
        addChart(newChart);
        toast.success('New chart added to dashboard!');
        onClose();
      } else {
        toast.error('AI could not generate a chart for this prompt.');
      }
    } catch (err) {
      toast.error('Failed to generate chart');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-surface-950/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-card w-full max-w-xl p-8 shadow-2xl border-white/10 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-500/10 rounded-full blur-[80px]" />
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <FiX size={20} />
        </button>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-400">
              <FiCpu size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Add Chart via AI</h2>
              <p className="text-white/40 text-sm">Describe the visualization you want to add.</p>
            </div>
          </div>

          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="e.g., Show me a line chart of monthly revenue trends compared to last year..."
            className="input-field w-full h-32 text-base resize-none mb-6"
            disabled={isGenerating}
            autoFocus
          />

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="btn-secondary flex-1 py-3"
              disabled={isGenerating}
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className={`btn-primary flex-[2] py-3 flex items-center justify-center gap-2 ${
                !prompt.trim() || isGenerating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  AI is thinking...
                </>
              ) : (
                <>
                  <FiPlus /> Add to Dashboard
                </>
              )}
            </button>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-brand-500/5 border border-brand-500/10 flex gap-3">
            <FiActivity className="text-brand-400 shrink-0 mt-0.5" />
            <p className="text-xs text-white/50 leading-relaxed">
              <strong>Tip:</strong> Be specific about columns and chart types for best results. 
              Example: "Bar chart of Quantity by Region with average aggregation."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
