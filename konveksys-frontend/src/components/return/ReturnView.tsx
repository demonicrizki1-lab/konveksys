import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ReturnItem, ReturnStatus, ReturnSource, SizeBreakdown } from '../../types';
import { formatDateIndo } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  RotateCcw,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  X,
  Eye,
  Printer,
  Wrench,
  XCircle,
  Truck,
  Building2,
  Trash2,
  ArrowRight,
  Sparkles,
  AlertCircle,
  ClipboardList,
} from 'lucide-react';

export const ReturnView: React.FC = () => {
  const {
    returnList,
    createReturn,
    updateReturnStatus,
    deleteReturn,
    spkList,
    suratJalanList,
    userRole,
    activeBrand,
    brands,
    vendors,
  } = useApp();

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState(userRole === 'BRAND' ? activeBrand : 'ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');

  // Modal State: Create Return
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    item?: ReturnItem;
  }>({ isOpen: false });
  const [sumber, setSumber] = useState<ReturnSource>(userRole === 'BRAND' ? 'BRAND_COMPLAINT' : 'INTERNAL_QC');
  const [selectedSPKId, setSelectedSPKId] = useState<string>('');
  const [selectedSJId, setSelectedSJId] = useState<string>('');
  const [brand, setBrand] = useState<string>(userRole === 'BRAND' ? activeBrand : (brands[0]?.name || ''));
  const [produk, setProduk] = useState<string>('');
  const [vendor, setVendor] = useState<string>(vendors[0]?.name || '');
  const [kategoriCacat, setKategoriCacat] = useState<string>('JAHITAN');
  const [alasanCacat, setAlasanCacat] = useState<string>('');
  const [catatan, setCatatan] = useState<string>('');
  const [qtyBreakdown, setQtyBreakdown] = useState<SizeBreakdown>({
    s: 0,
    m: 0,
    l: 0,
    xl: 0,
    xxl: 0,
    anak4: 0,
    anak6: 0,
    anak8: 0,
    anak10: 0,
    anak12: 0,
    anak14: 0,
    anak16: 0,
  });

  // Modal State: Detail & Rework Completion & Print
  const [selectedReturnDetail, setSelectedReturnDetail] = useState<ReturnItem | null>(null);
  const [selectedPrintReturn, setSelectedPrintReturn] = useState<ReturnItem | null>(null);
  const [completingReturn, setCompletingReturn] = useState<ReturnItem | null>(null);
  const [reworkSuccessQty, setReworkSuccessQty] = useState<number>(0);
  const [reworkRejectQty, setReworkRejectQty] = useState<number>(0);
  const [reworkNote, setReworkNote] = useState<string>('');

  // Hitung Total Pcs Form
  const totalFormPcs =
    qtyBreakdown.s +
    qtyBreakdown.m +
    qtyBreakdown.l +
    qtyBreakdown.xl +
    qtyBreakdown.xxl +
    qtyBreakdown.anak4 +
    qtyBreakdown.anak6 +
    qtyBreakdown.anak8 +
    qtyBreakdown.anak10 +
    qtyBreakdown.anak12 +
    qtyBreakdown.anak14 +
    qtyBreakdown.anak16;

  // Filtered List
  const filteredReturns = returnList.filter((item) => {
    const effectiveBrand = userRole === 'BRAND' ? activeBrand : brandFilter;
    const matchBrand = effectiveBrand === 'ALL' || item.brand === effectiveBrand;
    const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchSource = sourceFilter === 'ALL' || item.sumber === sourceFilter;
    const matchSearch =
      item.noRetur.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.produk.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.alasanCacat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchTerm.toLowerCase());

    return matchBrand && matchStatus && matchSource && matchSearch;
  });

  // KPI Metrics
  const relevantList = userRole === 'BRAND' ? returnList.filter((r) => r.brand === activeBrand) : returnList;
  const kpiTotal = relevantList.length;
  const kpiInVendor = relevantList.filter((r) => r.status === 'DIKIRIM_KE_VENDOR' || r.status === 'DIAJUKAN').length;
  const kpiReworkDone = relevantList.filter((r) => r.status === 'SELESAI_REWORK').length;
  const kpiRejectTotal = relevantList.filter((r) => r.status === 'REJECT_TOTAL').length;

  // Handle Sumber Switch in Modal Form
  const handleSourceChange = (newSource: ReturnSource) => {
    setSumber(newSource);
    if (newSource === 'INTERNAL_QC') {
      if (spkList.length > 0) {
        const firstSpk = spkList[0];
        setSelectedSPKId(firstSpk.id);
        setBrand(firstSpk.brand);
        setProduk(firstSpk.produk);
        setVendor(firstSpk.vendor);
      }
    } else {
      const brandSJs = userRole === 'BRAND' ? suratJalanList.filter((sj) => sj.brand === activeBrand) : suratJalanList;
      if (brandSJs.length > 0) {
        const firstSJ = brandSJs[0];
        setSelectedSJId(firstSJ.id);
        setBrand(firstSJ.brand);
        setProduk(firstSJ.produk || '');
        setVendor(firstSJ.vendor || '');
      }
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setSumber(userRole === 'BRAND' ? 'BRAND_COMPLAINT' : 'INTERNAL_QC');
    if (userRole === 'BRAND') {
      const brandSJs = suratJalanList.filter((sj) => sj.brand === activeBrand);
      if (brandSJs.length > 0) {
        setSelectedSJId(brandSJs[0].id);
        setBrand(activeBrand);
        setProduk(brandSJs[0].produk || '');
        setVendor(brandSJs[0].vendor || '');
      }
    } else {
      if (spkList.length > 0) {
        setSelectedSPKId(spkList[0].id);
        setBrand(spkList[0].brand);
        setProduk(spkList[0].produk || '');
        setVendor(spkList[0].vendor || '');
      }
    }
    setKategoriCacat('JAHITAN');
    setAlasanCacat('');
    setCatatan('');
    setQtyBreakdown({ s: 0, m: 0, l: 0, xl: 0, xxl: 0, anak4: 0, anak6: 0, anak8: 0, anak10: 0, anak12: 0, anak14: 0, anak16: 0 });
    setIsCreateModalOpen(true);
  };

  // Handle SPK Select Change
  const handleSPKChange = (spkId: string) => {
    setSelectedSPKId(spkId);
    const matched = spkList.find((s) => s.id === spkId);
    if (matched) {
      setBrand(matched.brand);
      setProduk(matched.produk || '');
      setVendor(matched.vendor || '');
    }
  };

  // Handle Surat Jalan Select Change
  const handleSJChange = (sjId: string) => {
    setSelectedSJId(sjId);
    const matched = suratJalanList.find((sj) => sj.id === sjId);
    if (matched) {
      setBrand(matched.brand);
      setProduk(matched.produk || '');
      setVendor(matched.vendor || '');
    }
  };

  // Submit Create Return
  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalFormPcs <= 0) {
      alert('Harap masukkan minimal 1 pcs barang yang cacat.');
      return;
    }
    if (!alasanCacat.trim()) {
      alert('Harap isi alasan / deskripsi cacat produksi.');
      return;
    }

    const res = await createReturn({
      sumber,
      spkId: sumber === 'INTERNAL_QC' ? selectedSPKId : undefined,
      suratJalanId: sumber === 'BRAND_COMPLAINT' ? selectedSJId : undefined,
      brand,
      produk,
      vendor,
      alasanCacat,
      kategoriCacat,
      catatan,
      qtyBreakdown,
    });

    if (res.success) {
      setIsCreateModalOpen(false);
    }
  };

  // Open Complete Rework Modal
  const handleOpenCompleteRework = (item: ReturnItem) => {
    setCompletingReturn(item);
    setReworkSuccessQty(item.totalPcs);
    setReworkRejectQty(0);
    setReworkNote(`Semua ${item.totalPcs} pcs telah diperbaiki dengan baik dan lolos QC ulang.`);
  };

  // Submit Complete Rework
  const handleSubmitCompleteRework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingReturn) return;

    if (reworkSuccessQty + reworkRejectQty !== completingReturn.totalPcs) {
      alert(
        `Total qty perbaikan (${reworkSuccessQty} lolos + ${reworkRejectQty} BS = ${
          reworkSuccessQty + reworkRejectQty
        } pcs) harus sama dengan total retur (${completingReturn.totalPcs} pcs).`
      );
      return;
    }

    const finalStatus: ReturnStatus = reworkSuccessQty > 0 ? 'SELESAI_REWORK' : 'REJECT_TOTAL';

    await updateReturnStatus(completingReturn.id, {
      status: finalStatus,
      qtyReworked: reworkSuccessQty,
      qtyRejectTotal: reworkRejectQty,
      catatan: reworkNote,
    });

    setCompletingReturn(null);
  };

  // Helper Badge Render
  const renderStatusBadge = (status: ReturnStatus) => {
    switch (status) {
      case 'DIAJUKAN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            Diajukan
          </span>
        );
      case 'DIKIRIM_KE_VENDOR':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
            <Wrench className="w-3 h-3 text-amber-600" />
            Di Vendor (Rework)
          </span>
        );
      case 'SELESAI_REWORK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Selesai Diperbaiki
          </span>
        );
      case 'REJECT_TOTAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-300">
            <XCircle className="w-3 h-3 text-rose-600" />
            Reject Total (BS)
          </span>
        );
      default:
        return null;
    }
  };

  const getKategoriLabel = (cat: string) => {
    switch (cat) {
      case 'JAHITAN':
        return 'Jahitan Rusak / Melompat';
      case 'NODA_KOTOR':
        return 'Noda Minyak / Kotor';
      case 'AKSESORIS':
        return 'Kancing / Aksesoris Kurang';
      case 'UKURAN_LABEL':
        return 'Salah Ukuran / Label';
      case 'KAIN_CACAT':
        return 'Kain Cacat / Bolong';
      default:
        return cat;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {userRole === 'ADMIN' ? 'Pengembalian Barang & Rework (QC Return)' : 'Pengembalian Produk (Retur)'}
              </h1>
              <p className="text-xs text-slate-500">
                {userRole === 'ADMIN'
                  ? 'Manajemen barang cacat produksi, perbaikan di penjahit, dan tracking Surat Jalan Retur'
                  : `Lacak status perbaikan barang retur untuk ${activeBrand}`}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-indigo-600/20 btn-press cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{userRole === 'ADMIN' ? 'Buat Tiket Retur' : 'Ajukan Retur Barang Cacat'}</span>
        </button>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Retur */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-slate-100 text-slate-700 shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-400 block">Total Tiket Retur</span>
            <span className="text-lg font-bold text-slate-900">{kpiTotal} Dokumen</span>
          </div>
        </div>

        {/* Dalam Perbaikan di Vendor */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs flex items-center gap-3.5 bg-amber-50/30">
          <div className="p-3 rounded-xl bg-amber-100 text-amber-700 shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-amber-800/70 block">Sedang di Vendor</span>
            <span className="text-lg font-bold text-amber-900">{kpiInVendor} Dalam Rework</span>
          </div>
        </div>

        {/* Selesai Diperbaiki (Lolos QC) */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs flex items-center gap-3.5 bg-emerald-50/30">
          <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-emerald-800/70 block">Selesai Diperbaiki</span>
            <span className="text-lg font-bold text-emerald-900">{kpiReworkDone} Lolos QC</span>
          </div>
        </div>

        {/* Reject Total / BS */}
        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs flex items-center gap-3.5 bg-rose-50/30">
          <div className="p-3 rounded-xl bg-rose-100 text-rose-700 shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-rose-800/70 block">Reject Total (BS)</span>
            <span className="text-lg font-bold text-rose-900">{kpiRejectTotal} Rusak Permanen</span>
          </div>
        </div>
      </div>

      {/* 3. Toolbar & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari no retur, vendor, produk, alasan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-indigo-500 outline-none transition"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {userRole === 'ADMIN' && (
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">Semua Brand</option>
              {brands.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="DIAJUKAN">Diajukan</option>
            <option value="DIKIRIM_KE_VENDOR">Di Vendor (Rework)</option>
            <option value="SELESAI_REWORK">Selesai Diperbaiki</option>
            <option value="REJECT_TOTAL">Reject Total (BS)</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
          >
            <option value="ALL">Semua Sumber</option>
            <option value="INTERNAL_QC">QC Internal Maison Rayyan</option>
            <option value="BRAND_COMPLAINT">Komplain Mitra Brand</option>
          </select>
        </div>
      </div>

      {/* 4. Tabel Daftar Retur */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">No. Retur & Tanggal</th>
                <th className="py-3 px-4">Sumber</th>
                <th className="py-3 px-4">Brand & Produk</th>
                <th className="py-3 px-4">Vendor Penjahit</th>
                <th className="py-3 px-4">Qty Cacat</th>
                <th className="py-3 px-4">Alasan Cacat</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RotateCcw className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="font-semibold text-slate-600">Tidak ada data pengembalian barang cacat</p>
                    <p className="text-[11px] mt-0.5">Belum ada tiket retur yang dibuat atau sesuai filter.</p>
                  </td>
                </tr>
              ) : (
                filteredReturns.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <strong className="font-mono font-bold text-slate-900 block">{item.noRetur}</strong>
                      <span className="text-[10px] text-slate-400">{formatDateIndo(item.tanggalRetur)}</span>
                    </td>

                    <td className="py-3 px-4">
                      {item.sumber === 'INTERNAL_QC' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          <Building2 className="w-3 h-3" />
                          QC Internal
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <Truck className="w-3 h-3" />
                          Komplain Brand
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{item.produk}</span>
                      <span className="text-[11px] text-slate-500 font-semibold">{item.brand}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-indigo-700">{item.vendor}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-rose-600 block">{item.totalPcs} Pcs</span>
                      <span className="text-[10px] text-slate-400">
                        {Object.entries(item.qtyBreakdown)
                          .filter(([_, q]) => q > 0)
                          .map(([s, q]) => `${s.toUpperCase()}:${q}`)
                          .join(', ')}
                      </span>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <span className="font-bold text-slate-800 block truncate">{getKategoriLabel(item.kategoriCacat)}</span>
                      <span className="text-[11px] text-slate-500 line-clamp-1">{item.alasanCacat}</span>
                    </td>

                    <td className="py-3 px-4">{renderStatusBadge(item.status)}</td>

                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Detail */}
                        <button
                          onClick={() => setSelectedReturnDetail(item)}
                          title="Lihat Rincian"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Cetak Surat Jalan Retur */}
                        <button
                          onClick={() => setSelectedPrintReturn(item)}
                          title="Cetak Surat Jalan Retur"
                          className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Admin Action: Kirim ke Vendor */}
                        {userRole === 'ADMIN' && item.status === 'DIAJUKAN' && (
                          <button
                            onClick={() => updateReturnStatus(item.id, { status: 'DIKIRIM_KE_VENDOR' })}
                            title="Kirim ke Penjahit (Rework)"
                            className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] transition cursor-pointer flex items-center gap-1"
                          >
                            <Truck className="w-3 h-3" />
                            <span>Kirim Vendor</span>
                          </button>
                        )}

                        {/* Admin Action: Konfirmasi Selesai Rework */}
                        {userRole === 'ADMIN' && item.status === 'DIKIRIM_KE_VENDOR' && (
                          <button
                            onClick={() => handleOpenCompleteRework(item)}
                            title="Konfirmasi Selesai Rework"
                            className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition cursor-pointer flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>QC Ulang</span>
                          </button>
                        )}

                        {/* Admin Action: Delete */}
                        {userRole === 'ADMIN' && (
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, item })}
                            title="Hapus Tiket"
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MODAL: Buat Tiket Retur Baru */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-100 space-y-4 my-8 animate-slideUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {userRole === 'ADMIN' ? 'Buat Tiket Pengembalian Barang Cacat' : 'Ajukan Retur Barang Cacat'}
                  </h3>
                  <span className="text-xs text-slate-500">Catat detail kerusakan untuk dikirim ke penjahit</span>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCreate} className="space-y-4 text-xs">
              {/* Pilihan Sumber Retur (Admin Only) */}
              {userRole === 'ADMIN' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">Sumber Pengajuan Retur:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSourceChange('INTERNAL_QC')}
                      className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition ${
                        sumber === 'INTERNAL_QC'
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-bold ring-2 ring-indigo-600/20'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Building2 className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="block text-xs">Internal QC Maison</span>
                        <span className="text-[10px] text-slate-400 font-normal">Saat terima barang dari vendor</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSourceChange('BRAND_COMPLAINT')}
                      className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition ${
                        sumber === 'BRAND_COMPLAINT'
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-bold ring-2 ring-indigo-600/20'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Truck className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="block text-xs">Komplain Mitra Brand</span>
                        <span className="text-[10px] text-slate-400 font-normal">Dari Surat Jalan terkirim</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Rujukan SPK / Surat Jalan */}
              {sumber === 'INTERNAL_QC' ? (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rujukan SPK Cutting:</label>
                  <select
                    value={selectedSPKId}
                    onChange={(e) => handleSPKChange(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:bg-white focus:border-indigo-500"
                    required
                  >
                    {spkList.map((spk) => (
                      <option key={spk.id} value={spk.id}>
                        {spk.spkNumber} • {spk.brand} - {spk.produk} (Vendor: {spk.vendor})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rujukan No. Surat Jalan:</label>
                  <select
                    value={selectedSJId}
                    onChange={(e) => handleSJChange(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:bg-white focus:border-indigo-500"
                    required
                  >
                    {(userRole === 'BRAND' ? suratJalanList.filter((s) => s.brand === activeBrand) : suratJalanList).map(
                      (sj) => (
                        <option key={sj.id} value={sj.id}>
                          {sj.noSuratJalan} • {sj.brand} - {sj.produk} ({sj.totalPcs} pcs via {sj.vendor})
                        </option>
                      )
                    )}
                  </select>
                </div>
              )}

              {/* Info Terkait */}
              <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block">Brand:</span>
                  <strong className="text-slate-900">{brand}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Nama Produk:</span>
                  <strong className="text-slate-900 truncate block">{produk || '-'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Vendor Penjahit:</span>
                  <strong className="text-indigo-700">{vendor}</strong>
                </div>
              </div>

              {/* Kategori Kerusakan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Cacat:</label>
                  <select
                    value={kategoriCacat}
                    onChange={(e) => setKategoriCacat(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:bg-white focus:border-indigo-500"
                  >
                    <option value="JAHITAN">Jahitan Rusak / Melompat / Miring</option>
                    <option value="NODA_KOTOR">Noda Minyak Mesin / Kotoran Kain</option>
                    <option value="AKSESORIS">Kancing / Resleting / Aksesoris Kurang</option>
                    <option value="UKURAN_LABEL">Salah Ukuran / Salah Pasang Label</option>
                    <option value="KAIN_CACAT">Kain Bolong / Cacat Tenun</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Deskripsi Kerusakan:</label>
                  <input
                    type="text"
                    placeholder="Misal: Jahitan kerah melompat 3cm & kancing lepas"
                    value={alasanCacat}
                    onChange={(e) => setAlasanCacat(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:bg-white focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Size Breakdown Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700">Rincian Ukuran yang Cacat (Pcs):</label>
                  <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 text-[11px]">
                    Total Retur: {totalFormPcs} Pcs
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 text-center mb-1">Size S</label>
                    <input
                      type="number"
                      min="0"
                      value={qtyBreakdown.s}
                      onChange={(e) => setQtyBreakdown({ ...qtyBreakdown, s: parseInt(e.target.value) || 0 })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 text-center mb-1">Size M</label>
                    <input
                      type="number"
                      min="0"
                      value={qtyBreakdown.m}
                      onChange={(e) => setQtyBreakdown({ ...qtyBreakdown, m: parseInt(e.target.value) || 0 })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 text-center mb-1">Size L</label>
                    <input
                      type="number"
                      min="0"
                      value={qtyBreakdown.l}
                      onChange={(e) => setQtyBreakdown({ ...qtyBreakdown, l: parseInt(e.target.value) || 0 })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 text-center mb-1">Size XL</label>
                    <input
                      type="number"
                      min="0"
                      value={qtyBreakdown.xl}
                      onChange={(e) => setQtyBreakdown({ ...qtyBreakdown, xl: parseInt(e.target.value) || 0 })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 text-center mb-1">Size 2XL</label>
                    <input
                      type="number"
                      min="0"
                      value={qtyBreakdown.xxl}
                      onChange={(e) => setQtyBreakdown({ ...qtyBreakdown, xxl: parseInt(e.target.value) || 0 })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 text-center mb-1">Anak 4</label>
                    <input
                      type="number"
                      min="0"
                      value={qtyBreakdown.anak4}
                      onChange={(e) =>
                        setQtyBreakdown({ ...qtyBreakdown, anak4: parseInt(e.target.value) || 0 })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 text-center mb-1">Anak 6</label>
                    <input
                      type="number"
                      min="0"
                      value={qtyBreakdown.anak6}
                      onChange={(e) =>
                        setQtyBreakdown({ ...qtyBreakdown, anak6: parseInt(e.target.value) || 0 })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 text-center mb-1">Anak 8</label>
                    <input
                      type="number"
                      min="0"
                      value={qtyBreakdown.anak8}
                      onChange={(e) =>
                        setQtyBreakdown({ ...qtyBreakdown, anak8: parseInt(e.target.value) || 0 })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 text-center mb-1">Anak 10</label>
                    <input
                      type="number"
                      min="0"
                      value={qtyBreakdown.anak10}
                      onChange={(e) =>
                        setQtyBreakdown({ ...qtyBreakdown, anak10: parseInt(e.target.value) || 0 })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 text-center mb-1">Anak 12</label>
                    <input
                      type="number"
                      min="0"
                      value={qtyBreakdown.anak12}
                      onChange={(e) =>
                        setQtyBreakdown({ ...qtyBreakdown, anak12: parseInt(e.target.value) || 0 })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 text-center mb-1">Anak 14</label>
                    <input
                      type="number"
                      min="0"
                      value={qtyBreakdown.anak14}
                      onChange={(e) =>
                        setQtyBreakdown({ ...qtyBreakdown, anak14: parseInt(e.target.value) || 0 })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 text-center mb-1">Anak 16</label>
                    <input
                      type="number"
                      min="0"
                      value={qtyBreakdown.anak16}
                      onChange={(e) =>
                        setQtyBreakdown({ ...qtyBreakdown, anak16: parseInt(e.target.value) || 0 })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Catatan / Instruksi */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan untuk Penjahit:</label>
                <textarea
                  rows={2}
                  placeholder="Misal: Harap dibersihkan noda minyak atau ditindas ulang bagian kerah..."
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:bg-white focus:border-indigo-500"
                ></textarea>
              </div>

              {/* Notice Kebijakan Pembayaran */}
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Kebijakan Finansial:</strong> Barang yang diretur sebanyak <strong>{totalFormPcs} pcs</strong>{' '}
                  tidak akan dihitung dalam pembayaran ke vendor / invoice brand hingga selesai diperbaiki &amp; lolos QC ulang.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={totalFormPcs <= 0}
                  className={`flex-1 py-2.5 text-white font-bold rounded-xl transition shadow-md ${
                    totalFormPcs <= 0
                      ? 'bg-slate-300 cursor-not-allowed shadow-none'
                      : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30 cursor-pointer'
                  }`}
                >
                  Terbitkan Tiket Retur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: Konfirmasi Selesai Rework (QC Ulang) */}
      {completingReturn && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-slideUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">QC Ulang Hasil Perbaikan (Rework)</h3>
                  <span className="text-xs text-slate-500">{completingReturn.noRetur}</span>
                </div>
              </div>
              <button onClick={() => setCompletingReturn(null)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCompleteRework} className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Produk:</span>
                  <strong className="text-slate-800">{completingReturn.produk} ({completingReturn.brand})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vendor Penjahit:</span>
                  <strong className="text-indigo-700">{completingReturn.vendor}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Barang Retur:</span>
                  <strong className="text-rose-600">{completingReturn.totalPcs} Pcs</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <label className="block font-bold text-emerald-900 mb-1">✅ Lolos QC (Bagus):</label>
                  <input
                    type="number"
                    min="0"
                    max={completingReturn.totalPcs}
                    value={reworkSuccessQty}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setReworkSuccessQty(val);
                      setReworkRejectQty(Math.max(0, completingReturn.totalPcs - val));
                    }}
                    className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-center font-bold text-emerald-800 outline-none"
                    required
                  />
                  <span className="text-[10px] text-emerald-700 block mt-1 text-center">Siap dikirim ulang</span>
                </div>

                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <label className="block font-bold text-rose-900 mb-1">❌ Gagal / BS (Rusak):</label>
                  <input
                    type="number"
                    min="0"
                    max={completingReturn.totalPcs}
                    value={reworkRejectQty}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setReworkRejectQty(val);
                      setReworkSuccessQty(Math.max(0, completingReturn.totalPcs - val));
                    }}
                    className="w-full p-2 bg-white border border-rose-300 rounded-lg text-center font-bold text-rose-800 outline-none"
                    required
                  />
                  <span className="text-[10px] text-rose-700 block mt-1 text-center">Barang reject total</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Hasil QC Ulang:</label>
                <input
                  type="text"
                  value={reworkNote}
                  onChange={(e) => setReworkNote(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCompletingReturn(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-md shadow-emerald-600/30"
                >
                  Simpan &amp; Selesaikan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: Detail Rincian Retur */}
      {selectedReturnDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-slideUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{selectedReturnDetail.noRetur}</h3>
                <span className="text-xs text-slate-500">
                  {selectedReturnDetail.brand} • {selectedReturnDetail.produk}
                </span>
              </div>
              <button
                onClick={() => setSelectedReturnDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[10px]">Vendor Penjahit:</span>
                  <strong className="text-slate-900">{selectedReturnDetail.vendor}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Tanggal Retur:</span>
                  <strong className="text-slate-900">{formatDateIndo(selectedReturnDetail.tanggalRetur)}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Sumber Pengajuan:</span>
                  <span className="text-slate-700 font-semibold">
                    {selectedReturnDetail.sumber === 'INTERNAL_QC' ? 'QC Internal Maison Rayyan' : 'Komplain Mitra Brand'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Status:</span>
                  <div>{renderStatusBadge(selectedReturnDetail.status)}</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200">
                <span className="text-amber-800 font-bold block mb-0.5">
                  Kategori: {getKategoriLabel(selectedReturnDetail.kategoriCacat)}
                </span>
                <p className="text-slate-700">{selectedReturnDetail.alasanCacat}</p>
                {selectedReturnDetail.catatan && (
                  <p className="text-[11px] text-slate-500 mt-1 italic">
                    Instruksi: "{selectedReturnDetail.catatan}"
                  </p>
                )}
              </div>

              {/* Size Breakdown Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-center text-xs">
                  <thead className="bg-slate-900 text-white font-bold text-[10px]">
                    <tr>
                      <th className="p-2 text-left pl-3">Ukuran (Size)</th>
                      <th className="p-2">Qty Cacat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(selectedReturnDetail.qtyBreakdown).map(([size, qty]) => {
                      if (qty === 0) return null;
                      return (
                        <tr key={size}>
                          <td className="p-2 text-left pl-3 font-bold uppercase">{size.replace('anak', 'Anak ')}</td>
                          <td className="p-2 font-bold text-rose-600">{qty} Pcs</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-50 font-bold">
                      <td className="p-2 text-left pl-3">Total Barang Cacat</td>
                      <td className="p-2 text-rose-600">{selectedReturnDetail.totalPcs} Pcs</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Rework result info if completed */}
              {(selectedReturnDetail.status === 'SELESAI_REWORK' || selectedReturnDetail.status === 'REJECT_TOTAL') && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 grid grid-cols-2 gap-2 text-center">
                  <div>
                    <span className="text-[10px] text-emerald-700 block font-semibold">Hasil Lolos QC Ulang:</span>
                    <strong className="text-base text-emerald-900">{selectedReturnDetail.qtyReworked} Pcs</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-700 block font-semibold">Reject Total (BS):</span>
                    <strong className="text-base text-rose-900">{selectedReturnDetail.qtyRejectTotal} Pcs</strong>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setSelectedPrintReturn(selectedReturnDetail);
                  setSelectedReturnDetail(null);
                }}
                className="flex-1 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Surat Jalan Retur</span>
              </button>
              <button
                onClick={() => setSelectedReturnDetail(null)}
                className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: Cetak Surat Jalan Retur (Print Ready Document) */}
      {selectedPrintReturn && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 my-8 space-y-6">
            {/* Toolbar Cetak */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 no-print">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-600" />
                <span className="font-bold text-slate-800 text-sm">Pratinjau Surat Jalan Pengembalian Barang (Retur)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Dokumen</span>
                </button>
                <button
                  onClick={() => setSelectedPrintReturn(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Dokumen Fisik Surat Jalan Retur */}
            <div className="border border-slate-800 p-6 rounded-lg text-slate-900 font-sans space-y-5">
              {/* Header Dokumen */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h2 className="text-lg font-black tracking-wider uppercase">MAISON RAYYAN MANUFACTURING</h2>
                  <p className="text-xs text-slate-600">Konveksi &amp; Garment CMT Solution</p>
                  <p className="text-[11px] text-slate-500">Jl. Industri Konveksi No. 88, Bandung • Telp: (022) 8765-4321</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 bg-slate-900 text-white font-bold text-xs rounded uppercase tracking-wider">
                    SURAT JALAN RETUR (REWORK)
                  </span>
                  <p className="font-mono font-bold text-sm text-slate-900 mt-1">{selectedPrintReturn.noRetur}</p>
                </div>
              </div>

              {/* Info Surat Jalan Retur */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <div>
                    <span className="text-slate-500 text-[11px]">Kepada (Vendor Penjahit):</span>
                    <p className="font-bold text-sm text-slate-900">{selectedPrintReturn.vendor}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">Brand / Pemilik:</span>
                    <p className="font-semibold text-slate-800">{selectedPrintReturn.brand}</p>
                  </div>
                </div>

                <div className="space-y-1 text-right sm:text-left">
                  <div>
                    <span className="text-slate-500 text-[11px]">Tanggal Pengembalian:</span>
                    <p className="font-semibold text-slate-800">{formatDateIndo(selectedPrintReturn.tanggalRetur)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">Referensi Rujukan:</span>
                    <p className="font-semibold font-mono text-slate-800">
                      {selectedPrintReturn.spk?.spkNumber || selectedPrintReturn.suratJalan?.noSuratJalan || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabel Barang Cacat */}
              <div>
                <table className="w-full border-collapse border border-slate-900 text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-900 font-bold text-slate-900">
                      <th className="border border-slate-900 p-2 text-left">Nama Produk</th>
                      <th className="border border-slate-900 p-2 text-left">Kategori Kerusakan</th>
                      <th className="border border-slate-900 p-2 text-center">Rincian Ukuran</th>
                      <th className="border border-slate-900 p-2 text-center">Jumlah (Pcs)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-900 p-2.5 font-bold">{selectedPrintReturn.produk}</td>
                      <td className="border border-slate-900 p-2.5">
                        <span className="font-bold block">{getKategoriLabel(selectedPrintReturn.kategoriCacat)}</span>
                        <span className="text-[11px] text-slate-600 italic">{selectedPrintReturn.alasanCacat}</span>
                      </td>
                      <td className="border border-slate-900 p-2.5 text-center font-mono">
                        {Object.entries(selectedPrintReturn.qtyBreakdown)
                          .filter(([_, q]) => q > 0)
                          .map(([s, q]) => `${s.toUpperCase()}:${q}`)
                          .join(' | ')}
                      </td>
                      <td className="border border-slate-900 p-2.5 text-center font-bold text-sm">
                        {selectedPrintReturn.totalPcs} Pcs
                      </td>
                    </tr>
                    <tr className="bg-slate-50 font-bold">
                      <td colSpan={3} className="border border-slate-900 p-2 text-right pr-3">
                        TOTAL BARANG YANG DIKEMBALIKAN UNTUK DIPERBAIKI:
                      </td>
                      <td className="border border-slate-900 p-2 text-center text-sm">
                        {selectedPrintReturn.totalPcs} Pcs
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Catatan Perbaikan */}
              <div className="p-3 bg-slate-50 border border-slate-300 rounded text-xs space-y-1">
                <strong className="block text-slate-900">Instruksi Khusus untuk Penjahit:</strong>
                <p className="text-slate-700">
                  {selectedPrintReturn.catatan || 'Harap segera diperbaiki dan dikirimkan kembali ke gudang QC Maison Rayyan.'}
                </p>
              </div>

              {/* Kolom Tanda Tangan 3 Pihak */}
              <div className="grid grid-cols-3 gap-4 pt-6 text-center text-xs">
                <div className="space-y-12">
                  <p className="font-bold text-slate-700">Petugas QC (Pengirim)</p>
                  <p className="border-t border-slate-400 pt-1 font-semibold text-slate-800">( Maison Rayyan QC )</p>
                </div>
                <div className="space-y-12">
                  <p className="font-bold text-slate-700">Driver / Kurir</p>
                  <p className="border-t border-slate-400 pt-1 font-semibold text-slate-800">( .............................. )</p>
                </div>
                <div className="space-y-12">
                  <p className="font-bold text-slate-700">Diterima Oleh (Vendor)</p>
                  <p className="border-t border-slate-400 pt-1 font-semibold text-slate-800">
                    ( {selectedPrintReturn.vendor} )
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus Tiket Retur */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        onConfirm={() => {
          if (deleteModal.item) {
            deleteReturn(deleteModal.item.id);
            setDeleteModal({ isOpen: false });
          }
        }}
        title="Hapus Tiket Retur?"
        variant="danger"
        confirmText="Ya, Hapus Tiket"
        cancelText="Batal"
        message={
          deleteModal.item ? (
            <span>
              Apakah Anda yakin ingin menghapus tiket retur{' '}
              <strong className="text-slate-900 font-mono">{deleteModal.item.noRetur}</strong>{' '}
              ({deleteModal.item.produk} - {deleteModal.item.vendor})?
            </span>
          ) : (
            'Apakah Anda yakin ingin menghapus tiket retur ini?'
          )
        }
        note="Data riwayat retur dan QC barang cacat ini akan dihapus dari sistem."
      />
    </div>
  );
};
