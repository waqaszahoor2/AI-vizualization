import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { shareDashboard } from '../services/api';

interface Props {
  dashboardId: string;
  onClose: () => void;
}

export default function ShareModal({ dashboardId, onClose }: Props) {
  const [shareUrl, setShareUrl] = useState('');
  const [shareType, setShareType] = useState('public');
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    try {
      setLoading(true);
      const result = await shareDashboard(dashboardId, shareType);
      setShareUrl(result.share_url);
    } catch {
      toast.error('Failed to generate share link');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card p-8 w-full max-w-md mx-4 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Share Dashboard</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 text-xl">✕</button>
        </div>

        {/* Share type */}
        <div className="flex gap-3 mb-6">
          {[
            { id: 'public', label: '🌍 Public', desc: 'Anyone with the link can view' },
            { id: 'private', label: '🔒 Private', desc: 'Only invited users' },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setShareType(opt.id)}
              className={`flex-1 p-4 rounded-xl border text-left transition-all ${shareType === opt.id ? 'border-brand-500/50 bg-brand-500/10' : 'border-white/10 bg-white/[0.02] hover:border-white/20'}`}
            >
              <div className="text-sm font-medium">{opt.label}</div>
              <div className="text-xs text-white/40 mt-1">{opt.desc}</div>
            </button>
          ))}
        </div>

        {/* Generate button */}
        {!shareUrl && (
          <button
            onClick={handleShare}
            disabled={loading}
            className="btn-primary w-full py-3"
          >
            {loading ? 'Generating...' : 'Generate Share Link'}
          </button>
        )}

        {/* Share URL */}
        {shareUrl && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input value={shareUrl} readOnly className="input-field flex-1 text-sm font-mono" />
              <button onClick={copyLink} className="btn-primary py-2 px-4 text-sm">Copy</button>
            </div>

            {/* Export options */}
            <div>
              <p className="text-sm text-white/40 mb-3">Export as:</p>
              <div className="flex gap-2">
                {['JSON', 'PDF', 'PNG', 'Excel'].map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => toast.success(`${fmt} export started`)}
                    className="btn-secondary py-2 px-4 text-sm flex-1"
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
