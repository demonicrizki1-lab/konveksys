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
  User,
  Phone,
  Tag,
  X,
  Sparkles,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, registerBrand } = useApp();

  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Register Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regBrandsInput, setRegBrandsInput] = useState('');
  const [regIsLoading, setRegIsLoading] = useState(false);
  const [regErrorMsg, setRegErrorMsg] = useState<string | null>(null);
  const [regSuccessMsg, setRegSuccessMsg] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegErrorMsg(null);
    setRegSuccessMsg(null);

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setRegErrorMsg('Harap lengkapi nama, email, dan kata sandi.');
      return;
    }

    // Split brand names by comma (contoh: "CITA-CITA, GREYWOLF, JENAKA KIDS")
    const parsedBrands = regBrandsInput
      .split(/[,;\n]+/)
      .map(b => b.trim().toUpperCase())
      .filter(Boolean);

    if (parsedBrands.length === 0) {
      setRegErrorMsg('Harap sebutkan minimal 1 nama brand yang Anda naungi.');
      return;
    }

    setRegIsLoading(true);
    try {
      const res = await registerBrand({
        name: regName,
        email: regEmail,
        password: regPassword,
        phone: regPhone,
        brands: parsedBrands,
      });

      if (res.success) {
        setRegSuccessMsg(res.message);
        // Reset form
        setRegName('');
        setRegEmail('');
        setRegPassword('');
        setRegPhone('');
        setRegBrandsInput('');
      } else {
        setRegErrorMsg(res.message);
      }
    } catch {
      setRegErrorMsg('Terjadi kesalahan jaringan saat mengirim pendaftaran.');
    } finally {
      setRegIsLoading(false);
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
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
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

          {/* Footer Notice & Register Trigger */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 text-center space-y-2">
            <div className="text-[11px] text-slate-400">
              Belum memiliki akun kemitraan brand?
            </div>
            <button
              type="button"
              onClick={() => {
                setRegErrorMsg(null);
                setRegSuccessMsg(null);
                setIsRegisterOpen(true);
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold inline-flex items-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-3.5 py-1.5 rounded-lg transition-base cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Daftar Kemitraan Brand Baru</span>
            </button>
          </div>

        </div>
      </main>

      {/* MODAL REGISTRASI MITRA BRAND MANDIRI */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl my-6">
            
            {/* Modal Header */}
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Pendaftaran Kemitraan Brand</h3>
                  <p className="text-[11px] text-slate-400">Maison Rayyan Manufacturing Partner Portal</p>
                </div>
              </div>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {regSuccessMsg ? (
                <div className="py-6 text-center space-y-4 animate-fadeIn">
                  <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Pengajuan Berhasil Dikirim!</h4>
                    <p className="text-xs text-slate-300 mt-2 max-w-sm mx-auto leading-relaxed">
                      {regSuccessMsg}
                    </p>
                  </div>
                  <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 text-left space-y-1">
                    <div>📌 <strong>Langkah Selanjutnya:</strong></div>
                    <div>1. Tim Admin Maison Rayyan akan memverifikasi permohonan kemitraan Anda.</div>
                    <div>2. Setelah disetujui, Anda dapat langsung login menggunakan email & kata sandi yang telah didaftarkan.</div>
                  </div>
                  <button
                    onClick={() => setIsRegisterOpen(false)}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition"
                  >
                    Tutup &amp; Kembali ke Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  {regErrorMsg && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{regErrorMsg}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Nama Lengkap PIC / Owner *
                      </label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="contoh: Ibu Tri Handayani"
                          className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        No. WhatsApp Aktif
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="contoh: 081234567890"
                          className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Alamat Email Login *
                      </label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="tri@citacitagroup.com"
                          className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Kata Sandi *
                      </label>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Minimal 6 karakter"
                          className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Multi-Brand Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                      <span>Brand yang Dikelola (Bisa Lebih dari 1) *</span>
                      <span className="text-[10px] text-slate-400 font-normal">Pisahkan dengan koma</span>
                    </label>
                    <div className="relative">
                      <Tag className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                      <textarea
                        rows={2}
                        value={regBrandsInput}
                        onChange={(e) => setRegBrandsInput(e.target.value)}
                        placeholder="contoh: CITA-CITA, GREYWOLF, JENAKA KIDS"
                        className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-indigo-300/80">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      <span>Satu akun dapat menaungi beberapa brand sekaligus dengan fitur Brand Switcher.</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsRegisterOpen(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={regIsLoading}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                    >
                      {regIsLoading ? 'Mengirim...' : 'Kirim Pengajuan Kemitraan'}
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-4 py-6 text-center text-xs text-slate-600">
        <div>&copy; {new Date().getFullYear()} Maison Rayyan Manufacturing. Hak Cipta Dilindungi.</div>
        <div className="text-[10px] text-slate-700 mt-1">KonvekSys Enterprise Garment Operating System</div>
      </footer>

    </div>
  );
};
