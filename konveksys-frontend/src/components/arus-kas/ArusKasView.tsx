import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PembayaranBrand, MetodePembayaran } from '../../types';
import { formatRupiahInput, parseRupiahInput, formatDateIndo } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  TrendingUp,
  Plus,
  Trash2,
  X,
  ArrowDownCircle,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Banknote,
  Search,
  CreditCard,
} from 'lucide-react';

const METODE_OPTIONS: { value: MetodePembayaran; label: string }[] = [
  { value: 'TRANSFER', label: 'Transfer Bank' },
  { value: 'TUNAI', label: 'Tunai / Cash' },
  { value: 'CEK', label: 'Cek' },
  { value: 'GIRO', label: 'Giro' },
];

const metodeBadge = (metode: MetodePembayaran) => {
  const styles: Record<MetodePembayaran, string> = {
    TRANSFER: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    TUNAI: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    CEK: 'bg-amber-50 text-amber-700 border-amber-100',
    GIRO: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${styles[metode]}`}>
      {metode}
    </span>
  );
};

export const ArusKasView: React.FC = () => {
  const {
    brands,
    pembayaranList,
    addPembayaran,
    deletePembayaran,
    getArusKasSummary,
    userRole,
    activeBrand,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState(userRole === 'BRAND' ? activeBrand : 'ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    item?: PembayaranBrand;
  }>({ isOpen: false });
  const [form, setForm] = useState({
    brand: userRole === 'BRAND' ? activeBrand : brands[0]?.name || 'GREYWOLF',
    tanggal: new Date().toISOString().split('T')[0],
    jumlah: 0,
    metode: 'TRANSFER' as MetodePembayaran,
    keterangan: '',
    referensiNomor: '',
  });

  const formatRp = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

  const arusKasSummary = getArusKasSummary();

  // Filter pembayaran
  const filteredPembayaran = pembayaranList.filter(p => {
    const effectiveBrand = userRole === 'BRAND' ? activeBrand : brandFilter;
    const matchBrand = effectiveBrand === 'ALL' || p.brand === effectiveBrand;
    const matchSearch =
      p.keterangan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.referensiNomor || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchBrand && matchSearch;
  });

  // Summary untuk header
  const visibleSummary = userRole === 'BRAND'
    ? arusKasSummary.filter(s => s.brand === activeBrand)
    : arusKasSummary;

  const totalTagihanAll = visibleSummary.reduce((a, b) => a + b.totalTagihan, 0);
  const totalTerbayarAll = visibleSummary.reduce((a, b) => a + b.totalTerbayar, 0);
  const totalOutstandingAll = visibleSummary.reduce((a, b) => a + b.outstanding, 0);

  const handleOpenModal = () => {
    setForm({
      brand: userRole === 'BRAND' ? activeBrand : brands[0]?.name || 'GREYWOLF',
      tanggal: new Date().toISOString().split('T')[0],
      jumlah: 0,
      metode: 'TRANSFER',
      keterangan: '',
      referensiNomor: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.jumlah <= 0) {
      alert('Nominal pembayaran harus lebih dari 0!');
      return;
    }
    if (!form.keterangan.trim()) {
      alert('Keterangan pembayaran wajib diisi!');
      return;
    }
    const targetBrand = userRole === 'BRAND' ? activeBrand : form.brand;
    await addPembayaran({
      brand: targetBrand,
      tanggal: form.tanggal,
      jumlah: Number(form.jumlah),
      metode: form.metode,
      keterangan: form.keterangan,
      referensiNomor: form.referensiNomor || undefined,
    });
    setIsModalOpen(false);
  };

  const handleDelete = (p: PembayaranBrand) => {
    setDeleteModal({ isOpen: true, item: p });
  };

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="bg-white rounded-xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg mb-2 border border-indigo-100">
              <TrendingUp className="w-3.5 h-3.5" />
              {userRole === 'ADMIN' ? 'Manajemen Arus Kas Semua Brand' : `Arus Kas • ${activeBrand}`}
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pencatatan Pembayaran Brand</h1>
            <p className="text-slate-500 text-xs mt-1 max-w-xl leading-relaxed">
              {userRole === 'ADMIN'
                ? 'Catat pembayaran masuk dari brand — termasuk cicilan & pembayaran parsial. Lacak outstanding tagihan secara real-time.'
                : 'Informasi tagihan, riwayat transfer pembayaran Anda ke konveksi, dan sisa outstanding secara real-time.'}
            </p>
          </div>

          <button
            onClick={handleOpenModal}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-base btn-press shadow-sm shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {userRole === 'ADMIN' ? 'Catat Pembayaran' : 'Catat Bukti Transfer'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Tagihan */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Tagihan</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Banknote className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-0.5">{formatRp(totalTagihanAll)}</div>
          <p className="text-xs text-slate-400">Akumulasi dari semua surat jalan</p>
        </div>

        {/* Sudah Terbayar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Sudah Terbayar</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-0.5">{formatRp(totalTerbayarAll)}</div>
          <p className="text-xs text-slate-400">{filteredPembayaran.length} transaksi tercatat</p>
        </div>

        {/* Outstanding */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Outstanding</span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${totalOutstandingAll > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className={`text-2xl font-bold mt-0.5 ${totalOutstandingAll > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
            {formatRp(totalOutstandingAll)}
          </div>
          <p className="text-xs text-slate-400">Sisa tagihan belum dilunasi</p>
        </div>
      </div>

      {/* Per-Brand Status Cards (Admin only) */}
      {userRole === 'ADMIN' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h2 className="font-semibold text-slate-900 text-sm">Status Piutang Per Brand</h2>
            <span className="text-[11px] text-slate-400">Real-time dari surat jalan &amp; pembayaran</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {arusKasSummary.map(summary => (
              <div key={summary.brand} className="p-4 rounded-lg border border-slate-100 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <Building2 className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-800">{summary.brand}</span>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    summary.persentase >= 100
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : summary.persentase >= 50
                      ? 'bg-amber-50 text-amber-700 border-amber-100'
                      : 'bg-red-50 text-red-600 border-red-100'
                  }`}>
                    {summary.persentase}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      summary.persentase >= 100
                        ? 'bg-emerald-500'
                        : summary.persentase >= 50
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, summary.persentase)}%` }}
                  />
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between text-slate-500">
                    <span>Tagihan</span>
                    <span className="font-medium text-slate-700">{formatRp(summary.totalTagihan)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Terbayar</span>
                    <span className="font-medium text-emerald-700">{formatRp(summary.totalTerbayar)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1 mt-1">
                    <span className="font-medium text-slate-600">Outstanding</span>
                    <span className={`font-semibold ${summary.outstanding > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {summary.outstanding > 0 ? formatRp(summary.outstanding) : 'LUNAS ✓'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabel Riwayat Pembayaran */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-semibold text-slate-900 text-sm">
            Riwayat Pembayaran ({filteredPembayaran.length} Transaksi)
          </h2>

          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari keterangan / brand..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-base w-52"
              />
            </div>

            {/* Filter brand */}
            {userRole === 'ADMIN' && (
              <select
                value={brandFilter}
                onChange={e => setBrandFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 transition-base"
              >
                <option value="ALL">Semua Brand</option>
                {brands.map(b => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
              </select>
            )}

            {/* Tombol tambah di sini juga (untuk mobile convenience) */}
            <button
              onClick={handleOpenModal}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-base btn-press shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              {userRole === 'ADMIN' ? 'Catat' : 'Catat Transfer'}
            </button>
          </div>
        </div>

        {filteredPembayaran.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ArrowDownCircle className="w-6 h-6" />
            </div>
            <div className="text-sm font-medium text-slate-500">Belum ada pembayaran tercatat</div>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              {userRole === 'ADMIN'
                ? 'Catat pembayaran masuk dari brand menggunakan tombol "+ Catat Pembayaran" di atas.'
                : 'Catat pembayaran yang telah Anda transfer menggunakan tombol "+ Catat Bukti Transfer" di atas.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-100">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Tanggal</th>
                  <th className="p-3.5 text-center whitespace-nowrap">Brand</th>
                  <th className="p-3.5">Nominal</th>
                  <th className="p-3.5">Metode</th>
                  <th className="p-3.5">Keterangan</th>
                  <th className="p-3.5">No. Referensi</th>
                  {userRole === 'ADMIN' && <th className="p-3.5 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredPembayaran.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-base">
                    <td className="p-3.5 font-medium text-slate-700">{formatDateIndo(p.tanggal)}</td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold text-[10px] border border-indigo-100 whitespace-nowrap">
                        {p.brand}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-emerald-600">{formatRp(p.jumlah)}</td>
                    <td className="p-3.5">{metodeBadge(p.metode)}</td>
                    <td className="p-3.5 text-slate-600 max-w-[200px] truncate">{p.keterangan}</td>
                    <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                      {p.referensiNomor || <span className="text-slate-300">—</span>}
                    </td>
                    {userRole === 'ADMIN' && (
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleDelete(p)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-base btn-press"
                          title="Hapus pencatatan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah Pembayaran */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-lg border border-slate-200 space-y-5 animate-slideUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-semibold text-slate-900 text-base">
                  {userRole === 'ADMIN' ? 'Catat Pembayaran Masuk' : 'Konfirmasi Transfer Pembayaran'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {userRole === 'ADMIN'
                    ? 'Rekam pembayaran dari brand (bisa cicilan)'
                    : 'Input pembayaran yang telah Anda transfer ke Admin / Konveksi'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg btn-press"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1.5">Brand / Klien</label>
                  {userRole === 'BRAND' ? (
                    <div className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-semibold flex items-center justify-between">
                      <span className="truncate">{activeBrand}</span>
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium shrink-0">Brand Anda</span>
                    </div>
                  ) : (
                    <select
                      value={form.brand}
                      onChange={e => setForm({ ...form, brand: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-400 transition-base"
                    >
                      {brands.map(b => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-medium text-slate-600 mb-1.5">
                    {userRole === 'ADMIN' ? 'Tanggal Bayar' : 'Tanggal Transfer'}
                  </label>
                  <input
                    type="date"
                    value={form.tanggal}
                    onChange={e => setForm({ ...form, tanggal: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-400 transition-base"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1.5">Nominal Pembayaran (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-medium">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatRupiahInput(form.jumlah)}
                    onChange={e => setForm({ ...form, jumlah: parseRupiahInput(e.target.value) })}
                    placeholder="0"
                    className="w-full pl-9 pr-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-400 transition-base font-semibold text-emerald-700"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1.5">Metode Pembayaran</label>
                  <select
                    value={form.metode}
                    onChange={e => setForm({ ...form, metode: e.target.value as MetodePembayaran })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-400 transition-base"
                  >
                    {METODE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-600 mb-1.5">No. Referensi / Bukti</label>
                  <input
                    type="text"
                    value={form.referensiNomor}
                    onChange={e => setForm({ ...form, referensiNomor: e.target.value })}
                    placeholder="TRF-xxx / opsional"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-400 transition-base font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1.5">Keterangan</label>
                <input
                  type="text"
                  value={form.keterangan}
                  onChange={e => setForm({ ...form, keterangan: e.target.value })}
                  placeholder="Misal: Cicilan ke-1, DP pesanan bulan ini..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-400 transition-base"
                  required
                />
              </div>

              {/* Info ringkas outstanding */}
              {form.brand && (() => {
                const s = getArusKasSummary().find(x => x.brand === form.brand);
                if (!s || s.totalTagihan === 0) return null;
                return (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-[11px] space-y-1">
                    <div className="font-semibold text-indigo-700 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      Status Piutang {form.brand}
                    </div>
                    <div className="flex justify-between text-indigo-600">
                      <span>Total Tagihan</span>
                      <span className="font-medium">{formatRp(s.totalTagihan)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700">
                      <span>Sudah Terbayar</span>
                      <span className="font-medium">{formatRp(s.totalTerbayar)}</span>
                    </div>
                    <div className="flex justify-between border-t border-indigo-100 pt-1 font-semibold">
                      <span className="text-slate-700">Outstanding</span>
                      <span className={s.outstanding > 0 ? 'text-red-600' : 'text-emerald-600'}>
                        {s.outstanding > 0 ? formatRp(s.outstanding) : 'LUNAS'}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-base btn-press"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-base btn-press shadow-sm"
                >
                  {userRole === 'ADMIN' ? 'Simpan Pembayaran' : 'Kirim Bukti Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus Pembayaran */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        onConfirm={async () => {
          if (deleteModal.item) {
            await deletePembayaran(deleteModal.item.id);
            setDeleteModal({ isOpen: false });
          }
        }}
        title="Hapus Pembayaran Brand?"
        variant="danger"
        confirmText="Ya, Hapus Pembayaran"
        cancelText="Batal"
        message={
          deleteModal.item ? (
            <span>
              Apakah Anda yakin ingin menghapus pencatatan pembayaran{' '}
              <strong className="text-slate-900">{formatRp(deleteModal.item.jumlah)}</strong> dari{' '}
              <strong className="text-slate-900">{deleteModal.item.brand}</strong>?
            </span>
          ) : (
            'Apakah Anda yakin ingin menghapus pembayaran ini?'
          )
        }
        note="Data pencatatan kas masuk ini akan dihapus dan total akumulasi terbayar brand akan disesuaikan."
      />
    </div>
  );
};
