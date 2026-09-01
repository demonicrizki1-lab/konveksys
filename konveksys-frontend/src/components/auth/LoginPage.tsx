import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { demoUsers } from '../../data/initialData';
import { AuthUser } from '../../types';
import {
  ShieldCheck,
  Building2,
  Lock,
  Mail,
  ArrowRight,
  CheckCircle2,
  Scissors,
  Layers,
  AlertCircle,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, loginAsPreset } = useApp();

  const [activeTab, setActiveTab] = useState<'quick' | 'manual'>('quick');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const adminUser = demoUsers.find(u => u.role === 'ADMIN')!;
  const brandUsers = demoUsers.filter(u => u.role === 'BRAND');

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email || !password) {
      setErrorMsg('Harap isi alamat email dan kata sandi.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await login(email, password);
      if (!res.success) {
        setErrorMsg(res.message || 'Gagal masuk ke sistem.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPreset = async (user: AuthUser) => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const pwd = user.password || (user.role === 'ADMIN' ? 'admin' : 'brand');
      const res = await login(user.email, pwd);
      if (!res.success) {
        // Fallback to local preset if backend has any temporary issue
        loginAsPreset(user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">

      {/* Header */}
      <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 text-white font-bold px-3.5 py-1.5 rounded-lg text-xl tracking-wide">
            KonvekSys
          </div>
          <div className="hidden sm:block border-l border-slate-800 pl-3">
            <div className="text-xs font-semibold text-slate-200">Sistem Manajemen Makloon</div>
            <div className="text-[10px] text-slate-500">Maison Rayyan Manufacturing</div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-lg text-xs text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>Role-Based Access Control</span>
        </div>
      </header>

      {/* Konten Utama */}
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 my-auto animate-fadeIn">

        {/* Judul */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Masuk ke Portal Operasional
          </h1>
          <p className="text-slate-400 text-sm mt-3 leading-relaxed">
            Pilih peran Anda untuk mengakses sistem. Admin memiliki kendali penuh, Brand memiliki portal inventori &amp; tagihan terisolasi.
          </p>

          {/* Selector Tab */}
          <div className="mt-6 inline-flex p-1 bg-slate-900 border border-slate-800 rounded-xl max-w-xs w-full">
            <button
              onClick={() => setActiveTab('quick')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-base btn-press ${
                activeTab === 'quick'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1-Klik Login Demo
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-base btn-press ${
                activeTab === 'manual'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Form Manual
            </button>
          </div>
        </div>

        {/* TAB 1: QUICK LOGIN */}
        {activeTab === 'quick' && (
          <div className="space-y-5 animate-fadeIn">

            {/* Akun Admin */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Akun Pengelola Utama (Admin / Owner)</span>
              </div>

              <div
                onClick={() => handleSelectPreset(adminUser)}
                className="group cursor-pointer bg-slate-900 hover:bg-slate-800/80 border border-slate-700 hover:border-indigo-500/60 rounded-xl p-5 sm:p-6 transition-base btn-press relative overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-md shrink-0">
                      MR
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-white">
                          {adminUser.name}
                        </h3>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
                          Akses Penuh
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 max-w-lg">
                        Akses seluruh modul: Master Harga, Inbound Stok, SPK Cutting, Outbound, Payroll & Invoice.
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                        <span>{adminUser.email}</span>
                        <span>·</span>
                        <span>Pass: {adminUser.password}</span>
                      </div>
                    </div>
                  </div>

                  <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 shrink-0 transition-base btn-press shadow-md">
                    <span>Masuk Admin</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Akun Brand */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pilih Akun Klien Brand (Portal Terisolasi)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {brandUsers.map((brandUser) => (
                  <div
                    key={brandUser.id}
                    onClick={() => handleSelectPreset(brandUser)}
                    className="group cursor-pointer bg-slate-900 hover:bg-slate-800/80 border border-slate-700 hover:border-emerald-500/50 rounded-xl p-4 transition-base btn-press flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-600 text-emerald-400 font-semibold text-sm flex items-center justify-center">
                          {brandUser.avatar}
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/40 text-emerald-400">
                          Brand
                        </span>
                      </div>

                      <div>
                        <h4 className="font-semibold text-sm text-white">
                          {brandUser.brandName}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">{brandUser.name}</p>
                      </div>

                      <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-800 pt-2">
                        {brandUser.brandName === 'GREYWOLF' && 'Combed 30s & SJ Bedah'}
                        {brandUser.brandName === 'CITA-CITA' && 'Rayon, Ripstop & Tagihan TNI'}
                        {brandUser.brandName === 'CREADIVE' && 'Viscose & Kemeja Hawai'}
                        {brandUser.brandName === 'JENAKA KIDS' && 'Linen & Pakaian Anak'}
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-[10px] text-slate-500">{brandUser.email}</span>
                      <span className="font-semibold text-emerald-400 flex items-center gap-1">
                        Masuk <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: FORM MANUAL */}
        {activeTab === 'manual' && (
          <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-lg animate-fadeIn">

            <h2 className="text-lg font-semibold text-white mb-1">Masuk dengan Email</h2>
            <p className="text-xs text-slate-400 mb-6">
              Masukkan email dan kata sandi akun KonvekSys Anda.
            </p>

            {errorMsg && (
              <div className="mb-5 bg-red-950/50 border border-red-500/40 p-3.5 rounded-lg flex items-center gap-2.5 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contoh: admin@konveksys.com"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-base focus-ring"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-base focus-ring"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold text-xs py-3 rounded-lg flex items-center justify-center gap-2 transition-base btn-press shadow-md"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk Sekarang</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800/80 text-[11px] text-slate-500 space-y-1">
              <span className="font-semibold block text-slate-400">Akun Demo:</span>
              <p>Admin: <code className="text-indigo-400">admin@konveksys.com</code> / Pass: <code className="text-slate-400">admin</code></p>
              <p>Brand: <code className="text-emerald-400">greywolf@brand.com</code> / Pass: <code className="text-slate-400">brand</code></p>
            </div>
          </div>
        )}

        {/* Trust Footer Cards */}
        <div className="mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex items-center justify-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Isolasi Data Antar-Brand Terjaga</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Scissors className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Kerahasiaan Ongkos Jahit & Margin</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Layers className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Kalkulasi Otomatis Gaji & Invoice</span>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 text-center text-xs text-slate-600">
        KonvekSys - Sistem Manajemen Makloon Terintegrasi Maison Rayyan
      </footer>
    </div>
  );
};
