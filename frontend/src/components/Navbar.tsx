import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useStore } from '../store/useStore';

export default function Navbar() {
  const loc = useLocation();
  const { theme, toggleTheme } = useStore();
  const isWorkspace = loc.pathname === '/workspace';
  const isShared = loc.pathname.startsWith('/shared/');
  
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const offset = new Date().getTimezoneOffset();
  const absOffset = Math.abs(offset);
  const offsetHours = Math.floor(absOffset / 60);
  const offsetMins = absOffset % 60;
  const offStr = `GMT${offset <= 0 ? '+' : '-'}${offsetHours}${offsetMins > 0 ? `:${offsetMins}` : ''}`;

  return (
    <nav className="sticky top-0 z-50 glass border-b border-black/[0.04] dark:border-white/[0.06] backdrop-blur-2xl">
      <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center text-lg font-bold shadow-lg shadow-brand-500/20 group-hover:shadow-brand-400/40 transition-shadow text-white">
            ✦
          </div>
          <span className="text-xl font-bold tracking-tight">
            <span className="gradient-text">AI Viz</span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex flex-col items-end border-r border-black/10 dark:border-white/10 pr-4 leading-tight">
            <div className="text-sm font-bold text-slate-700 dark:text-white/90">{timeString}</div>
            <div className="text-[9px] font-bold text-brand-600 dark:text-brand-400 tracking-wider uppercase">{offStr}</div>
          </div>

          <Link to="/dashboard" className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${loc.pathname === '/dashboard' ? 'text-brand-500 dark:text-brand-400 bg-brand-500/10' : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'}`}>
            Dashboard
          </Link>
          
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-black/5 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white transition-all"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
          </button>

          {!isWorkspace && !isShared && (
            <Link to="/workspace" className="btn-primary text-sm py-2 px-5 ml-2">
              Get Started →
            </Link>
          )}
          {(isShared || isWorkspace) && (
            <Link to="/" className="btn-secondary text-sm py-2 px-4 ml-2">
              ← Home
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
