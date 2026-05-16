import React from 'react';
import { Link } from 'react-router-dom';

const features = [
  { icon: '🤖', title: 'AI-Powered Analysis', desc: 'Local AI with DeepSeek models analyzes your data and generates insights automatically.' },
  { icon: '📊', title: '25+ Chart Types', desc: 'From line charts to Sankey diagrams — every visualization you need, powered by Apache ECharts.' },
  { icon: '🔒', title: '100% Private', desc: 'All AI processing runs locally via Ollama. Your data never leaves your machine.' },
  { icon: '⚡', title: 'Instant Dashboards', desc: 'Describe what you want in natural language and get a complete dashboard in seconds.' },
  { icon: '🎯', title: 'Drag & Drop Editor', desc: 'Resize, rearrange, and customize every chart with an intuitive grid-based layout.' },
  { icon: '🔗', title: 'Share & Export', desc: 'Share via secure links or export to PDF, PNG, Excel, and JSON formats.' },
];

const chartTypes = [
  'Line', 'Area', 'Bar', 'Horizontal Bar', 'Stacked Bar', 'Pie', 'Donut',
  'Scatter', 'Bubble', 'Heatmap', 'Histogram', 'Box Plot', 'Waterfall',
  'Funnel', 'Treemap', 'Sunburst', 'Sankey', 'Gauge', 'Radar', 'Candlestick',
  'KPI Cards', 'Table/Grid', 'Correlation Matrix', 'Geographic Map', '100% Stacked',
];

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[120px] animate-pulse-soft" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] animate-pulse-soft" style={{ animationDelay: '1s' }} />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-500/20 to-transparent" />
        </div>

        <div className="relative max-w-[1200px] mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 animate-slide-up">
            Turn Data Into{' '}
            <span className="gradient-text">Stunning Dashboards</span>
            <br />With AI
          </h1>

          <p className="text-lg md:text-xl text-slate-500 dark:text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Upload your data, describe what you want, and let AI generate
            interactive Power BI-style dashboards — all running locally for maximum privacy.
          </p>

          <div className="flex flex-wrap justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/workspace" className="btn-primary text-lg px-8 py-4">
              Start Building →
            </Link>
            <a href="#features" className="btn-secondary text-lg px-8 py-4">
              Explore Features
            </a>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-12 mt-16 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {[['25+', 'Chart Types'], ['< 30s', 'Generation'], ['100%', 'Private'], ['0', 'API Costs']].map(([val, label]) => (
              <div key={label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold gradient-text">{val}</div>
                <div className="text-sm text-slate-400 dark:text-white/40 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Everything You Need for <span className="gradient-text">Data Intelligence</span>
          </h2>
          <p className="text-slate-500 dark:text-white/40 text-center mb-16 max-w-xl mx-auto">
            Enterprise-grade features powered by local AI models
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="glass-card p-8 hover:border-brand-500/20 transition-all duration-500 group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{f.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-slate-500 dark:text-white/40 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chart Types */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-500/[0.02] to-transparent" />
        <div className="relative max-w-[1200px] mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="gradient-text">25+ Visualization</span> Types
          </h2>
          <p className="text-slate-500 dark:text-white/40 mb-12 max-w-xl mx-auto">
            AI automatically selects the best chart type for your data
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            {chartTypes.map((t, i) => (
              <span key={i} className="px-4 py-2 rounded-full bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/[0.06] text-sm text-slate-600 dark:text-white/60 hover:bg-brand-500/10 hover:border-brand-500/20 hover:text-brand-600 dark:hover:text-brand-300 transition-all duration-300 cursor-default">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-[800px] mx-auto text-center glass-card p-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to <span className="gradient-text">Transform Your Data</span>?
          </h2>
          <p className="text-slate-500 dark:text-white/40 mb-8">
            Upload your CSV or Excel file and generate a professional dashboard in seconds.
          </p>
          <Link to="/workspace" className="btn-primary text-lg px-10 py-4 inline-block">
            Get Started Free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/[0.06] dark:border-white/[0.06] py-12 px-6">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white">✦</div>
            <span className="font-semibold gradient-text">AI Viz</span>
          </div>
          <p className="text-slate-400 dark:text-white/30 text-sm">© 2024 AI Data Visualization Platform. Built with ❤️ using Ollama + ECharts.</p>
        </div>
      </footer>
    </div>
  );
}
