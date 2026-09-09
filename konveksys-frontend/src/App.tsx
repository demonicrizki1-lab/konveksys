import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginPage } from './components/auth/LoginPage';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './components/dashboard/Dashboard';
import { MasterHargaView } from './components/master-harga/MasterHargaView';
import { InboundView } from './components/inbound/InboundView';
import { SPKView } from './components/cutting-spk/SPKView';
import { OutboundView } from './components/outbound/OutboundView';
import { ReturnView } from './components/return/ReturnView';
import { FinanceView } from './components/finance/FinanceView';
import { ArusKasView } from './components/arus-kas/ArusKasView';
import { MarginAnalyticsView } from './components/finance/MarginAnalyticsView';
import { AccessoriesView } from './components/accessories/AccessoriesView';
import { BrandApprovalModal } from './components/brands/BrandApprovalModal';

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab, currentUser, userRole, isApprovalModalOpen, setIsApprovalModalOpen } = useApp();

  useEffect(() => {
    if (userRole === 'BRAND' && (activeTab === 'accessories' || activeTab === 'master-harga' || activeTab === 'spk' || activeTab === 'margin-analytics')) {
      setActiveTab('dashboard');
    }
  }, [userRole, activeTab, setActiveTab]);

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
          {activeTab === 'accessories' && userRole === 'ADMIN' && <AccessoriesView />}
          {activeTab === 'spk' && userRole === 'ADMIN' && <SPKView />}
          {activeTab === 'outbound' && <OutboundView />}
          {activeTab === 'return' && <ReturnView />}
          {activeTab === 'finance' && <FinanceView />}
          {activeTab === 'arus-kas' && <ArusKasView />}
          {activeTab === 'margin-analytics' && userRole === 'ADMIN' && <MarginAnalyticsView />}
        </main>
      </div>

      <footer className="bg-white border-t border-slate-200 py-3.5 text-center text-xs text-slate-400 no-print">
        <div className="max-w-[1600px] mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-1.5">
          <span>Maison - Sistem Manajemen Makloon Terintegrasi</span>
          <span className="text-slate-500">Maison Rayyan Manufacturing</span>
        </div>
      </footer>

      {/* Modal Persetujuan Kemitraan Brand (Global Modal) */}
      <BrandApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
      />
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
