import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LandingPage from './pages/LandingPage';
import WorkspacePage from './pages/WorkspacePage';
import SharedPage from './pages/SharedPage';
import DashboardOverview from './pages/DashboardOverview';
import Navbar from './components/Navbar';
import { useStore } from './store/useStore';

export default function App() {
  const { theme } = useStore();

  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] transition-colors duration-300">
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardOverview />} />
          <Route path="/workspace" element={<WorkspacePage />} />
          <Route path="/shared/:token" element={<SharedPage />} />
        </Routes>
        <Toaster position="bottom-right" toastOptions={{
          style: { 
            background: theme === 'dark' ? '#1e293b' : '#ffffff', 
            color: theme === 'dark' ? '#e2e8f0' : '#0f172a', 
            border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', 
            borderRadius: '12px' 
          },
        }} />
      </div>
    </BrowserRouter>
  );
}
