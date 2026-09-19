import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { InboundRoll, RollStatus } from '../../types';
import { formatRupiahInput, parseRupiahInput, formatDateIndo } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  PackageCheck,
  Plus,
  Search,
  CheckCircle,
  Clock,
  Scissors,
  CheckCircle2,
  X,
  Layers,
  Sparkles,
  Trash2,
  Banknote,
  ChevronLeft,
  ChevronRight,
  Coins,
} from 'lucide-react';
import { FobDepositTab } from './FobDepositTab';

export type InboundSubTab = 'kain-fisik' | 'dp-uang-fob';

export const InboundView: React.FC = () => {
  const {
    inboundRolls,
    addInboundRoll,
    updateInboundRollStatus,
    deleteInboundRoll,
    fobDeposits,
    brands,
    userRole,
    activeBrand,
    currentUser,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<InboundSubTab>('kain-fisik');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'CMT' | 'FOB'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState(userRole === 'BRAND' ? activeBrand : 'ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    roll?: InboundRoll;
    isBlocked?: boolean;
    blockMessage?: string;
  }>({ isOpen: false });
  const [isDeleting, setIsDeleting] = useState(false);

  const [form, setForm] = useState({
    rollCode: '',
    brand: userRole === 'BRAND' ? activeBrand : 'GREYWOLF',
    jenisKain: '',
    meterLength: 100,
    hargaModalMeter: 40000,
    keterangan: '',
    status: (userRole === 'BRAND' ? 'MENUNGGU_FISIK' : 'DI_GUDANG') as RollStatus,
  });

  const formatRp = (num: number) => 'Rp ' + num.toLocaleString('id-ID');

  const filteredRolls = inboundRolls.filter((roll) => {
    // If brand user, strictly only see their own rolls
    const effectiveBrand = userRole === 'BRAND' ? activeBrand : brandFilter;
    const matchBrand = effectiveBrand === 'ALL' || roll.brand === effectiveBrand;
    const matchStatus = statusFilter === 'ALL' || roll.status === statusFilter;
    const matchSource =
      sourceFilter === 'ALL' ||
      (sourceFilter === 'FOB' ? roll.sourceType === 'FOB' : roll.sourceType !== 'FOB');
    const matchSearch =
      roll.rollCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      roll.jenisKain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      roll.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (roll.sourcePONumber && roll.sourcePONumber.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchBrand && matchStatus && matchSource && matchSearch;
  });

  // Pagination State (Default 10 per halaman)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset pagination on filter or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, brandFilter, statusFilter, sourceFilter, itemsPerPage, activeSubTab]);

  const totalPages = Math.max(1, Math.ceil(filteredRolls.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredRolls.length);

  const paginatedRolls = useMemo(() => {
    return filteredRolls.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRolls, startIndex, itemsPerPage]);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (safeCurrentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (safeCurrentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  // Calculation Stats
  const totalMeters = filteredRolls.reduce((a, b) => a + b.meterLength, 0);
  const totalStockMeters = filteredRolls
    .filter((r) => r.status === 'DI_GUDANG')
    .reduce((a, b) => a + (b.meterLength - b.meterUsed), 0);
  const totalAssetValue = filteredRolls.reduce((a, b) => a + b.meterLength * b.hargaModalMeter, 0);

  // Generate intelligent auto-increment roll barcode code per brand
  const generateNextRollCode = (brandName: string): string => {
    const matchedBrand = brands.find((b) => b.name.trim().toUpperCase() === brandName.trim().toUpperCase());
    const brandCode = (matchedBrand?.code || brandName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3) || 'ROL').toUpperCase();
    const prefix = `ROL-${brandCode}-`;

    let maxSeq = 0;
    inboundRolls.forEach((roll) => {
      if (roll.rollCode && roll.rollCode.toUpperCase().startsWith(prefix)) {
        const seqStr = roll.rollCode.substring(prefix.length);
        const parsedNum = parseInt(seqStr, 10);
        if (!isNaN(parsedNum) && parsedNum > maxSeq) {
          maxSeq = parsedNum;
        }
      } else if (roll.brand?.trim().toUpperCase() === brandName.trim().toUpperCase()) {
        const match = roll.rollCode?.match(/(\d+)$/);
        if (match) {
          const parsedNum = parseInt(match[1], 10);
          if (!isNaN(parsedNum) && parsedNum > maxSeq) {
            maxSeq = parsedNum;
          }
        }
      }
    });

    const nextSeq = maxSeq + 1;
    return `ROL-${brandCode}-${String(nextSeq).padStart(3, '0')}`;
  };

  const handleOpenAdd = () => {
    const userBrands = userRole === 'BRAND'
      ? (currentUser?.accessibleBrands && currentUser.accessibleBrands.length > 0 ? currentUser.accessibleBrands : [activeBrand])
      : brands.map(b => b.name);
    const selectedBrand = userBrands.includes(activeBrand) ? activeBrand : (userBrands[0] || 'GREYWOLF');
    const autoRollCode = generateNextRollCode(selectedBrand);
    setForm({
      rollCode: autoRollCode,
      brand: selectedBrand,
      jenisKain: '',
      meterLength: 120,
      hargaModalMeter: 40000,
      keterangan: '',
      status: userRole === 'BRAND' ? 'MENUNGGU_FISIK' : 'DI_GUDANG',
    });
    setIsAddModalOpen(true);
  };

  const handleSaveRoll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.jenisKain.trim()) {
      alert('Jenis kain wajib diisi!');
      return;
    }

    addInboundRoll({
      rollCode: form.rollCode.toUpperCase(),
      brand: form.brand,
      jenisKain: form.jenisKain,
      meterLength: Number(form.meterLength),
      meterUsed: 0,
      hargaModalMeter: Number(form.hargaModalMeter),
      status: form.status,
      tanggalMasuk: new Date().toISOString().split('T')[0],
      keterangan: form.keterangan,
    });

    setIsAddModalOpen(false);
  };

  const handleDeleteRoll = (roll: InboundRoll) => {
    if (roll.status === 'DIPROSES') {
      setDeleteModal({
        isOpen: true,
        roll,
        isBlocked: true,
        blockMessage: `Rol kain ${roll.rollCode} sedang digunakan dalam SPK aktif. Hapus SPK terkait terlebih dahulu sebelum menghapus data kain ini.`,
      });
      return;
    }

    setDeleteModal({
      isOpen: true,
      roll,
      isBlocked: false,
    });
  };

  const executeDeleteRoll = async () => {
    if (!deleteModal.roll) return;
    setIsDeleting(true);
    try {
      const res = await deleteInboundRoll(deleteModal.roll.id);
      if (!res.success) {
        setDeleteModal({
          isOpen: true,
          roll: deleteModal.roll,
          isBlocked: true,
          blockMessage: res.message || 'Gagal menghapus data rol kain.',
        });
      } else {
        setDeleteModal({ isOpen: false });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: RollStatus) => {
    switch (status) {
      case 'MENUNGGU_FISIK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 font-bold rounded-lg text-[10px] border border-amber-200">
            <Clock className="w-3 h-3" /> Menunggu Fisik
          </span>
        );
      case 'DI_GUDANG':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-[10px] border border-emerald-200">
            <CheckCircle className="w-3 h-3" /> Di Gudang (Ready)
          </span>
        );
      case 'DIPROSES':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-[10px] border border-indigo-200">
            <Scissors className="w-3 h-3" /> Diproses SPK
          </span>
        );
      case 'SELESAI':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg text-[10px]">
            <CheckCircle2 className="w-3 h-3" /> Selesai
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-Tab Navigation Switcher */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 w-fit shadow-xs">
        <button
          onClick={() => setActiveSubTab('kain-fisik')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeSubTab === 'kain-fisik'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <PackageCheck className="w-4 h-4 text-indigo-600" />
          <span>Stok Rol Kain (CMT / Fisik)</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeSubTab === 'kain-fisik' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {inboundRolls.length} Rol
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('dp-uang-fob')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeSubTab === 'dp-uang-fob'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Coins className="w-4 h-4 text-amber-500" />
          <span>Inbound DP Uang (FOB Cash Deposit)</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeSubTab === 'dp-uang-fob' ? 'bg-amber-50 text-amber-800' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {fobDeposits.length} DP
          </span>
        </button>
      </div>

      {activeSubTab === 'dp-uang-fob' ? (
        <FobDepositTab
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          brandFilter={brandFilter}
          setBrandFilter={setBrandFilter}
        />
      ) : (
        <>
          {/* Header Banner */}
          <div className="bg-white rounded-xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg mb-2 border border-indigo-100">
                  <PackageCheck className="w-3.5 h-3.5" />
                  Inbound Stok Kain Rol
                </div>
                <h1 className="text-xl font-bold text-slate-900">Pencatatan Stok Kain Masuk</h1>
                <p className="text-slate-500 text-xs mt-1">
                  Pelacakan kain milik Brand per nomor rol. Rol berstatus &quot;Di Gudang&quot; siap di-pooling menjadi SPK Potong.
                </p>
              </div>

              <button
                onClick={handleOpenAdd}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-base btn-press shrink-0"
              >
                <Plus className="w-4 h-4" />
                {userRole === 'BRAND' ? 'Rencana Kirim Kain' : 'Terima Rol Kain Baru'}
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* Card 1: Total Rol Kain */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Total Rol Kain</span>
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Layers className="w-4.5 h-4.5" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-0.5">
                  {filteredRolls.length} <span className="text-sm font-semibold text-slate-500">Rol</span>
                </div>
                <p className="text-xs text-slate-400">Akumulasi: {totalMeters.toLocaleString('id-ID')} m</p>
              </div>

              {/* Card 2: Stok Siap Potong */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Stok Siap Potong</span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Scissors className="w-4.5 h-4.5" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-0.5">
                  {totalStockMeters.toLocaleString('id-ID')} <span className="text-sm font-semibold text-slate-500">m</span>
                </div>
                <p className="text-xs text-slate-400">
                  {filteredRolls.filter((r) => r.status === 'DI_GUDANG').length} Rol ready di gudang
                </p>
              </div>

              {/* Card 3: Nilai Kain */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Nilai Aset Kain</span>
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Banknote className="w-4.5 h-4.5" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-0.5">{formatRp(totalAssetValue)}</div>
                <p className="text-xs text-slate-400">Berdasarkan harga modal meter</p>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nomor rol atau jenis kain..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-base"
                />
              </div>

              {/* Filter Sumber Kain: Semua vs CMT vs FOB */}
              <div className="w-full sm:w-44">
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value as any)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-base font-semibold text-slate-700"
                >
                  <option value="ALL">Semua Tipe Bahan</option>
                  <option value="CMT">Bahan Titipan Buyer (CMT)</option>
                  <option value="FOB">Bahan Pengadaan FOB (DP)</option>
                </select>
              </div>

              {userRole === 'ADMIN' && (
                <div className="w-full sm:w-48">
                  <select
                    value={brandFilter}
                    onChange={(e) => setBrandFilter(e.target.value)}
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-base"
                  >
                    <option value="ALL">Semua Brand</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="w-full sm:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-base"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="MENUNGGU_FISIK">Menunggu Fisik</option>
                  <option value="DI_GUDANG">Di Gudang (Ready)</option>
                  <option value="DIPROSES">Diproses SPK</option>
                  <option value="SELESAI">Selesai</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabel Rol */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 text-sm">
                Inventaris Rol Kain ({filteredRolls.length} Rol)
              </h2>
              <span className="text-[11px] text-slate-400">Per nomor rol kain</span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Kode Rol & Sumber</th>
                    <th className="p-3.5 text-center whitespace-nowrap">Pemilik (Brand)</th>
                    <th className="p-3.5">Jenis Kain</th>
                    <th className="p-3.5">Panjang Kain</th>
                    <th className="p-3.5">Status Fisik</th>
                    <th className="p-3.5">Tgl Masuk</th>
                    <th className="p-3.5">Keterangan</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedRolls.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        Tidak ada data rol kain yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedRolls.map((roll) => (
                      <tr key={roll.id} className="hover:bg-slate-50 transition">
                        <td className="p-3.5">
                          <div className="font-semibold text-indigo-600 font-mono">{roll.rollCode}</div>
                          {roll.sourceType === 'FOB' ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 mt-1 bg-indigo-50 text-indigo-700 font-sans font-bold rounded text-[9px] border border-indigo-200">
                              FOB: {roll.sourcePONumber || 'Order'}
                            </span>
                          ) : (
                            <span className="inline-block mt-1 px-1.5 py-0.5 bg-slate-100 text-slate-500 font-sans font-medium rounded text-[9px]">
                              CMT (Titipan)
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 bg-slate-100 text-slate-800 font-bold rounded-md text-[10px] whitespace-nowrap">
                            {roll.brand}
                          </span>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-900">{roll.jenisKain}</td>
                        <td className="p-3.5 font-bold">
                          {roll.meterLength} m
                          {roll.meterUsed > 0 && (
                            <span className="text-[10px] text-slate-400 block font-normal">
                              Terpakai: {roll.meterUsed} m
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">{getStatusBadge(roll.status)}</td>
                        <td className="p-3.5 text-slate-600 font-medium">{formatDateIndo(roll.tanggalMasuk)}</td>
                        <td className="p-3.5 text-slate-500 text-[11px]">{roll.keterangan || '-'}</td>
                        <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                          {userRole === 'ADMIN' && roll.status === 'MENUNGGU_FISIK' && (
                            <button
                              onClick={() => updateInboundRollStatus(roll.id, 'DI_GUDANG')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-[10px] transition-base btn-press shadow-sm inline-flex items-center gap-1"
                              title="Konfirmasi barang telah sampai di gudang"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Konfirmasi Sampai
                            </button>
                          )}
                          {(userRole === 'ADMIN' || (userRole === 'BRAND' && roll.status === 'MENUNGGU_FISIK')) && (
                            <button
                              onClick={() => handleDeleteRoll(roll)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition btn-press inline-flex items-center align-middle"
                              title={userRole === 'BRAND' ? 'Batalkan Rencana Kirim Kain' : 'Hapus Data Rol Kain'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs">
              <div className="flex items-center gap-3 text-slate-500 font-medium">
                <span>
                  Menampilkan <strong className="text-slate-800">{filteredRolls.length > 0 ? startIndex + 1 : 0}</strong> - <strong className="text-slate-800">{endIndex}</strong> dari <strong className="text-slate-800">{filteredRolls.length}</strong> Rol
                </span>
                <div className="flex items-center gap-1.5">
                  <span>Baris per hal:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="py-1 px-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-semibold text-slate-700 outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safeCurrentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    title="Halaman Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {getPageNumbers().map((p, idx) =>
                    p === '...' ? (
                      <span key={`dots-${idx}`} className="px-2 py-1 text-slate-400">
                        ...
                      </span>
                    ) : (
                      <button
                        key={`page-${p}`}
                        onClick={() => setCurrentPage(Number(p))}
                        className={`min-w-7 h-7 px-2 text-xs font-bold rounded-lg transition ${
                          safeCurrentPage === p
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100 border border-transparent'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safeCurrentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    title="Halaman Selanjutnya"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* MODAL: Tambah Rol Kain Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-lg border border-slate-200 space-y-5 animate-slideUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-semibold text-slate-900 text-base">
                {userRole === 'BRAND' ? 'Rencana Pengiriman Kain ke Gudang' : 'Penerimaan Rol Kain Baru'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 btn-press"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoll} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-medium text-slate-600">Kode / Barcode Rol</label>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <Sparkles className="w-2.5 h-2.5" /> Otomatis
                    </span>
                  </div>
                  <input
                    type="text"
                    value={form.rollCode}
                    readOnly
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg outline-none font-mono font-bold text-indigo-700 tracking-wider cursor-not-allowed select-all"
                    title="Kode barcode rol digenerate otomatis oleh sistem"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-600 mb-1">Pemilik (Brand)</label>
                  {userRole === 'BRAND' ? (
                    currentUser?.accessibleBrands && currentUser.accessibleBrands.length > 1 ? (
                      <select
                        value={form.brand}
                        onChange={(e) => {
                          const newBrand = e.target.value;
                          setForm((prev) => ({
                            ...prev,
                            brand: newBrand,
                            rollCode: generateNextRollCode(newBrand),
                          }));
                        }}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-400 transition-base font-semibold text-slate-800 cursor-pointer"
                      >
                        {currentUser.accessibleBrands.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={form.brand || activeBrand}
                        disabled
                        className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-semibold cursor-not-allowed"
                      />
                    )
                  ) : (
                    <select
                      value={form.brand}
                      onChange={(e) => {
                        const newBrand = e.target.value;
                        setForm((prev) => ({
                          ...prev,
                          brand: newBrand,
                          rollCode: generateNextRollCode(newBrand),
                        }));
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-400 transition-base font-semibold text-slate-800 cursor-pointer"
                    >
                      {brands.map((b) => (
                        <option key={b.id} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Jenis Kain &amp; Warna</label>
                <input
                  type="text"
                  placeholder="Misal: Cotton Combed 30s Hitam, Rayon Twill Sage..."
                  value={form.jenisKain}
                  onChange={(e) => setForm({ ...form, jenisKain: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-400 transition-base"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Panjang (Meter)</label>
                  <input
                    type="number"
                    value={form.meterLength}
                    onChange={(e) => setForm({ ...form, meterLength: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-400 transition-base"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-600 mb-1">Harga Modal / Meter (Rp)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Contoh: 40.000"
                    value={formatRupiahInput(form.hargaModalMeter)}
                    onChange={(e) => setForm({ ...form, hargaModalMeter: parseRupiahInput(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-400 transition-base font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Keterangan / Lokasi Rak</label>
                <input
                  type="text"
                  placeholder="Misal: Rak A-2, Lot #990..."
                  value={form.keterangan}
                  onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-400 transition-base"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-base btn-press"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-base btn-press shadow-sm"
                >
                  Simpan Rol Kain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi / Peringatan Hapus Rol Kain */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        onConfirm={deleteModal.isBlocked ? undefined : executeDeleteRoll}
        title={deleteModal.isBlocked ? 'Tidak Dapat Menghapus Kain' : 'Hapus Data Rol Kain?'}
        variant={deleteModal.isBlocked ? 'warning' : 'danger'}
        confirmText="Ya, Hapus Rol Kain"
        cancelText="Batal"
        isLoading={isDeleting}
        message={
          deleteModal.isBlocked ? (
            deleteModal.blockMessage
          ) : deleteModal.roll ? (
            <span>
              Apakah Anda yakin ingin menghapus data rol kain{' '}
              <strong className="text-slate-900 font-mono">{deleteModal.roll.rollCode}</strong>{' '}
              ({deleteModal.roll.jenisKain} - {deleteModal.roll.meterLength}m)?
            </span>
          ) : (
            'Apakah Anda yakin ingin menghapus data rol kain ini?'
          )
        }
        note={
          deleteModal.isBlocked
            ? 'Harap hapus atau selesaikan SPK terkait terlebih dahulu sebelum menghapus data rol kain ini.'
            : 'Data rol kain yang telah dihapus tidak dapat dipulihkan kembali.'
        }
      />

    </div>
  );
};
