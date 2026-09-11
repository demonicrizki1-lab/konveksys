import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { MonthlyStatementModal, MarginReportItem } from './MonthlyStatementModal';
import { formatRp, formatDateIndo } from '../../utils/formatters';
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
  } = useApp();

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

  // Transform each Surat Jalan into full Margin Analytical Item
  const allMarginItems: MarginReportItem[] = useMemo(() => {
    const list: MarginReportItem[] = [];
    suratJalanList.forEach((sj) => {
      const sjItems = getSuratJalanItems(sj);
      sjItems.forEach((it, idx) => {
        const matchedSpk = spkList.find((s) => s.id === it.spkId || s.spkNumber === it.spkId);
        
        let jenisKain = it.jenisKain || 'Kain Standar';
        if ((!jenisKain || jenisKain === 'Kain Standar') && matchedSpk && matchedSpk.rollIds && matchedSpk.rollIds.length > 0) {
          const matchedRolls = inboundRolls.filter((r) => matchedSpk.rollIds.includes(r.id));
          if (matchedRolls.length > 0) {
            const names = Array.from(new Set(matchedRolls.map((r) => r.jenisKain).filter(Boolean)));
            jenisKain = names.join(', ');
          }
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
        });
      });
    });
    return list;
  }, [suratJalanList, spkList, inboundRolls, getBuyerRates, getVendorRate, getSuratJalanItems]);

  // Filtered margin items based on controls
  const filteredItems = useMemo(() => {
    return allMarginItems.filter((item) => {
      // Month filter
      if (selectedMonth !== 'ALL') {
        const itemMonth = item.tanggal.substring(0, 7);
        if (itemMonth !== selectedMonth) return false;
      }
      // Brand filter
      if (selectedBrand !== 'ALL' && item.brand !== selectedBrand) return false;
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
        if (!matchNo && !matchSpk && !matchProd && !matchBrand && !matchVendor && !matchKain) {
          return false;
        }
      }
      return true;
    });
  }, [allMarginItems, selectedMonth, selectedBrand, selectedVendor, statusFilter, searchTerm]);

  // KPI Calculations
  const kpi = useMemo(() => {
    let totalPcs = 0;
    let totalRevenue = 0;
    let totalCost = 0;

    filteredItems.forEach((item) => {
      totalPcs += item.totalPcs;
      totalRevenue += item.omzetBuyer;
      totalCost += item.biayaCmt;
    });

    const grossProfit = Math.max(0, totalRevenue - totalCost);
    const avgMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return {
      totalPcs,
      totalRevenue,
      totalCost,
      grossProfit,
      avgMargin,
    };
  }, [filteredItems]);

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
      <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg mb-2 border border-emerald-200">
              <TrendingUp className="w-3.5 h-3.5" />
              Executive Profit & Loss Analytics
            </div>
            <h1 className="text-xl font-bold text-slate-900">Analisis Margin & Rekap Bulanan</h1>
            <p className="text-slate-500 text-xs mt-1">
              Monitoring selisih riil antara Omzet Tagihan Brand dengan Beban Ongkos Jahit CMT Penjahit untuk mengukur laba bersih workshop.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 border border-slate-300 shadow-xs transition btn-press"
              title="Download Data sebagai File Excel (.csv)"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={() => setIsStatementModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition btn-press"
              title="Preview & Cetak Laporan Keuangan Bulanan Resmi"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Laporan PDF</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs">
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

      {/* 2. Four Main KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Revenue */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Omzet Buyer</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-0.5">{formatRp(kpi.totalRevenue)}</div>
          <p className="text-xs text-slate-400">Volume: {kpi.totalPcs.toLocaleString('id-ID')} Pcs barang kirim</p>
        </div>

        {/* Card 2: Total Cost */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Beban Jahit (CMT)</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Coins className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-0.5">{formatRp(kpi.totalCost)}</div>
          <p className="text-xs text-slate-400">Upah langsung ke mitra penjahit</p>
        </div>

        {/* Card 3: Gross Profit */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Laba Bersih Workshop</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-0.5">{formatRp(kpi.grossProfit)}</div>
          <p className="text-xs text-slate-400">Omzet dikurangi ongkos jahit</p>
        </div>

        {/* Card 4: Profit Margin % */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Rata-rata Margin</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Percent className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <div className="text-2xl font-bold text-indigo-700">{kpi.avgMargin.toFixed(1)}%</div>
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
          </div>

          {/* Progress Bar */}
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
        </div>
      </div>

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
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
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
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3 whitespace-nowrap">No SJ & SPK</th>
                <th className="p-3">Artikel & Material Kain</th>
                <th className="p-3">Brand & Penjahit</th>
                <th className="p-3 text-center whitespace-nowrap">Volume (Pcs)</th>
                <th className="p-3 text-right whitespace-nowrap">Omzet Buyer</th>
                <th className="p-3 text-right whitespace-nowrap">Beban CMT</th>
                <th className="p-3 text-right whitespace-nowrap">Laba Bersih</th>
                <th className="p-3 text-center whitespace-nowrap">Margin (%)</th>
                <th className="p-3 text-center whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Tidak ada transaksi pengiriman yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold text-indigo-700 whitespace-nowrap">
                      <div>{item.noSuratJalan}</div>
                      <span className="text-[10px] text-slate-400 font-normal block mt-0.5">
                        SPK: {item.spkNumber} • {formatDateIndo(item.tanggal)}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{item.produk}</div>
                      <span className="text-[10px] text-slate-500 block truncate max-w-[200px]" title={item.jenisKain}>
                        🧵 {item.jenisKain}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{item.brand}</div>
                      <span className="text-[10px] text-slate-500 block">Vendor: {item.vendor}</span>
                    </td>
                    <td className="p-3 text-center font-bold text-slate-900 whitespace-nowrap">{item.totalPcs} Pcs</td>
                    <td className="p-3 text-right font-medium text-slate-800 whitespace-nowrap tabular-nums">{formatRp(item.omzetBuyer)}</td>
                    <td className="p-3 text-right font-medium text-rose-600 whitespace-nowrap tabular-nums">{formatRp(item.biayaCmt)}</td>
                    <td className="p-3 text-right font-bold text-emerald-700 whitespace-nowrap tabular-nums">{formatRp(item.labaBersih)}</td>
                    <td className="p-3 text-center font-bold text-indigo-700 whitespace-nowrap">{item.marginPersen.toFixed(1)}%</td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-bold inline-block ${
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
              <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                <tr>
                  <td colSpan={3} className="p-3 text-right uppercase text-[10px] whitespace-nowrap">
                    Total Akumulasi:
                  </td>
                  <td className="p-3 text-center whitespace-nowrap">{kpi.totalPcs} Pcs</td>
                  <td className="p-3 text-right whitespace-nowrap tabular-nums">{formatRp(kpi.totalRevenue)}</td>
                  <td className="p-3 text-right text-rose-600 whitespace-nowrap tabular-nums">{formatRp(kpi.totalCost)}</td>
                  <td className="p-3 text-right text-emerald-700 whitespace-nowrap tabular-nums">{formatRp(kpi.grossProfit)}</td>
                  <td className="p-3 text-center text-indigo-700 whitespace-nowrap">{kpi.avgMargin.toFixed(1)}%</td>
                  <td className="p-3 text-center whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
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
      </div>

      {/* 5. Statement Print Modal */}
      {isStatementModalOpen && (
        <MonthlyStatementModal
          monthLabel={activeMonthLabel}
          brandFilter={selectedBrand}
          kpi={kpi}
          items={filteredItems}
          onClose={() => setIsStatementModalOpen(false)}
        />
      )}

    </div>
  );
};
