import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { MonthlyStatementModal, MarginReportItem, FabricReportItem } from './MonthlyStatementModal';
import { SavedNetProfitReport } from '../../types';
import { formatRp, formatDateIndo } from '../../utils/formatters';
import { matchBrand, resolveItemPONumber } from '../../utils/spkHelper';
import {
  TrendingUp,
  DollarSign,
  Download,
  Printer,
  Search,
  Filter,
  Building2,
  Package,
  Calendar,
  Scissors,
  Info,
  Sparkles,
  CheckCircle2,
  CheckSquare,
  Square,
  BookmarkCheck,
  History,
  Trash2,
  ArrowLeft,
  Eye,
  X,
  FileSpreadsheet,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Save,
} from 'lucide-react';

const STORAGE_SAVED_REPORTS_KEY = 'konvek_saved_margin_reports';

export const MarginAnalyticsView: React.FC = () => {
  const {
    suratJalanList,
    spkList,
    inboundRolls,
    brands,
    vendors,
    productionPOs,
    getBuyerRates,
    getVendorRate,
    getSuratJalanItems,
    fobDeposits,
    fobOrders,
    userRole,
  } = useApp();

  // Mode View Utama: 'generator' (Penyusun Laporan) atau 'saved_reports' (Arsip Laporan Tersimpan)
  const [viewMode, setViewMode] = useState<'generator' | 'saved_reports'>('generator');

  // Laporan Tersimpan yang sedang ditinjau (Snapshot Review)
  const [activeSnapshot, setActiveSnapshot] = useState<SavedNetProfitReport | null>(null);

  // 1. FILTER UTAMA (Bulan & Brand)
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL'); // 'ALL' or 'YYYY-MM'
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL'); // 'ALL' = Semua Brand (Konsolidasi)
  const [selectedVendor, setSelectedVendor] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SEHAT' | 'MODERAT' | 'TIPIS'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // 2. SELEKSI 3 FILTER UTAMA (Sama persis seperti menu Finance Tagihan Brand)
  // - Seleksi PO Produksi
  const [selectedPoNumbers, setSelectedPoNumbers] = useState<string[]>([]);
  // - Seleksi Surat Jalan (Checklist)
  const [selectedSjRowKeys, setSelectedSjRowKeys] = useState<string[]>([]);
  // - Seleksi Kain Terpakai (Checklist)
  const [selectedRollIds, setSelectedRollIds] = useState<string[]>([]);
  // Tab Seleksi Interaktif: 'surat_jalan' atau 'kain'
  const [activeSubTab, setActiveSubTab] = useState<'surat_jalan' | 'kain'>('surat_jalan');

  // Accordion Expand/Collapse baris rincian varian produk per Surat Jalan
  const [expandedSjKeys, setExpandedSjKeys] = useState<string[]>([]);
  const toggleExpandSj = (key: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedSjKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  // Modals State
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveNotes, setSaveNotes] = useState('');

  // LocalStorage Saved Reports State
  const [savedReports, setSavedReports] = useState<SavedNetProfitReport[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_SAVED_REPORTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Gagal memuat arsip laporan:', e);
      return [];
    }
  });

  const persistSavedReports = (newList: SavedNetProfitReport[]) => {
    setSavedReports(newList);
    try {
      localStorage.setItem(STORAGE_SAVED_REPORTS_KEY, JSON.stringify(newList));
    } catch (e) {
      console.error('Gagal menyimpan arsip laporan ke localStorage:', e);
    }
  };

  // Generate available months dari seluruh Surat Jalan
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    suratJalanList.forEach((sj) => {
      if (sj.tanggal) {
        const monthKey = sj.tanggal.substring(0, 7);
        monthsSet.add(monthKey);
      }
    });

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

  // Label bulan aktif
  const activeMonthLabel = useMemo(() => {
    if (selectedMonth === 'ALL') return 'Semua Periode (All-Time)';
    const found = availableMonths.find((m) => m.key === selectedMonth);
    return found ? found.label : selectedMonth;
  }, [selectedMonth, availableMonths]);

  // =========================================================================
  // 1. DATA PO PRODUKSI (Filterable by Brand & Month)
  // =========================================================================
  const availablePOs = useMemo(() => {
    return (productionPOs || []).filter((po) => {
      // Filter Brand jika dipilih
      if (selectedBrand !== 'ALL' && !matchBrand(po.brand, selectedBrand)) {
        return false;
      }
      return true;
    });
  }, [productionPOs, selectedBrand]);

  // Auto-sync PO selection when availablePOs change
  useEffect(() => {
    if (availablePOs.length > 0) {
      // Default: centang semua PO yang relevan
      setSelectedPoNumbers(availablePOs.map((p) => p.noPO));
    } else {
      setSelectedPoNumbers([]);
    }
  }, [availablePOs]);

  // =========================================================================
  // 2. DATA SURAT JALAN & OMZET (Consolidated per Surat Jalan)
  // =========================================================================
  const allAvailableSjItems = useMemo(() => {
    const list: Array<
      MarginReportItem & {
        rowKey: string;
      }
    > = [];

    suratJalanList.forEach((sj) => {
      // Filter Bulan
      if (selectedMonth !== 'ALL') {
        const sjMonth = sj.tanggal ? sj.tanggal.substring(0, 7) : '';
        if (sjMonth !== selectedMonth) return;
      }

      const rawItems = getSuratJalanItems(sj);
      // Filter Brand
      const matchedItems = rawItems.filter((it) => {
        const itBrand = it.brand || sj.brand || 'UMUM';
        return selectedBrand === 'ALL' || matchBrand(itBrand, selectedBrand);
      });

      if (matchedItems.length === 0) return;

      // Konsolidasi angka per Surat Jalan
      let totalPcs = 0;
      let totalOmzetBuyer = 0;
      let totalBiayaCmt = 0;
      const poSet = new Set<string>();
      const spkSet = new Set<string>();
      const prodSet = new Set<string>();
      const kainSet = new Set<string>();
      const vendorSet = new Set<string>();
      const brandSet = new Set<string>();
      const subItemsList: Array<{
        idx: number;
        produk: string;
        jenisKain: string;
        totalPcs: number;
        omzetBuyer: number;
        biayaCmt: number;
        labaBersih: number;
        vendor?: string;
      }> = [];

      matchedItems.forEach((it, idx) => {
        const itBrand = it.brand || sj.brand || 'UMUM';
        brandSet.add(itBrand);
        if (it.vendor) vendorSet.add(it.vendor);

        const matchedSpk = spkList.find((s) => s.id === it.spkId || s.spkNumber === it.spkId);
        const spkVal = matchedSpk?.spkNumber || it.spkNumber || it.spkId;
        if (spkVal) spkSet.add(spkVal);

        const resolvedPo = resolveItemPONumber(it, spkList, sj, productionPOs) || it.sourcePONumber || undefined;
        if (resolvedPo) poSet.add(resolvedPo);

        let jenisKain = it.jenisKain || 'Kain Standar';
        const matchedRolls =
          matchedSpk && matchedSpk.rollIds && matchedSpk.rollIds.length > 0
            ? inboundRolls.filter((r) => matchedSpk.rollIds.includes(r.id))
            : [];
        if ((!jenisKain || jenisKain === 'Kain Standar') && matchedRolls.length > 0) {
          const names = Array.from(new Set(matchedRolls.map((r) => r.jenisKain).filter(Boolean)));
          if (names.length > 0) jenisKain = names.join(', ');
        }
        if (jenisKain) kainSet.add(jenisKain);
        if (it.produk) prodSet.add(it.produk);

        const buyerRates = getBuyerRates(itBrand, it.produk);
        const qtyS = it.qtyDelivered?.s || 0;
        const qtyM = it.qtyDelivered?.m || 0;
        const qtyL = it.qtyDelivered?.l || 0;
        const qtyXL = it.qtyDelivered?.xl || 0;
        const qtyXXL = it.qtyDelivered?.xxl || 0;
        const qtySML = (it.qtyDelivered as any)?.sml || 0;

        const qtyAnak4 = it.qtyDelivered?.anak4 || 0;
        const qtyAnak6 = it.qtyDelivered?.anak6 || 0;
        const qtyAnak8 = it.qtyDelivered?.anak8 || 0;
        const qtyAnak10 = it.qtyDelivered?.anak10 || 0;
        const qtyAnak12 = it.qtyDelivered?.anak12 || 0;
        const qtyAnak14 = it.qtyDelivered?.anak14 || 0;
        const qtyAnak16 = it.qtyDelivered?.anak16 || 0;

        const subHuruf =
          qtyS * (buyerRates.rateS || buyerRates.rateSML || 0) +
          qtyM * (buyerRates.rateM || buyerRates.rateSML || 0) +
          qtyL * (buyerRates.rateL || buyerRates.rateSML || 0) +
          qtyXL * (buyerRates.rateXL || 0) +
          qtyXXL * (buyerRates.rateXXL || buyerRates.rateXL || 0) +
          (qtySML > 0 && !qtyS && !qtyM && !qtyL ? qtySML * (buyerRates.rateSML || 0) : 0);

        const subAnak =
          qtyAnak4 * (buyerRates.rateAnak4 || 0) +
          qtyAnak6 * (buyerRates.rateAnak6 || 0) +
          qtyAnak8 * (buyerRates.rateAnak8 || 0) +
          qtyAnak10 * (buyerRates.rateAnak10 || 0) +
          qtyAnak12 * (buyerRates.rateAnak12 || 0) +
          qtyAnak14 * (buyerRates.rateAnak14 || 0) +
          qtyAnak16 * (buyerRates.rateAnak16 || 0);

        const itemOmzet = subHuruf + subAnak;
        const vendorRate = getVendorRate(it.vendor, it.produk, itBrand);
        const itemBiayaCmt = it.totalPcs * vendorRate;
        const itemLaba = Math.max(0, itemOmzet - itemBiayaCmt);

        totalPcs += it.totalPcs;
        totalOmzetBuyer += itemOmzet;
        totalBiayaCmt += itemBiayaCmt;

        subItemsList.push({
          idx,
          produk: it.produk,
          jenisKain,
          totalPcs: it.totalPcs,
          omzetBuyer: itemOmzet,
          biayaCmt: itemBiayaCmt,
          labaBersih: itemLaba,
          vendor: it.vendor,
        });
      });

      const totalLabaBersih = Math.max(0, totalOmzetBuyer - totalBiayaCmt);
      const marginPersen = totalOmzetBuyer > 0 ? (totalLabaBersih / totalOmzetBuyer) * 100 : 0;

      let statusMargin: 'SEHAT' | 'MODERAT' | 'TIPIS' = 'SEHAT';
      if (marginPersen < 15) {
        statusMargin = 'TIPIS';
      } else if (marginPersen < 30) {
        statusMargin = 'MODERAT';
      }

      // Format produk label ringkas
      const prodArray = Array.from(prodSet);
      let produkLabel = '';
      if (prodArray.length === 1) {
        produkLabel = matchedItems.length > 1 ? `${prodArray[0]} (${matchedItems.length} Varian)` : prodArray[0];
      } else if (prodArray.length > 1) {
        produkLabel = `${prodArray.slice(0, 2).join(', ')}${prodArray.length > 2 ? ` +${prodArray.length - 2} lain` : ''} (${matchedItems.length} Item)`;
      } else {
        produkLabel = 'Produk Garment';
      }

      const kainArray = Array.from(kainSet);
      const kainLabel = kainArray.slice(0, 2).join(', ') + (kainArray.length > 2 ? ` +${kainArray.length - 2}` : '');

      const brandLabel = Array.from(brandSet).join(', ') || sj.brand || 'UMUM';
      const vendorLabel = Array.from(vendorSet).join(', ') || sj.vendor || 'Belum Ditentukan';
      const poLabel = Array.from(poSet).join(', ') || undefined;
      const spkLabel = Array.from(spkSet).join(', ') || '-';

      const rowKey = sj.id || sj.noSuratJalan;

      list.push({
        id: sj.id || sj.noSuratJalan,
        rowKey,
        noSuratJalan: sj.noSuratJalan,
        spkNumber: spkLabel,
        tanggal: sj.tanggal,
        produk: produkLabel,
        jenisKain: kainLabel || 'Kain Standar',
        brand: brandLabel,
        vendor: vendorLabel,
        totalPcs,
        omzetBuyer: totalOmzetBuyer,
        biayaCmt: totalBiayaCmt,
        labaBersih: totalLabaBersih,
        marginPersen,
        statusMargin,
        orderType: 'CMT',
        itemPo: poLabel,
        itemCount: matchedItems.length,
        subItems: subItemsList,
      });
    });

    return list;
  }, [
    suratJalanList,
    spkList,
    productionPOs,
    inboundRolls,
    selectedMonth,
    selectedBrand,
    getSuratJalanItems,
    getBuyerRates,
    getVendorRate,
  ]);

  // =========================================================================
  // 3. DATA ROL KAIN (Inbound Rol Kain & Beban Modal Kain)
  // =========================================================================
  const availableRolls = useMemo(() => {
    return (inboundRolls || []).filter((r) => {
      // Filter Brand
      if (selectedBrand !== 'ALL' && !matchBrand(r.brand, selectedBrand)) {
        return false;
      }
      return true;
    });
  }, [inboundRolls, selectedBrand]);

  // Auto-sync checklist Surat Jalan & Kain ketika PO berubah atau data masuk
  useEffect(() => {
    if (allAvailableSjItems.length > 0) {
      if (selectedPoNumbers.length > 0) {
        // Pilih SJ yang item PO-nya sesuai dengan PO yang dicentang
        const matchingSjs = allAvailableSjItems
          .filter((it) => it.itemPo && selectedPoNumbers.some((p) => it.itemPo?.includes(p)))
          .map((it) => it.rowKey);
        // Jika ada yang cocok, gunakan itu; jika tidak ada ref PO di SJ, centang seluruh SJ bulan ini
        setSelectedSjRowKeys(matchingSjs.length > 0 ? matchingSjs : allAvailableSjItems.map((it) => it.rowKey));
      } else {
        setSelectedSjRowKeys([]);
      }
    } else {
      setSelectedSjRowKeys([]);
    }

    if (availableRolls.length > 0) {
      if (selectedPoNumbers.length > 0) {
        const matchingRolls = availableRolls
          .filter((r) => r.sourcePONumber && selectedPoNumbers.includes(r.sourcePONumber))
          .map((r) => r.id);
        setSelectedRollIds(matchingRolls);
      } else {
        setSelectedRollIds([]);
      }
    } else {
      setSelectedRollIds([]);
    }
  }, [selectedPoNumbers, selectedBrand, selectedMonth, allAvailableSjItems.length, availableRolls.length]);

  // =========================================================================
  // 4. ITEM YANG TERPILIH (CHECKED) & KALKULASI NET PROFIT
  // =========================================================================
  const checkedSjItems = useMemo(() => {
    return allAvailableSjItems.filter((it) => selectedSjRowKeys.includes(it.rowKey));
  }, [allAvailableSjItems, selectedSjRowKeys]);

  const checkedRolls: FabricReportItem[] = useMemo(() => {
    return availableRolls
      .filter((r) => selectedRollIds.includes(r.id))
      .map((r) => {
        const meterUsed = r.meterUsed > 0 ? r.meterUsed : r.meterLength;
        const totalNilaiKain = meterUsed * (r.hargaModalMeter || 0);
        return {
          id: r.id,
          rollCode: r.rollCode,
          jenisKain: r.jenisKain,
          tanggalMasuk: r.tanggalMasuk,
          meterUsed,
          hargaModalMeter: r.hargaModalMeter || 0,
          totalNilaiKain,
        };
      });
  }, [availableRolls, selectedRollIds]);

  // Kalkulasi KPI Eksekutif Net Profit
  const kpi = useMemo(() => {
    const totalPcs = checkedSjItems.reduce((acc, it) => acc + it.totalPcs, 0);
    const totalRevenue = checkedSjItems.reduce((acc, it) => acc + it.omzetBuyer, 0);
    const totalCost = checkedSjItems.reduce((acc, it) => acc + it.biayaCmt, 0);
    const grossProfit = Math.max(0, totalRevenue - totalCost);

    const totalFabricCost = checkedRolls.reduce((acc, r) => acc + r.totalNilaiKain, 0);
    const fabricMeters = checkedRolls.reduce((acc, r) => acc + r.meterUsed, 0);

    const netProfit = Math.max(0, totalRevenue - totalCost - totalFabricCost);
    const avgMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      totalPcs,
      totalRevenue,
      totalCost,
      grossProfit,
      totalFabricCost,
      fabricMeters,
      netProfit,
      avgMargin,
    };
  }, [checkedSjItems, checkedRolls]);

  // Filtered items untuk tabel tampilan (mendukung pencarian teks & filter vendor)
  const displayedItems = useMemo(() => {
    return checkedSjItems.filter((item) => {
      if (selectedVendor !== 'ALL' && item.vendor !== selectedVendor) return false;
      if (statusFilter !== 'ALL' && item.statusMargin !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchNo = item.noSuratJalan.toLowerCase().includes(q);
        const matchSpk = item.spkNumber.toLowerCase().includes(q);
        const matchProd = item.produk.toLowerCase().includes(q);
        const matchBrandName = item.brand.toLowerCase().includes(q);
        const matchVendorName = item.vendor.toLowerCase().includes(q);
        const matchKain = item.jenisKain.toLowerCase().includes(q);
        const matchPo = item.itemPo ? item.itemPo.toLowerCase().includes(q) : false;
        const matchSub = item.subItems?.some((sub: any) =>
          (sub.produk && sub.produk.toLowerCase().includes(q)) ||
          (sub.jenisKain && sub.jenisKain.toLowerCase().includes(q))
        );
        if (!matchNo && !matchSpk && !matchProd && !matchBrandName && !matchVendorName && !matchKain && !matchPo && !matchSub) {
          return false;
        }
      }
      return true;
    });
  }, [checkedSjItems, selectedVendor, statusFilter, searchTerm]);

  // Paginasi Tabel
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(displayedItems.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedItems = displayedItems.slice(startIndex, startIndex + itemsPerPage);

  // Breakdown Kontribusi Brand (Konsolidasi Multi-Brand)
  const brandContributions = useMemo(() => {
    const map: Record<string, { brand: string; totalPcs: number; revenue: number; cmtCost: number; profit: number }> = {};
    checkedSjItems.forEach((it) => {
      if (!map[it.brand]) {
        map[it.brand] = { brand: it.brand, totalPcs: 0, revenue: 0, cmtCost: 0, profit: 0 };
      }
      map[it.brand].totalPcs += it.totalPcs;
      map[it.brand].revenue += it.omzetBuyer;
      map[it.brand].cmtCost += it.biayaCmt;
      map[it.brand].profit += it.labaBersih;
    });

    return Object.values(map)
      .map((b) => ({
        ...b,
        marginPersen: b.revenue > 0 ? (b.profit / b.revenue) * 100 : 0,
        shareOfProfit: kpi.grossProfit > 0 ? (b.profit / kpi.grossProfit) * 100 : 0,
      }))
      .sort((a, b) => b.profit - a.profit);
  }, [checkedSjItems, kpi.grossProfit]);

  // =========================================================================
  // 5. FITUR SIMPAN LAPORAN NET PROFIT (ARCHIVING)
  // =========================================================================
  const handleOpenSaveModal = () => {
    const brandName = selectedBrand === 'ALL' ? 'Semua Brand (Konsolidasi)' : selectedBrand;
    setSaveTitle(`Laporan Net Profit - ${activeMonthLabel} (${brandName})`);
    setSaveNotes('');
    setIsSaveModalOpen(true);
  };

  const handleConfirmSaveReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveTitle.trim()) {
      alert('Mohon masukkan judul laporan.');
      return;
    }

    const pad = (n: number) => n.toString().padStart(2, '0');
    const now = new Date();
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const rand = Math.floor(100 + Math.random() * 900);
    const reportNo = `RPT-NP-${dateStr}-${rand}`;

    const newReport: SavedNetProfitReport = {
      id: `report-${Date.now()}`,
      reportNo,
      title: saveTitle.trim(),
      monthKey: selectedMonth,
      monthLabel: activeMonthLabel,
      brand: selectedBrand,
      orderScheme: 'ALL',
      createdAt: now.toISOString(),
      savedBy: userRole === 'ADMIN' ? 'Admin Finance' : 'Owner',
      notes: saveNotes.trim() || undefined,
      kpi: {
        totalPcs: kpi.totalPcs,
        totalRevenue: kpi.totalRevenue,
        totalCmtCost: kpi.totalCost,
        totalFabricCost: kpi.totalFabricCost,
        netProfit: kpi.netProfit,
        avgMargin: kpi.avgMargin,
        fabricMeters: kpi.fabricMeters,
      },
      selectedPoNumbers: [...selectedPoNumbers],
      selectedSjRowKeys: [...selectedSjRowKeys],
      selectedRollIds: [...selectedRollIds],
      items: checkedSjItems.map((it) => ({
        id: it.id,
        noSuratJalan: it.noSuratJalan,
        spkNumber: it.spkNumber,
        tanggal: it.tanggal,
        produk: it.produk,
        jenisKain: it.jenisKain,
        brand: it.brand,
        vendor: it.vendor,
        totalPcs: it.totalPcs,
        omzetBuyer: it.omzetBuyer,
        biayaCmt: it.biayaCmt,
        labaBersih: it.labaBersih,
        marginPersen: it.marginPersen,
        statusMargin: it.statusMargin,
        orderType: it.orderType,
        itemPo: it.itemPo,
      })),
      fabricItems: checkedRolls,
    };

    const updated = [newReport, ...savedReports];
    persistSavedReports(updated);
    setIsSaveModalOpen(false);
    alert(`Laporan "${newReport.title}" (${newReport.reportNo}) berhasil disimpan ke arsip!`);
  };

  const handleDeleteSavedReport = (id: string, title: string) => {
    if (confirm(`Hapus arsip laporan "${title}"? Data yang dihapus tidak dapat dipulihkan.`)) {
      const updated = savedReports.filter((r) => r.id !== id);
      persistSavedReports(updated);
      if (activeSnapshot?.id === id) {
        setActiveSnapshot(null);
      }
    }
  };

  const handleOpenSnapshotReview = (rep: SavedNetProfitReport) => {
    setActiveSnapshot(rep);
    setViewMode('generator');
  };

  // Export CSV
  const handleExportCSV = () => {
    const targetItems = activeSnapshot ? activeSnapshot.items : checkedSjItems;
    if (targetItems.length === 0) {
      alert('Tidak ada data surat jalan untuk diekspor!');
      return;
    }

    const headers = [
      'No Surat Jalan',
      'No SPK',
      'Ref PO',
      'Tanggal',
      'Brand',
      'Mitra Penjahit',
      'Produk',
      'Jenis Kain',
      'Qty Pcs',
      'Omzet Buyer (Rp)',
      'Beban CMT Penjahit (Rp)',
      'Margin Jahit (Rp)',
      'Margin (%)',
      'Status Margin',
    ];

    const rows = targetItems.map((it) => [
      `"${it.noSuratJalan}"`,
      `"${it.spkNumber}"`,
      `"${it.itemPo || '-'}"`,
      `"${it.tanggal}"`,
      `"${it.brand}"`,
      `"${it.vendor}"`,
      `"${it.produk}"`,
      `"${it.jenisKain}"`,
      it.totalPcs,
      it.omzetBuyer,
      it.biayaCmt,
      it.labaBersih,
      `${it.marginPersen.toFixed(1)}%`,
      `"${it.statusMargin}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeTitle = (activeSnapshot?.title || `Rekap_Net_Profit_${activeMonthLabel}`).replace(/[/\\?%*:|"<> ]/g, '_');
    a.download = `${safeTitle}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // =========================================================================
  // RENDER TAMPILAN
  // =========================================================================
  return (
    <div className="space-y-6">
      
      {/* 1. HEADER UTAMA & NAVIGASI */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg mb-2 border border-emerald-200">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              Laporan Net Profit Eksekutif & Analisis Margin
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Analisis Margin & Laporan Net Profit Bulanan
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Kompilasi laporan keuangan laba bersih riil workshop (Omzet Pengiriman - Beban Jahit CMT - Beban Modal Bahan) siap dilaporkan ke atasan & owner.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                if (activeSnapshot) {
                  setActiveSnapshot(null);
                }
                setViewMode(viewMode === 'generator' ? 'saved_reports' : 'generator');
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition cursor-pointer shadow-xs ${
                viewMode === 'saved_reports'
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
              }`}
            >
              <History className="w-4 h-4 text-indigo-500" />
              <span>Arsip Laporan Tersimpan</span>
              {savedReports.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  viewMode === 'saved_reports' ? 'bg-indigo-800 text-white' : 'bg-indigo-100 text-indigo-800'
                }`}>
                  {savedReports.length}
                </span>
              )}
            </button>

            {viewMode === 'generator' && !activeSnapshot && (
              <button
                onClick={handleOpenSaveModal}
                disabled={checkedSjItems.length === 0}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition btn-press cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Simpan susunan laporan ini ke riwayat tersimpan"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Laporan Bulan Ini</span>
              </button>
            )}

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
              title="Cetak Laporan PDF Resmi A4"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Laporan PDF</span>
            </button>
          </div>
        </div>

        {/* Banner Snapshot Review Aktif */}
        {activeSnapshot && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2.5">
              <BookmarkCheck className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <div className="font-bold text-sm text-amber-950 flex items-center gap-2">
                  <span>Sedang Meninjau Arsip: {activeSnapshot.title}</span>
                  <span className="font-mono text-xs px-2 py-0.5 bg-amber-200/80 rounded font-semibold text-amber-900">
                    {activeSnapshot.reportNo}
                  </span>
                </div>
                <div className="text-[11px] text-amber-700 mt-0.5">
                  Disimpan pada: {formatDateIndo(activeSnapshot.createdAt)} oleh {activeSnapshot.savedBy} • Periode: {activeSnapshot.monthLabel}
                </div>
              </div>
            </div>
            <button
              onClick={() => setActiveSnapshot(null)}
              className="px-3.5 py-1.5 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg font-bold text-amber-900 text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Generator Aktif</span>
            </button>
          </div>
        )}

        {/* Contextual Info Banner */}
        <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 text-emerald-950 text-xs flex items-start gap-2.5">
          <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Sistem Perhitungan Net Profit Workshop:</strong> Data omzet ditarik otomatis dari Surat Jalan (SJ) pengiriman barang jadi yang dicentang. Biaya dihitung dari <strong>Beban Upah Jahit (CMT)</strong> mitra penjahit dan <strong>Beban Modal Kain</strong> dari rol kain yang dialokasikan. Rumus Laba Bersih: <code>Net Profit = Omzet Pengiriman - Beban Jahit - Beban Modal Kain</code>.
          </div>
        </div>

        {/* Filter Controls Bar (Hanya tampil di Mode Generator) */}
        {!activeSnapshot && viewMode === 'generator' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
            {/* 1. Filter Periode Bulan */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
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

            {/* 2. Filter Brand Buyer */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                Filter Brand Buyer:
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="ALL">Semua Brand (Konsolidasi)</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Filter Mitra Penjahit */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Scissors className="w-3.5 h-3.5 text-indigo-600" />
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

            {/* 4. Pencarian Cepat */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Search className="w-3.5 h-3.5 text-slate-500" />
                Pencarian Cepat:
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari No SJ, PO, Produk, Kain..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2.5 pr-8 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* VIEW MODE 1: ARSIP LAPORAN TERSIMPAN */}
      {/* ========================================================================= */}
      {viewMode === 'saved_reports' && (
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookmarkCheck className="w-5 h-5 text-indigo-600" />
                <span>Daftar Arsip Laporan Net Profit Tersimpan</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Buka atau cetak kembali snapshot laporan bulanan yang telah difinalisasi kapan saja.
              </p>
            </div>
            <button
              onClick={() => setViewMode('generator')}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Generator</span>
            </button>
          </div>

          {savedReports.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <BookmarkCheck className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="font-bold text-slate-700 text-sm">Belum Ada Laporan yang Disimpan</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Silakan susun filter bulan, PO, Surat Jalan, dan Kain di generator, lalu klik tombol "Simpan Laporan Bulan Ini".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedReports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-md transition space-y-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                        {rep.reportNo}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm mt-1.5">{rep.title}</h3>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Periode: <strong className="text-slate-700">{rep.monthLabel}</strong> • Brand: <strong className="text-slate-700">{rep.brand === 'ALL' ? 'Semua Brand (Konsolidasi)' : rep.brand}</strong>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black shrink-0 ${
                        rep.kpi.avgMargin >= 30
                          ? 'bg-emerald-100 text-emerald-800'
                          : rep.kpi.avgMargin >= 15
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {rep.kpi.avgMargin.toFixed(1)}% Margin
                    </span>
                  </div>

                  {/* Summary Bar */}
                  <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-xl border border-slate-200/80 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Total Omzet:</span>
                      <strong className="text-slate-900 font-mono text-xs">{formatRp(rep.kpi.totalRevenue)}</strong>
                      <span className="text-[9px] text-slate-500 block">{rep.kpi.totalPcs.toLocaleString('id-ID')} Pcs</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Beban Jahit:</span>
                      <strong className="text-rose-600 font-mono text-xs">{formatRp(rep.kpi.totalCmtCost)}</strong>
                      <span className="text-[9px] text-slate-500 block">Upah CMT</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Net Profit:</span>
                      <strong className="text-emerald-700 font-mono text-xs">{formatRp(rep.kpi.netProfit)}</strong>
                      <span className="text-[9px] text-emerald-600 font-semibold block">Laba Bersih</span>
                    </div>
                  </div>

                  {rep.notes && (
                    <div className="text-[11px] text-slate-600 bg-white/70 p-2 rounded-lg border border-slate-200 italic">
                      "{rep.notes}"
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-xs">
                    <span className="text-[10.5px] text-slate-400">
                      Disimpan: {formatDateIndo(rep.createdAt)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenSnapshotReview(rep)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Buka laporan ini ke generator"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Buka</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveSnapshot(rep);
                          setIsStatementModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Cetak PDF Laporan ini"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak PDF</span>
                      </button>
                      <button
                        onClick={() => handleDeleteSavedReport(rep.id, rep.title)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Hapus dari arsip"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW MODE 2: GENERATOR / REVIEW LAPORAN */}
      {/* ========================================================================= */}
      {viewMode === 'generator' && (
        <div className="space-y-6">
          
          {/* EXECUTIVE KPI SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Omzet Pengiriman */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span>Total Omzet Terkirim</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                {formatRp(activeSnapshot ? activeSnapshot.kpi.totalRevenue : kpi.totalRevenue)}
              </div>
              <div className="text-xs text-slate-500 flex items-center justify-between">
                <span>Volume Pengiriman:</span>
                <strong className="text-slate-800 font-bold font-mono">
                  {(activeSnapshot ? activeSnapshot.kpi.totalPcs : kpi.totalPcs).toLocaleString('id-ID')} Pcs
                </strong>
              </div>
            </div>

            {/* 2. Beban Jahit CMT */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span>Beban Jahit (CMT)</span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Scissors className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-rose-600 font-mono">
                - {formatRp(activeSnapshot ? activeSnapshot.kpi.totalCmtCost : kpi.totalCost)}
              </div>
              <div className="text-xs text-slate-500 flex items-center justify-between">
                <span>Upah Mitra Penjahit:</span>
                <strong className="text-rose-700 font-bold">
                  {checkedSjItems.length} Pengiriman SJ
                </strong>
              </div>
            </div>

            {/* 3. Beban Modal Kain (Potongan Kain) */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span>Beban Modal Kain</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-700 font-mono">
                - {formatRp(activeSnapshot ? activeSnapshot.kpi.totalFabricCost : kpi.totalFabricCost)}
              </div>
              <div className="text-xs text-slate-500 flex items-center justify-between">
                <span>Pemakaian Bahan Baku:</span>
                <strong className="text-amber-800 font-bold font-mono">
                  {activeSnapshot ? activeSnapshot.kpi.fabricMeters : kpi.fabricMeters} Meter Kain
                </strong>
              </div>
            </div>

            {/* 4. Laba Bersih Workshop (Net Profit) */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-md space-y-2">
              <div className="flex items-center justify-between text-emerald-100 text-xs font-bold uppercase tracking-wider">
                <span>Laba Bersih Workshop (Net)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white">
                  {(activeSnapshot ? activeSnapshot.kpi.avgMargin : kpi.avgMargin).toFixed(1)}% Margin
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono">
                {formatRp(activeSnapshot ? activeSnapshot.kpi.netProfit : kpi.netProfit)}
              </div>
              <div className="text-xs text-emerald-100 flex items-center justify-between pt-1 border-t border-white/20">
                <span>Status Kesehatan:</span>
                <strong className="text-white font-bold">
                  {(activeSnapshot ? activeSnapshot.kpi.avgMargin : kpi.avgMargin) >= 30
                    ? '✓ Sangat Sehat (≥30%)'
                    : (activeSnapshot ? activeSnapshot.kpi.avgMargin : kpi.avgMargin) >= 15
                    ? '⚡ Moderat (15-29%)'
                    : '⚠️ Margin Tipis (<15%)'}
                </strong>
              </div>
            </div>

          </div>

          {/* KONTRIBUSI PER BRAND (Konsolidasi Semua Brand) */}
          {selectedBrand === 'ALL' && !activeSnapshot && brandContributions.length > 1 && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  Kontribusi Laba Bersih Antar Brand (Konsolidasi)
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  {brandContributions.length} Brand Aktif Terdata
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {brandContributions.map((b) => (
                  <div key={b.brand} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{b.brand}</span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                        {b.marginPersen.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-sm font-black text-slate-900 font-mono">{formatRp(b.profit)}</div>
                    <div className="text-[10px] text-slate-500 flex justify-between">
                      <span>Omzet: {formatRp(b.revenue)}</span>
                      <span>{b.totalPcs} pcs</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* POLA FILTER & SELEKSI DATA (Persis seperti menu Finance Bagian Tagihan Brand) */}
          {/* ======================================================================= */}
          {!activeSnapshot && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* KOLOM KIRI: Filter & Seleksi Surat PO Produksi */}
              <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Package className="w-4 h-4 text-indigo-600" />
                    1. Filter Surat PO Produksi
                  </h3>
                  <span className="text-[10px] font-semibold text-slate-500">
                    {availablePOs.length} PO Terdaftar
                  </span>
                </div>

                {/* Batch Select PO */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPoNumbers(availablePOs.map((p) => p.noPO))}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg font-semibold text-indigo-700 text-[11px] transition cursor-pointer flex items-center gap-1"
                  >
                    <CheckSquare className="w-3 h-3" />
                    Pilih Semua ({availablePOs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPoNumbers([])}
                    className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg font-semibold text-slate-600 text-[11px] transition cursor-pointer flex items-center gap-1"
                  >
                    <Square className="w-3 h-3" />
                    Batal Semua
                  </button>
                  {selectedPoNumbers.length > 0 && (
                    <span className="text-[10.5px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-md ml-auto">
                      {selectedPoNumbers.length} PO Dipilih
                    </span>
                  )}
                </div>

                {/* List Checklist PO */}
                <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                  {availablePOs.length === 0 ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                      Tidak ada PO Produksi yang cocok dengan filter saat ini.
                    </div>
                  ) : (
                    availablePOs.map((po) => {
                      const isPoChecked = selectedPoNumbers.includes(po.noPO);
                      return (
                        <div
                          key={po.id || po.noPO}
                          onClick={() => {
                            setSelectedPoNumbers((prev) =>
                              prev.includes(po.noPO) ? prev.filter((n) => n !== po.noPO) : [...prev, po.noPO]
                            );
                          }}
                          className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center gap-2.5 ${
                            isPoChecked
                              ? 'bg-indigo-50/80 border-indigo-400 shadow-2xs'
                              : 'bg-slate-50 border-slate-200 hover:border-slate-300 opacity-60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isPoChecked}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-indigo-600 cursor-pointer accent-indigo-600 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="font-mono font-bold text-xs text-slate-900 truncate">{po.noPO}</span>
                              <span
                                className={`px-1.5 py-0.2 rounded-full text-[8.5px] font-bold shrink-0 ${
                                  po.status === 'SELESAI'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-indigo-100 text-indigo-800'
                                }`}
                              >
                                {po.status}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                              <strong className="text-slate-700">{po.brand}</strong> • {po.vendorTujuan || 'Workshop'} •{' '}
                              {(po.totalPcs || po.items?.reduce((s: number, i: any) => s + (i.qty || 0), 0) || 0).toLocaleString('id-ID')} pcs
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Box Ringkasan Cepat */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                  <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                    Ringkasan Pilihan Laporan:
                  </div>
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>Surat Jalan Terpilih:</span>
                    <strong className="text-slate-900">{checkedSjItems.length} dari {allAvailableSjItems.length} SJ</strong>
                  </div>
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>Rol Kain Terpilih:</span>
                    <strong className="text-slate-900">{checkedRolls.length} dari {availableRolls.length} Rol</strong>
                  </div>
                  <div className="flex justify-between text-slate-600 text-[11px] pt-1 border-t border-slate-200">
                    <span>Estimasi Net Profit:</span>
                    <strong className="text-emerald-700 font-bold font-mono">{formatRp(kpi.netProfit)}</strong>
                  </div>
                </div>
              </div>

              {/* KOLOM KANAN: Tab Seleksi Surat Jalan & Kain (Sama persis dengan Menu Finance Tagihan Brand) */}
              <div className="lg:col-span-8 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
                
                {/* Header Sub Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      2. Komponen Perhitungan Laba: {selectedBrand === 'ALL' ? 'Semua Brand (Konsolidasi)' : selectedBrand}
                    </h3>
                    <span className="text-xs text-slate-400">
                      Centang Surat Jalan dan Rol Kain yang masuk ke dalam buku laporan periode ini.
                    </span>
                  </div>

                  {/* Switcher Tab: 1. Surat Jalan, 2. Pemakaian Kain */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('surat_jalan')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        activeSubTab === 'surat_jalan'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Surat Jalan Pengiriman</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        activeSubTab === 'surat_jalan' ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {checkedSjItems.length}/{allAvailableSjItems.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveSubTab('kain')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        activeSubTab === 'kain'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Scissors className="w-3.5 h-3.5" />
                      <span>Pemakaian Kain</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        activeSubTab === 'kain' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {checkedRolls.length}/{availableRolls.length}
                      </span>
                    </button>
                  </div>
                </div>

                {/* ============================================================== */}
                {/* SUB TAB 1: SURAT JALAN PENGIRIMAN */}
                {/* ============================================================== */}
                {activeSubTab === 'surat_jalan' && (
                  <div className="space-y-3">
                    {/* Action Bar Seleksi Surat Jalan */}
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedSjRowKeys(allAvailableSjItems.map((it) => it.rowKey))}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg font-semibold text-slate-700 text-[11px] transition cursor-pointer"
                        >
                          Pilih Semua ({allAvailableSjItems.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedSjRowKeys([])}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg font-semibold text-slate-700 text-[11px] transition cursor-pointer"
                        >
                          Batal Semua
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-600 font-medium">
                        Terpilih: <strong className="text-slate-900">{checkedSjItems.length}</strong> Surat Jalan • <strong className="text-emerald-700">{kpi.totalPcs.toLocaleString('id-ID')} Pcs</strong> ({formatRp(kpi.totalRevenue)})
                      </div>
                    </div>

                    {/* Table Surat Jalan */}
                    <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-96">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px] sticky top-0 z-10">
                          <tr>
                            <th className="p-3 w-10 text-center">
                              <input
                                type="checkbox"
                                checked={allAvailableSjItems.length > 0 && selectedSjRowKeys.length === allAvailableSjItems.length}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedSjRowKeys(allAvailableSjItems.map((it) => it.rowKey));
                                  } else {
                                    setSelectedSjRowKeys([]);
                                  }
                                }}
                                className="w-4 h-4 rounded text-indigo-600 cursor-pointer accent-indigo-600"
                              />
                            </th>
                            <th className="p-3">No Surat Jalan</th>
                            <th className="p-3">Brand & PO</th>
                            <th className="p-3">Artikel Produk</th>
                            <th className="p-3">Penjahit</th>
                            <th className="p-3 text-center">Qty Pcs</th>
                            <th className="p-3 text-right">Omzet Buyer</th>
                            <th className="p-3 text-right">Beban CMT</th>
                            <th className="p-3 text-right">Margin Jahit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {allAvailableSjItems.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="p-8 text-center text-slate-400">
                                Tidak ada pengiriman Surat Jalan untuk periode & filter yang dipilih.
                              </td>
                            </tr>
                          ) : (
                            allAvailableSjItems.map((item) => {
                              const isChecked = selectedSjRowKeys.includes(item.rowKey);
                              const isExpanded = expandedSjKeys.includes(item.rowKey);
                              return (
                                <React.Fragment key={item.rowKey}>
                                  <tr
                                    onClick={() => {
                                      setSelectedSjRowKeys((prev) =>
                                        prev.includes(item.rowKey)
                                          ? prev.filter((k) => k !== item.rowKey)
                                          : [...prev, item.rowKey]
                                      );
                                    }}
                                    className={`transition cursor-pointer ${
                                      isChecked ? 'bg-indigo-50/40 hover:bg-indigo-50/60' : 'hover:bg-slate-50 opacity-60'
                                    }`}
                                  >
                                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {
                                          setSelectedSjRowKeys((prev) =>
                                            prev.includes(item.rowKey)
                                              ? prev.filter((k) => k !== item.rowKey)
                                              : [...prev, item.rowKey]
                                          );
                                        }}
                                        className="w-4 h-4 rounded text-indigo-600 cursor-pointer accent-indigo-600"
                                      />
                                    </td>
                                    <td className="p-3 whitespace-nowrap">
                                      <div className="font-mono font-bold text-indigo-700">{item.noSuratJalan}</div>
                                      <span className="text-[10px] text-slate-400 block">{formatDateIndo(item.tanggal)}</span>
                                    </td>
                                    <td className="p-3 whitespace-nowrap">
                                      <span className="font-bold text-slate-800 text-[11px] block">{item.brand}</span>
                                      {item.itemPo ? (
                                        <span className="text-[9.5px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1 py-0.2 rounded mt-0.5 inline-block">
                                          PO: {item.itemPo}
                                        </span>
                                      ) : (
                                        <span className="text-[9.5px] text-slate-400">-</span>
                                      )}
                                    </td>
                                    <td className="p-3">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-bold text-slate-900">{item.produk}</span>
                                        {item.subItems && item.subItems.length > 1 && (
                                          <button
                                            type="button"
                                            onClick={(e) => toggleExpandSj(item.rowKey, e)}
                                            className="px-1.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[9.5px] font-semibold flex items-center gap-0.5 border border-indigo-200 transition cursor-pointer"
                                          >
                                            {isExpanded ? (
                                              <>Tutup <ChevronDown className="w-3 h-3" /></>
                                            ) : (
                                              <>+{item.subItems.length} Rincian <ChevronRight className="w-3 h-3" /></>
                                            )}
                                          </button>
                                        )}
                                      </div>
                                      <div className="text-[10px] text-slate-400">{item.jenisKain}</div>
                                    </td>
                                    <td className="p-3 whitespace-nowrap text-slate-600 font-medium">
                                      {item.vendor}
                                    </td>
                                    <td className="p-3 text-center font-bold text-slate-900 font-mono whitespace-nowrap">
                                      {item.totalPcs}
                                    </td>
                                    <td className="p-3 text-right font-bold text-slate-900 font-mono whitespace-nowrap tabular-nums">
                                      {formatRp(item.omzetBuyer)}
                                    </td>
                                    <td className="p-3 text-right font-medium text-rose-600 font-mono whitespace-nowrap tabular-nums">
                                      {formatRp(item.biayaCmt)}
                                    </td>
                                    <td className="p-3 text-right font-bold text-emerald-700 font-mono whitespace-nowrap tabular-nums">
                                      {formatRp(item.labaBersih)}
                                    </td>
                                  </tr>

                                  {/* Sub-item Expand Row */}
                                  {isExpanded && item.subItems && (
                                    <tr className="bg-slate-50/90">
                                      <td colSpan={9} className="p-3 pl-10">
                                        <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-1.5">
                                          <div className="text-[10.5px] font-bold text-slate-700 flex items-center gap-1.5">
                                            <Layers className="w-3.5 h-3.5 text-indigo-600" />
                                            <span>Rincian Produk & Warna pada {item.noSuratJalan} ({item.subItems.length} item):</span>
                                          </div>
                                          <div className="overflow-x-auto">
                                            <table className="w-full text-[10.5px] text-left">
                                              <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                                                <tr>
                                                  <th className="py-1 px-2">No</th>
                                                  <th className="py-1 px-2">Artikel Produk</th>
                                                  <th className="py-1 px-2">Bahan Kain</th>
                                                  <th className="py-1 px-2 text-center">Pcs</th>
                                                  <th className="py-1 px-2 text-right">Omzet Buyer</th>
                                                  <th className="py-1 px-2 text-right">Beban CMT</th>
                                                  <th className="py-1 px-2 text-right">Margin Jahit</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-slate-100">
                                                {item.subItems.map((sub, sIdx) => (
                                                  <tr key={sIdx} className="hover:bg-slate-50">
                                                    <td className="py-1 px-2 text-slate-400 font-mono">{sIdx + 1}</td>
                                                    <td className="py-1 px-2 font-medium text-slate-800">{sub.produk}</td>
                                                    <td className="py-1 px-2 text-slate-500">{sub.jenisKain || '-'}</td>
                                                    <td className="py-1 px-2 text-center font-bold font-mono text-slate-900">{sub.totalPcs}</td>
                                                    <td className="py-1 px-2 text-right font-mono text-slate-800">{formatRp(sub.omzetBuyer)}</td>
                                                    <td className="py-1 px-2 text-right font-mono text-rose-600">{formatRp(sub.biayaCmt)}</td>
                                                    <td className="py-1 px-2 text-right font-mono font-bold text-emerald-700">{formatRp(sub.labaBersih)}</td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ============================================================== */}
                {/* SUB TAB 2: PEMAKAIAN KAIN (BEBAN BAHAN BAKU) */}
                {/* ============================================================== */}
                {activeSubTab === 'kain' && (
                  <div className="space-y-3">
                    {/* Action Bar Seleksi Kain */}
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedRollIds(availableRolls.map((r) => r.id))}
                          className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg font-semibold text-amber-900 text-[11px] transition cursor-pointer"
                        >
                          Pilih Semua ({availableRolls.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedRollIds([])}
                          className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg font-semibold text-amber-900 text-[11px] transition cursor-pointer"
                        >
                          Batal Semua
                        </button>
                      </div>
                      <div className="text-[11px] text-amber-950 font-medium">
                        Terpilih: <strong className="text-amber-900">{checkedRolls.length}</strong> Rol • <strong className="text-amber-800">{kpi.fabricMeters} Meter</strong> (- {formatRp(kpi.totalFabricCost)})
                      </div>
                    </div>

                    {/* Table Rol Kain */}
                    <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-96">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px] sticky top-0 z-10">
                          <tr>
                            <th className="p-3 w-10 text-center">
                              <input
                                type="checkbox"
                                checked={availableRolls.length > 0 && selectedRollIds.length === availableRolls.length}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedRollIds(availableRolls.map((r) => r.id));
                                  } else {
                                    setSelectedRollIds([]);
                                  }
                                }}
                                className="w-4 h-4 rounded text-amber-600 cursor-pointer accent-amber-600"
                              />
                            </th>
                            <th className="p-3">Kode Rol Kain</th>
                            <th className="p-3">Brand</th>
                            <th className="p-3">Ref PO Masuk</th>
                            <th className="p-3">Jenis / Material Kain</th>
                            <th className="p-3 text-center">Panjang Terpakai</th>
                            <th className="p-3 text-right">Harga Modal Satuan</th>
                            <th className="p-3 text-right">Total Beban Kain</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {availableRolls.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="p-8 text-center text-slate-400">
                                Tidak ada rol kain inbound untuk brand ini.
                              </td>
                            </tr>
                          ) : (
                            availableRolls.map((roll) => {
                              const isChecked = selectedRollIds.includes(roll.id);
                              const meterUsed = roll.meterUsed > 0 ? roll.meterUsed : roll.meterLength;
                              const subtotalKain = meterUsed * (roll.hargaModalMeter || 0);
                              return (
                                <tr
                                  key={roll.id}
                                  onClick={() => {
                                    setSelectedRollIds((prev) =>
                                      prev.includes(roll.id) ? prev.filter((id) => id !== roll.id) : [...prev, roll.id]
                                    );
                                  }}
                                  className={`transition cursor-pointer ${
                                    isChecked ? 'bg-amber-50/50 hover:bg-amber-50/70' : 'hover:bg-slate-50 opacity-60'
                                  }`}
                                >
                                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        setSelectedRollIds((prev) =>
                                          prev.includes(roll.id) ? prev.filter((id) => id !== roll.id) : [...prev, roll.id]
                                        );
                                      }}
                                      className="w-4 h-4 rounded text-amber-600 cursor-pointer accent-amber-600"
                                    />
                                  </td>
                                  <td className="p-3 font-mono font-bold text-amber-900 whitespace-nowrap">
                                    {roll.rollCode}
                                  </td>
                                  <td className="p-3 font-semibold text-slate-800 whitespace-nowrap">
                                    {roll.brand}
                                  </td>
                                  <td className="p-3 whitespace-nowrap">
                                    {roll.sourcePONumber ? (
                                      <span className="font-mono text-[9.5px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1 py-0.2 rounded">
                                        {roll.sourcePONumber}
                                      </span>
                                    ) : (
                                      <span className="text-[9.5px] text-slate-400">-</span>
                                    )}
                                  </td>
                                  <td className="p-3 font-bold text-slate-900">
                                    {roll.jenisKain}
                                  </td>
                                  <td className="p-3 text-center font-bold text-slate-900 font-mono whitespace-nowrap">
                                    {meterUsed} m
                                  </td>
                                  <td className="p-3 text-right font-medium text-slate-700 font-mono whitespace-nowrap tabular-nums">
                                    {formatRp(roll.hargaModalMeter || 0)}
                                  </td>
                                  <td className="p-3 text-right font-bold text-amber-800 font-mono whitespace-nowrap tabular-nums">
                                    {formatRp(subtotalKain)}
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

              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* TABEL RINCIAN LENGKAP PENGIRIMAN & MARGIN */}
          {/* ======================================================================= */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Tabel Rincian Laporan Pengiriman & Margin {activeSnapshot ? `(Arsip ${activeSnapshot.reportNo})` : ''}
                </h3>
                <p className="text-xs text-slate-400">
                  Menampilkan {displayedItems.length} transaksi pengiriman yang diperhitungkan
                </p>
              </div>

              {/* Status Margin Filter */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    statusFilter === 'ALL' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua ({checkedSjItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('SEHAT')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    statusFilter === 'SEHAT' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-emerald-700 hover:text-emerald-800'
                  }`}
                >
                  Sehat (≥30%)
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('MODERAT')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    statusFilter === 'MODERAT' ? 'bg-amber-600 text-white shadow-2xs' : 'text-amber-700 hover:text-amber-800'
                  }`}
                >
                  Moderat
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('TIPIS')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    statusFilter === 'TIPIS' ? 'bg-rose-600 text-white shadow-2xs' : 'text-rose-700 hover:text-rose-800'
                  }`}
                >
                  Tipis (&lt;15%)
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3 whitespace-nowrap">No SJ / Tanggal</th>
                    <th className="p-3 whitespace-nowrap">Ref PO / SPK</th>
                    <th className="p-3">Brand & Mitra Penjahit</th>
                    <th className="p-3">Artikel Produk & Bahan</th>
                    <th className="p-3 text-center whitespace-nowrap">Qty Pcs</th>
                    <th className="p-3 text-right whitespace-nowrap">Omzet Buyer</th>
                    <th className="p-3 text-right whitespace-nowrap">Beban Jahit (CMT)</th>
                    <th className="p-3 text-right whitespace-nowrap">Margin Jahit</th>
                    <th className="p-3 text-center whitespace-nowrap">Margin (%)</th>
                    <th className="p-3 text-center whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400">
                        Tidak ada rincian data pengiriman yang cocok dengan filter saat ini.
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map((item, idx) => {
                      const rowId = item.id || item.noSuratJalan || String(idx);
                      const isExpanded = expandedSjKeys.includes(rowId);
                      return (
                        <React.Fragment key={rowId}>
                          <tr className="hover:bg-slate-50 transition">
                            <td className="p-3 whitespace-nowrap">
                              <div className="font-mono font-bold text-indigo-700">{item.noSuratJalan}</div>
                              <span className="text-[10px] text-slate-400 block">{formatDateIndo(item.tanggal)}</span>
                            </td>
                            <td className="p-3 whitespace-nowrap font-mono text-[9.5px]">
                              {item.itemPo ? (
                                <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                                  {item.itemPo}
                                </span>
                              ) : (
                                <span className="text-slate-500">{item.spkNumber || '-'}</span>
                              )}
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <div className="font-bold text-slate-900">{item.brand}</div>
                              <div className="text-[10px] text-slate-500">{item.vendor}</div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-900">{item.produk}</span>
                                {item.subItems && item.subItems.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => toggleExpandSj(rowId)}
                                    className="px-1.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[9.5px] font-semibold flex items-center gap-0.5 border border-indigo-200 transition cursor-pointer"
                                  >
                                    {isExpanded ? (
                                      <>Tutup <ChevronDown className="w-3 h-3" /></>
                                    ) : (
                                      <>+{item.subItems.length} Rincian <ChevronRight className="w-3 h-3" /></>
                                    )}
                                  </button>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400">{item.jenisKain}</div>
                            </td>
                            <td className="p-3 text-center font-bold text-slate-900 font-mono whitespace-nowrap">
                              {item.totalPcs}
                            </td>
                            <td className="p-3 text-right font-bold text-slate-900 font-mono whitespace-nowrap tabular-nums">
                              {formatRp(item.omzetBuyer)}
                            </td>
                            <td className="p-3 text-right font-medium text-rose-600 font-mono whitespace-nowrap tabular-nums">
                              {formatRp(item.biayaCmt)}
                            </td>
                            <td className="p-3 text-right font-bold text-emerald-700 font-mono whitespace-nowrap tabular-nums">
                              {formatRp(item.labaBersih)}
                            </td>
                            <td className="p-3 text-center whitespace-nowrap">
                              <span className="font-bold font-mono text-slate-800">
                                {item.marginPersen.toFixed(1)}%
                              </span>
                            </td>
                            <td className="p-3 text-center whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9.5px] font-black ${
                                  item.statusMargin === 'SEHAT'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : item.statusMargin === 'MODERAT'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                                }`}
                              >
                                {item.statusMargin}
                              </span>
                            </td>
                          </tr>

                          {/* Sub-item Expand Row */}
                          {isExpanded && item.subItems && (
                            <tr className="bg-slate-50/90">
                              <td colSpan={10} className="p-3 pl-10">
                                <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-1.5">
                                  <div className="text-[10.5px] font-bold text-slate-700 flex items-center gap-1.5">
                                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>Rincian Produk & Warna pada {item.noSuratJalan} ({item.subItems.length} item):</span>
                                  </div>
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-[10.5px] text-left">
                                      <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                                        <tr>
                                          <th className="py-1 px-2">No</th>
                                          <th className="py-1 px-2">Artikel Produk</th>
                                          <th className="py-1 px-2">Bahan Kain</th>
                                          <th className="py-1 px-2 text-center">Pcs</th>
                                          <th className="py-1 px-2 text-right">Omzet Buyer</th>
                                          <th className="py-1 px-2 text-right">Beban CMT</th>
                                          <th className="py-1 px-2 text-right">Margin Jahit</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {item.subItems.map((sub, sIdx) => (
                                          <tr key={sIdx} className="hover:bg-slate-50">
                                            <td className="py-1 px-2 text-slate-400 font-mono">{sIdx + 1}</td>
                                            <td className="py-1 px-2 font-medium text-slate-800">{sub.produk}</td>
                                            <td className="py-1 px-2 text-slate-500">{sub.jenisKain || '-'}</td>
                                            <td className="py-1 px-2 text-center font-bold font-mono text-slate-900">{sub.totalPcs}</td>
                                            <td className="py-1 px-2 text-right font-mono text-slate-800">{formatRp(sub.omzetBuyer)}</td>
                                            <td className="py-1 px-2 text-right font-mono text-rose-600">{formatRp(sub.biayaCmt)}</td>
                                            <td className="py-1 px-2 text-right font-mono font-bold text-emerald-700">{formatRp(sub.labaBersih)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginasi Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-500">
                  Halaman <strong>{safeCurrentPage}</strong> dari <strong>{totalPages}</strong> ({displayedItems.length} Total Data)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safeCurrentPage <= 1}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safeCurrentPage >= totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL SIMPAN LAPORAN KE ARSIP */}
      {/* ========================================================================= */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-slideUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <BookmarkCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Simpan Laporan Net Profit ke Arsip</h3>
                  <p className="text-[11px] text-slate-400">Snapshot data ini akan disimpan agar bisa dibuka kembali</p>
                </div>
              </div>
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmSaveReport} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Laporan:</label>
                <input
                  type="text"
                  required
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  placeholder="Contoh: Laporan Net Profit Oktober 2026 - Semua Brand"
                />
              </div>

              {/* Ringkasan Angka yang Disimpan */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-slate-600">
                <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wider mb-1">
                  Ringkasan Nilai Keuangan:
                </div>
                <div className="flex justify-between">
                  <span>Periode / Brand:</span>
                  <strong className="text-slate-900">{activeMonthLabel} • {selectedBrand === 'ALL' ? 'Semua Brand' : selectedBrand}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Total Omzet Terkirim:</span>
                  <strong className="text-slate-900 font-mono">{formatRp(kpi.totalRevenue)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Beban Upah Jahit (CMT):</span>
                  <strong className="text-rose-600 font-mono">- {formatRp(kpi.totalCost)}</strong>
                </div>
                {kpi.totalFabricCost > 0 && (
                  <div className="flex justify-between">
                    <span>Beban Modal Kain ({kpi.fabricMeters} m):</span>
                    <strong className="text-amber-700 font-mono">- {formatRp(kpi.totalFabricCost)}</strong>
                  </div>
                )}
                <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold text-xs text-slate-900">
                  <span>Net Profit Bersih:</span>
                  <strong className="text-emerald-700 font-mono">{formatRp(kpi.netProfit)} ({kpi.avgMargin.toFixed(1)}%)</strong>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan (Opsional):</label>
                <textarea
                  rows={2}
                  value={saveNotes}
                  onChange={(e) => setSaveNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  placeholder="Catatan untuk atasan / owner atau keterangan evaluasi..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-sm transition btn-press cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan ke Arsip</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CETAK LAPORAN RESMI (PDF A4) */}
      {/* ========================================================================= */}
      {isStatementModalOpen && (
        <MonthlyStatementModal
          reportTitle={activeSnapshot?.title}
          reportNumber={activeSnapshot?.reportNo}
          monthLabel={activeSnapshot ? activeSnapshot.monthLabel : activeMonthLabel}
          brandFilter={activeSnapshot ? activeSnapshot.brand : selectedBrand}
          orderScheme="ALL"
          kpi={
            activeSnapshot
              ? {
                  totalPcs: activeSnapshot.kpi.totalPcs,
                  totalRevenue: activeSnapshot.kpi.totalRevenue,
                  totalCost: activeSnapshot.kpi.totalCmtCost,
                  totalFabricCost: activeSnapshot.kpi.totalFabricCost,
                  fabricMeters: activeSnapshot.kpi.fabricMeters,
                  grossProfit: activeSnapshot.kpi.totalRevenue - activeSnapshot.kpi.totalCmtCost,
                  netProfit: activeSnapshot.kpi.netProfit,
                  avgMargin: activeSnapshot.kpi.avgMargin,
                }
              : {
                  totalPcs: kpi.totalPcs,
                  totalRevenue: kpi.totalRevenue,
                  totalCost: kpi.totalCost,
                  totalFabricCost: kpi.totalFabricCost,
                  fabricMeters: kpi.fabricMeters,
                  grossProfit: kpi.grossProfit,
                  netProfit: kpi.netProfit,
                  avgMargin: kpi.avgMargin,
                }
          }
          items={activeSnapshot ? activeSnapshot.items : checkedSjItems}
          fabricItems={activeSnapshot ? activeSnapshot.fabricItems : checkedRolls}
          poNumbers={activeSnapshot ? activeSnapshot.selectedPoNumbers : selectedPoNumbers}
          notes={activeSnapshot?.notes}
          onClose={() => setIsStatementModalOpen(false)}
        />
      )}

    </div>
  );
};
