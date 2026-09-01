import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Building2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email || !password) {
      setErrorMsg('Harap masukkan alamat email dan kata sandi.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await login(email, password);
      if (!res.success) {
        setErrorMsg(res.message || 'Email atau kata sandi tidak sesuai.');
      }
    } catch {
      setErrorMsg('Terjadi kendala koneksi ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      
      {/* Header */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 text-white font-black px-3.5 py-1.5 rounded-xl text-xl tracking-wider shadow-lg shadow-indigo-600/30">
            KonvekSys
          </div>
          <div className="hidden sm:block border-l border-slate-800 pl-3.5">
            <div className="text-xs font-bold text-slate-200 uppercase tracking-wider">Maison Rayyan Manufacturing</div>
            <div className="text-[11px] text-slate-500 font-medium">Sistem Operasional Makloon & Garment Terpadu</div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3.5 py-1.5 rounded-full text-xs text-slate-400 backdrop-blur-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-medium text-[11px]">Enkripsi SSL 256-Bit</span>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="w-full max-w-md mx-auto px-4 py-8 sm:py-12 my-auto animate-fadeIn">
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/60 relative overflow-hidden backdrop-blur-md">
          
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Heading */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Masuk ke Akun Anda
            </h1>
            <p className="text-slate-400 text-xs mt-2">
              Silakan masukkan kredensial untuk mengakses portal operasional &amp; inventori Anda.
            </p>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Alamat Email / ID Pengguna
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@konveksys.com atau email brand"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-base"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Kata Sandi
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-base"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-base btn-press cursor-pointer"
            >
              {isLoading ? (
                <span>Memverifikasi...</span>
              ) : (
                <>
                  <span>Masuk ke Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Notice */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
            <div className="text-[11px] text-slate-500">
              Klien Brand baru yang ingin mendaftar kemitraan?
            </div>
            <div className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold mt-1 inline-flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>Hubungi Admin Maison Rayyan</span>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-4 py-6 text-center text-xs text-slate-600">
        <div>&copy; {new Date().getFullYear()} Maison Rayyan Manufacturing. Hak Cipta Dilindungi.</div>
        <div className="text-[10px] text-slate-700 mt-1">KonvekSys Enterprise Garment Operating System</div>
      </footer>

    </div>
  );
};
