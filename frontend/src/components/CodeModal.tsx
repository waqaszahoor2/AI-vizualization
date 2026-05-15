import React, { useState } from 'react';
import { useStore } from '../store/useStore';

interface Props {
  onClose: () => void;
}

export default function CodeModal({ onClose }: Props) {
  const { dashboard } = useStore();
  const [copied, setCopied] = useState(false);

  if (!dashboard) return null;

  // Create a clean version of the dashboard without some internal fields
  const displayData = {
    title: dashboard.title,
    summary: dashboard.summary,
    insights: dashboard.insights,
    kpis: dashboard.kpis,
    charts: dashboard.charts,
    layout: dashboard.layout
  };

  const code = JSON.stringify(displayData, null, 2);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="glass-card w-full max-w-4xl max-h-[90vh] flex flex-col relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-surface-900">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-brand-400">&lt;/&gt;</span> Dashboard Source Code
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white">✕</button>
        </div>
        
        <div className="flex-1 overflow-auto bg-[#1e1e1e] p-4 text-sm font-mono relative group">
          <button 
            onClick={copyToClipboard}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-all text-xs border border-white/10 backdrop-blur"
          >
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
          <pre className="text-green-400">
            <code>{code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
