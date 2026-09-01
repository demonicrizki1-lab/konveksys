import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginPage } from './components/auth/LoginPage';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './components/dashboard/Dashboard';
import { MasterHargaView } from './components/master-harga/MasterHargaView';
import { InboundView } from './components/inbound/InboundView';
import { SPKView } from './components/cutting-spk/SPKView';
import { OutboundView } from './components/outbound/OutboundView';
import { FinanceView } from './components/finance/FinanceView';
import { ArusKasView } from './components/arus-kas/ArusKasView';

const MainLayout: React.FC = () => {
  const { activeTab, currentUser, userRole } = useApp();

  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1600px] mx-auto">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0 transition-all duration-300">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'master-harga' && userRole === 'ADMIN' && <MasterHargaView />}
          {activeTab === 'inbound' && <InboundView />}
          {activeTab === 'spk' && userRole === 'ADMIN' && <SPKView />}
          {activeTab === 'outbound' && <OutboundView />}
          {activeTab === 'finance' && <FinanceView />}
          {activeTab === 'arus-kas' && <ArusKasView />}
        </main>
      </div>

      <footer className="bg-white border-t border-slate-200 py-3.5 text-center text-xs text-slate-400 no-print">
        <div className="max-w-[1600px] mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-1.5">
          <span>KonvekSys - Sistem Manajemen Makloon Terintegrasi</span>
          <span className="text-slate-500">Maison Rayyan Manufacturing</span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
