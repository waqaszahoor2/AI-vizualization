import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSharedDashboard } from '../services/api';
import DashboardView from '../components/DashboardView';
import { useStore } from '../store/useStore';
import type { Dashboard } from '../types';

export default function SharedPage() {
  const { token } = useParams<{ token: string }>();
  const { setDashboard, setDashboardFilters } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setDashboardFilters([]);
  }, [token, setDashboardFilters]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const dash = await getSharedDashboard(token);
        setDashboard(dash);
      } catch {
        setError('Dashboard not found or access denied');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold mb-2">{error}</h2>
          <p className="text-white/40">The link may have expired or the dashboard may be private.</p>
        </div>
      </div>
    );
  }

  return <DashboardView readOnly />;
}
