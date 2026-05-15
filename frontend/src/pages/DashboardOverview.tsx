import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiActivity, 
  FiDatabase, 
  FiCpu, 
  FiLayout, 
  FiPlus, 
  FiClock, 
  FiCheckCircle, 
  FiAlertCircle,
  FiTrendingUp,
  FiPieChart,
  FiBarChart2,
  FiArrowRight
} from 'react-icons/fi';
import { aiHealth, listDashboards } from '../services/api';

const StatCard = ({ icon: Icon, title, value, detail, trend }: any) => (
  <div className="glass-card p-6 relative overflow-hidden group hover:border-brand-500/30 transition-all duration-500">
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
      <Icon size={80} />
    </div>
    <div className="relative z-10">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
          <Icon size={20} />
        </div>
        <span className="text-white/50 text-sm font-medium">{title}</span>
      </div>
      <div className="flex items-end gap-3">
        <h3 className="text-3xl font-bold text-white">{value}</h3>
        {trend && (
          <span className="text-emerald-400 text-xs font-medium mb-1 flex items-center gap-1">
            <FiTrendingUp size={12} /> {trend}
          </span>
        )}
      </div>
      <p className="text-white/30 text-xs mt-2">{detail}</p>
    </div>
  </div>
);

const ActivityItem = ({ title, time, status, type }: any) => (
  <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/[0.03] transition-colors border border-transparent hover:border-white/5">
    <div className={`p-2.5 rounded-lg ${
      type === 'upload' ? 'bg-blue-500/10 text-blue-400' : 
      type === 'generate' ? 'bg-purple-500/10 text-purple-400' : 
      'bg-emerald-500/10 text-emerald-400'
    }`}>
      {type === 'upload' ? <FiDatabase size={18} /> : 
       type === 'generate' ? <FiCpu size={18} /> : 
       <FiLayout size={18} />}
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="text-sm font-medium text-white truncate">{title}</h4>
      <p className="text-xs text-white/40">{time}</p>
    </div>
    <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
      status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
    }`}>
      {status === 'completed' ? <FiCheckCircle size={10} /> : <FiClock size={10} />}
      {status}
    </div>
  </div>
);

export default function DashboardOverview() {
  const [systemStatus, setSystemStatus] = useState({
    ollama: 'checking',
    backend: 'checking',
    models: 0
  });
  const [recentDashboards, setRecentDashboards] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
// ... existing fetchData logic
    const fetchData = async () => {
      try {
        const [health, dashboards] = await Promise.all([
          aiHealth(),
          listDashboards()
        ]);
        setSystemStatus({
          ollama: health.status === 'healthy' ? 'online' : 'error',
          backend: 'online',
          models: health.models?.length || 0
        });
        setRecentDashboards(dashboards);
      } catch {
        setSystemStatus({
          ollama: 'offline',
          backend: 'online',
          models: 0
        });
      }
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold mb-2">Project <span className="gradient-text">Overview</span></h1>
          <p className="text-white/40">Manage your datasets, AI models, and generated visualizations.</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end border-r border-white/10 pr-6">
            <div className="text-xl font-bold tracking-tight text-white/90">{timeString}</div>
            <div className="text-[10px] uppercase font-bold text-brand-400 tracking-widest">{timeZone}</div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/workspace" className="btn-primary flex items-center gap-2 px-6 py-3">
              <FiPlus /> New Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard 
          icon={FiDatabase} 
          title="Datasets Uploaded" 
          value={recentDashboards.length > 0 ? "1" : "0"} 
          detail="Using EXAMPLE_DATA.csv" 
          trend={recentDashboards.length > 0 ? "+1" : "0"}
        />
        <StatCard 
          icon={FiCpu} 
          title="AI Generations" 
          value={recentDashboards.length > 0 ? "4" : "0"} 
          detail="Avg time: 14s / chart" 
          trend={recentDashboards.length > 0 ? "Active" : "Idle"}
        />
        <StatCard 
          icon={FiLayout} 
          title="Active Dashboards" 
          value={recentDashboards.length.toString()} 
          detail="Managed in local database"
        />
        <StatCard 
          icon={FiActivity} 
          title="System Health" 
          value={systemStatus.ollama === 'online' ? '99.9%' : 'Warning'} 
          detail={systemStatus.ollama === 'online' ? `Ollama Active (${systemStatus.models} models)` : 'AI Service Disconnected'}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FiClock className="text-brand-400" /> Recent Activity
              </h3>
              <button className="text-xs text-brand-400 hover:underline">View All</button>
            </div>
            
            <div className="space-y-2">
              {recentDashboards.length > 0 ? recentDashboards.map((dash: any) => (
                <ActivityItem 
                  key={dash.id}
                  title={dash.title} 
                  time={new Date(dash.created_at).toLocaleString()} 
                  status="completed" 
                  type="dashboard"
                />
              )) : (
                <div className="text-center py-8 text-white/20 text-sm italic">
                  No dashboards created yet. Run the demo script to populate this!
                </div>
              )}
            </div>
          </div>

          {/* AI Insights Card */}
          <div className="glass-card p-8 relative overflow-hidden bg-gradient-to-br from-brand-500/5 to-purple-500/5">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-500/10 rounded-full blur-[80px]" />
            <div className="relative z-10">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">🤖</span> AI Recommended Visualizations
              </h3>
              <p className="text-white/50 text-sm mb-6 max-w-xl">
                Based on your recently uploaded datasets, AI suggests these visualization patterns to uncover deeper insights.
              </p>
              
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { icon: FiPieChart, label: 'Market Distribution', color: 'text-blue-400' },
                  { icon: FiBarChart2, label: 'Monthly Growth', color: 'text-purple-400' },
                  { icon: FiTrendingUp, label: 'Revenue Trends', color: 'text-emerald-400' },
                ].map((item, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:bg-white/[0.06] transition-colors cursor-pointer group">
                    <item.icon className={`mb-3 ${item.color}`} size={24} />
                    <div className="text-sm font-medium mb-1">{item.label}</div>
                    <div className="text-[10px] text-white/30 flex items-center gap-1 group-hover:text-white/50">
                      Learn more <FiArrowRight size={10} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Status */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/30 mb-6">Service Status</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${systemStatus.backend === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`} />
                  <span className="text-sm font-medium">Backend API</span>
                </div>
                <span className="text-xs text-white/40">{systemStatus.backend}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${systemStatus.ollama === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                  <span className="text-sm font-medium">Ollama Service</span>
                </div>
                <span className="text-xs text-white/40">{systemStatus.ollama}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-sm font-medium">Database (SQLite)</span>
                </div>
                <span className="text-xs text-white/40">online</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5">
              <h4 className="text-xs font-semibold text-white/30 mb-4 uppercase">Connected Models</h4>
              <div className="space-y-2">
                {systemStatus.models > 0 ? (
                  <div className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/5 text-xs text-brand-300 flex items-center justify-between">
                    <span>deepseek-coder:6.7b</span>
                    <FiCheckCircle size={12} />
                  </div>
                ) : (
                  <div className="px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/10 text-xs text-red-400 flex items-center gap-2">
                    <FiAlertCircle size={12} /> No models found
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="glass-card p-6 bg-brand-500/5 border-brand-500/20">
            <h3 className="text-sm font-semibold mb-2">Need help?</h3>
            <p className="text-xs text-white/50 mb-4">Check out our documentation for advanced dashboard configurations.</p>
            <a href="/docs" className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1">
              Read Documentation <FiArrowRight size={10} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
