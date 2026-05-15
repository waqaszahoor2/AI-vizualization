import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LandingPage from './pages/LandingPage';
import WorkspacePage from './pages/WorkspacePage';
import SharedPage from './pages/SharedPage';
import DashboardOverview from './pages/DashboardOverview';
import Navbar from './components/Navbar';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-surface-900 text-white">
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardOverview />} />
          <Route path="/workspace" element={<WorkspacePage />} />
          <Route path="/shared/:token" element={<SharedPage />} />
        </Routes>
        <Toaster position="bottom-right" toastOptions={{
          style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' },
        }} />
      </div>
    </BrowserRouter>
  );
}
