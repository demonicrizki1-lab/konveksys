import React from 'react';
import { useApp, ActiveTab } from '../../context/AppContext';
import {
  LayoutDashboard,
  Coins,
  PackageCheck,
  Scissors,
  Truck,
  RotateCcw,
  ReceiptText,
  TrendingUp,
  BarChart3,
  Archive,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
  ShieldCheck,
  LogOut,
  Inbox,
  Users,
  ShoppingBag,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    userRole,
    activeBrand,
    currentUser,
    logout,
    inboundRolls,
    spkList,
    suratJalanList,
    returnList,
    accessories,
    managedUsers,
    isSidebarCollapsed,
    toggleSidebar,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    getArusKasSummary,
  } = useApp();

  // Stats untuk badge
  const filteredRolls = userRole === 'BRAND' ? inboundRolls.filter(r => r.brand === activeBrand) : inboundRolls;
  const filteredSJ = userRole === 'BRAND' ? suratJalanList.filter(s => s.brand === activeBrand) : suratJalanList;
  const filteredReturns = userRole === 'BRAND' ? returnList.filter(r => r.brand === activeBrand) : returnList;
  const filteredAccessories = userRole === 'BRAND' ? accessories.filter(a => !a.brand || a.brand === 'UMUM' || a.brand === activeBrand) : accessories;

  const rollsInStock = filteredRolls.filter(r => r.status === 'DI_GUDANG').length;
  const activeSPKs = spkList.filter(s => {
    if (s.status === 'COMPLETED' || s.status === 'OVER_DELIVERY') return false;
    const targetTotal = Object.values(s.targetCutQty || {}).reduce((a, b) => a + b, 0);
    const delivTotal = Object.values(s.deliveredQty || {}).reduce((a, b) => a + b, 0);
    if (targetTotal > 0 && delivTotal >= targetTotal) return false;
    return s.status === 'IN_PRODUCTION' || s.status === 'PARTIAL_DELIVERED';
  }).length;
  const recentSJ = filteredSJ.length;
  const totalBarangMasukPcs = filteredSJ.reduce((acc, s) => acc + (s.totalPcs || 0), 0);
  const activeReturns = filteredReturns.filter(r => r.status === 'DIAJUKAN' || r.status === 'DIKIRIM_KE_VENDOR').length;
  const lowStockAccessories = filteredAccessories.filter(a => a.stock <= a.safetyStock).length;

  // Outstanding arus kas untuk badge
  const arusKasSummary = getArusKasSummary();
  const visibleSummary = userRole === 'BRAND' ? arusKasSummary.filter(s => s.brand === activeBrand) : arusKasSummary;
  const totalOutstanding = visibleSummary.reduce((a, b) => a + b.outstanding, 0);
  const hasOutstanding = totalOutstanding > 0;

  interface NavItem {
    id: ActiveTab;
    label: string;
    description: string;
    icon: React.ElementType;
    badge?: number | string;
    roles: ('ADMIN' | 'BRAND')[];
  }

  interface NavSection {
    sectionKey: string;
    title: string;
    items: NavItem[];
  }

  const navSections: NavSection[] = [
    {
      sectionKey: 'overview',
      title: 'Ikhtisar',
      items: [
        {
          id: 'dashboard',
          label: userRole === 'ADMIN' ? 'Dashboard Utama' : 'Dashboard Brand',
          description: userRole === 'ADMIN' ? 'KPI & Monitoring Operasional' : `Status ${activeBrand}`,
          icon: LayoutDashboard,
          roles: ['ADMIN', 'BRAND'],
        },
      ],
    },
    {
      sectionKey: 'production',
      title: 'Produksi & Operasional',
      items: [
        {
          id: 'inbound',
          label: userRole === 'ADMIN' ? 'Inbound Stok Kain' : 'Stok Kain Saya',
          description: userRole === 'ADMIN' ? 'Pelacakan Rol Semua Brand' : 'Tracking Rol di Gudang',
          icon: PackageCheck,
          badge: rollsInStock > 0 ? `${rollsInStock} Rol` : undefined,
          roles: ['ADMIN', 'BRAND'],
        },
        {
          id: 'barang-masuk',
          label: userRole === 'ADMIN' ? 'Rekap Barang Masuk' : 'Barang Masuk',
          description: userRole === 'ADMIN' ? 'Rekapan Barang Jadi Buyer' : 'Rekapan Barang Jadi Masuk',
          icon: Inbox,
          badge: totalBarangMasukPcs > 0 ? `${totalBarangMasukPcs} Pcs` : undefined,
          roles: ['ADMIN', 'BRAND'],
        },
        {
          id: 'stok-penjualan',
          label: userRole === 'ADMIN' ? 'Stok & Penjualan Brand' : 'Stok & Penjualan',
          description: userRole === 'ADMIN' ? 'Live Inventori & Order MP' : 'Database Stok & Marketplace',
          icon: ShoppingBag,
          roles: ['ADMIN', 'BRAND'],
        },
        {
          id: 'accessories',
          label: 'Stok Aksesoris & Trims',
          description: 'Kancing, Zipper, Label, Benang',
          icon: Archive,
          badge: lowStockAccessories > 0 ? `${lowStockAccessories} Menipis` : undefined,
          roles: ['ADMIN'],
        },
        {
          id: 'spk',
          label: 'SPK & Cutting',
          description: 'Pooling Rol & Alokasi Vendor',
          icon: Scissors,
          badge: activeSPKs > 0 ? `${activeSPKs} Aktif` : undefined,
          roles: ['ADMIN'],
        },
        {
          id: 'outbound',
          label: userRole === 'ADMIN' ? 'Outbound Surat Jalan' : 'Surat Jalan',
          description: userRole === 'ADMIN' ? 'Pengiriman & Auto-Deduct' : 'Riwayat Pengiriman',
          icon: Truck,
          badge: recentSJ > 0 ? `${recentSJ} SJ` : undefined,
          roles: ['ADMIN', 'BRAND'],
        },
        {
          id: 'return',
          label: userRole === 'ADMIN' ? 'Pengembalian & Retur' : 'Retur Produk',
          description: userRole === 'ADMIN' ? 'Barang Cacat & Rework' : 'Lacak Perbaikan Barang',
          icon: RotateCcw,
          badge: activeReturns > 0 ? `${activeReturns} Retur` : undefined,
          roles: ['ADMIN', 'BRAND'],
        },
      ],
    },
    {
      sectionKey: 'finance',
      title: 'Keuangan & Arus Kas',
      items: [
        {
          id: 'finance',
          label: userRole === 'ADMIN' ? 'Finance & Tagihan' : 'Tagihan & Invoice',
          description: userRole === 'ADMIN' ? 'Slip Gaji & Invoice Brand' : 'Invoice Makloon',
          icon: ReceiptText,
          roles: ['ADMIN', 'BRAND'],
        },
        {
          id: 'arus-kas',
          label: 'Arus Kas',
          description: userRole === 'ADMIN' ? 'Pembayaran Masuk dari Brand' : 'Riwayat Pembayaran Saya',
          icon: TrendingUp,
          badge: hasOutstanding ? 'Ada Saldo' : undefined,
          roles: ['ADMIN', 'BRAND'],
        },
        {
          id: 'margin-analytics',
          label: 'Analisis Margin & Laba',
          description: 'Laba Bersih & Rekap Bulanan',
          icon: BarChart3,
          badge: 'Owner',
          roles: ['ADMIN'],
        },
      ],
    },
    {
      sectionKey: 'master',
      title: 'Data Master & Akun',
      items: [
        {
          id: 'master-harga',
          label: 'Master Harga',
          description: 'Ongkos Jahit & Rate Buyer',
          icon: Coins,
          roles: ['ADMIN'],
        },
        {
          id: 'manajemen-user',
          label: 'Manajemen User & Brand',
          description: 'Kelola User Aktif & Brand Mitra',
          icon: Users,
          badge: managedUsers && managedUsers.length > 0 ? `${managedUsers.length} User` : undefined,
          roles: ['ADMIN'],
        },
      ],
    },
  ];

  const handleSelectNav = (tabId: ActiveTab) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const renderNavContent = (isMobile: boolean = false) => {
    const isCollapsed = !isMobile && isSidebarCollapsed;

    return (
      <div className="flex flex-col h-full justify-between">
        <div className="space-y-3">
          
          {/* Header sidebar */}
          <div className={`px-2 py-2 flex items-center justify-between border-b border-slate-100 mb-1 ${isCollapsed ? 'justify-center' : ''}`}>
            {!isCollapsed ? (
              <>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {userRole === 'ADMIN' ? 'Menu Admin' : 'Brand Portal'}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {userRole === 'ADMIN' ? 'Admin' : activeBrand}
                </span>
              </>
            ) : (
              <span className="w-2 h-2 rounded-full bg-indigo-500" title="Maison Menu"></span>
            )}
          </div>

          {/* Navigasi Berkelompok per Section */}
          <div className="space-y-3">
            {navSections.map((section, idx) => {
              const visibleItems = section.items.filter((item) => item.roles.includes(userRole));
              if (visibleItems.length === 0) return null;

              return (
                <div key={section.sectionKey} className={idx > 0 && isCollapsed ? 'pt-2 border-t border-slate-100' : ''}>
                  {!isCollapsed && (
                    <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {section.title}
                    </div>
                  )}

                  <div className="space-y-1">
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelectNav(item.id)}
                          title={isCollapsed ? `${item.label} - ${item.description}` : undefined}
                          className={`w-full flex items-center rounded-xl transition-base btn-press focus-ring relative group ${
                            isCollapsed ? 'justify-center p-3' : 'gap-3 p-2.5 text-left'
                          } ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <div
                            className={`p-2 rounded-lg shrink-0 transition-transform ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 text-slate-600 group-hover:scale-105'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>

                          {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-slate-800'}`}>
                                  {item.label}
                                </span>
                                {item.badge && (
                                  <span
                                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                      isActive
                                        ? 'bg-white/25 text-white'
                                        : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                    }`}
                                  >
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className={`text-[11px] truncate mt-0.5 ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>
                                {item.description}
                              </p>
                            </div>
                          )}

                          {/* Indikator badge mini saat collapsed */}
                          {isCollapsed && item.badge && (
                            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500 border border-white"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Footer Sidebar */}
        <div className="mt-6 space-y-3">
          
          {/* Tombol Collapse/Expand untuk Desktop */}
          {!isMobile && (
            <button
              onClick={toggleSidebar}
              className={`w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-base btn-press focus-ring text-xs font-medium gap-1.5 ${
                isCollapsed ? 'py-2.5' : ''
              }`}
              title={isCollapsed ? 'Perbesar Sidebar' : 'Kecilkan Sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-indigo-600" />
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4" />
                  <span>Sembunyikan Sidebar</span>
                </>
              )}
            </button>
          )}

          {/* Info Peran / Akses */}
          {!isCollapsed ? (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-600">Akses:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                  {userRole === 'ADMIN' ? 'Admin / Owner' : `Brand ${activeBrand}`}
                </span>
              </div>
              {currentUser && (
                <p className="text-[11px] text-slate-500 truncate mt-1">
                  {currentUser.name}
                </p>
              )}
            </div>
          ) : (
            <div
              className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700"
              title={`Akses: ${userRole === 'ADMIN' ? 'Admin / Owner' : activeBrand}`}
            >
              {userRole === 'ADMIN' ? (
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
              ) : (
                <Building2 className="w-4 h-4 text-indigo-600" />
              )}
            </div>
          )}

          {/* Tombol Logout di Bawah Sidebar */}
          {!isCollapsed ? (
            <button
              onClick={() => {
                if (confirm('Apakah Anda yakin ingin logout?')) {
                  logout();
                }
              }}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 transition-base btn-press cursor-pointer shadow-xs"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Logout</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (confirm('Apakah Anda yakin ingin logout?')) {
                  logout();
                }
              }}
              title="Logout"
              className="w-full flex items-center justify-center p-2.5 rounded-xl text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-base btn-press cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
            </button>
          )}

        </div>
      </div>
    );
  };

  return (
    <>
      {/* 1. Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-white border-r border-slate-200 p-4 transition-all duration-300 ease-in-out shrink-0 no-print ${
          isSidebarCollapsed ? 'w-20' : 'w-72'
        } min-h-[calc(100vh-4rem)]`}
      >
        {renderNavContent(false)}
      </aside>

      {/* 2. Mobile Drawer (Overlay) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
          ></div>

          {/* Konten Drawer */}
          <div className="relative w-72 max-w-[80vw] bg-white h-full p-4 shadow-lg flex flex-col justify-between z-10 animate-slideRight">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
              <div className="flex items-center gap-2">
                <div className="bg-indigo-600 text-white font-bold px-2.5 py-1 rounded-lg text-sm">
                  Maison
                </div>
                <span className="text-xs font-semibold text-slate-700">Navigasi</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 btn-press focus-ring"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {renderNavContent(true)}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
