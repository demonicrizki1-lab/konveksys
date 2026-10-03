import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { OperationalExpense, JenisKasOperasional } from '../../types';
import { formatRp, formatDateIndo, formatRupiahInput, parseRupiahInput } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  TrendingDown,
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  X,
  Search,
  Filter,
  Calendar,
  Wallet,
  Building2,
  Server,
  Zap,
  Wrench,
  Package,
  Car,
  Coffee,
  HelpCircle,
  CreditCard,
  FileText,
  Download,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
} from 'lucide-react';

export const OPEX_CATEGORIES: { key: string; label: string; icon: React.ElementType; color: string; defaultJenis: JenisKasOperasional }[] = [
  { key: 'GAJI', label: 'Gaji & Upah Staf Internal', icon: Building2, color: 'text-purple-600 bg-purple-50 border-purple-200', defaultJenis: 'KAS_KELUAR' },
  { key: 'SERVER_IT', label: 'Server, IT & Software', icon: Server, color: 'text-blue-600 bg-blue-50 border-blue-200', defaultJenis: 'KAS_KELUAR' },
  { key: 'SEWA_UTILITAS', label: 'Sewa & Utilitas (Listrik, Air, WiFi)', icon: Zap, color: 'text-amber-600 bg-amber-50 border-amber-200', defaultJenis: 'KAS_KELUAR' },
  { key: 'MAINTENANCE', label: 'Maintenance Mesin & Alat', icon: Wrench, color: 'text-orange-600 bg-orange-50 border-orange-200', defaultJenis: 'KAS_KELUAR' },
  { key: 'PERLENGKAPAN', label: 'Perlengkapan Umum (Plastik, ATK, Lakban)', icon: Package, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', defaultJenis: 'KAS_KELUAR' },
  { key: 'TRANSPORT', label: 'Transportasi & Logistik Non-SJ', icon: Car, color: 'text-cyan-600 bg-cyan-50 border-cyan-200', defaultJenis: 'KAS_KELUAR' },
  { key: 'KONSUMSI', label: 'Konsumsi & Rumah Tangga Workshop', icon: Coffee, color: 'text-rose-600 bg-rose-50 border-rose-200', defaultJenis: 'KAS_KELUAR' },
  { key: 'LAINNYA', label: 'Biaya Tak Terduga & Lain-lain', icon: HelpCircle, color: 'text-slate-600 bg-slate-50 border-slate-200', defaultJenis: 'KAS_KELUAR' },
  { key: 'MODAL_MASUK', label: 'Pemasukan Kas / Modal Masuk', icon: TrendingUp, color: 'text-emerald-700 bg-emerald-100 border-emerald-300', defaultJenis: 'KAS_MASUK' },
];

export const AKUN_KAS_OPTIONS = [
  'BCA Perusahaan',
  'Kas Tunai (Petty Cash)',
  'Bank Mandiri',
  'Bank Lainnya',
];

export const KasOperasionalView: React.FC = () => {
  const {
    operationalExpenses,
    addOperationalExpense,
    updateOperationalExpense,
    deleteOperationalExpense,
    userRole,
  } = useApp();

  // Filters
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL'); // 'ALL' or 'YYYY-MM'
  const [selectedKategori, setSelectedKategori] = useState<string>('ALL');
  const [selectedJenis, setSelectedJenis] = useState<'ALL' | 'KAS_KELUAR' | 'KAS_MASUK'>('ALL');
  const [selectedAkun, setSelectedAkun] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OperationalExpense | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; item?: OperationalExpense }>({ isOpen: false });
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Form State
  const [formTanggal, setFormTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [formJenis, setFormJenis] = useState<JenisKasOperasional>('KAS_KELUAR');
  const [formKategori, setFormKategori] = useState<string>('GAJI');
  const [formNominal, setFormNominal] = useState<string>('');
  const [formAkunKas, setFormAkunKas] = useState<string>('BCA Perusahaan');
  const [formDeskripsi, setFormDeskripsi] = useState<string>('');
  const [formPenerima, setFormPenerima] = useState<string>('');
  const [formReferensi, setFormReferensi] = useState<string>('');
  const [formLampiranUrl, setFormLampiranUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available months
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    operationalExpenses.forEach((item) => {
      if (item.tanggal) {
        set.add(item.tanggal.substring(0, 7));
      }
    });
    set.add(new Date().toISOString().substring(0, 7));
    return Array.from(set).sort().reverse();
  }, [operationalExpenses]);

  // Filtered List
  const filteredList = useMemo(() => {
    return operationalExpenses.filter((item) => {
      if (selectedMonth !== 'ALL') {
        const itemMonth = item.tanggal ? item.tanggal.substring(0, 7) : '';
        if (itemMonth !== selectedMonth) return false;
      }
      if (selectedKategori !== 'ALL' && item.kategori !== selectedKategori) return false;
      if (selectedJenis !== 'ALL' && item.jenis !== selectedJenis) return false;
      if (selectedAkun !== 'ALL' && item.akunKas !== selectedAkun) return false;

      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase();
        const matchDesc = item.deskripsi.toLowerCase().includes(q);
        const matchPenerima = (item.penerimaPenyetor || '').toLowerCase().includes(q);
        const matchRef = (item.referensiNomor || '').toLowerCase().includes(q);
        const matchKat = item.kategori.toLowerCase().includes(q);
        if (!matchDesc && !matchPenerima && !matchRef && !matchKat) return false;
      }

      return true;
    });
  }, [operationalExpenses, selectedMonth, selectedKategori, selectedJenis, selectedAkun, searchTerm]);

  // KPI Metrics (Calculated based on current month/filter)
  const kpi = useMemo(() => {
    let totalMasuk = 0;
    let totalKeluar = 0;
    const categoryBreakdown: Record<string, number> = {};
    const accountBreakdown: Record<string, { masuk: number; keluar: number; balance: number }> = {};

    filteredList.forEach((item) => {
      const nom = item.nominal || 0;
      const akun = item.akunKas || 'BCA Perusahaan';

      if (!accountBreakdown[akun]) {
        accountBreakdown[akun] = { masuk: 0, keluar: 0, balance: 0 };
      }

      if (item.jenis === 'KAS_MASUK') {
        totalMasuk += nom;
        accountBreakdown[akun].masuk += nom;
        accountBreakdown[akun].balance += nom;
      } else {
        totalKeluar += nom;
        categoryBreakdown[item.kategori] = (categoryBreakdown[item.kategori] || 0) + nom;
        accountBreakdown[akun].keluar += nom;
        accountBreakdown[akun].balance -= nom;
      }
    });

    const netCashFlow = totalMasuk - totalKeluar;

    return {
      totalMasuk,
      totalKeluar,
      netCashFlow,
      categoryBreakdown,
      accountBreakdown,
      count: filteredList.length,
    };
  }, [filteredList]);

  // Handle open modal for Create
  const handleOpenCreateModal = (defaultJenis: JenisKasOperasional = 'KAS_KELUAR') => {
    setEditingItem(null);
    setFormTanggal(new Date().toISOString().split('T')[0]);
    setFormJenis(defaultJenis);
    setFormKategori(defaultJenis === 'KAS_KELUAR' ? 'GAJI' : 'MODAL_MASUK');
    setFormNominal('');
    setFormAkunKas('BCA Perusahaan');
    setFormDeskripsi('');
    setFormPenerima('');
    setFormReferensi('');
    setFormLampiranUrl('');
    setIsModalOpen(true);
  };

  // Handle open modal for Edit
  const handleOpenEditModal = (item: OperationalExpense) => {
    setEditingItem(item);
    setFormTanggal(item.tanggal);
    setFormJenis(item.jenis);
    setFormKategori(item.kategori);
    setFormNominal(item.nominal.toString());
    setFormAkunKas(item.akunKas || 'BCA Perusahaan');
    setFormDeskripsi(item.deskripsi);
    setFormPenerima(item.penerimaPenyetor || '');
    setFormReferensi(item.referensiNomor || '');
    setFormLampiranUrl(item.lampiranUrl || '');
    setIsModalOpen(true);
  };

  // Handle Image Upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran file maksimal 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormLampiranUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedNominal = parseRupiahInput(formNominal);

    if (parsedNominal <= 0) {
      alert('Nominal harus lebih dari 0!');
      return;
    }
    if (!formDeskripsi.trim()) {
      alert('Keterangan / Deskripsi wajib diisi!');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await updateOperationalExpense(editingItem.id, {
          tanggal: formTanggal,
          jenis: formJenis,
          kategori: formKategori,
          nominal: parsedNominal,
          akunKas: formAkunKas,
          deskripsi: formDeskripsi.trim(),
          penerimaPenyetor: formPenerima.trim() || undefined,
          referensiNomor: formReferensi.trim() || undefined,
          lampiranUrl: formLampiranUrl || undefined,
        });
      } else {
        await addOperationalExpense({
          tanggal: formTanggal,
          jenis: formJenis,
          kategori: formKategori,
          nominal: parsedNominal,
          akunKas: formAkunKas,
          deskripsi: formDeskripsi.trim(),
          penerimaPenyetor: formPenerima.trim() || undefined,
          referensiNomor: formReferensi.trim() || undefined,
          lampiranUrl: formLampiranUrl || undefined,
        });
      }
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      alert(`Gagal menyimpan: ${err.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export CSV
  const exportToCSV = () => {
    const headers = ['Tanggal', 'Jenis', 'Kategori', 'Deskripsi', 'Nominal', 'Akun Kas', 'Penerima/Penyetor', 'No. Referensi'];
    const rows = filteredList.map((item) => [
      item.tanggal,
      item.jenis === 'KAS_KELUAR' ? 'PENGELUARAN (OPEX)' : 'PEMASUKAN',
      item.kategori,
      `"${item.deskripsi.replace(/"/g, '""')}"`,
      item.nominal,
      `"${item.akunKas}"`,
      `"${(item.penerimaPenyetor || '').replace(/"/g, '""')}"`,
      `"${(item.referensiNomor || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Kas_Operasional_Maison_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-lg mb-2 border border-rose-100">
              <Wallet className="w-3.5 h-3.5" />
              Kas Operasional & Beban Usaha (OPEX)
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Beban Operasional & Arus Kas Internal
            </h1>
            <p className="text-slate-500 text-xs mt-1 max-w-2xl leading-relaxed">
              Catat pengeluaran rutin konveksi (gaji staf tetap, sewa, listrik, server, pemeliharaan mesin, dan ATK). Data ini otomatis terhubung dan mengurangi Laba Bersih di modul Analisis Margin & Laba.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={exportToCSV}
              className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-200 transition-base cursor-pointer"
              title="Unduh data dalam format CSV"
            >
              <Download className="w-4 h-4 text-slate-500" />
              Export CSV
            </button>

            <button
              onClick={() => handleOpenCreateModal('KAS_MASUK')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-base shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Catat Kas Masuk
            </button>

            <button
              onClick={() => handleOpenCreateModal('KAS_KELUAR')}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-base shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Catat Beban OPEX
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Beban OPEX */}
        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Beban OPEX</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-700 tracking-tight">
            {formatRp(kpi.totalKeluar)}
          </div>
          <p className="text-xs text-slate-400">
            {filteredList.filter((i) => i.jenis === 'KAS_KELUAR').length} transaksi beban operasional
          </p>
        </div>

        {/* Kas Masuk Lainnya */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Kas Masuk Non-Produksi</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700 tracking-tight">
            {formatRp(kpi.totalMasuk)}
          </div>
          <p className="text-xs text-slate-400">
            {filteredList.filter((i) => i.jenis === 'KAS_MASUK').length} transaksi kas masuk
          </p>
        </div>

        {/* Arus Kas Bersih (Net Cash Flow) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Net Arus Kas Operasional</span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${kpi.netCashFlow >= 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
              <CreditCard className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className={`text-2xl font-bold tracking-tight ${kpi.netCashFlow >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
            {kpi.netCashFlow >= 0 ? `+ ${formatRp(kpi.netCashFlow)}` : `- ${formatRp(Math.abs(kpi.netCashFlow))}`}
          </div>
          <p className="text-xs text-slate-400">
            Selisih kas masuk vs beban keluar periode ini
          </p>
        </div>

        {/* Akun Kas Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Saldo Akun Dompet</span>
            <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
              <Wallet className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1 pt-0.5">
            {Object.keys(kpi.accountBreakdown).length === 0 ? (
              <span className="text-xs text-slate-400">Belum ada mutasi akun</span>
            ) : (
              Object.entries(kpi.accountBreakdown).slice(0, 2).map(([accName, val]) => (
                <div key={accName} className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium truncate max-w-[130px]">{accName}</span>
                  <span className={`font-bold tabular-nums ${val.balance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                    {val.balance >= 0 ? `+${formatRp(val.balance)}` : `-${formatRp(Math.abs(val.balance))}`}
                  </span>
                </div>
              ))
            )}
          </div>
          <p className="text-[11px] text-slate-400">Arus berjalan per sumber kas</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari deskripsi pengeluaran, penerima, atau nomor referensi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters Selects */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Bulan */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer text-xs"
              >
                <option value="ALL">Semua Bulan</option>
                {availableMonths.map((m) => {
                  const [y, mon] = m.split('-');
                  const d = new Date(parseInt(y, 10), parseInt(mon, 10) - 1, 1);
                  const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
                  return (
                    <option key={m} value={m}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Filter Jenis */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={selectedJenis}
                onChange={(e) => setSelectedJenis(e.target.value as any)}
                className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer text-xs"
              >
                <option value="ALL">Semua Jenis</option>
                <option value="KAS_KELUAR">Kas Keluar (OPEX)</option>
                <option value="KAS_MASUK">Kas Masuk</option>
              </select>
            </div>

            {/* Filter Kategori */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs">
              <select
                value={selectedKategori}
                onChange={(e) => setSelectedKategori(e.target.value)}
                className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer text-xs"
              >
                <option value="ALL">Semua Kategori</option>
                {OPEX_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Akun Kas */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs">
              <Wallet className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={selectedAkun}
                onChange={(e) => setSelectedAkun(e.target.value)}
                className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer text-xs"
              >
                <option value="ALL">Semua Akun</option>
                {AKUN_KAS_OPTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Rincian Transaksi Kas Operasional</h2>
            <p className="text-xs text-slate-400 mt-0.5">Menampilkan {filteredList.length} transaksi</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Kategori & Jenis</th>
                <th className="py-3 px-4">Keterangan / Keperluan</th>
                <th className="py-3 px-4">Penerima / Penyetor</th>
                <th className="py-3 px-4">Akun Kas</th>
                <th className="py-3 px-4">Bukti / Nota</th>
                <th className="py-3 px-4 text-right">Nominal (Rp)</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Wallet className="w-8 h-8 text-slate-300" />
                      <p className="font-medium text-slate-500">Belum ada transaksi kas operasional yang tercatat</p>
                      <p className="text-xs text-slate-400">Klik "Catat Beban OPEX" untuk menambahkan pengeluaran baru.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => {
                  const catConfig = OPEX_CATEGORIES.find((c) => c.key === item.kategori) || OPEX_CATEGORIES[7];
                  const Icon = catConfig.icon;
                  const isKeluar = item.jenis === 'KAS_KELUAR';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                        {formatDateIndo(item.tanggal)}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${catConfig.color}`}>
                            <Icon className="w-3.5 h-3.5" />
                            {catConfig.label}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-900 line-clamp-1">{item.deskripsi}</div>
                        {item.referensiNomor && (
                          <div className="text-[11px] text-slate-400 mt-0.5">Ref: {item.referensiNomor}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {item.penerimaPenyetor || <span className="text-slate-400 italic">-</span>}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          <CreditCard className="w-3 h-3 text-slate-500" />
                          {item.akunKas || 'BCA Perusahaan'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.lampiranUrl ? (
                          <button
                            onClick={() => setPreviewImage(item.lampiranUrl || null)}
                            className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            Lihat Nota
                          </button>
                        ) : (
                          <span className="text-slate-300 text-[11px] italic">Tidak ada</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold tabular-nums">
                        {isKeluar ? (
                          <span className="text-rose-600 flex items-center justify-end gap-1">
                            <ArrowDownRight className="w-3.5 h-3.5" />
                            - {formatRp(item.nominal)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 flex items-center justify-end gap-1">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            + {formatRp(item.nominal)}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Transaksi"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, item })}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Tambah / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${formJenis === 'KAS_KELUAR' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {formJenis === 'KAS_KELUAR' ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingItem ? 'Edit Transaksi Kas Operasional' : formJenis === 'KAS_KELUAR' ? 'Catat Beban Operasional (OPEX)' : 'Catat Kas Masuk Non-Produksi'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Pastikan data pengeluaran/pemasukan diisi dengan benar.</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {/* Jenis Toggle */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Jenis Transaksi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormJenis('KAS_KELUAR');
                      if (formKategori === 'MODAL_MASUK') setFormKategori('GAJI');
                    }}
                    className={`py-2 px-3 rounded-xl font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      formJenis === 'KAS_KELUAR'
                        ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <TrendingDown className="w-4 h-4" />
                    Beban (Kas Keluar)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormJenis('KAS_MASUK');
                      setFormKategori('MODAL_MASUK');
                    }}
                    className={`py-2 px-3 rounded-xl font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      formJenis === 'KAS_MASUK'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    Pemasukan (Kas Masuk)
                  </button>
                </div>
              </div>

              {/* Tanggal & Akun Kas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Transaksi</label>
                  <input
                    type="date"
                    required
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Akun Kas / Sumber Dana</label>
                  <select
                    value={formAkunKas}
                    onChange={(e) => setFormAkunKas(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {AKUN_KAS_OPTIONS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Kategori */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kategori Biaya / Alokasi</label>
                <select
                  value={formKategori}
                  onChange={(e) => setFormKategori(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {OPEX_CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nominal */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nominal (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-slate-500">Rp</span>
                  <input
                    type="text"
                    required
                    placeholder="0"
                    value={formNominal}
                    onChange={(e) => setFormNominal(formatRupiahInput(e.target.value))}
                    className="w-full pl-10 pr-3 py-2.5 font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan / Keperluan</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh: Gaji staf admin bulan Oktober, atau Bayar sewa server VPS 6 bulan"
                  value={formDeskripsi}
                  onChange={(e) => setFormDeskripsi(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Penerima / Penyetor & Referensi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Penerima / Penyetor (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Nama staf / vendor"
                    value={formPenerima}
                    onChange={(e) => setFormPenerima(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. Nota / Kwitansi (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: INV-2026-001"
                    value={formReferensi}
                    onChange={(e) => setFormReferensi(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Upload Foto Nota / Struk */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lampiran Struk / Bukti Transfer (Opsional)</label>
                {formLampiranUrl ? (
                  <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={formLampiranUrl} alt="Bukti" className="w-12 h-12 object-cover rounded-lg border border-slate-200" />
                      <span className="text-xs text-slate-600 font-medium">Struk terlampir</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormLampiranUrl('')}
                      className="text-rose-600 hover:text-rose-700 text-xs font-semibold px-2 py-1 bg-rose-50 rounded-lg cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-xs transition-base cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : editingItem ? 'Perbarui Transaksi' : 'Simpan Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Preview Gambar Struk */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh] bg-white rounded-2xl overflow-hidden p-2 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-slate-900/60 hover:bg-slate-900 text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={previewImage} alt="Preview Bukti" className="max-w-full max-h-[85vh] object-contain rounded-xl" />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Hapus Transaksi Kas Operasional"
        message={`Apakah Anda yakin ingin menghapus transaksi "${deleteModal.item?.deskripsi}" senilai ${formatRp(deleteModal.item?.nominal || 0)}? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Transaksi"
        cancelText="Batal"
        variant="danger"
        onConfirm={async () => {
          if (deleteModal.item) {
            await deleteOperationalExpense(deleteModal.item.id);
          }
          setDeleteModal({ isOpen: false });
        }}
        onClose={() => setDeleteModal({ isOpen: false })}
      />
    </div>
  );
};
