import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Calculator,
  Database,
  FileText,
  Layers,
  RefreshCw,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { HPPCalculationRecord, FOBQuotation, FobPurchaseOrder } from '../../types';
import { FobDashboardTab } from './FobDashboardTab';
import { FobCalculatorTab } from './FobCalculatorTab';
import { FobDatabaseTab } from './FobDatabaseTab';
import { FobQuotationTab } from './FobQuotationTab';
import { FobMasterDataTab } from './FobMasterDataTab';
import { FobAiAnalysisTab } from './FobAiAnalysisTab';
import { FobOrdersTab } from './FobOrdersTab';
import { FobOrderModal } from './FobOrderModal';
import { FobOrderPrintModal } from './FobOrderPrintModal';
import { FobHppPrintModal } from './FobHppPrintModal';
import { FobQuotationPrintModal } from './FobQuotationPrintModal';
import { FobRekapPrintModal } from './FobRekapPrintModal';

export type FobSubTab = 'dashboard' | 'order-brand' | 'kalkulator' | 'database' | 'penawaran' | 'master-data' | 'ai-analysis';

export const FobCostingView: React.FC = () => {
  const {
    hppRecords,
    fobQuotations,
    fobMaterials,
    fobProducts,
    fobOrders,
    saveFobOrder,
    updateFobOrder,
    updateFobOrderStatus,
    deleteFobOrder,
    brands,
    vendors,
    isLoadingFob,
    saveHppRecord,
    deleteHppRecord,
    saveFobQuotation,
    deleteFobQuotation,
    saveFobMaterial,
    deleteFobMaterial,
    saveFobProduct,
    deleteFobProduct,
    refreshFobData,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<FobSubTab>('dashboard');
  const [editingHpp, setEditingHpp] = useState<HPPCalculationRecord | null>(null);

  // Modal FOB Order States
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<FobPurchaseOrder | null>(null);
  const [printOrder, setPrintOrder] = useState<FobPurchaseOrder | null>(null);

  // Modal Print States
  const [printHppRecord, setPrintHppRecord] = useState<HPPCalculationRecord | null>(null);
  const [printQuotation, setPrintQuotation] = useState<FOBQuotation | null>(null);
  const [isRekapPrintOpen, setIsRekapPrintOpen] = useState<boolean>(false);

  // Auto refresh on mount
  useEffect(() => {
    refreshFobData();
  }, []);

  const handleEditHpp = (record: HPPCalculationRecord) => {
    setEditingHpp(record);
    setActiveSubTab('kalkulator');
  };

  const navItems: { id: FobSubTab; label: string; icon: React.ElementType; count?: number; isAi?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'order-brand', label: 'Order Masuk (PO)', icon: ShoppingBag, count: fobOrders.length },
    { id: 'kalkulator', label: 'Kalkulator HPP', icon: Calculator },
    { id: 'database', label: 'Database HPP', icon: Database, count: hppRecords.length },
    { id: 'penawaran', label: 'Surat Penawaran (SPH)', icon: FileText, count: fobQuotations.length },
    { id: 'master-data', label: 'Master Data', icon: Layers },
    { id: 'ai-analysis', label: 'Analisis AI', icon: Sparkles, isAi: true },
  ];

  return (
    <div className="space-y-6 pb-12">
      
      {/* TOP NAVIGATION SUB-TABS (SINGLE ROW RESPONSIVE SCROLLABLE BAR) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-1.5 shadow-xs flex items-center justify-between gap-2 overflow-hidden">
        {/* Scrollable Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth flex-1 min-w-0 py-0.5 px-0.5">
          {navItems.map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id !== 'kalkulator') setEditingHpp(null);
                  setActiveSubTab(tab.id);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${tab.isAi && !isActive ? 'text-indigo-600' : ''}`} />
                <span>{tab.label}</span>
                {tab.isAi && (
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-full tracking-wider shrink-0 ${
                      isActive ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                    }`}
                  >
                    AI
                  </span>
                )}
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Pinned Right Actions (Refresh) */}
        <div className="flex items-center gap-1 shrink-0 pl-2 pr-1 border-l border-slate-200/90">
          <button
            onClick={() => refreshFobData()}
            disabled={isLoadingFob}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition cursor-pointer disabled:opacity-50"
            title="Sinkronisasi Ulang Database Backend"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingFob ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* SUBTAB CONTENT */}
      {activeSubTab === 'dashboard' && (
        <FobDashboardTab
          records={hppRecords}
          onNavigateTab={setActiveSubTab}
          onEditRecord={handleEditHpp}
          onPrintRecord={setPrintHppRecord}
        />
      )}

      {activeSubTab === 'order-brand' && (
        <FobOrdersTab
          orders={fobOrders}
          onOpenCreate={() => {
            setEditingOrder(null);
            setIsOrderModalOpen(true);
          }}
          onEditOrder={(ord) => {
            setEditingOrder(ord);
            setIsOrderModalOpen(true);
          }}
          onDeleteOrder={deleteFobOrder}
          onUpdateStatus={updateFobOrderStatus}
          onPrintOrder={setPrintOrder}
        />
      )}

      {activeSubTab === 'kalkulator' && (
        <FobCalculatorTab
          initialRecord={editingHpp}
          existingRecords={hppRecords}
          materials={fobMaterials}
          products={fobProducts}
          onSave={saveHppRecord}
          onPrint={setPrintHppRecord}
          onClearInitial={() => setEditingHpp(null)}
        />
      )}

      {activeSubTab === 'database' && (
        <FobDatabaseTab
          records={hppRecords}
          onEdit={handleEditHpp}
          onDelete={deleteHppRecord}
          onPrintSingle={setPrintHppRecord}
          onOpenRekapPrint={() => setIsRekapPrintOpen(true)}
        />
      )}

      {activeSubTab === 'penawaran' && (
        <FobQuotationTab
          hppRecords={hppRecords}
          savedQuotations={fobQuotations}
          onSaveQuotation={saveFobQuotation}
          onDeleteQuotation={deleteFobQuotation}
          onPrintQuotation={setPrintQuotation}
        />
      )}

      {activeSubTab === 'master-data' && (
        <FobMasterDataTab
          materials={fobMaterials}
          products={fobProducts}
          onSaveMaterial={saveFobMaterial}
          onDeleteMaterial={deleteFobMaterial}
          onSaveProduct={saveFobProduct}
          onDeleteProduct={deleteFobProduct}
        />
      )}

      {activeSubTab === 'ai-analysis' && (
        <FobAiAnalysisTab
          records={hppRecords}
          onNavigateTab={setActiveSubTab}
        />
      )}

      {/* FOB ORDER MODALS */}
      {isOrderModalOpen && (
        <FobOrderModal
          initialOrder={editingOrder}
          existingOrders={fobOrders}
          brands={brands}
          vendors={vendors}
          hppRecords={hppRecords}
          fobQuotations={fobQuotations}
          onSave={async (data) => {
            if (editingOrder) {
              await updateFobOrder(editingOrder.id, data);
            } else {
              await saveFobOrder(data);
            }
          }}
          onClose={() => {
            setIsOrderModalOpen(false);
            setEditingOrder(null);
          }}
        />
      )}

      {printOrder && (
        <FobOrderPrintModal
          order={printOrder}
          onClose={() => setPrintOrder(null)}
        />
      )}

      {/* PRINT MODALS */}
      {printHppRecord && (
        <FobHppPrintModal
          hpp={printHppRecord}
          onClose={() => setPrintHppRecord(null)}
        />
      )}

      {printQuotation && (
        <FobQuotationPrintModal
          quotation={printQuotation}
          onClose={() => setPrintQuotation(null)}
        />
      )}

      {isRekapPrintOpen && (
        <FobRekapPrintModal
          records={hppRecords}
          onClose={() => setIsRekapPrintOpen(false)}
        />
      )}

    </div>
  );
};
