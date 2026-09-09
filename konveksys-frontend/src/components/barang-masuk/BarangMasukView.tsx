import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { SuratJalan, SizeBreakdown } from '../../types';
import { formatDateIndo } from '../../utils/formatters';
import { printIsolatedDocument } from '../../utils/printHelper';
import {
  Inbox,
  PackageCheck,
  Calendar,
  Search,
  Printer,
  FileText,
  Truck,
  RotateCcw,
  CheckCircle2,
  X,
  Layers,
  Building2,
  SlidersHorizontal,
  Eye,
  TrendingUp,
  Clock,
} from 'lucide-react';

const SIZE_DISPLAY_ORDER: { key: keyof SizeBreakdown; label: string }[] = [
  { key: 's', label: 'S' },
  { key: 'm', label: 'M' },
  { key: 'l', label: 'L' },
  { key: 'xl', label: 'XL' },
  { key: 'xxl', label: '2XL' },
  { key: 'anak4', label: 'Anak 4' },
  { key: 'anak6', label: 'Anak 6' },
  { key: 'anak8', label: 'Anak 8' },
  { key: 'anak10', label: 'Anak 10' },
  { key: 'anak12', label: 'Anak 12' },
  { key: 'anak14', label: 'Anak 14' },
  { key: 'anak16', label: 'Anak 16' },
];

interface ArticleSummary {
  produk: string;
  jenisKain: string;
  vendors: string[];
  totalPcs: number;
  sizeBreakdown: SizeBreakdown;
  shipmentCount: number;
  lastArrivalDate: string;
  lastSJNumber: string;
  spkNumbers: string[];
}

export const BarangMasukView: React.FC = () => {
  const {
    suratJalanList,
    getSuratJalanItems,
    spkList,
    userRole,
    activeBrand,
    brands,
    setActiveTab,
  } = useApp();

  // Filter States
  const [selectedBrand, setSelectedBrand] = useState<string>(
    userRole === 'BRAND' ? activeBrand : 'ALL'
  );
  const [periodMode, setPeriodMode] = useState<'all' | 'this_month' | 'this_week' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProduct, setFilterProduct] = useState('ALL');

  // Sub-tabs: 'rekap_artikel' | 'riwayat_sj' | 'progress_spk'
  const [activeSubTab, setActiveSubTab] = useState<'rekap_artikel' | 'riwayat_sj' | 'progress_spk'>('rekap_artikel');

  // Modal States
  const [selectedSJDetail, setSelectedSJDetail] = useState<SuratJalan | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const printPaperRef = useRef<HTMLDivElement>(null);
  const printSJRef = useRef<HTMLDivElement>(null);

  // Effective brand for queries
  const currentBrand = userRole === 'BRAND' ? activeBrand : selectedBrand;

  // Date range calculations
  const { startDate, endDate, periodLabel } = useMemo(() => {
    const now = new Date();
    if (periodMode === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      return {
        startDate: start,
        endDate: end,
        periodLabel: `Bulan Ini (${formatDateIndo(start)} – ${formatDateIndo(end)})`,
      };
    }
    if (periodMode === 'this_week') {
      // Last 7 days
      const past = new Date(now);
      past.setDate(now.getDate() - 7);
      const start = past.toISOString().split('T')[0];
      const end = now.toISOString().split('T')[0];
      return {
        startDate: start,
        endDate: end,
        periodLabel: `7 Hari Terakhir (${formatDateIndo(start)} – ${formatDateIndo(end)})`,
      };
    }
    if (periodMode === 'custom') {
      return {
        startDate: customStartDate || undefined,
        endDate: customEndDate || undefined,
        periodLabel: customStartDate && customEndDate
          ? `${formatDateIndo(customStartDate)} – ${formatDateIndo(customEndDate)}`
          : 'Rentang Tanggal Kustom',
      };
    }
    return {
      startDate: undefined,
      endDate: undefined,
      periodLabel: 'Semua Periode',
    };
  }, [periodMode, customStartDate, customEndDate]);

  // Filtered Surat Jalan
  const filteredSJs = useMemo(() => {
    return suratJalanList.filter((sj) => {
      // Brand filter
      if (currentBrand !== 'ALL' && sj.brand !== currentBrand) return false;

      // Date filter
      const sjDate = (sj.tanggal || '').split('T')[0];
      if (startDate && sjDate < startDate) return false;
      if (endDate && sjDate > endDate) return false;

      // Search term filter
      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase();
        const items = getSuratJalanItems(sj);
        const matchSJNo = (sj.noSuratJalan || '').toLowerCase().includes(search);
        const matchDriver = (sj.driverName || '').toLowerCase().includes(search);
        const matchPlat = (sj.nomorKendaraan || '').toLowerCase().includes(search);
        const matchItem = items.some(
          (it) =>
            it.produk.toLowerCase().includes(search) ||
            (it.jenisKain && it.jenisKain.toLowerCase().includes(search)) ||
            (it.vendor && it.vendor.toLowerCase().includes(search))
        );
        if (!matchSJNo && !matchDriver && !matchPlat && !matchItem) return false;
      }

      // Product filter
      if (filterProduct !== 'ALL') {
        const items = getSuratJalanItems(sj);
        const matchProd = items.some(
          (it) => it.produk.trim().toUpperCase() === filterProduct.trim().toUpperCase()
        );
        if (!matchProd) return false;
      }

      return true;
    });
  }, [suratJalanList, currentBrand, startDate, endDate, searchTerm, filterProduct, getSuratJalanItems]);

  // Aggregated Article Breakdown (Rekap per Artikel & Size)
  const articleSummaries = useMemo(() => {
    const map = new Map<string, ArticleSummary>();

    for (const sj of filteredSJs) {
      const items = getSuratJalanItems(sj);
      for (const it of items) {
        const key = it.produk.trim().toUpperCase();
        if (filterProduct !== 'ALL' && key !== filterProduct.trim().toUpperCase()) continue;

        if (!map.has(key)) {
          map.set(key, {
            produk: it.produk,
            jenisKain: it.jenisKain || 'Kain Standar',
            vendors: it.vendor ? [it.vendor] : [],
            totalPcs: 0,
            sizeBreakdown: {
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
            },
            shipmentCount: 0,
            lastArrivalDate: sj.tanggal,
            lastSJNumber: sj.noSuratJalan,
            spkNumbers: it.spkNumber ? [it.spkNumber] : [],
          });
        }

        const curr = map.get(key)!;
        curr.totalPcs += it.totalPcs;
        curr.shipmentCount += 1;

        if (it.jenisKain && !curr.jenisKain.includes(it.jenisKain)) {
          curr.jenisKain = curr.jenisKain ? `${curr.jenisKain}, ${it.jenisKain}` : it.jenisKain;
        }

        if (it.vendor && !curr.vendors.includes(it.vendor)) {
          curr.vendors.push(it.vendor);
        }

        if (it.spkNumber && !curr.spkNumbers.includes(it.spkNumber)) {
          curr.spkNumbers.push(it.spkNumber);
        }

        // Keep most recent arrival date
        if (new Date(sj.tanggal) > new Date(curr.lastArrivalDate)) {
          curr.lastArrivalDate = sj.tanggal;
          curr.lastSJNumber = sj.noSuratJalan;
        }

        // Sum size breakdown
        const deliv = it.qtyDelivered || {};
        SIZE_DISPLAY_ORDER.forEach(({ key: szKey }) => {
          curr.sizeBreakdown[szKey] = (curr.sizeBreakdown[szKey] || 0) + (deliv[szKey] || 0);
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.totalPcs - a.totalPcs);
  }, [filteredSJs, filterProduct, getSuratJalanItems]);

  // Overall Totals
  const grandTotalPcs = useMemo(() => {
    return articleSummaries.reduce((sum, a) => sum + a.totalPcs, 0);
  }, [articleSummaries]);

  // Total Sizes Accumulation
  const totalSizeAccumulation = useMemo(() => {
    const acc: SizeBreakdown = {
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
    };
    for (const a of articleSummaries) {
      SIZE_DISPLAY_ORDER.forEach(({ key }) => {
        acc[key] = (acc[key] || 0) + (a.sizeBreakdown[key] || 0);
      });
    }
    return acc;
  }, [articleSummaries]);

  // Available Product Options for Dropdown
  const availableProductNames = useMemo(() => {
    const set = new Set<string>();
    const brandSJs = currentBrand === 'ALL'
      ? suratJalanList
      : suratJalanList.filter((s) => s.brand === currentBrand);

    for (const sj of brandSJs) {
      const items = getSuratJalanItems(sj);
      for (const it of items) {
        if (it.produk) set.add(it.produk.trim().toUpperCase());
      }
    }
    return Array.from(set).sort();
  }, [suratJalanList, currentBrand, getSuratJalanItems]);

  // Linked SPKs for monitoring
  const linkedSPKs = useMemo(() => {
    return spkList
      .filter((s) => currentBrand === 'ALL' || s.brand === currentBrand)
      .map((spk) => {
        const targetTotal = Object.values(spk.targetCutQty || {}).reduce((a, b) => a + b, 0);
        const delivTotal = Object.values(spk.deliveredQty || {}).reduce((a, b) => a + b, 0);
        const remaining = Math.max(0, targetTotal - delivTotal);
        const progressPct = targetTotal > 0 ? Math.min(100, Math.round((delivTotal / targetTotal) * 100)) : 0;
        return {
          ...spk,
          targetTotal,
          delivTotal,
          remaining,
          progressPct,
        };
      });
  }, [spkList, currentBrand]);

  // Handle Print Rekapitulasi
  const handlePrintRekap = () => {
    if (!printPaperRef.current) return;
    const docTitle = `Rekap_Barang_Masuk_${currentBrand}_${periodMode}`;
    printIsolatedDocument(printPaperRef.current, docTitle);
  };

  // Handle Print SJ from Detail Modal
  const handlePrintSJ = () => {
    if (!printSJRef.current || !selectedSJDetail) return;
    const safeSJNo = (selectedSJDetail.noSuratJalan || 'SJ').replace(/[/\\?%*:|"<>]/g, '-');
    const docTitle = `SuratJalan_${selectedSJDetail.brand}_${safeSJNo}`;
    printIsolatedDocument(printSJRef.current, docTitle);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg mb-2 border border-indigo-100">
              <Inbox className="w-3.5 h-3.5" />
              {userRole === 'BRAND' ? `Penerimaan Barang • ${activeBrand}` : 'Rekapitulasi Barang Masuk Buyer'}
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {userRole === 'BRAND' ? 'Barang Masuk & Rekapan Penerimaan' : 'Penerimaan Barang Masuk Buyer'}
            </h1>
            <p className="text-slate-500 text-xs mt-1">
              Rekapitulasi barang jadi makloon yang telah dikirim dan diterima di gudang Brand, lengkap dengan rincian size breakdown.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {userRole === 'ADMIN' && (
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <Building2 className="w-4 h-4 text-slate-400" />
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="bg-transparent font-bold text-xs text-slate-800 outline-none cursor-pointer"
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

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition btn-press cursor-pointer"
              title="Cetak Laporan Rekapitulasi Barang Masuk"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Rekapan</span>
            </button>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <button
            onClick={() => setActiveSubTab('rekap_artikel')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-base btn-press flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'rekap_artikel'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Rekapan per Artikel & Size ({articleSummaries.length} Model)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('riwayat_sj')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-base btn-press flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'riwayat_sj'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Riwayat Pengiriman ({filteredSJs.length} Surat Jalan)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('progress_spk')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-base btn-press flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'progress_spk'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Progress Target SPK ({linkedSPKs.length} SPK)</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pcs Masuk */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Total Barang Masuk</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Inbox className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {grandTotalPcs} <span className="text-sm font-semibold text-slate-500">Pcs</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Akumulasi barang jadi yang diterima</p>
        </div>

        {/* Card 2: Varian Model */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Varian Model / Artikel</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {articleSummaries.length} <span className="text-sm font-semibold text-slate-500">Artikel</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Jenis pakaian yang telah masuk</p>
        </div>

        {/* Card 3: Frekuensi Pengiriman */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Frekuensi Pengiriman</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {filteredSJs.length} <span className="text-sm font-semibold text-slate-500">Surat Jalan</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Dokumen pengiriman tercatat</p>
        </div>

        {/* Card 4: Progress Pemenuhan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Status Pemenuhan SPK</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {linkedSPKs.filter((s) => s.progressPct >= 100).length} / {linkedSPKs.length}{' '}
            <span className="text-sm font-semibold text-slate-500">Selesai</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            {linkedSPKs.filter((s) => s.progressPct < 100).length} batch SPK sedang diproses
          </p>
        </div>
      </div>

      {/* 3. Toolbar Filter Periode & Pencarian */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Quick Period Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-slate-400 text-xs font-semibold mr-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            <span>Periode:</span>
          </div>

          <button
            onClick={() => setPeriodMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition btn-press cursor-pointer ${
              periodMode === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Semua
          </button>

          <button
            onClick={() => setPeriodMode('this_month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition btn-press cursor-pointer ${
              periodMode === 'this_month'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Bulan Ini
          </button>

          <button
            onClick={() => setPeriodMode('this_week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition btn-press cursor-pointer ${
              periodMode === 'this_week'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            7 Hari Terakhir
          </button>

          <button
            onClick={() => setPeriodMode('custom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition btn-press cursor-pointer ${
              periodMode === 'custom'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Kustom
          </button>

          {periodMode === 'custom' && (
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-xs">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-transparent font-medium text-slate-800 outline-none text-xs"
              />
              <span className="text-slate-400 font-bold">s/d</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-transparent font-medium text-slate-800 outline-none text-xs"
              />
            </div>
          )}
        </div>

        {/* Right: Search & Product Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {availableProductNames.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterProduct}
                onChange={(e) => setFilterProduct(e.target.value)}
                className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">Semua Model Artikel</option>
                {availableProductNames.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari artikel, kain, SJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-400 transition"
            />
          </div>
        </div>
      </div>

      {/* 4. SUB-TAB 1: Rekapitulasi per Artikel & Ukuran */}
      {activeSubTab === 'rekap_artikel' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Rekapitulasi Akumulasi per Artikel Produk</span>
                </h3>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Total kuantiti barang masuk yang dihitung dari seluruh Surat Jalan dalam periode terpilih.
                </p>
              </div>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 self-start sm:self-auto">
                {periodLabel}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 text-white font-bold text-[9px] uppercase">
                  <tr>
                    <th className="p-3 w-10 text-center">No</th>
                    <th className="p-3 min-w-[200px]">Artikel Produk & Bahan</th>
                    <th className="p-3 min-w-[320px]">Rincian Ukuran Diterima (Pcs)</th>
                    <th className="p-3 text-center whitespace-nowrap">Kedatangan</th>
                    <th className="p-3 text-right whitespace-nowrap">Total Masuk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {articleSummaries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        Belum ada barang masuk yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    articleSummaries.map((art, idx) => (
                      <tr key={art.produk} className="hover:bg-slate-50/70 transition align-top">
                        <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="p-3 space-y-1">
                          <strong className="font-bold text-slate-900 text-sm block">{art.produk}</strong>
                          {art.jenisKain && (
                            <div className="text-[11px] text-slate-600 flex items-center gap-1 font-medium">
                              <span>🧵</span>
                              <span>{art.jenisKain}</span>
                            </div>
                          )}
                          {art.vendors.length > 0 && (
                            <div className="text-[10px] text-slate-400">
                              Penjahit: {art.vendors.join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1.5">
                            {SIZE_DISPLAY_ORDER.map(({ key, label }) => {
                              const qty = art.sizeBreakdown[key] || 0;
                              if (qty === 0) return null;
                              return (
                                <div
                                  key={key}
                                  className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-md text-[10px] font-semibold text-slate-700 flex items-center gap-1.5 shadow-2xs"
                                >
                                  <span className="font-bold uppercase text-indigo-700">{label}:</span>
                                  <span className="text-slate-900 font-bold">{qty} pcs</span>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-full text-[10px] border border-indigo-100">
                            {art.shipmentCount}x Kirim
                          </span>
                          <div className="text-[10px] text-slate-400 mt-1 font-mono">
                            {art.lastSJNumber} ({formatDateIndo(art.lastArrivalDate)})
                          </div>
                        </td>
                        <td className="p-3 text-right font-black text-indigo-700 text-sm whitespace-nowrap">
                          {art.totalPcs} Pcs
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {articleSummaries.length > 0 && (
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                    <tr>
                      <td colSpan={2} className="p-3 uppercase text-[10px] text-slate-700">
                        Total Keseluruhan Barang Masuk:
                      </td>
                      <td className="p-3 text-[10px] text-slate-700">
                        <div className="flex flex-wrap gap-1.5">
                          {SIZE_DISPLAY_ORDER.map(({ key, label }) => {
                            const qty = totalSizeAccumulation[key] || 0;
                            if (qty === 0) return null;
                            return (
                              <span key={key} className="bg-white border border-slate-300 px-1.5 py-0.5 rounded text-[9px]">
                                {label}: <strong>{qty}</strong>
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="p-3 text-center text-slate-500 text-[10px]">
                        {filteredSJs.length} Surat Jalan
                      </td>
                      <td className="p-3 text-right text-indigo-700 font-black text-base whitespace-nowrap">
                        {grandTotalPcs} Pcs
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. SUB-TAB 2: Riwayat Pengiriman (Surat Jalan) */}
      {activeSubTab === 'riwayat_sj' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-indigo-600" />
              <span>Daftar Kedatangan Barang (Surat Jalan Masuk)</span>
            </h3>
            <span className="text-xs font-bold text-slate-500">
              Total: {filteredSJs.length} Surat Jalan
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 text-white font-bold text-[9px] uppercase">
                <tr>
                  <th className="p-3">No. Surat Jalan</th>
                  <th className="p-3">Tanggal Tiba</th>
                  <th className="p-3">Driver / Kendaraan</th>
                  <th className="p-3 min-w-[240px]">Muatan Artikel & Size</th>
                  <th className="p-3 text-center">Total Pcs</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredSJs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Tidak ada data surat jalan pengiriman untuk filter ini.
                    </td>
                  </tr>
                ) : (
                  filteredSJs.map((sj) => {
                    const items = getSuratJalanItems(sj);
                    return (
                      <tr key={sj.id} className="hover:bg-slate-50/70 transition align-top">
                        <td className="p-3 font-mono font-bold text-indigo-600">
                          {sj.noSuratJalan}
                          <div className="text-[10px] text-slate-400 font-sans font-medium">
                            Brand: {sj.brand}
                          </div>
                        </td>
                        <td className="p-3 font-medium text-slate-700 whitespace-nowrap">
                          {formatDateIndo(sj.tanggal)}
                        </td>
                        <td className="p-3 text-slate-600">
                          <div className="font-semibold text-slate-800">{sj.driverName || 'Kurir Konveksi'}</div>
                          <span className="text-[10px] text-slate-400 font-mono font-bold">
                            {sj.nomorKendaraan || '-'}
                          </span>
                        </td>
                        <td className="p-3 space-y-2">
                          {items.map((it, idx) => (
                            <div key={idx} className="bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-slate-900">{it.produk}</span>
                                <span className="font-bold text-indigo-600 shrink-0">{it.totalPcs} Pcs</span>
                              </div>
                              {it.jenisKain && (
                                <div className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                                  <span>🧵</span>
                                  <span>{it.jenisKain}</span>
                                </div>
                              )}
                              <div className="text-[10px] text-slate-500 flex flex-wrap gap-1 pt-0.5">
                                {SIZE_DISPLAY_ORDER.map(({ key, label }) => {
                                  const qty = it.qtyDelivered?.[key] || 0;
                                  if (qty === 0) return null;
                                  return (
                                    <span
                                      key={key}
                                      className="bg-white border border-slate-200 text-slate-700 px-1 py-0.2 rounded font-medium text-[9px]"
                                    >
                                      {label}: <strong className="text-slate-900">{qty}</strong>
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </td>
                        <td className="p-3 text-center font-bold text-slate-900 text-sm whitespace-nowrap">
                          {sj.totalPcs} Pcs
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-[10px] border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Diterima
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => setSelectedSJDetail(sj)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition inline-flex items-center align-middle cursor-pointer"
                            title="Lihat & Cetak Surat Jalan Resmi"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setActiveTab('return')}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition inline-flex items-center align-middle cursor-pointer"
                            title="Laporkan Barang Cacat / Retur"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. SUB-TAB 3: Progress Pemenuhan Target SPK */}
      {activeSubTab === 'progress_spk' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {linkedSPKs.length === 0 ? (
              <div className="col-span-2 p-8 bg-white border border-slate-200 rounded-xl text-center text-slate-400">
                Belum ada data SPK pemotongan untuk brand ini.
              </div>
            ) : (
              linkedSPKs.map((spk) => (
                <div key={spk.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-indigo-600 block">{spk.spkNumber}</span>
                      <strong className="font-bold text-slate-900 text-sm block mt-0.5">{spk.produk}</strong>
                      <span className="text-[11px] text-slate-500 font-medium">Penjahit: {spk.vendor}</span>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                        spk.progressPct >= 100
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : spk.delivTotal > 0
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {spk.progressPct >= 100 ? 'Selesai' : spk.delivTotal > 0 ? 'Parsial Dikirim' : 'Dalam Proses'}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-600">Progress Penerimaan:</span>
                      <span className="text-indigo-600">{spk.progressPct}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          spk.progressPct >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${Math.min(100, spk.progressPct)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Stat Details */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Target SPK</span>
                      <strong className="text-slate-900 font-bold">{spk.targetTotal} Pcs</strong>
                    </div>
                    <div className="bg-indigo-50/60 p-2 rounded-lg">
                      <span className="text-[10px] text-indigo-500 block font-bold uppercase">Sudah Masuk</span>
                      <strong className="text-indigo-700 font-bold">{spk.delivTotal} Pcs</strong>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Sisa Proses</span>
                      <strong className="text-slate-700 font-bold">{spk.remaining} Pcs</strong>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 7. MODAL: Cetak Laporan Rekapitulasi Barang Masuk (A4 Printable Isolated Paper) */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-slate-100 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden animate-slideUp">
            {/* Header Toolbar */}
            <div className="bg-white px-5 py-3.5 border-b border-slate-200 flex items-center justify-between shrink-0 z-30 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Laporan Rekapitulasi Barang Masuk</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-indigo-600">{currentBrand}</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">{periodLabel}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintRekap}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition btn-press cursor-pointer"
                  title="Cetak atau Simpan PDF Laporan"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / PDF</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition ml-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Paper Canvas */}
            <div className="overflow-y-auto p-4 sm:p-6 flex-1 flex justify-center bg-slate-200/50">
              <div
                ref={printPaperRef}
                className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-8 space-y-4 text-slate-800 max-w-2xl w-full my-auto"
              >
                {/* Header Kop */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">MAISON RAYYAN MANUFACTURING</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Konveksi & Makloon Garment Terpadu</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-slate-900 text-white text-[11px] font-bold px-3 py-1 rounded uppercase tracking-wider inline-block">
                      REKAP BARANG MASUK
                    </span>
                    <div className="text-xs font-mono font-bold text-slate-800 mt-1.5">{currentBrand}</div>
                    <div className="text-[11px] text-slate-500">Tgl Cetak: {formatDateIndo(new Date().toISOString().split('T')[0])}</div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Mitra Brand / Buyer:</span>
                    <strong className="text-slate-900 text-sm font-bold">{currentBrand}</strong>
                    <div className="text-slate-500 text-[11px] mt-0.5">Partner Brand Makloon</div>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Periode Laporan:</span>
                    <strong className="text-indigo-700 text-xs font-bold">{periodLabel}</strong>
                    <div className="text-slate-500 text-[11px] mt-0.5">{filteredSJs.length} Surat Jalan Tercatat</div>
                  </div>
                </div>

                {/* Table of Rekapan */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Rincian Akumulasi Barang Diterima
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-900 text-white font-bold text-[9px] uppercase">
                        <tr>
                          <th className="p-2 w-[6%] text-center">No</th>
                          <th className="p-2 w-[30%]">Artikel Produk</th>
                          <th className="p-2 w-[24%]">Bahan / Kain</th>
                          <th className="p-2 w-[26%]">Rincian Size</th>
                          <th className="p-2 w-[14%] text-right whitespace-nowrap">Total Pcs</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {articleSummaries.map((art, idx) => (
                          <tr key={idx} className="align-top">
                            <td className="p-2 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="p-2 font-bold text-slate-900">{art.produk}</td>
                            <td className="p-2 text-slate-600 text-[11px]">{art.jenisKain}</td>
                            <td className="p-2 text-[10px] text-slate-600 space-y-0.5">
                              {SIZE_DISPLAY_ORDER.map(({ key, label }) => {
                                const qty = art.sizeBreakdown[key] || 0;
                                if (qty === 0) return null;
                                return (
                                  <div key={key} className="whitespace-nowrap">
                                    <span className="font-bold uppercase">{label}:</span> {qty} pcs
                                  </div>
                                );
                              })}
                            </td>
                            <td className="p-2 text-right font-bold text-slate-900 whitespace-nowrap">
                              {art.totalPcs} Pcs
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                        <tr>
                          <td colSpan={4} className="p-2 text-right uppercase text-[10px]">
                            Total Keseluruhan Barang Masuk:
                          </td>
                          <td className="p-2 text-right text-indigo-700 font-bold text-sm whitespace-nowrap">
                            {grandTotalPcs} Pcs
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Kolom Tanda Tangan */}
                <div className="grid grid-cols-2 gap-4 pt-4 text-center text-xs">
                  <div className="border border-slate-200 rounded-xl p-2.5 flex flex-col justify-between h-24">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Dibuat Oleh</span>
                    <div className="border-b border-slate-300 w-3/4 mx-auto"></div>
                    <span className="text-[10px] text-slate-400">(Admin Gudang / Logistik)</span>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-2.5 flex flex-col justify-between h-24">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Diterima & Mengetahui</span>
                    <div className="border-b border-slate-300 w-3/4 mx-auto"></div>
                    <span className="text-[10px] text-slate-400">(Owner / Manajemen {currentBrand})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: Detail Surat Jalan Spesifik (Jika user klik Eye pada Riwayat SJ) */}
      {selectedSJDetail && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-slate-100 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden animate-slideUp">
            {/* Header Toolbar */}
            <div className="bg-white px-5 py-3.5 border-b border-slate-200 flex items-center justify-between shrink-0 z-30 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Surat Jalan Pengiriman Resmi</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-indigo-600">{selectedSJDetail.brand}</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">{selectedSJDetail.noSuratJalan}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintSJ}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition btn-press cursor-pointer"
                  title="Download & Cetak Surat Jalan PDF"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / PDF</span>
                </button>
                <button
                  onClick={() => setSelectedSJDetail(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition ml-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Paper Canvas */}
            <div className="overflow-y-auto p-4 sm:p-6 flex-1 flex justify-center bg-slate-200/50">
              <div
                ref={printSJRef}
                className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-8 space-y-4 text-slate-800 max-w-2xl w-full my-auto"
              >
                {/* Header Kop Perusahaan */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">MAISON RAYYAN MANUFACTURING</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Konveksi & Makloon Garment Terpadu</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-slate-900 text-white text-[11px] font-bold px-3 py-1 rounded uppercase tracking-wider inline-block">
                      SURAT JALAN
                    </span>
                    <div className="text-xs font-mono font-bold text-slate-800 mt-1.5">{selectedSJDetail.noSuratJalan}</div>
                    <div className="text-[11px] text-slate-500">Tgl: {formatDateIndo(selectedSJDetail.tanggal)}</div>
                  </div>
                </div>

                {/* Info Pengiriman Box */}
                <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Brand Tujuan:</span>
                    <strong className="text-slate-900 text-sm font-bold">{selectedSJDetail.brand}</strong>
                    <div className="text-slate-500 text-[11px] mt-0.5">Partner Brand Makloon</div>
                  </div>
                  {selectedSJDetail.catatan && (
                    <div className="pt-2 mt-2 border-t border-slate-200/60 text-[11px] text-slate-600">
                      <span className="font-bold">Catatan:</span> {selectedSJDetail.catatan}
                    </div>
                  )}
                </div>

                {/* Table of Shipped Items */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                    Rincian Barang yang Dikirim
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-900 text-white font-bold text-[9px] uppercase">
                        <tr>
                          <th className="p-2 w-[6%] text-center">No</th>
                          <th className="p-2 w-[32%]">Artikel Produk</th>
                          <th className="p-2 w-[28%]">Bahan / Kain</th>
                          <th className="p-2 w-[22%]">Rincian Size</th>
                          <th className="p-2 w-[12%] text-right whitespace-nowrap">Qty Pcs</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {getSuratJalanItems(selectedSJDetail).map((item, idx) => (
                          <tr key={idx} className="align-top">
                            <td className="p-2 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="p-2 font-bold text-slate-900">{item.produk}</td>
                            <td className="p-2 text-slate-600 text-[11px]">{item.jenisKain || 'Kain Standar'}</td>
                            <td className="p-2 text-[10px] text-slate-600 space-y-0.5">
                              {SIZE_DISPLAY_ORDER.map(({ key, label }) => {
                                const qty = item.qtyDelivered?.[key] || 0;
                                if (qty === 0) return null;
                                return (
                                  <div key={key} className="whitespace-nowrap">
                                    <span className="font-bold uppercase">{label}:</span> {qty} pcs
                                  </div>
                                );
                              })}
                            </td>
                            <td className="p-2 text-right font-bold text-slate-900 whitespace-nowrap">
                              {item.totalPcs} Pcs
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                        <tr>
                          <td colSpan={4} className="p-2 text-right uppercase text-[10px]">
                            Total Keseluruhan Barang:
                          </td>
                          <td className="p-2 text-right text-indigo-700 font-bold text-sm whitespace-nowrap">
                            {selectedSJDetail.totalPcs} Pcs
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Kolom Tanda Tangan */}
                <div className="grid grid-cols-3 gap-2 pt-4 text-center text-xs">
                  <div className="border border-slate-200 rounded-xl p-2.5 flex flex-col justify-between h-24">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Dibuat Oleh</span>
                    <div className="border-b border-slate-300 w-3/4 mx-auto"></div>
                    <span className="text-[10px] text-slate-400">(Admin / Gudang)</span>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-2.5 flex flex-col justify-between h-24">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Dikirim Oleh</span>
                    <div className="border-b border-slate-300 w-3/4 mx-auto"></div>
                    <span className="text-[10px] text-slate-400">(Kurir / Driver)</span>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-2.5 flex flex-col justify-between h-24">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Diterima Oleh</span>
                    <div className="border-b border-slate-300 w-3/4 mx-auto"></div>
                    <span className="text-[10px] text-slate-400">(Nama & Cap Penerima)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
