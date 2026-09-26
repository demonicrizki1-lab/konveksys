import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { MonthlyStatementModal, MarginReportItem } from './MonthlyStatementModal';
import { formatRp, formatDateIndo } from '../../utils/formatters';
import { matchBrand } from '../../utils/spkHelper';
import {
  TrendingUp,
  DollarSign,
  Coins,
  Percent,
  Download,
  Printer,
  Search,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Package,
  Award,
  Calendar,
  Layers,
  ChevronRight,
  ChevronLeft,
  Scissors,
  ShoppingBag,
  Info,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export const MarginAnalyticsView: React.FC = () => {
  const {
    suratJalanList,
    spkList,
    inboundRolls,
    brands,
    vendors,
    getBuyerRates,
    getVendorRate,
    getSuratJalanItems,
    fobDeposits,
    fobOrders,
  } = useApp();

  // Mode Skema: 'ALL' (Konsolidasi), 'CMT' (Makloon Jasa), 'FOB' (Order Bahan)
  const [orderSchemeFilter, setOrderSchemeFilter] = useState<'ALL' | 'CMT' | 'FOB'>('ALL');

  const [selectedMonth, setSelectedMonth] = useState<string>('ALL'); // 'ALL' or 'YYYY-MM'
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [selectedVendor, setSelectedVendor] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SEHAT' | 'MODERAT' | 'TIPIS'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);

  // Generate available months from Surat Jalan data
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    suratJalanList.forEach((sj) => {
      if (sj.tanggal) {
        const monthKey = sj.tanggal.substring(0, 7); // 'YYYY-MM'
        monthsSet.add(monthKey);
      }
    });

    // Also include current month if empty
    const currentMonthKey = new Date().toISOString().substring(0, 7);
    monthsSet.add(currentMonthKey);

    const sorted = Array.from(monthsSet).sort().reverse();
    return sorted.map((key) => {
      const [year, month] = key.split('-');
      const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      const label = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      return { key, label };
    });
  }, [suratJalanList]);

  // Transform each Surat Jalan into full Margin Analytical Item with CMT vs FOB detection
  const allMarginItems: MarginReportItem[] = useMemo(() => {
    const list: MarginReportItem[] = [];
    suratJalanList.forEach((sj) => {
      const sjItems = getSuratJalanItems(sj);
      sjItems.forEach((it, idx) => {
        const matchedSpk = spkList.find((s) => s.id === it.spkId || s.spkNumber === it.spkId);
        
        let jenisKain = it.jenisKain || 'Kain Standar';
        const matchedRolls = matchedSpk && matchedSpk.rollIds && matchedSpk.rollIds.length > 0
          ? inboundRolls.filter((r) => matchedSpk.rollIds.includes(r.id))
          : [];

        if ((!jenisKain || jenisKain === 'Kain Standar') && matchedRolls.length > 0) {
          const names = Array.from(new Set(matchedRolls.map((r) => r.jenisKain).filter(Boolean)));
          jenisKain = names.join(', ');
        }

        // Deteksi Skema Order: CMT vs FOB
        // Aturan: Saat ini hanya brand Monture Outdoor yang merupakan skema FOB, seluruh brand lainnya adalah CMT.
        const isFob = it.brand ? matchBrand(it.brand, 'MONTURE') : false;
        const orderType: 'CMT' | 'FOB' = isFob ? 'FOB' : 'CMT';

        // Nomor PO rujukan untuk pesanan FOB
        let fobPoNumber: string | undefined = undefined;
        if (isFob) {
          const matchedFobDeposit = fobDeposits.find(
            (d) => (matchedSpk?.depositId && d.id === matchedSpk.depositId) ||
                   (it.sourcePONumber && d.poNumber?.toLowerCase() === it.sourcePONumber.toLowerCase()) ||
                   (matchedSpk?.sourcePONumber && d.poNumber?.toLowerCase() === matchedSpk.sourcePONumber.toLowerCase()) ||
                   (it.brand && matchBrand(d.brand, it.brand))
          );
          const matchedFobOrder = fobOrders.find(
            (o) => (it.sourcePONumber && o.poNumber?.toLowerCase() === it.sourcePONumber.toLowerCase()) ||
                   (matchedSpk?.sourcePONumber && o.poNumber?.toLowerCase() === matchedSpk.sourcePONumber.toLowerCase()) ||
                   (it.brand && matchBrand(o.brand, it.brand))
          );
          fobPoNumber = matchedFobDeposit?.poNumber || matchedFobOrder?.poNumber || it.sourcePONumber || matchedSpk?.sourcePONumber || undefined;
        }

        // 1. Calculate Buyer Revenue
        const buyerRates = getBuyerRates(it.brand, it.produk);
        const subHuruf =
          (it.qtyDelivered.s || 0) * (buyerRates.rateS || buyerRates.rateSML || 0) +
          (it.qtyDelivered.m || 0) * (buyerRates.rateM || buyerRates.rateSML || 0) +
          (it.qtyDelivered.l || 0) * (buyerRates.rateL || buyerRates.rateSML || 0) +
          (it.qtyDelivered.xl || 0) * (buyerRates.rateXL || 0) +
          (it.qtyDelivered.xxl || 0) * (buyerRates.rateXXL || buyerRates.rateXL || 0);
        const subAnak =
          (it.qtyDelivered.anak4 || 0) * (buyerRates.rateAnak4 || 0) +
          (it.qtyDelivered.anak6 || 0) * (buyerRates.rateAnak6 || 0) +
          (it.qtyDelivered.anak8 || 0) * (buyerRates.rateAnak8 || 0) +
          (it.qtyDelivered.anak10 || 0) * (buyerRates.rateAnak10 || 0) +
          (it.qtyDelivered.anak12 || 0) * (buyerRates.rateAnak12 || 0) +
          (it.qtyDelivered.anak14 || 0) * (buyerRates.rateAnak14 || 0) +
          (it.qtyDelivered.anak16 || 0) * (buyerRates.rateAnak16 || 0);

        const omzetBuyer = subHuruf + subAnak;

        // 2. Calculate Vendor CMT Cost
        const vendorRate = getVendorRate(it.vendor, it.produk, it.brand);
        const biayaCmt = it.totalPcs * vendorRate;

        // 3. Gross Profit & Margin Percentage
        const labaBersih = Math.max(0, omzetBuyer - biayaCmt);
        const marginPersen = omzetBuyer > 0 ? (labaBersih / omzetBuyer) * 100 : 0;

        let statusMargin: 'SEHAT' | 'MODERAT' | 'TIPIS' = 'SEHAT';
        if (marginPersen < 15) {
          statusMargin = 'TIPIS';
        } else if (marginPersen < 30) {
          statusMargin = 'MODERAT';
        }

        list.push({
          id: `${sj.id}-${it.spkItemId || idx}`,
          noSuratJalan: sj.noSuratJalan,
          spkNumber: matchedSpk ? matchedSpk.spkNumber : it.spkNumber || it.spkId || '-',
          tanggal: sj.tanggal,
          produk: it.produk,
          jenisKain,
          brand: it.brand,
          vendor: it.vendor,
          totalPcs: it.totalPcs,
          omzetBuyer,
          biayaCmt,
          labaBersih,
          marginPersen,
          statusMargin,
          orderType,
          fobPoNumber,
        });
      });
    });
    return list;
  }, [suratJalanList, spkList, inboundRolls, fobDeposits, fobOrders, getBuyerRates, getVendorRate, getSuratJalanItems]);

  // Rekapitulasi Kontrak PO FOB & Pengadaan Bahan Toko
  const fobContractSummaries = useMemo(() => {
    return fobDeposits.map((dep) => {
      const items = dep.rincianBahan || [];
      const totalNilaiPo = Number(dep.totalNilaiPo || dep.nominalTotalOrder || 0);
      const totalBelanjaKain = items
        .filter((it) => it.kategori === 'KAIN')
        .reduce((acc, it) => acc + (it.subtotal || 0), 0);
      const totalBelanjaTrims = items
        .filter((it) => it.kategori === 'AKSESORIS')
        .reduce((acc, it) => acc + (it.subtotal || 0), 0);
      const totalBelanjaBahan = totalBelanjaKain + totalBelanjaTrims;
      const hakJasaCmt = Math.max(0, totalNilaiPo - totalBelanjaBahan);

      const relatedSJItems = allMarginItems.filter(
        (m) => (m.fobPoNumber && m.fobPoNumber.toLowerCase() === dep.poNumber.toLowerCase()) ||
               (m.brand.toLowerCase() === dep.brand.toLowerCase() && m.orderType === 'FOB')
      );
      const totalBiayaJahit = relatedSJItems.reduce((acc, it) => acc + it.biayaCmt, 0);
      const deliveredPcs = relatedSJItems.reduce((acc, it) => acc + it.totalPcs, 0);
      const estimasiLabaBersih = hakJasaCmt - (totalBiayaJahit > 0 ? totalBiayaJahit : 0);
      const marginPersen = totalNilaiPo > 0 ? (estimasiLabaBersih / totalNilaiPo) * 100 : 0;

      return {
        id: dep.id,
        depositNumber: dep.depositNumber,
        poNumber: dep.poNumber,
        brand: dep.brand,
        tanggal: dep.tanggalBayar,
        totalNilaiPo,
        totalBelanjaKain,
        totalBelanjaTrims,
        totalBelanjaBahan,
        hakJasaCmt,
        totalBiayaJahit,
        deliveredPcs,
        estimasiLabaBersih,
        marginPersen,
        itemCount: items.length,
        statusBahan: dep.statusBahan,
      };
    });
  }, [fobDeposits, allMarginItems]);

  // Filtered margin items based on controls
  const filteredItems = useMemo(() => {
    return allMarginItems.filter((item) => {
      // Skema Filter (ALL, CMT, FOB)
      if (orderSchemeFilter !== 'ALL' && item.orderType !== orderSchemeFilter) {
        return false;
      }
      // Month filter
      if (selectedMonth !== 'ALL') {
        const itemMonth = item.tanggal.substring(0, 7);
        if (itemMonth !== selectedMonth) return false;
      }
      // Brand filter
      if (selectedBrand !== 'ALL' && !matchBrand(item.brand, selectedBrand)) return false;
      // Vendor filter
      if (selectedVendor !== 'ALL' && item.vendor !== selectedVendor) return false;
      // Status filter
      if (statusFilter !== 'ALL' && item.statusMargin !== statusFilter) return false;
      // Search
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchNo = item.noSuratJalan.toLowerCase().includes(q);
        const matchSpk = item.spkNumber.toLowerCase().includes(q);
        const matchProd = item.produk.toLowerCase().includes(q);
        const matchBrand = item.brand.toLowerCase().includes(q);
        const matchVendor = item.vendor.toLowerCase().includes(q);
        const matchKain = item.jenisKain.toLowerCase().includes(q);
        const matchFobPo = item.fobPoNumber ? item.fobPoNumber.toLowerCase().includes(q) : false;
        if (!matchNo && !matchSpk && !matchProd && !matchBrand && !matchVendor && !matchKain && !matchFobPo) {
          return false;
        }
      }
      return true;
    });
  }, [allMarginItems, orderSchemeFilter, selectedMonth, selectedBrand, selectedVendor, statusFilter, searchTerm]);

  // Pagination State (Default 10)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Reset pagination on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedBrand, selectedVendor, statusFilter, searchTerm, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredItems.length);

  const paginatedItems = useMemo(() => {
    return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredItems, startIndex, itemsPerPage]);

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

  // KPI Calculations
  const kpi = useMemo(() => {
    let totalPcs = 0;
    let totalRevenue = 0;
    let totalCost = 0;
    let cmtProfit = 0;
    let fobProfit = 0;

    filteredItems.forEach((item) => {
      totalPcs += item.totalPcs;
      totalRevenue += item.omzetBuyer;
      totalCost += item.biayaCmt;
      if (item.orderType === 'FOB') {
        fobProfit += item.labaBersih;
      } else {
        cmtProfit += item.labaBersih;
      }
    });

    const grossProfit = Math.max(0, totalRevenue - totalCost);
    const avgMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // FOB Contract Aggregates (filtered by brand if selected)
    const relevantFobContracts = fobContractSummaries.filter((c) => {
      if (selectedBrand !== 'ALL' && c.brand !== selectedBrand) return false;
      return true;
    });

    const totalFobPoContract = relevantFobContracts.reduce((acc, c) => acc + c.totalNilaiPo, 0);
    const totalFobBelanjaBahan = relevantFobContracts.reduce((acc, c) => acc + c.totalBelanjaBahan, 0);
    const totalFobBelanjaKain = relevantFobContracts.reduce((acc, c) => acc + c.totalBelanjaKain, 0);
    const totalFobBelanjaTrims = relevantFobContracts.reduce((acc, c) => acc + c.totalBelanjaTrims, 0);
    const totalFobHakJasa = relevantFobContracts.reduce((acc, c) => acc + c.hakJasaCmt, 0);

    return {
      totalPcs,
      totalRevenue,
      totalCost,
      grossProfit,
      avgMargin,
      cmtProfit,
      fobProfit,
      totalFobPoContract,
      totalFobBelanjaBahan,
      totalFobBelanjaKain,
      totalFobBelanjaTrims,
      totalFobHakJasa,
    };
  }, [filteredItems, fobContractSummaries, selectedBrand]);

  // Top 3 Most Profitable Articles
  const topArticles = useMemo(() => {
    const articleMap: Record<string, { produk: string; brand: string; totalPcs: number; totalProfit: number; totalRevenue: number }> = {};

    filteredItems.forEach((item) => {
      const key = `${item.brand}-${item.produk}`;
      if (!articleMap[key]) {
        articleMap[key] = {
          produk: item.produk,
          brand: item.brand,
          totalPcs: 0,
          totalProfit: 0,
          totalRevenue: 0,
        };
      }
      articleMap[key].totalPcs += item.totalPcs;
      articleMap[key].totalProfit += item.labaBersih;
      articleMap[key].totalRevenue += item.omzetBuyer;
    });

    return Object.values(articleMap)
      .map((item) => ({
        ...item,
        marginPersen: item.totalRevenue > 0 ? (item.totalProfit / item.totalRevenue) * 100 : 0,
      }))
      .sort((a, b) => b.totalProfit - a.totalProfit)
      .slice(0, 3);
  }, [filteredItems]);

  // Brand Contribution Breakdown
  const brandContributions = useMemo(() => {
    const map: Record<string, { brand: string; totalPcs: number; revenue: number; profit: number }> = {};
    filteredItems.forEach((item) => {
      if (!map[item.brand]) {
        map[item.brand] = { brand: item.brand, totalPcs: 0, revenue: 0, profit: 0 };
      }
      map[item.brand].totalPcs += item.totalPcs;
      map[item.brand].revenue += item.omzetBuyer;
      map[item.brand].profit += item.labaBersih;
    });

    return Object.values(map)
      .map((b) => ({
        ...b,
        marginPersen: b.revenue > 0 ? (b.profit / b.revenue) * 100 : 0,
        shareOfProfit: kpi.grossProfit > 0 ? (b.profit / kpi.grossProfit) * 100 : 0,
      }))
      .sort((a, b) => b.profit - a.profit);
  }, [filteredItems, kpi.grossProfit]);

  // Active Month Label
  const activeMonthLabel = useMemo(() => {
    if (selectedMonth === 'ALL') return 'Semua Periode (All-Time)';
    const found = availableMonths.find((m) => m.key === selectedMonth);
    return found ? found.label : selectedMonth;
  }, [selectedMonth, availableMonths]);

  // Export to Excel / CSV
  const handleExportCSV = () => {
    if (filteredItems.length === 0) {
      alert('Tidak ada data untuk diekspor!');
      return;
    }

    const headers = [
      'No Surat Jalan',
      'No SPK',
      'Tanggal',
      'Skema Order',
      'PO Rujukan',
      'Artikel Produk',
      'Material Kain',
      'Brand Buyer',
      'Mitra Penjahit',
      'Qty Pcs',
      'Omzet Buyer (Rp)',
      'Beban CMT Vendor (Rp)',
      'Laba Bersih Workshop (Rp)',
      'Margin Persen (%)',
      'Status Margin',
    ];

    const rows = filteredItems.map((item) => [
      `"${item.noSuratJalan}"`,
      `"${item.spkNumber}"`,
      `"${item.tanggal}"`,
      `"${item.orderType || 'CMT'}"`,
      `"${item.fobPoNumber || '-'}"`,
      `"${item.produk}"`,
      `"${item.jenisKain}"`,
      `"${item.brand}"`,
      `"${item.vendor}"`,
      item.totalPcs,
      item.omzetBuyer,
      item.biayaCmt,
      item.labaBersih,
      `${item.marginPersen.toFixed(1)}%`,
      `"${item.statusMargin}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeMonth = activeMonthLabel.replace(/[/\\?%*:|"<> ]/g, '_');
    a.download = `Rekap_Margin_Maison_${safeMonth}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner & Executive Actions */}
      <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg mb-2 border border-emerald-200">
              <TrendingUp className="w-3.5 h-3.5" />
              Executive Profit & Loss Analytics
            </div>
            <h1 className="text-xl font-bold text-slate-900">Analisis Margin & Rekap Bulanan</h1>
            <p className="text-slate-500 text-xs mt-1">
              Monitoring selisih riil omzet terhadap beban jahit & belanja bahan dengan pemisahan skema CMT vs FOB secara akurat.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 border border-slate-300 shadow-xs transition btn-press cursor-pointer"
              title="Download Data sebagai File Excel (.csv)"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={() => setIsStatementModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition btn-press cursor-pointer"
              title="Preview & Cetak Laporan Keuangan Bulanan Resmi"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Laporan PDF</span>
            </button>
          </div>
        </div>

        {/* Dual Mode Switcher (Segmented Control Tabs) */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80">
          <button
            onClick={() => setOrderSchemeFilter('ALL')}
            className={`flex-1 min-w-[160px] py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              orderSchemeFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${orderSchemeFilter === 'ALL' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>Semua Model (Konsolidasi)</span>
          </button>

          <button
            onClick={() => setOrderSchemeFilter('CMT')}
            className={`flex-1 min-w-[160px] py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              orderSchemeFilter === 'CMT'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Scissors className={`w-3.5 h-3.5 ${orderSchemeFilter === 'CMT' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>Khusus CMT (Makloon Jasa)</span>
          </button>

          <button
            onClick={() => setOrderSchemeFilter('FOB')}
            className={`flex-1 min-w-[160px] py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              orderSchemeFilter === 'FOB'
                ? 'bg-white text-purple-700 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <ShoppingBag className={`w-3.5 h-3.5 ${orderSchemeFilter === 'FOB' ? 'text-purple-600' : 'text-slate-400'}`} />
            <span>Khusus FOB (Order Bahan)</span>
            {fobContractSummaries.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-800 font-bold ml-1">
                {fobContractSummaries.length}
              </span>
            )}
          </button>
        </div>

        {/* Dynamic Contextual Helper Banner explaining the business formula */}
        <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
          orderSchemeFilter === 'CMT'
            ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
            : orderSchemeFilter === 'FOB'
            ? 'bg-purple-50/70 border-purple-200 text-purple-900'
            : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
        }`}>
          <Info className={`w-4 h-4 shrink-0 mt-0.5 ${
            orderSchemeFilter === 'CMT' ? 'text-indigo-600' : orderSchemeFilter === 'FOB' ? 'text-purple-600' : 'text-emerald-600'
          }`} />
          <div className="leading-relaxed">
            {orderSchemeFilter === 'CMT' ? (
              <span>
                <strong>Prinsip Akuntansi Makloon CMT:</strong> Kain & aksesoris adalah 100% aset milik buyer (dititipkan), sehingga <strong className="underline decoration-indigo-400">nilai kain TIDAK dipotong</strong> dari omzet workshop. Laba Bersih murni dihitung dari: <code>Omzet Jasa Jahit Buyer - Beban Jahit Penjahit Mitra</code>.
              </span>
            ) : orderSchemeFilter === 'FOB' ? (
              <span>
                <strong>Prinsip Akuntansi FOB (Full Order Bahan):</strong> Workshop membelanjakan modal bahan baku (kain & trims). Laba Bersih dihitung: <code>(Nilai Kontrak PO - Total Belanja Bahan Toko) = Hak Jasa CMT</code>, lalu dikurangi <code>Beban Jahit Penjahit = Laba Bersih Akhir</code>.
              </span>
            ) : (
              <span>
                <strong>Mode Konsolidasi Keuangan:</strong> Menggabungkan akumulasi laba dari seluruh pengiriman Surat Jalan skema makloon murni (CMT) dan skema pesanan penuh (FOB). Total Laba Bersih workshop mencerminkan kontribusi gabungan kedua lini usaha.
              </span>
            )}
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="block font-bold text-slate-600 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              Periode Bulan Rekap:
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="ALL">Semua Bulan (All-Time)</option>
              {availableMonths.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              Filter Brand Buyer:
            </label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="ALL">Semua Brand</option>
              {brands.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              Filter Mitra Penjahit:
            </label>
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="ALL">Semua Penjahit (Vendor)</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.name}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1 flex items-center gap-1">
              <Percent className="w-3.5 h-3.5 text-emerald-600" />
              Kesehatan Margin:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="ALL">Semua Tingkat Margin</option>
              <option value="SEHAT">🟢 Sehat (&gt; 30%)</option>
              <option value="MODERAT">🟡 Moderat (15% - 30%)</option>
              <option value="TIPIS">🔴 Tipis (&lt; 15%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Four Main KPI Metric Cards (Dynamic according to CMT/FOB/ALL) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Revenue / Contract */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {orderSchemeFilter === 'CMT'
                ? 'Omzet Jasa Makloon'
                : orderSchemeFilter === 'FOB'
                ? 'Kontrak PO FOB'
                : 'Total Omzet Terkirim'}
            </span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              orderSchemeFilter === 'FOB' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
            }`}>
              {orderSchemeFilter === 'FOB' ? <ShoppingBag className="w-4.5 h-4.5" /> : <DollarSign className="w-4.5 h-4.5" />}
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-0.5">
            {formatRp(orderSchemeFilter === 'FOB' ? (kpi.totalFobPoContract || kpi.totalRevenue) : kpi.totalRevenue)}
          </div>
          <p className="text-xs text-slate-400">
            {orderSchemeFilter === 'FOB'
              ? `Dari ${fobContractSummaries.length} kontrak PO aktif`
              : `Volume: ${kpi.totalPcs.toLocaleString('id-ID')} Pcs barang kirim`}
          </p>
        </div>

        {/* Card 2: Cost / Materials */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {orderSchemeFilter === 'FOB' ? 'Modal Belanja Bahan' : 'Beban Jahit (CMT)'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Coins className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-0.5">
            {formatRp(orderSchemeFilter === 'FOB' ? kpi.totalFobBelanjaBahan : kpi.totalCost)}
          </div>
          <p className="text-xs text-slate-400">
            {orderSchemeFilter === 'FOB'
              ? `Kain ${formatRp(kpi.totalFobBelanjaKain)} + Trims ${formatRp(kpi.totalFobBelanjaTrims)}`
              : 'Upah langsung ke mitra penjahit'}
          </p>
        </div>

        {/* Card 3: Net Profit / Hak Jasa */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {orderSchemeFilter === 'FOB' ? 'Hak Jasa CMT Workshop' : 'Laba Bersih Workshop'}
            </span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              orderSchemeFilter === 'FOB' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className={`text-2xl font-bold mt-0.5 ${
            orderSchemeFilter === 'FOB' ? 'text-indigo-700' : 'text-emerald-700'
          }`}>
            {formatRp(orderSchemeFilter === 'FOB' ? kpi.totalFobHakJasa : kpi.grossProfit)}
          </div>
          <p className="text-xs text-slate-400">
            {orderSchemeFilter === 'ALL'
              ? `CMT: ${formatRp(kpi.cmtProfit)} • FOB: ${formatRp(kpi.fobProfit)}`
              : orderSchemeFilter === 'CMT'
              ? 'Omzet dikurangi upah jahit (Kain Rp 0)'
              : 'Kontrak PO dikurangi belanja bahan toko'}
          </p>
        </div>

        {/* Card 4: Profit Margin % / Realisasi Kirim */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {orderSchemeFilter === 'FOB' ? 'Realisasi Laba Kirim' : 'Rata-rata Margin'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Percent className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <div className="text-2xl font-bold text-indigo-700">
              {orderSchemeFilter === 'FOB'
                ? formatRp(kpi.fobProfit || kpi.grossProfit)
                : `${kpi.avgMargin.toFixed(1)}%`}
            </div>
            {orderSchemeFilter !== 'FOB' && (
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  kpi.avgMargin >= 30
                    ? 'bg-emerald-100 text-emerald-800'
                    : kpi.avgMargin >= 15
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {kpi.avgMargin >= 30 ? 'Sehat' : kpi.avgMargin >= 15 ? 'Moderat' : 'Tipis'}
              </span>
            )}
          </div>

          {/* Subtitle / Progress */}
          {orderSchemeFilter === 'FOB' ? (
            <p className="text-xs text-slate-400">
              Dari {kpi.totalPcs.toLocaleString('id-ID')} Pcs terkirim di surat jalan
            </p>
          ) : (
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  kpi.avgMargin >= 30
                    ? 'bg-emerald-500'
                    : kpi.avgMargin >= 15
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, kpi.avgMargin))}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* 2b. FOB Contract & Material Procurement Overview (Shown in FOB or ALL mode when FOB contracts exist) */}
      {(orderSchemeFilter === 'FOB' || (orderSchemeFilter === 'ALL' && fobContractSummaries.length > 0)) && (
        <div className="bg-white rounded-xl border border-purple-200 shadow-xs overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-100 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-lg mb-1 border border-purple-200">
                <ShoppingBag className="w-3.5 h-3.5" />
                Rekapitulasi Pengadaan Bahan Toko (FOB)
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                Rincian Kontrak PO, Belanja Bahan & Hak Jasa CMT
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Nilai bahan (kain & aksesoris) yang dibelanjakan langsung oleh workshop ke toko supplier untuk pesanan FOB.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-500">Total Modal Bahan:</span>
              <div className="text-base font-bold text-rose-700">{formatRp(kpi.totalFobBelanjaBahan)}</div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-[11px] text-slate-700">
              <thead className="bg-purple-50/70 border-b border-purple-200 text-purple-900 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-2.5 py-2.5 whitespace-nowrap">No Kontrak / PO</th>
                  <th className="px-2 py-2.5 whitespace-nowrap">Brand Buyer</th>
                  <th className="px-2 py-2.5 text-right whitespace-nowrap">Nilai Kontrak PO</th>
                  <th className="px-2 py-2.5 text-right whitespace-nowrap">Belanja Kain</th>
                  <th className="px-2 py-2.5 text-right whitespace-nowrap">Belanja Trims</th>
                  <th className="px-2 py-2.5 text-right font-bold text-rose-700 whitespace-nowrap">Modal Bahan</th>
                  <th className="px-2 py-2.5 text-right font-bold text-purple-700 whitespace-nowrap">Hak Jasa CMT</th>
                  <th className="px-2 py-2.5 text-right whitespace-nowrap">Realisasi Jahit</th>
                  <th className="px-2 py-2.5 text-right font-bold text-emerald-700 whitespace-nowrap">Est. Laba</th>
                  <th className="px-2 py-2.5 text-center whitespace-nowrap">Status Bahan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {fobContractSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-6 text-center text-slate-400">
                      Belum ada data kontrak PO FOB yang tercatat di sistem.
                    </td>
                  </tr>
                ) : (
                  fobContractSummaries.map((fob) => (
                    <tr key={fob.id} className="hover:bg-purple-50/30 transition">
                      <td className="px-2.5 py-2 font-mono font-bold text-purple-700 whitespace-nowrap">
                        <div className="text-[11px]">{fob.depositNumber}</div>
                        <span className="text-[9px] text-slate-400 font-normal block leading-tight">PO: {fob.poNumber}</span>
                      </td>
                      <td className="px-2 py-2 font-semibold text-slate-800 whitespace-nowrap text-[11px]">
                        {fob.brand}
                      </td>
                      <td className="px-2 py-2 text-right font-bold text-slate-900 whitespace-nowrap tabular-nums text-[11px]">
                        {formatRp(fob.totalNilaiPo)}
                      </td>
                      <td className="px-2 py-2 text-right text-slate-600 whitespace-nowrap tabular-nums text-[11px]">
                        {formatRp(fob.totalBelanjaKain)}
                      </td>
                      <td className="px-2 py-2 text-right text-slate-600 whitespace-nowrap tabular-nums text-[11px]">
                        {formatRp(fob.totalBelanjaTrims)}
                      </td>
                      <td className="px-2 py-2 text-right font-bold text-rose-700 whitespace-nowrap tabular-nums bg-rose-50/30 text-[11px]">
                        {formatRp(fob.totalBelanjaBahan)}
                      </td>
                      <td className="px-2 py-2 text-right font-bold text-purple-700 whitespace-nowrap tabular-nums bg-purple-50/30 text-[11px]">
                        {formatRp(fob.hakJasaCmt)}
                      </td>
                      <td className="px-2 py-2 text-right text-slate-700 whitespace-nowrap tabular-nums text-[11px]">
                        {formatRp(fob.totalBiayaJahit)}
                        {fob.deliveredPcs > 0 && (
                          <span className="block text-[8px] text-slate-400 font-normal">({fob.deliveredPcs} pcs)</span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-right font-bold text-emerald-700 whitespace-nowrap tabular-nums text-[11px]">
                        {formatRp(fob.estimasiLabaBersih)}
                      </td>
                      <td className="px-2 py-2 text-center whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                          {fob.statusBahan}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Top Insights: Top Products & Brand Contribution (2 Column Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Top 3 Most Profitable Articles */}
        <div className="lg:col-span-6 bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Top 3 Artikel Paling Menguntungkan
            </h3>
            <span className="text-[11px] text-slate-400">Kontribusi laba terbesar</span>
          </div>

          {topArticles.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Belum ada data artikel pada filter ini.
            </div>
          ) : (
            <div className="space-y-3">
              {topArticles.map((art, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between hover:border-slate-300 transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center ${
                        idx === 0
                          ? 'bg-amber-100 text-amber-800'
                          : idx === 1
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">{art.produk}</div>
                      <div className="text-[10px] text-slate-500">{art.brand} • {art.totalPcs} pcs</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-xs text-emerald-700">{formatRp(art.totalProfit)}</div>
                    <span className="text-[10px] text-indigo-600 font-semibold">Margin {art.marginPersen.toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Profit Contribution per Brand */}
        <div className="lg:col-span-6 bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              Kontribusi Laba per Brand Buyer
            </h3>
            <span className="text-[11px] text-slate-400">Porsi profit workshop</span>
          </div>

          {brandContributions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Belum ada data brand pada filter ini.
            </div>
          ) : (
            <div className="space-y-3">
              {brandContributions.map((b, idx) => (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between font-semibold text-slate-800">
                    <div className="flex items-center gap-2">
                      <span>{b.brand}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({b.totalPcs} pcs)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-700">{formatRp(b.profit)}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({b.shareOfProfit.toFixed(0)}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, b.shareOfProfit))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* 4. Comprehensive Margin Analytics Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Rincian Analisis Margin per Pengiriman Surat Jalan
            </h3>
            <span className="text-xs text-slate-400">
              Menampilkan {filteredItems.length} transaksi pengiriman pada {activeMonthLabel}
            </span>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari SJ, SPK, Produk, Brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-[11px] text-slate-700">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-2.5 py-2.5 whitespace-nowrap">No SJ & SPK</th>
                <th className="px-1.5 py-2.5 text-center whitespace-nowrap">Skema & PO</th>
                <th className="px-2 py-2.5">Artikel & Material Kain</th>
                <th className="px-2 py-2.5">Brand & Penjahit</th>
                <th className="px-1.5 py-2.5 text-center whitespace-nowrap">Volume</th>
                <th className="px-2 py-2.5 text-right whitespace-nowrap">Omzet Buyer</th>
                <th className="px-2 py-2.5 text-right whitespace-nowrap">Beban CMT</th>
                <th className="px-2 py-2.5 text-right whitespace-nowrap">Laba Bersih</th>
                <th className="px-1.5 py-2.5 text-center whitespace-nowrap">Margin</th>
                <th className="px-1.5 py-2.5 text-center whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    Tidak ada transaksi pengiriman yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="px-2.5 py-2 font-mono font-bold text-indigo-700 whitespace-nowrap">
                      <div className="text-[11px]">{item.noSuratJalan}</div>
                      <span className="text-[9px] text-slate-400 font-normal block leading-tight">
                        SPK: {item.spkNumber}
                      </span>
                    </td>
                    <td className="px-1.5 py-2 text-center whitespace-nowrap">
                      {item.orderType === 'FOB' ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            <ShoppingBag className="w-2.5 h-2.5 text-purple-600" />
                            FOB
                          </span>
                          {item.fobPoNumber && (
                            <span className="text-[8px] font-mono text-purple-700 mt-0.5 max-w-[65px] truncate" title={item.fobPoNumber}>
                              {item.fobPoNumber}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          <Scissors className="w-2.5 h-2.5 text-indigo-500" />
                          CMT
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <div className="font-bold text-slate-900 text-[11px] truncate max-w-[140px]" title={item.produk}>
                        {item.produk}
                      </div>
                      <span className="text-[9px] text-slate-500 block truncate max-w-[140px]" title={item.jenisKain}>
                        🧵 {item.jenisKain}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <div className="font-semibold text-slate-800 text-[11px] truncate max-w-[110px]" title={item.brand}>
                        {item.brand}
                      </div>
                      <span className="text-[9px] text-slate-500 block truncate max-w-[110px]" title={item.vendor}>
                        Vdr: {item.vendor}
                      </span>
                    </td>
                    <td className="px-1.5 py-2 text-center font-bold text-slate-900 whitespace-nowrap text-[11px]">
                      {item.totalPcs} <span className="text-[9px] font-normal text-slate-400">Pcs</span>
                    </td>
                    <td className="px-2 py-2 text-right font-medium text-slate-800 whitespace-nowrap tabular-nums text-[11px]">
                      {formatRp(item.omzetBuyer)}
                    </td>
                    <td className="px-2 py-2 text-right font-medium text-rose-600 whitespace-nowrap tabular-nums text-[11px]">
                      {formatRp(item.biayaCmt)}
                    </td>
                    <td className="px-2 py-2 text-right font-bold text-emerald-700 whitespace-nowrap tabular-nums text-[11px]">
                      {formatRp(item.labaBersih)}
                    </td>
                    <td className="px-1.5 py-2 text-center font-bold text-indigo-700 whitespace-nowrap text-[11px]">
                      {item.marginPersen.toFixed(1)}%
                    </td>
                    <td className="px-1.5 py-2 text-center whitespace-nowrap">
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold inline-block ${
                          item.statusMargin === 'SEHAT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.statusMargin === 'MODERAT'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.statusMargin}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredItems.length > 0 && (
              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900 text-[11px]">
                <tr>
                  <td colSpan={4} className="px-2.5 py-2 text-right uppercase text-[10px] whitespace-nowrap">
                    Total:
                  </td>
                  <td className="px-1.5 py-2 text-center whitespace-nowrap">{kpi.totalPcs} Pcs</td>
                  <td className="px-2 py-2 text-right whitespace-nowrap tabular-nums">{formatRp(kpi.totalRevenue)}</td>
                  <td className="px-2 py-2 text-right text-rose-600 whitespace-nowrap tabular-nums">{formatRp(kpi.totalCost)}</td>
                  <td className="px-2 py-2 text-right text-emerald-700 whitespace-nowrap tabular-nums">{formatRp(kpi.grossProfit)}</td>
                  <td className="px-1.5 py-2 text-center text-indigo-700 whitespace-nowrap">{kpi.avgMargin.toFixed(1)}%</td>
                  <td className="px-1.5 py-2 text-center whitespace-nowrap">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        kpi.avgMargin >= 30
                          ? 'bg-emerald-100 text-emerald-800'
                          : kpi.avgMargin >= 15
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {kpi.avgMargin >= 30 ? 'SEHAT' : kpi.avgMargin >= 15 ? 'MODERAT' : 'TIPIS'}
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs">
          <div className="flex items-center gap-3 text-slate-500 font-medium">
            <span>
              Menampilkan <strong className="text-slate-800">{filteredItems.length > 0 ? startIndex + 1 : 0}</strong> - <strong className="text-slate-800">{endIndex}</strong> dari <strong className="text-slate-800">{filteredItems.length}</strong> Transaksi
            </span>
            <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
              <span className="text-[11px] text-slate-400">Tampilkan:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-md px-2 py-0.5 text-xs font-semibold text-slate-700 outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value={10}>10 per hal</option>
                <option value={25}>25 per hal</option>
                <option value={50}>50 per hal</option>
                <option value={100}>100 per hal</option>
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
                  <span key={`dots-${idx}`} className="px-1 text-slate-400 font-medium">
                    ...
                  </span>
                ) : (
                  <button
                    key={`page-${p}`}
                    onClick={() => setCurrentPage(Number(p))}
                    className={`min-w-[30px] h-7 px-2 text-xs font-bold rounded-lg transition ${
                      safeCurrentPage === p
                        ? 'bg-emerald-600 text-white shadow-sm'
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

      {/* 5. Statement Print Modal */}
      {isStatementModalOpen && (
        <MonthlyStatementModal
          monthLabel={activeMonthLabel}
          brandFilter={selectedBrand}
          orderScheme={orderSchemeFilter}
          kpi={kpi}
          items={filteredItems}
          onClose={() => setIsStatementModalOpen(false)}
        />
      )}

    </div>
  );
};
