import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Building2, LogOut, RefreshCw, PanelLeftClose, PanelLeftOpen, Menu } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentUser, logout, resetToDefaultData, isSidebarCollapsed, toggleSidebar, toggleMobileMenu } = useApp();

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 no-print" style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.15)' }}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Kiri: Toggle Sidebar + Logo */}
          <div className="flex items-center gap-2.5">
            
            {/* Tombol Hamburger Mobile */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-base btn-press focus-ring"
              title="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Toggle Sidebar Desktop */}
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-base btn-press focus-ring items-center justify-center"
              title={isSidebarCollapsed ? 'Tampilkan Sidebar Penuh' : 'Kecilkan Sidebar'}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-5 h-5 text-indigo-400" />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </button>

            {/* Logo */}
            <div className="bg-indigo-600 text-white font-bold px-3.5 py-1.5 rounded-lg text-lg tracking-wide">
              KonvekSys
            </div>
            <div className="hidden sm:block border-l border-slate-700 pl-3">
              <div className="text-xs font-semibold text-slate-200">Sistem Manajemen Makloon</div>
              <div className="text-[10px] text-slate-400">Maison Rayyan Manufacturing</div>
            </div>
          </div>

          {/* Kanan: Profil Pengguna & Logout */}
          {currentUser && (
            <div className="flex items-center gap-2.5">
              
              {/* Badge Profil */}
              <div className="flex items-center gap-2.5 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-lg">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                  currentUser.role === 'ADMIN' ? 'bg-indigo-600' : 'bg-emerald-600'
                }`}>
                  {currentUser.avatar || (currentUser.role === 'ADMIN' ? 'MR' : 'BP')}
                </div>
                
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-semibold text-white leading-tight flex items-center gap-1.5">
                    <span>{currentUser.name}</span>
                    {currentUser.role === 'ADMIN' ? (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <Building2 className="w-2.5 h-2.5" />
                        {currentUser.brandName}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {currentUser.email}
                  </div>
                </div>
              </div>

              {/* Tombol Reset Data */}
              <button
                onClick={() => {
                  if (confirm('Kembalikan data ke awal sesuai spreadsheet contoh?')) {
                    resetToDefaultData();
                  }
                }}
                title="Reset ke data bawaan"
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-base btn-press focus-ring"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {/* Tombol Logout */}
              <button
                onClick={() => {
                  if (confirm('Apakah Anda yakin ingin keluar?')) {
                    logout();
                  }
                }}
                title="Keluar"
                className="flex items-center gap-1.5 bg-red-950/50 hover:bg-red-900/60 border border-red-500/25 text-red-300 hover:text-red-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-base btn-press focus-ring"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Keluar</span>
              </button>

            </div>
          )}

        </div>
      </div>
    </header>
  );
};
