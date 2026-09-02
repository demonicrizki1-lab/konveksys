import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Building2,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  Bell,
  ChevronDown,
  Check,
  Sparkles,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    isSidebarCollapsed,
    toggleSidebar,
    toggleMobileMenu,
    activeBrand,
    switchBrand,
    pendingBrands,
    setIsApprovalModalOpen,
  } = useApp();

  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hasMultipleBrands =
    currentUser?.role === 'BRAND' &&
    currentUser?.accessibleBrands &&
    currentUser.accessibleBrands.length > 1;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBrandDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-slate-900/95 backdrop-blur-md text-white sticky top-0 z-40 border-b border-slate-800/80 no-print" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.2)' }}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Kiri: Toggle Sidebar + Logo Brand */}
          <div className="flex items-center gap-3">
            
            {/* Tombol Hamburger Mobile */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-base btn-press"
              title="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Toggle Sidebar Desktop */}
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-base btn-press items-center justify-center"
              title={isSidebarCollapsed ? 'Tampilkan Sidebar Penuh' : 'Kecilkan Sidebar'}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-5 h-5 text-indigo-400" />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </button>

            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-black px-3 py-1 rounded-xl text-base tracking-wider shadow-md shadow-indigo-600/30">
                Maison
              </div>
              <div className="hidden sm:block border-l border-slate-800 pl-3">
                <div className="text-xs font-bold text-slate-200 uppercase tracking-wider">Maison Rayyan</div>
                <div className="text-[10px] text-slate-400 font-medium">Manufacturing ERP</div>
              </div>
            </div>
          </div>

          {/* Kanan: Action & Profil Terpadu */}
          {currentUser && (
            <div className="flex items-center gap-3">

              {/* TOMBOL NOTIFIKASI APPROVAL BRAND UNTUK ADMIN */}
              {currentUser.role === 'ADMIN' && (
                <button
                  onClick={() => setIsApprovalModalOpen(true)}
                  className="relative p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-base flex items-center gap-1.5 shadow-sm"
                  title="Persetujuan Kemitraan Brand Baru"
                >
                  <Bell className="w-4 h-4 text-amber-400" />
                  <span className="hidden md:inline text-xs font-semibold text-slate-300">Persetujuan</span>
                  {pendingBrands.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] animate-pulse">
                      {pendingBrands.length}
                    </span>
                  )}
                </button>
              )}

              {/* CARD PROFIL & CUSTOM BRAND SWITCHER POPOVER */}
              <div className="relative" ref={dropdownRef}>
                
                {/* Trigger Card */}
                <button
                  type="button"
                  onClick={() => {
                    if (hasMultipleBrands) {
                      setIsBrandDropdownOpen(prev => !prev);
                    }
                  }}
                  className={`flex items-center gap-3 p-1.5 pr-3 rounded-2xl border transition-all text-left ${
                    hasMultipleBrands
                      ? 'bg-slate-800/90 hover:bg-slate-800 border-indigo-500/40 hover:border-indigo-500/70 shadow-sm cursor-pointer'
                      : 'bg-slate-800/80 border-slate-700/60 cursor-default'
                  }`}
                >
                  {/* Avatar Bulat Mewah */}
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white shadow-md shrink-0 bg-gradient-to-tr from-indigo-600 to-indigo-500 shadow-indigo-600/30">
                    {currentUser.avatar || (currentUser.role === 'ADMIN' ? 'MR' : 'BP')}
                  </div>

                  {/* Info Teks Pengguna */}
                  <div className="hidden sm:block">
                    <div className="text-xs font-bold text-white leading-tight flex items-center gap-1.5">
                      <span>{currentUser.name}</span>
                      {currentUser.role === 'ADMIN' && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          Admin
                        </span>
                      )}
                    </div>

                    {/* Subtitle / Brand Switcher Label */}
                    <div className="flex items-center gap-1 mt-0.5">
                      {currentUser.role === 'BRAND' ? (
                        <div className="inline-flex items-center gap-1 text-[11px] font-extrabold text-indigo-400">
                          <Building2 className="w-3 h-3 text-indigo-400" />
                          <span>{activeBrand}</span>
                          {hasMultipleBrands && (
                            <ChevronDown className={`w-3 h-3 text-indigo-400/80 transition-transform duration-200 ${
                              isBrandDropdownOpen ? 'rotate-180' : ''
                            }`} />
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">{currentUser.email}</span>
                      )}
                    </div>
                  </div>

                  {/* Mobile Indicator untuk Multi-Brand */}
                  {hasMultipleBrands && (
                    <ChevronDown className="w-3.5 h-3.5 text-indigo-400 sm:hidden" />
                  )}
                </button>

                {/* CUSTOM FLOATING POPOVER DROPDOWN (Bukan native <select> kaku!) */}
                {isBrandDropdownOpen && hasMultipleBrands && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-2.5 z-50 animate-fadeIn divide-y divide-slate-800">
                    
                    {/* Header Popover */}
                    <div className="px-2.5 py-2">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        <span>Ganti Portal Brand</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Pilih brand yang ingin dikelola saat ini:
                      </div>
                    </div>

                    {/* Daftar Brand */}
                    <div className="py-1.5 space-y-1">
                      {currentUser.accessibleBrands?.map((brandName) => {
                        const isActive = brandName === activeBrand;
                        return (
                          <button
                            key={brandName}
                            type="button"
                            onClick={() => {
                              switchBrand(brandName);
                              setIsBrandDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-base cursor-pointer ${
                              isActive
                                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                                : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                                isActive ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                              }`}>
                                {brandName.substring(0, 2)}
                              </div>
                              <span>{brandName}</span>
                            </div>

                            {isActive && (
                              <div className="flex items-center gap-1 text-[10px] text-indigo-300 bg-indigo-500/25 px-1.5 py-0.5 rounded-md font-semibold">
                                <Check className="w-3 h-3" />
                                <span>Aktif</span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}

        </div>
      </div>
    </header>
  );
};
