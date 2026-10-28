import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SlipGajiModal } from './SlipGajiModal';
import { InvoiceModal } from './InvoiceModal';
import { VendorManualInvoiceModal } from './VendorManualInvoiceModal';
import { CreateManualInvoiceModal } from './CreateManualInvoiceModal';
import { BrandInvoicePortal } from './BrandInvoicePortal';
import { BuyerInvoiceSummary, VendorManualInvoice } from '../../types';
import { formatRupiahInput, parseRupiahInput, formatDateIndo, getSabtuanPeriod } from '../../utils/formatters';
import { resolveItemPONumber, matchPOItemColor } from '../../utils/spkHelper';
import {
  ReceiptText,
  DollarSign,
  Printer,
  Plus,
  Coins,
  CreditCard,
  Building2,
  FileText,
  UserCheck,
  CheckCircle,
  Calendar,
  Package,
  CheckCircle2,
  RotateCcw,
  CheckSquare,
  Square,
  Clock,
  X,
  Scissors,
  Layers,
  Info,
  Search,
  Filter,
  Eye,
} from 'lucide-react';

export const FinanceView: React.FC = () => {
  const {
    vendors,
    brands,
    kasbonList,
    addKasbon,
    calculateVendorPayroll,
    calculateBuyerInvoice,
    userRole,
    activeBrand,
    vendorSettlements,
    settleVendorPO,
    unsettleVendorPO,
    productionPOs,
    inboundRolls,
    spkList,
    suratJalanList,
    getSuratJalanItems,
    getBuyerRates,
    vendorManualInvoices,
    createVendorManualInvoice,
    updateVendorManualInvoice,
    deleteVendorManualInvoice,
    financeSubTab,
    setFinanceSubTab,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'payroll' | 'manual_invoice' | 'invoice' | 'kasbon'>(
    userRole === 'BRAND' ? 'invoice' : (financeSubTab || 'payroll')
  );

  React.useEffect(() => {
    if (userRole === 'BRAND') {
      setActiveSubTab('invoice');
    } else if (financeSubTab) {
      setActiveSubTab(financeSubTab);
    }
  }, [userRole, financeSubTab]);

  // Modal State untuk Invoice Manual Vendor
  const [isCreateManualModalOpen, setIsCreateManualModalOpen] = useState(false);
  const [editingManualInvoice, setEditingManualInvoice] = useState<VendorManualInvoice | null>(null);
  const [previewManualInvoice, setPreviewManualInvoice] = useState<VendorManualInvoice | null>(null);
  const [isAdminPreviewingBrandPortal, setIsAdminPreviewingBrandPortal] = useState(false);

  // Filter State untuk Tab Invoice Manual
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [manualVendorFilter, setManualVendorFilter] = useState('ALL');
  const [manualStatusFilter, setManualStatusFilter] = useState<'ALL' | 'DIBAYAR' | 'PENDING'>('ALL');
  const [manualPotongFilter, setManualPotongFilter] = useState<'ALL' | 'POTONG_GAJI' | 'NON_POTONG'>('ALL');

  const filteredManualInvoices = useMemo(() => {
    return (vendorManualInvoices || []).filter((inv) => {
      if (manualVendorFilter !== 'ALL' && inv.vendor !== manualVendorFilter) {
        return false;
      }
      if (manualStatusFilter !== 'ALL' && inv.status !== manualStatusFilter) {
        return false;
      }
      if (manualPotongFilter === 'POTONG_GAJI' && !inv.potongDiSlipGaji) {
        return false;
      }
      if (manualPotongFilter === 'NON_POTONG' && inv.potongDiSlipGaji) {
        return false;
      }
      if (manualSearchQuery.trim()) {
        const q = manualSearchQuery.toLowerCase();
        const matchNo = (inv.invoiceNo || '').toLowerCase().includes(q);
        const matchVendor = (inv.vendor || '').toLowerCase().includes(q);
        const matchPO = (inv.poNumber || '').toLowerCase().includes(q);
        const matchBrand = (inv.brand || '').toLowerCase().includes(q);
        const matchKet = (inv.keterangan || '').toLowerCase().includes(q);
        if (!matchNo && !matchVendor && !matchPO && !matchBrand && !matchKet) {
          return false;
        }
      }
      return true;
    });
  }, [vendorManualInvoices, manualVendorFilter, manualStatusFilter, manualPotongFilter, manualSearchQuery]);

  const manualStats = useMemo(() => {
    const all = vendorManualInvoices || [];
    const totalAmount = all.reduce((sum, inv) => sum + (inv.totalNominal || 0), 0);
    const paidAmount = all
      .filter((inv) => inv.status === 'DIBAYAR')
      .reduce((sum, inv) => sum + (inv.totalNominal || 0), 0);
    const deductedAmount = all
      .filter((inv) => inv.isDeducted)
      .reduce((sum, inv) => sum + (inv.totalNominal || 0), 0);
    const activeDeductionAmount = all
      .filter((inv) => inv.status === 'DIBAYAR' && inv.potongDiSlipGaji && !inv.isDeducted)
      .reduce((sum, inv) => sum + (inv.totalNominal || 0), 0);

    return {
      count: all.length,
      totalAmount,
      paidAmount,
      deductedAmount,
      activeDeductionAmount,
    };
  }, [vendorManualInvoices]);

  // Sabtuan Period State
  type PeriodMode = 'this_sabtuan' | 'custom' | 'all';
  const [periodMode, setPeriodMode] = useState<PeriodMode>('this_sabtuan');
  const thisSabtuan = getSabtuanPeriod(0);

  const [customStartDate, setCustomStartDate] = useState(thisSabtuan.startDate);
  const [customEndDate, setCustomEndDate] = useState(thisSabtuan.endDate);

  // Determine active date filter bounds
  let activeStartDate: string | undefined;
  let activeEndDate: string | undefined;
  let activePeriodLabel: string = 'Semua Transaksi (All-Time)';

  if (periodMode === 'this_sabtuan') {
    activeStartDate = thisSabtuan.startDate;
    activeEndDate = thisSabtuan.endDate;
    activePeriodLabel = `Pekan Ini (${thisSabtuan.label})`;
  } else if (periodMode === 'custom') {
    activeStartDate = customStartDate;
    activeEndDate = customEndDate;
    activePeriodLabel = `Kustom: ${formatDateIndo(customStartDate)} – ${formatDateIndo(customEndDate)}`;
  }

  // Selected Vendor for Payroll
  const [selectedVendorName, setSelectedVendorName] = useState(vendors[0]?.name || 'SAHIRA');

  // Selected Brand for Invoice
  const [selectedBrandName, setSelectedBrandName] = useState(
    userRole === 'BRAND' ? (activeBrand === 'CREADIVE' ? 'NAMI' : activeBrand) : (brands[0]?.name === 'CREADIVE' ? 'NAMI' : brands[0]?.name) || 'GREYWOLF'
  );

  React.useEffect(() => {
    if (userRole === 'BRAND') {
      setSelectedBrandName(activeBrand === 'CREADIVE' ? 'NAMI' : activeBrand);
    } else if (selectedBrandName === 'CREADIVE') {
      setSelectedBrandName('NAMI');
    }
  }, [userRole, activeBrand, selectedBrandName]);

  // Modals for Printing
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Modal for Add Kasbon
  const [isAddKasbonOpen, setIsAddKasbonOpen] = useState(false);
  const [kasbonForm, setKasbonForm] = useState({
    vendor: vendors[0]?.name || 'SAHIRA',
    jumlah: 500000,
    tipe: 'PINJAMAN' as 'PINJAMAN' | 'POTONGAN_GAJI',
    keterangan: 'Pinjaman operasional',
  });

  const formatRp = (amount: number) => 'Rp ' + amount.toLocaleString('id-ID');

  const [allowPartialPayment, setAllowPartialPayment] = useState(false);
  const [poSettlementFilter, setPoSettlementFilter] = useState<'UNPAID' | 'SETTLED' | 'ALL'>('UNPAID');
  const [selectedPOKeys, setSelectedPOKeys] = useState<string[]>([]);

  // Modal Pelunasan PO
  const [settleModal, setSettleModal] = useState<{
    isOpen: boolean;
    pkg?: any;
  }>({ isOpen: false });

  const [settleForm, setSettleForm] = useState({
    tanggalBayar: new Date().toISOString().split('T')[0],
    metodePembayaran: 'TRANSFER' as 'TRANSFER' | 'TUNAI' | 'LAINNYA',
    nomorReferensi: '',
    catatan: '',
  });

  // Live Payroll Data for selected vendor with active period
  const currentPayroll = calculateVendorPayroll(
    selectedVendorName,
    activeStartDate,
    activeEndDate,
    allowPartialPayment,
    poSettlementFilter
  );

  const displayedPackages = (currentPayroll.packages || []).filter((pkg) => {
    if (poSettlementFilter === 'UNPAID') return !pkg.isSettled;
    if (poSettlementFilter === 'SETTLED') return pkg.isSettled;
    return true;
  });

  const displayedTableItems = currentPayroll.items.filter((it) => {
    if (poSettlementFilter === 'UNPAID') return !it.isSettled;
    if (poSettlementFilter === 'SETTLED') return it.isSettled;
    return true;
  });

  // Data subset untuk cetak Slip Gaji (berdasarkan PO yang dicentang atau seluruh PO yang tampil)
  const selectedPayrollToPrint = (() => {
    const targetPackages = displayedPackages.filter((pkg) => {
      if (selectedPOKeys.length > 0) {
        return selectedPOKeys.includes(pkg.poNumber);
      }
      return true;
    });

    const targetPONumbers = new Set(targetPackages.map((p) => p.poNumber));
    const targetItems = currentPayroll.items.filter((it) => {
      if (selectedPOKeys.length > 0) {
        return it.poNumber && targetPONumbers.has(it.poNumber);
      }
      return it.poNumber ? targetPONumbers.has(it.poNumber) : true;
    });

    const totalPcs = targetItems.reduce((s, it) => s + it.pcs, 0);
    const totalGrossPay = targetItems.reduce((s, it) => s + it.subtotal, 0);
    const kasbonDeduction = currentPayroll.kasbonDeduction;
    const manualInvoiceDeduction = currentPayroll.manualInvoiceDeduction || 0;
    const netPay = Math.max(0, totalGrossPay - kasbonDeduction - manualInvoiceDeduction);

    return {
      vendor: currentPayroll.vendor,
      totalPcs,
      totalGrossPay,
      kasbonDeduction,
      manualInvoiceDeduction,
      manualInvoices: currentPayroll.manualInvoices,
      netPay,
      totalPendingPcs: currentPayroll.totalPendingPcs,
      totalPendingPay: currentPayroll.totalPendingPay,
      periodeAwal: currentPayroll.periodeAwal,
      periodeAkhir: currentPayroll.periodeAkhir,
      periodeLabel: currentPayroll.periodeLabel,
      packages: targetPackages,
      items: targetItems,
    };
  })();

  const handleConfirmSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleModal.pkg) return;

    const sjNos = (settleModal.pkg.suratJalanList || []).map((s: any) => s.noSuratJalan);
    await settleVendorPO({
      vendor: selectedVendorName,
      poNumber: settleModal.pkg.poNumber,
      tanggalBayar: settleForm.tanggalBayar,
      totalPcs: settleModal.pkg.deliveredPcs,
      totalAmount: settleModal.pkg.totalPay,
      metodePembayaran: settleForm.metodePembayaran,
      nomorReferensi: settleForm.nomorReferensi.trim() || undefined,
      catatan: settleForm.catatan.trim() || undefined,
      suratJalanNos: sjNos,
    });

    setSettleModal({ isOpen: false });
    setSelectedPOKeys((prev) => prev.filter((k) => k !== settleModal.pkg?.poNumber));
  };

  const handleUnsettle = async (settlementId: string, poNumber: string) => {
    if (window.confirm(`Batalkan status lunas untuk PO ${poNumber}? PO ini akan kembali menjadi tagihan berjalan (Outstanding).`)) {
      await unsettleVendorPO(settlementId);
    }
  };

  // ============================================================
  // PO-BASED BUYER INVOICE ENGINE (DENGAN PEMOTONGAN NILAI KAIN)
  // ============================================================
  const effectiveBrand = userRole === 'BRAND'
    ? (activeBrand === 'CREADIVE' ? 'NAMI' : activeBrand)
    : (selectedBrandName === 'CREADIVE' ? 'NAMI' : selectedBrandName);

  const [selectedPoNumbers, setSelectedPoNumbers] = useState<string[]>([]);
  const [selectedSjRowKeys, setSelectedSjRowKeys] = useState<string[]>([]);
  const [selectedRollIds, setSelectedRollIds] = useState<string[]>([]);
  const [activeInvoiceTab, setActiveInvoiceTab] = useState<'surat_jalan' | 'kain'>('surat_jalan');

  // Available Production POs for this Brand
  const brandPOs = useMemo(() => {
    return productionPOs.filter(
      po => !effectiveBrand || (po.brand && po.brand.toLowerCase() === effectiveBrand.toLowerCase())
    );
  }, [productionPOs, effectiveBrand]);

  // Selected PO Objects
  const selectedPOObjects = useMemo(() => {
    return brandPOs.filter(p => selectedPoNumbers.includes(p.noPO));
  }, [brandPOs, selectedPoNumbers]);

  // Auto-sync selectedPoNumbers when brand or brandPOs change
  useEffect(() => {
    if (brandPOs.length > 0) {
      const valid = selectedPoNumbers.filter(no => brandPOs.some(p => p.noPO === no));
      if (valid.length === 0) {
        setSelectedPoNumbers([brandPOs[0].noPO]);
      } else {
        setSelectedPoNumbers(valid);
      }
    } else {
      setSelectedPoNumbers([]);
    }
  }, [effectiveBrand, brandPOs]);

  // All Surat Jalan items for this Brand
  const availableSjItems = useMemo(() => {
    const matchedSJs = suratJalanList.filter(sj => {
      const sjItems = getSuratJalanItems(sj);
      const matchBrand =
        sj.brand === effectiveBrand ||
        (sj.brand && sj.brand.split(',').map(b => b.trim()).includes(effectiveBrand)) ||
        sjItems.some(it => it.brand === effectiveBrand);
      if (!matchBrand) return false;
      const sjDate = sj.tanggal.split('T')[0];
      if (activeStartDate && sjDate < activeStartDate) return false;
      if (activeEndDate && sjDate > activeEndDate) return false;
      return true;
    });

    const list: Array<BuyerInvoiceSummary['items'][0] & { rowKey: string; itemPo?: string; spkId?: string; spkNumber?: string; spkItemId?: string }> = [];
    matchedSJs.forEach((sj) => {
      const sjItems = getSuratJalanItems(sj);
      sjItems.forEach((it, itIdx) => {
        const itBrand = it.brand || sj.brand;
        if (itBrand !== effectiveBrand && (!itBrand || !itBrand.split(',').map(b => b.trim()).includes(effectiveBrand))) {
          return;
        }

        const rates = getBuyerRates(effectiveBrand, it.produk);
        const qtyS = it.qtyDelivered?.s || 0;
        const qtyM = it.qtyDelivered?.m || 0;
        const qtyL = it.qtyDelivered?.l || 0;
        const qtyXL = it.qtyDelivered?.xl || 0;
        const qtyXXL = it.qtyDelivered?.xxl || 0;
        const qtySML = qtyS + qtyM + qtyL;
        const qtyAnak2 = it.qtyDelivered?.anak2 || 0;
        const qtyAnak4 = it.qtyDelivered?.anak4 || 0;
        const qtyAnak6 = it.qtyDelivered?.anak6 || 0;
        const qtyAnak8 = it.qtyDelivered?.anak8 || 0;
        const qtyAnak10 = it.qtyDelivered?.anak10 || 0;
        const qtyAnak12 = it.qtyDelivered?.anak12 || 0;
        const qtyAnak14 = it.qtyDelivered?.anak14 || 0;
        const qtyAnak16 = it.qtyDelivered?.anak16 || 0;
        const qtyAnak18 = it.qtyDelivered?.anak18 || 0;

        const subS = qtyS * rates.rateS;
        const subM = qtyM * rates.rateM;
        const subL = qtyL * rates.rateL;
        const subXL = qtyXL * rates.rateXL;
        const subXXL = qtyXXL * rates.rateXXL;
        const subAnak2 = qtyAnak2 * (rates.rateAnak2 || rates.rateAnak4 || 0);
        const subAnak4 = qtyAnak4 * rates.rateAnak4;
        const subAnak6 = qtyAnak6 * rates.rateAnak6;
        const subAnak8 = qtyAnak8 * rates.rateAnak8;
        const subAnak10 = qtyAnak10 * rates.rateAnak10;
        const subAnak12 = qtyAnak12 * rates.rateAnak12;
        const subAnak14 = qtyAnak14 * rates.rateAnak14;
        const subAnak16 = qtyAnak16 * rates.rateAnak16;
        const subAnak18 = qtyAnak18 * (rates.rateAnak18 || rates.rateAnak16);

        const totalAmount = subS + subM + subL + subXL + subXXL + subAnak2 + subAnak4 + subAnak6 + subAnak8 + subAnak10 + subAnak12 + subAnak14 + subAnak16 + subAnak18;
        const rowKey = `${sj.id || sj.noSuratJalan}_${itIdx}_${it.produk}`;

        list.push({
          rowKey,
          suratJalanNo: sj.noSuratJalan,
          tanggal: sj.tanggal,
          produk: it.produk,
          jenisKain: it.jenisKain,
          spkId: it.spkId || sj.spkId,
          spkNumber: it.spkNumber || undefined,
          spkItemId: it.spkItemId || sj.spkItemId,
          qtyS,
          rateS: rates.rateS,
          qtyM,
          rateM: rates.rateM,
          qtyL,
          rateL: rates.rateL,
          qtyXL,
          rateXL: rates.rateXL,
          qtyXXL,
          rateXXL: rates.rateXXL,
          qtySML,
          rateSML: rates.rateSML,
          qtyAnak2,
          rateAnak2: rates.rateAnak2 || rates.rateAnak4 || 0,
          qtyAnak4,
          rateAnak4: rates.rateAnak4,
          qtyAnak6,
          rateAnak6: rates.rateAnak6,
          qtyAnak8,
          rateAnak8: rates.rateAnak8,
          qtyAnak10,
          rateAnak10: rates.rateAnak10,
          qtyAnak12,
          rateAnak12: rates.rateAnak12,
          qtyAnak14,
          rateAnak14: rates.rateAnak14,
          qtyAnak16,
          rateAnak16: rates.rateAnak16,
          qtyAnak18,
          rateAnak18: rates.rateAnak18 || rates.rateAnak16,
          totalPcs: it.totalPcs,
          totalAmount,
          itemPo: resolveItemPONumber(it, spkList, sj, productionPOs) || undefined,
        });
      });
    });
    return list;
  }, [suratJalanList, spkList, productionPOs, effectiveBrand, activeStartDate, activeEndDate, getSuratJalanItems, getBuyerRates]);

  // Available Fabric Rolls for this Brand
  const availableRolls = useMemo(() => {
    return inboundRolls.filter(r => {
      const matchBrand = !effectiveBrand || (r.brand && r.brand.toLowerCase() === effectiveBrand.toLowerCase());
      return matchBrand;
    });
  }, [inboundRolls, effectiveBrand]);

  // Auto initialize selection when PO or Brand changes
  useEffect(() => {
    if (availableSjItems.length > 0) {
      if (selectedPoNumbers.length > 0) {
        const matchingSJs = availableSjItems
          .filter(it => it.itemPo && selectedPoNumbers.includes(it.itemPo))
          .map(it => it.rowKey);
        setSelectedSjRowKeys(matchingSJs.length > 0 ? matchingSJs : availableSjItems.map(it => it.rowKey));
      } else {
        setSelectedSjRowKeys(availableSjItems.map(it => it.rowKey));
      }
    } else {
      setSelectedSjRowKeys([]);
    }

    if (availableRolls.length > 0) {
      if (selectedPoNumbers.length > 0) {
        const matchingRolls = availableRolls
          .filter(r => r.sourcePONumber && selectedPoNumbers.includes(r.sourcePONumber))
          .map(r => r.id);
        setSelectedRollIds(matchingRolls);
      } else {
        setSelectedRollIds([]);
      }
    } else {
      setSelectedRollIds([]);
    }
  }, [selectedPoNumbers, effectiveBrand, availableSjItems.length, availableRolls.length]);

  // Checked items calculations
  const checkedSjItems = useMemo(() => {
    return availableSjItems.filter(it => selectedSjRowKeys.includes(it.rowKey));
  }, [availableSjItems, selectedSjRowKeys]);

  const totalDeliveredPcs = useMemo(() => {
    return checkedSjItems.reduce((sum, it) => sum + (it.totalPcs || 0), 0);
  }, [checkedSjItems]);

  const totalGrossTagihan = useMemo(() => {
    return checkedSjItems.reduce((sum, it) => sum + (it.totalAmount || 0), 0);
  }, [checkedSjItems]);

  const checkedRolls = useMemo(() => {
    return availableRolls
      .filter(r => selectedRollIds.includes(r.id))
      .map(r => {
        const meterUsed = r.meterUsed > 0 ? r.meterUsed : r.meterLength;
        const totalNilaiKain = meterUsed * (r.hargaModalMeter || 0);
        return {
          id: r.id,
          rollCode: r.rollCode,
          jenisKain: r.jenisKain,
          tanggalMasuk: r.tanggalMasuk,
          meterUsed,
          meterLength: r.meterLength,
          hargaModalMeter: r.hargaModalMeter || 0,
          totalNilaiKain,
        };
      });
  }, [availableRolls, selectedRollIds]);

  const totalFabricMeters = useMemo(() => {
    return checkedRolls.reduce((sum, r) => sum + r.meterUsed, 0);
  }, [checkedRolls]);

  const totalFabricDeduction = useMemo(() => {
    return checkedRolls.reduce((sum, r) => sum + r.totalNilaiKain, 0);
  }, [checkedRolls]);

  const grandTotalNet = useMemo(() => {
    return Math.max(0, totalGrossTagihan - totalFabricDeduction);
  }, [totalGrossTagihan, totalFabricDeduction]);

  // Progres Pemenuhan Item PO (Target vs Terkirim vs Sisa Belum Terkirim)
  const itemsProgress = useMemo(() => {
    const list: Array<{
      id?: string;
      poNumber: string;
      namaProduk: string;
      warna?: string | null;
      ukuran?: string | null;
      targetQty: number;
      deliveredQty: number;
      remainingQty: number;
      bahanKain?: string | null;
      catatan?: string | null;
    }> = [];

    selectedPOObjects.forEach(po => {
      const linkedSJs = checkedSjItems.filter(sj => sj.itemPo === po.noPO || (!sj.itemPo && selectedPOObjects.length === 1));

      // Kumpulkan seluruh warna unik yang ada pada PO ini
      const poColors = Array.from(
        new Set((po.items || []).map(i => (i.warna || '').trim().toUpperCase()).filter(Boolean))
      );

      (po.items || []).forEach(poItem => {
        const targetQty = Number(poItem.qty) || 0;
        let deliveredQty = 0;

        const targetWarna = (poItem.warna || '').trim().toUpperCase();

        const matchingSjs = linkedSJs.filter(sj => {
          // 1. Model produk harus cocok
          if (sj.produk.trim().toLowerCase() !== poItem.namaProduk.trim().toLowerCase()) {
            return false;
          }

          // 2. Filter warna kain secara presisi
          const linkedSpk = spkList.find(
            s => (sj.spkId && s.id === sj.spkId) || (sj.spkNumber && s.spkNumber === sj.spkNumber)
          );
          return matchPOItemColor(targetWarna, sj.jenisKain, linkedSpk, poColors);
        });

        if (matchingSjs.length > 0) {
          const rawUkuran = (poItem.ukuran || '').trim().toLowerCase();
          const digitsOnly = rawUkuran.replace(/\D/g, '');

          if (rawUkuran === 's' || rawUkuran === 'size s') {
            deliveredQty = matchingSjs.reduce((s, it) => s + (it.qtyS || 0), 0);
          } else if (rawUkuran === 'm' || rawUkuran === 'size m') {
            deliveredQty = matchingSjs.reduce((s, it) => s + (it.qtyM || 0), 0);
          } else if (rawUkuran === 'l' || rawUkuran === 'size l') {
            deliveredQty = matchingSjs.reduce((s, it) => s + (it.qtyL || 0), 0);
          } else if (rawUkuran === 'xl' || rawUkuran === 'size xl') {
            deliveredQty = matchingSjs.reduce((s, it) => s + (it.qtyXL || 0), 0);
          } else if (rawUkuran === 'xxl' || rawUkuran === '2xl' || rawUkuran === 'size 2xl' || rawUkuran === 'size xxl') {
            deliveredQty = matchingSjs.reduce((s, it) => s + (it.qtyXXL || 0), 0);
          } else if (digitsOnly === '2') {
            deliveredQty = matchingSjs.reduce((s, it) => s + (it.qtyAnak2 || 0), 0);
          } else if (digitsOnly === '4') {
            deliveredQty = matchingSjs.reduce((s, it) => s + (it.qtyAnak4 || 0), 0);
          } else if (digitsOnly === '6') {
            deliveredQty = matchingSjs.reduce((s, it) => s + (it.qtyAnak6 || 0), 0);
          } else if (digitsOnly === '8') {
            deliveredQty = matchingSjs.reduce((s, it) => s + (it.qtyAnak8 || 0), 0);
          } else if (digitsOnly === '10') {
            deliveredQty = matchingSjs.reduce((s, it) => s + (it.qtyAnak10 || 0), 0);
          } else if (digitsOnly === '12') {
            deliveredQty = matchingSjs.reduce((s, it) => s + (it.qtyAnak12 || 0), 0);
          } else if (digitsOnly === '14') {
            deliveredQty = matchingSjs.reduce((s, it) => s + (it.qtyAnak14 || 0), 0);
          } else if (digitsOnly === '16') {
            deliveredQty = matchingSjs.reduce((s, it) => s + (it.qtyAnak16 || 0), 0);
          } else if (digitsOnly === '18') {
            deliveredQty = matchingSjs.reduce((s, it) => s + (it.qtyAnak18 || 0), 0);
          } else {
            const sameProductCount = po.items.filter(
              i => i.namaProduk.trim().toLowerCase() === poItem.namaProduk.trim().toLowerCase()
            ).length;
            const totalProdDelivered = matchingSjs.reduce((s, it) => s + (it.totalPcs || 0), 0);
            if (sameProductCount === 1) {
              deliveredQty = totalProdDelivered;
            } else {
              deliveredQty = Math.min(targetQty, totalProdDelivered);
            }
          }
        }

        const remainingQty = Math.max(0, targetQty - deliveredQty);

        list.push({
          id: poItem.id,
          poNumber: po.noPO,
          namaProduk: poItem.namaProduk,
          warna: poItem.warna,
          ukuran: poItem.ukuran,
          targetQty,
          deliveredQty,
          remainingQty,
          bahanKain: poItem.bahanKain,
          catatan: poItem.catatan,
        });
      });
    });

    return list;
  }, [selectedPOObjects, checkedSjItems, spkList]);

  const totalTargetPcs = useMemo(() => {
    return itemsProgress.reduce((sum, it) => sum + it.targetQty, 0);
  }, [itemsProgress]);

  const totalDeliveredFromPO = useMemo(() => {
    return itemsProgress.reduce((sum, it) => sum + it.deliveredQty, 0);
  }, [itemsProgress]);

  const totalRemainingPcs = useMemo(() => {
    return itemsProgress.reduce((sum, it) => sum + it.remainingQty, 0);
  }, [itemsProgress]);

  // Full composite invoice data for Preview & PDF Export
  const compositeInvoice = useMemo((): BuyerInvoiceSummary => {
    const now = new Date();
    const invoiceNo = `INV/${(effectiveBrand || 'BRAND').toUpperCase()}/${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}/01`;

    let jatuhTempoDate: Date;
    if (activeEndDate) {
      jatuhTempoDate = new Date(activeEndDate);
      jatuhTempoDate.setDate(jatuhTempoDate.getDate() + 7);
    } else {
      jatuhTempoDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const primaryPO = selectedPOObjects[0];

    return {
      brand: effectiveBrand,
      invoiceNo,
      tanggal: now.toISOString().split('T')[0],
      jatuhTempo: jatuhTempoDate.toISOString().split('T')[0],
      periodeAwal: activeStartDate,
      periodeAkhir: activeEndDate,
      periodeLabel: activePeriodLabel,
      poInfo: selectedPOObjects.length > 0 ? {
        id: primaryPO?.id,
        noPO: selectedPoNumbers.join(', '),
        selectedPoNumbers,
        brand: effectiveBrand,
        vendorTujuan: Array.from(new Set(selectedPOObjects.map(p => p.vendorTujuan).filter(Boolean))).join(', '),
        tanggalPO: primaryPO?.tanggalPO,
        targetDeadline: primaryPO?.targetDeadline,
        targetPcs: totalTargetPcs,
        totalTargetPcs,
        totalDeliveredPcs: totalDeliveredFromPO || totalDeliveredPcs,
        totalRemainingPcs,
        pos: selectedPOObjects.map(p => ({
          id: p.id,
          noPO: p.noPO,
          vendorTujuan: p.vendorTujuan,
          tanggalPO: p.tanggalPO,
          targetDeadline: p.targetDeadline,
          targetPcs: p.totalPcs || p.items?.reduce((s, it) => s + (it.qty || 0), 0) || 0,
          status: p.status,
        })),
        items: itemsProgress.map(it => ({
          poNumber: it.poNumber,
          namaProduk: it.namaProduk,
          warna: it.warna,
          ukuran: it.ukuran,
          qty: it.targetQty,
          bahanKain: it.bahanKain,
          catatan: it.catatan,
        })),
        itemsProgress,
      } : undefined,
      items: checkedSjItems,
      totalPcs: totalDeliveredPcs,
      subtotalGross: totalGrossTagihan,
      fabricItems: checkedRolls,
      totalFabricMeters,
      totalFabricDeduction,
      grandTotal: grandTotalNet,
    };
  }, [
    effectiveBrand,
    selectedPoNumbers,
    selectedPOObjects,
    itemsProgress,
    totalTargetPcs,
    totalDeliveredFromPO,
    totalRemainingPcs,
    checkedSjItems,
    totalDeliveredPcs,
    totalGrossTagihan,
    checkedRolls,
    totalFabricMeters,
    totalFabricDeduction,
    grandTotalNet,
    activeStartDate,
    activeEndDate,
    activePeriodLabel,
  ]);

  const handleSaveKasbon = (e: React.FormEvent) => {
    e.preventDefault();
    if (kasbonForm.jumlah <= 0) {
      alert('Nominal kasbon harus lebih dari 0!');
      return;
    }

    addKasbon({
      vendor: kasbonForm.vendor,
      tanggal: new Date().toISOString().split('T')[0],
      jumlah: Number(kasbonForm.jumlah),
      tipe: kasbonForm.tipe,
      keterangan: kasbonForm.keterangan,
    });

    setIsAddKasbonOpen(false);
  };

  // Jika role BRAND, langsung tampilkan Portal Tagihan & Invoice Khusus Brand
  // Atau jika ADMIN sedang mode pratinjau tampilan portal brand
  if (userRole === 'BRAND' || isAdminPreviewingBrandPortal) {
    return (
      <BrandInvoicePortal
        forcedBrand={userRole === 'ADMIN' ? effectiveBrand : undefined}
        isAdminPreview={userRole === 'ADMIN' && isAdminPreviewingBrandPortal}
        onExitAdminPreview={() => setIsAdminPreviewingBrandPortal(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg mb-2 border border-indigo-100">
              <ReceiptText className="w-3.5 h-3.5" />
              Finance & Tagihan
            </div>
            <h1 className="text-xl font-bold text-slate-900">Pusat Keuangan & Cetak Tagihan</h1>
            <p className="text-slate-500 text-xs mt-1">
              Pencocokan otomatis (*Auto-Lookup*) data kiriman Surat Jalan dengan Master Database Harga untuk penerbitan slip gaji dan invoice.
            </p>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {userRole === 'ADMIN' && (
            <button
              onClick={() => {
                setActiveSubTab('payroll');
                setFinanceSubTab('payroll');
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-base btn-press ${
                activeSubTab === 'payroll'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Penggajian Penjahit (Vendor Payroll)
            </button>
          )}

          {userRole === 'ADMIN' && (
            <button
              onClick={() => {
                setActiveSubTab('manual_invoice');
                setFinanceSubTab('manual_invoice');
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-base btn-press flex items-center gap-1.5 ${
                activeSubTab === 'manual_invoice'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ReceiptText className="w-3.5 h-3.5" />
              <span>Invoice Manual Vendor (Bayar Dimuka)</span>
              {vendorManualInvoices && vendorManualInvoices.length > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-bold ${
                    activeSubTab === 'manual_invoice'
                      ? 'bg-white text-indigo-800'
                      : 'bg-indigo-100 text-indigo-800'
                  }`}
                >
                  {vendorManualInvoices.length}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => {
              setActiveSubTab('invoice');
              setFinanceSubTab('invoice');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-base btn-press ${
              activeSubTab === 'invoice'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Invoice Tagihan Buyer (Multi-Size)
          </button>

          {userRole === 'ADMIN' && (
            <button
              onClick={() => {
                setActiveSubTab('kasbon');
                setFinanceSubTab('kasbon');
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-base btn-press ${
                activeSubTab === 'kasbon'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Manajemen Kasbon Penjahit
            </button>
          )}
        </div>
      </div>

      {/* Sabtuan Period Toolbar (Filter Sabtuan Pekan Ini, Pekan Lalu, Kustom) */}
      {activeSubTab !== 'kasbon' && activeSubTab !== 'manual_invoice' && (
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Filter Periode Sabtuan (Sabtu ke Sabtu)
              </div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                <span>{activePeriodLabel}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setPeriodMode('this_sabtuan')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition btn-press ${
                periodMode === 'this_sabtuan'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Pekan Ini
            </button>
            <button
              onClick={() => setPeriodMode('custom')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition btn-press ${
                periodMode === 'custom'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Kustom Tanggal
            </button>
            <button
              onClick={() => setPeriodMode('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition btn-press ${
                periodMode === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Semua Waktu
            </button>
          </div>

          {periodMode === 'custom' && (
            <div className="flex items-center gap-2 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-400">s/d</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>
      )}


      {/* 1. VENDOR PAYROLL VIEW */}
      {activeSubTab === 'payroll' && userRole === 'ADMIN' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Controls: Select Vendor */}
          <div className="lg:col-span-4 bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              Pilih Mitra Penjahit (Vendor)
            </h3>

            <div className="space-y-2">
              {vendors.map((v) => {
                const isSelected = selectedVendorName === v.name;
                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVendorName(v.name)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-500 shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-900">{v.name}</div>
                      <div className="text-[10px] text-slate-500">{v.specialty}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-rose-500 font-bold block">
                        Kasbon: {formatRp(v.currentKasbon)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Action: Buat Invoice Manual / Bayar Dimuka */}
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-950 flex items-center gap-1.5 text-[11px]">
                  <ReceiptText className="w-3.5 h-3.5 text-indigo-600" />
                  Barang Belum Terkirim?
                </span>
                <span className="text-[9.5px] font-bold text-indigo-700 bg-indigo-100 border border-indigo-200 px-1.5 py-0.2 rounded">
                  DP Jahit
                </span>
              </div>
              <p className="text-[10.5px] text-slate-600 leading-tight">
                Jika mitra <strong>{selectedVendorName}</strong> minta dicairkan uang muka (DP) sebelum barang dikirim via Surat Jalan:
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingManualInvoice(null);
                  setIsCreateManualModalOpen(true);
                }}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition btn-press cursor-pointer shadow-2xs mt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Buat Invoice Manual / Bayar Dimuka</span>
              </button>
            </div>

            {/* Emergency Override Toggle */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 text-xs">
              <label className="flex items-center justify-between font-bold text-slate-800 cursor-pointer">
                <span className="text-[11px]">Override: Bayar Sebagian (Partial)</span>
                <input
                  type="checkbox"
                  checked={allowPartialPayment}
                  onChange={(e) => setAllowPartialPayment(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer accent-indigo-600"
                />
              </label>
              <p className="text-[10.5px] text-slate-500 leading-tight">
                {allowPartialPayment
                  ? 'Mode darurat aktif: Seluruh kiriman surat jalan akan dihitung meskipun PO belum 100% tuntas.'
                  : 'Aturan standar aktif: Gaji hanya dicairkan untuk paket PO yang sudah 100% tuntas terkirim.'}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-700 block border-b border-slate-200 pb-1">
                Kalkulasi Bersih Siap Bayar:
              </span>
              <div className="flex justify-between text-slate-600">
                <span>Gaji Siap Cair (PO Tuntas):</span>
                <span className="font-bold text-emerald-700">{formatRp(currentPayroll.totalGrossPay)}</span>
              </div>
              {(currentPayroll.totalPendingPay ?? 0) > 0 && (
                <div className="flex justify-between text-amber-800 bg-amber-50 px-2 py-1.5 rounded-lg border border-amber-200/80">
                  <span>Gaji Ditahan (PO Belum Tuntas):</span>
                  <span className="font-bold">{formatRp(currentPayroll.totalPendingPay || 0)}</span>
                </div>
              )}
              <div className="flex justify-between text-rose-600">
                <span>Potongan Kasbon:</span>
                <span className="font-bold">- {formatRp(currentPayroll.kasbonDeduction)}</span>
              </div>
              {(currentPayroll.manualInvoiceDeduction ?? 0) > 0 && (
                <div className="flex justify-between text-amber-800 bg-amber-50 px-2 py-1.5 rounded-lg border border-amber-200">
                  <span>Potongan Invoice Manual (DP):</span>
                  <span className="font-bold">- {formatRp(currentPayroll.manualInvoiceDeduction || 0)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-900 border-t border-slate-200 pt-2 font-bold text-sm">
                <span>Gaji Bersih (Netto):</span>
                <span className="text-emerald-600">{formatRp(currentPayroll.netPay)}</span>
              </div>
            </div>

            <button
              onClick={() => setIsSlipModalOpen(true)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Preview & Cetak Slip Gaji
            </button>
          </div>

          {/* Right Table: Surat Jalan Items for Selected Vendor */}
          <div className="lg:col-span-8 bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Rincian Kiriman Surat Jalan: {selectedVendorName}
                </h3>
                <span className="text-xs text-slate-400">Total {currentPayroll.items.length} transaksi kirim</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                  Total {currentPayroll.totalPcs} Pcs
                </span>
              </div>
            </div>

            {/* PO Packages Status & Settlement Header */}
            {currentPayroll.packages && currentPayroll.packages.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-indigo-600" />
                    Status Pemenuhan PO Produksi & Kelayakan Cair (Vendor Payroll)
                  </h4>

                  {/* Filter Status Pelunasan */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs shrink-0">
                    <button
                      type="button"
                      onClick={() => setPoSettlementFilter('UNPAID')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                        poSettlementFilter === 'UNPAID'
                          ? 'bg-white text-indigo-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Belum Lunas ({currentPayroll.packages.filter((p) => !p.isSettled).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPoSettlementFilter('SETTLED')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        poSettlementFilter === 'SETTLED'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>Riwayat Lunas</span>
                      {currentPayroll.packages.filter((p) => p.isSettled).length > 0 && (
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-bold ${
                            poSettlementFilter === 'SETTLED'
                              ? 'bg-white text-emerald-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {currentPayroll.packages.filter((p) => p.isSettled).length}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPoSettlementFilter('ALL')}
                      className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                        poSettlementFilter === 'ALL'
                          ? 'bg-white text-indigo-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Semua
                    </button>
                  </div>
                </div>

                {/* Seleksi Checkbox PO untuk Cetak Slip Gaji */}
                {displayedPackages.length > 0 && (
                  <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/80 text-xs">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedPOKeys.length === displayedPackages.length) {
                            setSelectedPOKeys([]);
                          } else {
                            setSelectedPOKeys(displayedPackages.map((p) => p.poNumber));
                          }
                        }}
                        className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 cursor-pointer text-xs"
                      >
                        {selectedPOKeys.length > 0 && selectedPOKeys.length === displayedPackages.length ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                        <span>
                          {selectedPOKeys.length > 0 && selectedPOKeys.length === displayedPackages.length
                            ? 'Batalkan Semua Pilihan'
                            : 'Pilih Semua PO untuk Dicetak'}
                        </span>
                      </button>
                      {selectedPOKeys.length > 0 && (
                        <span className="text-[11px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-md">
                          {selectedPOKeys.length} PO Terpilih
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Menampilkan {displayedPackages.length} paket PO
                    </span>
                  </div>
                )}

                {displayedPackages.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
                    {poSettlementFilter === 'UNPAID'
                      ? 'Tidak ada PO belum lunas untuk vendor ini pada periode ini.'
                      : poSettlementFilter === 'SETTLED'
                      ? 'Belum ada riwayat PO yang dilunaskan untuk vendor ini.'
                      : 'Belum ada data PO untuk vendor ini.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {displayedPackages.map((pkg, pIdx) => {
                      const isSelected = selectedPOKeys.includes(pkg.poNumber);
                      return (
                        <div
                          key={pIdx}
                          className={`p-3.5 rounded-xl border transition space-y-2.5 ${
                            pkg.isSettled
                              ? 'bg-emerald-50/50 border-emerald-300 shadow-2xs'
                              : pkg.isComplete
                              ? isSelected
                                ? 'bg-indigo-50/60 border-indigo-400 shadow-xs ring-1 ring-indigo-400'
                                : 'bg-emerald-50/70 border-emerald-200 shadow-2xs'
                              : 'bg-amber-50/70 border-amber-200 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2">
                              {!pkg.isSettled && (
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedPOKeys((prev) => [...prev, pkg.poNumber]);
                                    } else {
                                      setSelectedPOKeys((prev) => prev.filter((k) => k !== pkg.poNumber));
                                    }
                                  }}
                                  className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 cursor-pointer mt-0.5"
                                  title="Centang untuk menyertakan PO ini pada Slip Gaji"
                                />
                              )}
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-mono font-bold text-xs text-slate-900">{pkg.poNumber}</span>
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-white rounded border border-slate-200 text-slate-700 uppercase">
                                    {pkg.brand}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-700 font-bold mt-0.5">{pkg.produk}</div>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                                pkg.isSettled
                                  ? 'bg-emerald-600 text-white shadow-2xs'
                                  : pkg.isComplete
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}
                            >
                              {pkg.isSettled ? '✓ LUNAS (PAID)' : pkg.isComplete ? '✓ SIAP CAIR (100%)' : '⏳ MENUNGGU PELUNASAN'}
                            </span>
                          </div>

                          <div className="text-[11px] space-y-1.5">
                            <div className="flex justify-between text-slate-600">
                              <span>Progres Kirim:</span>
                              <strong className="text-slate-800">
                                {pkg.deliveredPcs} / {pkg.targetPcs} Pcs ({pkg.percent}%)
                              </strong>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  pkg.isSettled ? 'bg-emerald-600' : pkg.isComplete ? 'bg-emerald-500' : 'bg-amber-500'
                                }`}
                                style={{ width: `${Math.min(100, pkg.percent)}%` }}
                              />
                            </div>
                            <div className="flex justify-between pt-1 border-t border-slate-200/70 text-xs">
                              <span className="text-slate-500">Nilai Gaji:</span>
                              <strong className={pkg.isSettled ? 'text-emerald-800 font-bold' : pkg.isComplete ? 'text-emerald-700 font-bold' : 'text-amber-800 font-bold'}>
                                {formatRp(pkg.totalPay)}
                              </strong>
                            </div>
                            {!pkg.isComplete && !allowPartialPayment && !pkg.isSettled && (
                              <div className="text-[10px] text-amber-700 mt-1 leading-tight">
                                *Kurang {pkg.remainingPcs} pcs untuk membuka pencairan gaji PO ini.
                              </div>
                            )}
                          </div>

                          {/* Action Bar per Kartu PO */}
                          {pkg.isSettled ? (
                            <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between text-xs">
                              <div>
                                <span className="text-[10px] text-emerald-900 font-bold block">
                                  Lunas: {formatDateIndo(pkg.settlementInfo?.tanggalBayar)} ({pkg.settlementInfo?.metodePembayaran})
                                </span>
                                {pkg.settlementInfo?.nomorReferensi && (
                                  <span className="text-[9.5px] text-slate-600 font-mono block">
                                    Ref: {pkg.settlementInfo.nomorReferensi}
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleUnsettle(pkg.settlementInfo!.id, pkg.poNumber)}
                                className="text-[10px] text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 bg-white border border-rose-200 px-2 py-1 rounded-md transition hover:bg-rose-50 cursor-pointer shadow-2xs"
                                title="Batalkan status lunas (kembalikan ke tagihan berjalan)"
                              >
                                <RotateCcw className="w-3 h-3" />
                                Batal Lunas
                              </button>
                            </div>
                          ) : (
                            (pkg.isComplete || allowPartialPayment) && (
                              <div className="pt-2 border-t border-slate-200/70 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSettleForm({
                                      tanggalBayar: new Date().toISOString().split('T')[0],
                                      metodePembayaran: 'TRANSFER',
                                      nomorReferensi: '',
                                      catatan: '',
                                    });
                                    setSettleModal({ isOpen: true, pkg });
                                  }}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Tandai Sudah Dibayar
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">No Surat Jalan</th>
                    <th className="p-3">Produk (Brand)</th>
                    <th className="p-3 text-center">Status PO</th>
                    <th className="p-3 text-center">Qty Pcs</th>
                    <th className="p-3 text-right">Tarif Auto-Lookup</th>
                    <th className="p-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {displayedTableItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        <div className="max-w-md mx-auto space-y-2.5">
                          <Package className="w-8 h-8 text-slate-300 mx-auto" />
                          <div className="font-bold text-slate-700 text-sm">
                            {poSettlementFilter === 'UNPAID'
                              ? 'Tidak ada kiriman Surat Jalan yang belum lunas.'
                              : poSettlementFilter === 'SETTLED'
                              ? 'Belum ada kiriman pada riwayat lunas.'
                              : `Belum ada riwayat Surat Jalan untuk vendor ${selectedVendorName}.`}
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            Barang belum terkirim? Jika vendor minta dibayarkan dahulu (DP / Uang Muka Ongkos Jahit), Anda dapat menerbitkan <strong>Invoice Manual Vendor</strong> sekarang.
                          </p>
                          <div>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingManualInvoice(null);
                                setIsCreateManualModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-xs transition btn-press cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Buat Invoice Manual / Bayar Dimuka</span>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayedTableItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-mono font-bold text-indigo-600">{item.suratJalanNo}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{item.produk}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-400">{item.brand}</span>
                            {item.poNumber && (
                              <span className="text-[9.5px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                                PO: {item.poNumber}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          {item.isSettled ? (
                            <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-600 text-white shadow-2xs">
                              ✓ Lunas (Paid)
                            </span>
                          ) : item.isCompletedPO ? (
                            <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Siap Cair
                            </span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold ${
                              allowPartialPayment
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {allowPartialPayment ? 'Cair (Override)' : 'Ditahan'}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center font-bold text-slate-800">{item.pcs} Pcs</td>
                        <td className="p-3 text-right font-medium text-slate-600">{formatRp(item.rate)}</td>
                        <td className="p-3 text-right font-bold text-slate-900">{formatRp(item.subtotal)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* 2. VENDOR MANUAL INVOICE / PEMBAYARAN DIMUKA VIEW */}
      {activeSubTab === 'manual_invoice' && userRole === 'ADMIN' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Dana Bayar Dimuka</span>
                <div className="text-lg font-black text-slate-900 mt-1">
                  {formatRp(manualStats.totalAmount)}
                </div>
                <span className="text-[10px] text-slate-500">{manualStats.count} transaksi invoice terbit</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Coins className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sudah Ditransfer / Lunas</span>
                <div className="text-lg font-black text-emerald-700 mt-1">
                  {formatRp(manualStats.paidAmount)}
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold">Uang muka sudah cair ke vendor</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Terpotong di Slip Gaji</span>
                <div className="text-lg font-black text-blue-700 mt-1">
                  {formatRp(manualStats.deductedAmount)}
                </div>
                <span className="text-[10px] text-blue-600 font-semibold">Telah diperhitungkan di pelunasan</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Aktif Memotong Gaji (Belum Tuntas)</span>
                <div className="text-lg font-black text-amber-700 mt-1">
                  {formatRp(manualStats.activeDeductionAmount)}
                </div>
                <span className="text-[10px] text-amber-600 font-semibold">Menunggu kiriman SJ & payroll</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Search, Filter Toolbar & Action */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3.5">
            {/* Top Row: Search & Primary Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={manualSearchQuery}
                  onChange={(e) => setManualSearchQuery(e.target.value)}
                  placeholder="Cari no invoice, vendor, no PO, keterangan..."
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition"
                />
                {manualSearchQuery && (
                  <button
                    onClick={() => setManualSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingManualInvoice(null);
                  setIsCreateManualModalOpen(true);
                }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition btn-press cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Invoice Manual / DP Vendor</span>
              </button>
            </div>

            {/* Subtle Divider */}
            <div className="border-t border-slate-100" />

            {/* Bottom Row: Filter Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase tracking-wider mr-1">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filter:</span>
                </div>

                <select
                  value={manualVendorFilter}
                  onChange={(e) => setManualVendorFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-700 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                >
                  <option value="ALL">Semua Mitra Penjahit</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.name}>{v.name}</option>
                  ))}
                </select>

                <select
                  value={manualPotongFilter}
                  onChange={(e) => setManualPotongFilter(e.target.value as any)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-700 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                >
                  <option value="ALL">Semua Tipe Potongan</option>
                  <option value="POTONG_GAJI">Otomatis Potong di Gaji</option>
                  <option value="NON_POTONG">Non-Potong Gaji</option>
                </select>

                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setManualStatusFilter('ALL')}
                    className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer text-xs ${
                      manualStatusFilter === 'ALL'
                        ? 'bg-white text-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Semua Status
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualStatusFilter('DIBAYAR')}
                    className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer text-xs ${
                      manualStatusFilter === 'DIBAYAR'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Sudah Dibayar
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualStatusFilter('PENDING')}
                    className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer text-xs ${
                      manualStatusFilter === 'PENDING'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Pending
                  </button>
                </div>

                {(manualSearchQuery || manualVendorFilter !== 'ALL' || manualStatusFilter !== 'ALL' || manualPotongFilter !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setManualSearchQuery('');
                      setManualVendorFilter('ALL');
                      setManualStatusFilter('ALL');
                      setManualPotongFilter('ALL');
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-rose-50 transition cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                    <span>Reset Filter</span>
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-500 font-medium">
                Menampilkan <strong className="text-slate-800 font-bold">{filteredManualInvoices.length}</strong> invoice
              </div>
            </div>
          </div>

          {/* Table Data Invoice Manual */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Daftar Tagihan & Invoice Manual Vendor</h3>
                <p className="text-xs text-slate-400">
                  Total {filteredManualInvoices.length} dokumen invoice manual tercatat
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="p-3 whitespace-nowrap">No. Invoice & Tgl</th>
                    <th className="p-3 whitespace-nowrap">Mitra Penjahit</th>
                    <th className="p-3 whitespace-nowrap">Ref PO / SPK</th>
                    <th className="p-3">Keterangan</th>
                    <th className="p-3 text-center whitespace-nowrap">Status Bayar</th>
                    <th className="p-3 text-center whitespace-nowrap">Potong Gaji Kelak</th>
                    <th className="p-3 text-right whitespace-nowrap min-w-[140px]">Nominal (Rp)</th>
                    <th className="p-3 text-center w-36 whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredManualInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-400">
                        <div className="max-w-md mx-auto space-y-2">
                          <ReceiptText className="w-10 h-10 text-slate-300 mx-auto" />
                          <div className="font-bold text-slate-700 text-sm">Belum Ada Dokumen Invoice Manual</div>
                          <p className="text-xs text-slate-400">
                            Fitur ini digunakan saat vendor meminta dicairkan uang muka / ongkos jahit sebelum barang tuntas dikirimkan via Surat Jalan.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingManualInvoice(null);
                              setIsCreateManualModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-xs cursor-pointer mt-2"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Terbitkan Invoice Manual Pertama</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredManualInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 whitespace-nowrap">
                          <div className="font-mono font-bold text-indigo-700 whitespace-nowrap">{inv.invoiceNo}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap">{formatDateIndo(inv.tanggal)}</div>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <div className="font-bold text-slate-900 whitespace-nowrap">{inv.vendor}</div>
                          {inv.bankTujuan && (
                            <div className="text-[10px] text-slate-500 whitespace-nowrap">
                              {inv.bankTujuan} {inv.nomorRekening}
                            </div>
                          )}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {inv.poNumber ? (
                            <div>
                              <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded text-[10px] whitespace-nowrap inline-block">
                                {inv.poNumber}
                              </span>
                              {inv.brand && (
                                <div className="text-[10px] text-slate-500 mt-0.5 whitespace-nowrap">
                                  {inv.brand} {inv.produk ? `• ${inv.produk}` : ''}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Non-PO / Umum</span>
                          )}
                        </td>
                        <td className="p-3 max-w-xs">
                          <div className="text-[11px] text-slate-700 leading-normal">
                            {inv.keterangan || '-'}
                          </div>
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          {inv.status === 'DIBAYAR' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              LUNAS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
                              <Clock className="w-3 h-3 text-amber-600" />
                              PENDING
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          {inv.isDeducted ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-blue-100 text-blue-800 border border-blue-200 whitespace-nowrap">
                              Sudah Terpotong
                            </span>
                          ) : inv.potongDiSlipGaji ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 whitespace-nowrap">
                              ✓ Auto-Potong Gaji
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-slate-100 text-slate-500 whitespace-nowrap">
                              Non-Potong
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right font-black text-slate-900 text-sm whitespace-nowrap">
                          <span className="inline-block whitespace-nowrap">
                            Rp {(inv.totalNominal || 0).toLocaleString('id-ID')}
                          </span>
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setPreviewManualInvoice(inv)}
                              title="Cetak / Preview Voucher Invoice"
                              className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {inv.status === 'PENDING' && (
                              <button
                                type="button"
                                onClick={async () => {
                                  if (confirm(`Tandai invoice ${inv.invoiceNo} sebesar ${formatRp(inv.totalNominal)} sebagai SUDAH DIBAYAR?`)) {
                                    await updateVendorManualInvoice(inv.id, {
                                      status: 'DIBAYAR',
                                      tanggalBayar: new Date().toISOString().split('T')[0],
                                    });
                                  }
                                }}
                                title="Tandai Sudah Dibayar (Lunas)"
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition cursor-pointer"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setEditingManualInvoice(inv);
                                setIsCreateManualModalOpen(true);
                              }}
                              title="Edit Data Invoice"
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                            >
                              <Scissors className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm(`Hapus invoice manual ${inv.invoiceNo} untuk vendor ${inv.vendor}?`)) {
                                  await deleteVendorManualInvoice(inv.id);
                                }
                              }}
                              title="Hapus Invoice"
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* 3. BUYER INVOICE VIEW (PO-BASED & MANUAL SELECTION WITH FABRIC DEDUCTION) */}
      {activeSubTab === 'invoice' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Controls: Select Brand, Select PO, PO Detail Card, Billing Calculation Card */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* 1. Pilih Brand */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                {userRole === 'ADMIN' ? '1. Pilih Brand Buyer' : 'Brand Client'}
              </h3>

              {userRole === 'ADMIN' ? (
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {brands.map((b) => {
                    const isSelected = effectiveBrand === b.name;
                    return (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBrandName(b.name)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-50/80 border-emerald-500 shadow-xs'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-xs text-slate-900">{b.name}</div>
                          <div className="text-[10px] text-slate-500">Kontak: {b.contactPerson}</div>
                        </div>
                        <span className="text-[10.5px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          {b.code}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="font-bold text-emerald-900 text-sm">{effectiveBrand}</div>
                  <div className="text-[10px] text-emerald-700">Portal Invoice Tagihan Resmi</div>
                </div>
              )}
            </div>

            {/* 2. Multi-Select Checklist PO Produksi */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Package className="w-4 h-4 text-indigo-600" />
                  2. Rujukan PO Produksi
                </h3>
                <span className="text-[10px] font-semibold text-slate-500">
                  {brandPOs.length} PO Terdaftar
                </span>
              </div>

              {/* Batch Select / Deselect Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPoNumbers(brandPOs.map(p => p.noPO))}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg font-semibold text-indigo-700 text-[11px] transition cursor-pointer flex items-center gap-1"
                >
                  <CheckSquare className="w-3 h-3" />
                  Pilih Semua ({brandPOs.length})
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

              {/* PO Checklist Items */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {brandPOs.length === 0 ? (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span>Belum ada PO Produksi untuk brand ini.</span>
                  </div>
                ) : (
                  brandPOs.map((po) => {
                    const isPoChecked = selectedPoNumbers.includes(po.noPO);
                    return (
                      <div
                        key={po.id || po.noPO}
                        onClick={() => {
                          setSelectedPoNumbers(prev =>
                            prev.includes(po.noPO)
                              ? prev.filter(n => n !== po.noPO)
                              : [...prev, po.noPO]
                          );
                        }}
                        className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center gap-2.5 ${
                          isPoChecked
                            ? 'bg-indigo-50/80 border-indigo-400 shadow-xs'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300 opacity-70'
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
                            <span className={`px-1.5 py-0.2 rounded-full text-[8.5px] font-bold shrink-0 ${
                              po.status === 'SELESAI'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-indigo-100 text-indigo-800'
                            }`}>
                              {po.status}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {po.vendorTujuan || 'Workshop'} • {(po.totalPcs || po.items?.reduce((s: number, i: any) => s + (i.qty || 0), 0) || 0).toLocaleString('id-ID')} pcs
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Multi-PO Summary Card with Progress */}
              {selectedPOObjects.length > 0 && (
                <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-xl p-3 text-xs space-y-2.5">
                  {/* PO Badges */}
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[9.5px] font-bold text-indigo-700 uppercase tracking-wider">PO Terpilih:</span>
                    {selectedPOObjects.map(po => (
                      <span key={po.noPO} className="font-mono text-[10px] font-bold text-indigo-900 bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-200">
                        {po.noPO}
                      </span>
                    ))}
                  </div>

                  {/* Aggregate Metrics */}
                  <div className="grid grid-cols-3 gap-2 pt-1.5 border-t border-indigo-100">
                    <div className="text-center">
                      <span className="text-slate-400 block text-[9px]">Target PO</span>
                      <span className="font-bold text-indigo-900 font-mono text-xs">{totalTargetPcs.toLocaleString('id-ID')}</span>
                      <span className="text-[9px] text-slate-500 block">Pcs</span>
                    </div>
                    <div className="text-center">
                      <span className="text-slate-400 block text-[9px]">Sudah Terkirim</span>
                      <span className="font-bold text-emerald-700 font-mono text-xs">{totalDeliveredFromPO.toLocaleString('id-ID')}</span>
                      <span className="text-[9px] text-slate-500 block">Pcs</span>
                    </div>
                    <div className="text-center">
                      <span className="text-slate-400 block text-[9px]">Sisa Belum Terkirim</span>
                      <span className={`font-bold font-mono text-xs ${totalRemainingPcs > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                        {totalRemainingPcs.toLocaleString('id-ID')}
                      </span>
                      <span className="text-[9px] text-slate-500 block">Pcs</span>
                    </div>
                  </div>

                  {/* Vendor Workshops */}
                  {(() => {
                    const vendorSet = Array.from(new Set(selectedPOObjects.map(p => p.vendorTujuan).filter(Boolean)));
                    return vendorSet.length > 0 ? (
                      <div className="pt-1 border-t border-indigo-100 text-[10px] text-indigo-800">
                        <span className="text-slate-400 text-[9px]">Workshop:</span>{' '}
                        <span className="font-semibold">{vendorSet.join(', ')}</span>
                      </div>
                    ) : null;
                  })()}

                  {/* Per-Item Progress Breakdown */}
                  {itemsProgress.length > 0 && (
                    <div className="pt-2 border-t border-indigo-100 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-indigo-950 uppercase tracking-wider">
                        <span>Rincian Item PO & Progres:</span>
                        <span className="text-indigo-600 font-mono font-semibold">{itemsProgress.length} Item</span>
                      </div>
                      <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                        {itemsProgress.map((it, idx) => (
                          <div key={it.id || idx} className="bg-white/80 p-1.5 rounded-lg border border-indigo-100 text-[10.5px]">
                            <div className="flex items-center justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  {selectedPOObjects.length > 1 && (
                                    <span className="text-[8.5px] font-mono text-indigo-600 bg-indigo-50 px-1 py-0.2 rounded shrink-0">{it.poNumber}</span>
                                  )}
                                  <span className="truncate">{it.namaProduk}</span>
                                </div>
                                <div className="text-slate-500 text-[9.5px]">
                                  {it.warna ? `${it.warna} • ` : ''}{it.ukuran ? `Size ${it.ukuran}` : ''}{it.bahanKain ? ` • ${it.bahanKain}` : ''}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[9.5px]">
                              <span className="text-indigo-800">Target: <b className="font-mono">{it.targetQty.toLocaleString('id-ID')}</b></span>
                              <span className="text-slate-300">|</span>
                              <span className="text-emerald-700">Terkirim: <b className="font-mono">{it.deliveredQty.toLocaleString('id-ID')}</b></span>
                              <span className="text-slate-300">|</span>
                              <span className={`${it.remainingQty > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                                Sisa: <b className="font-mono">{it.remainingQty.toLocaleString('id-ID')}</b>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. Kartu Kalkulasi Tagihan Bersih */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2.5 text-xs shadow-xs">
              <span className="font-bold text-slate-800 block border-b border-slate-200 pb-1.5 text-xs uppercase tracking-wider">
                Kalkulasi Tagihan Buyer:
              </span>
              
              <div className="flex justify-between text-slate-600">
                <span>Total Pcs Terkirim:</span>
                <span className="font-bold text-slate-900 font-mono">{totalDeliveredPcs.toLocaleString('id-ID')} Pcs</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Tagihan Kiriman ({checkedSjItems.length} SJ):</span>
                <span className="font-bold text-slate-900 font-mono">{formatRp(totalGrossTagihan)}</span>
              </div>

              <div className="flex justify-between text-rose-700 bg-rose-50 px-2 py-1.5 rounded-lg border border-rose-200/80">
                <span className="flex items-center gap-1">
                  <Scissors className="w-3.5 h-3.5" />
                  Potongan Kain ({totalFabricMeters} m):
                </span>
                <span className="font-bold font-mono">- {formatRp(totalFabricDeduction)}</span>
              </div>

              <div className="flex justify-between text-slate-600 pt-1">
                <span>Jatuh Tempo:</span>
                <span className="font-bold text-rose-600">{compositeInvoice.jatuhTempo}</span>
              </div>

              <div className="flex justify-between text-slate-900 border-t border-slate-200 pt-2 font-bold text-sm">
                <span>Total Tagihan Bersih:</span>
                <span className="text-emerald-700 text-base font-mono">{formatRp(grandTotalNet)}</span>
              </div>
            </div>

            <button
              onClick={() => setIsInvoiceModalOpen(true)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition btn-press cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Preview & Cetak Invoice Resmi (PDF)
            </button>
          </div>

          {/* Right Area: Interactive Tabs (Surat Jalan & Pemakaian Kain) */}
          <div className="lg:col-span-8 bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
            
            {/* Header Toolbar & Tab Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Rekapan & Pemilihan Item Invoice: {effectiveBrand}
                </h3>
                <span className="text-xs text-slate-400">
                  {selectedPoNumbers.length > 0 ? `Terkoneksi ke ${selectedPoNumbers.join(', ')} • Centang item yang masuk tagihan` : 'Pilih surat jalan & kain yang akan dimasukkan ke invoice'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdminPreviewingBrandPortal(true)}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Lihat bagaimana klien Brand melihat portal tagihan ini"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pratinjau Portal Brand</span>
                </button>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full self-start sm:self-auto">
                  {compositeInvoice.invoiceNo}
                </span>
              </div>
            </div>

            {/* Sub Tabs: 1. Surat Jalan, 2. Pemakaian Kain */}
            <div className="flex gap-2 border-b border-slate-200 pb-2">
              <button
                onClick={() => setActiveInvoiceTab('surat_jalan')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  activeInvoiceTab === 'surat_jalan'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>1. Surat Jalan Pengiriman</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeInvoiceTab === 'surat_jalan' ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {checkedSjItems.length}/{availableSjItems.length}
                </span>
              </button>

              <button
                onClick={() => setActiveInvoiceTab('kain')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  activeInvoiceTab === 'kain'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Scissors className="w-4 h-4" />
                <span>2. List Kain Terpakai (Potongan)</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeInvoiceTab === 'kain' ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {checkedRolls.length}/{availableRolls.length}
                </span>
              </button>
            </div>

            {/* TAB 1 CONTENT: SURAT JALAN */}
            {activeInvoiceTab === 'surat_jalan' && (
              <div className="space-y-3">
                {/* Batch Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedSjRowKeys(availableSjItems.map(it => it.rowKey))}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg font-semibold text-slate-700 text-[11px] transition cursor-pointer"
                    >
                      Pilih Semua ({availableSjItems.length})
                    </button>
                    <button
                      onClick={() => setSelectedSjRowKeys([])}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg font-semibold text-slate-700 text-[11px] transition cursor-pointer"
                    >
                      Batal Semua
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-600 font-medium">
                    Terpilih: <strong className="text-slate-900">{checkedSjItems.length}</strong> Item • <strong className="text-emerald-700">{totalDeliveredPcs} Pcs</strong> ({formatRp(totalGrossTagihan)})
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={availableSjItems.length > 0 && selectedSjRowKeys.length === availableSjItems.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSjRowKeys(availableSjItems.map(it => it.rowKey));
                              } else {
                                setSelectedSjRowKeys([]);
                              }
                            }}
                            className="w-4 h-4 rounded text-indigo-600 cursor-pointer accent-indigo-600"
                          />
                        </th>
                        <th className="p-3">No Surat Jalan</th>
                        <th className="p-3">Artikel Produk</th>
                        <th className="p-3">Rincian Multi-Size</th>
                        <th className="p-3 text-center">Total Pcs</th>
                        <th className="p-3 text-right">Subtotal Tagihan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {availableSjItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400">
                            Belum ada kiriman barang untuk Brand ini pada periode terpilih.
                          </td>
                        </tr>
                      ) : (
                        availableSjItems.map((item) => {
                          const isChecked = selectedSjRowKeys.includes(item.rowKey);
                          return (
                            <tr
                              key={item.rowKey}
                              onClick={() => {
                                setSelectedSjRowKeys(prev =>
                                  prev.includes(item.rowKey)
                                    ? prev.filter(k => k !== item.rowKey)
                                    : [...prev, item.rowKey]
                                );
                              }}
                              className={`transition align-top cursor-pointer ${
                                isChecked ? 'bg-indigo-50/30 hover:bg-indigo-50/50' : 'hover:bg-slate-50 opacity-75'
                              }`}
                            >
                              <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    setSelectedSjRowKeys(prev =>
                                      prev.includes(item.rowKey)
                                        ? prev.filter(k => k !== item.rowKey)
                                        : [...prev, item.rowKey]
                                    );
                                  }}
                                  className="w-4 h-4 rounded text-indigo-600 cursor-pointer accent-indigo-600"
                                />
                              </td>
                              <td className="p-3">
                                <div className="font-mono font-bold text-indigo-600">{item.suratJalanNo}</div>
                                <span className="text-[10px] text-slate-400 block mt-0.5">{formatDateIndo(item.tanggal)}</span>
                                {item.itemPo && (
                                  <span className="text-[9.5px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1 py-0.2 rounded mt-0.5 inline-block">
                                    PO: {item.itemPo}
                                  </span>
                                )}
                              </td>
                              <td className="p-3 font-bold text-slate-900">{item.produk}</td>
                              <td className="p-3 text-[11px] space-y-0.5">
                                {item.qtyS > 0 && <div className="text-slate-600">Size S: <strong>{item.qtyS} pcs</strong> @ {formatRp(item.rateS)}</div>}
                                {item.qtyM > 0 && <div className="text-slate-600">Size M: <strong>{item.qtyM} pcs</strong> @ {formatRp(item.rateM)}</div>}
                                {item.qtyL > 0 && <div className="text-slate-600">Size L: <strong>{item.qtyL} pcs</strong> @ {formatRp(item.rateL)}</div>}
                                {item.qtyXL > 0 && <div className="text-slate-600">Size XL: <strong>{item.qtyXL} pcs</strong> @ {formatRp(item.rateXL)}</div>}
                                {item.qtyXXL > 0 && <div className="text-slate-600">Size 2XL: <strong>{item.qtyXXL} pcs</strong> @ {formatRp(item.rateXXL)}</div>}
                                {!item.qtyS && !item.qtyM && !item.qtyL && (item.qtySML || 0) > 0 && (
                                  <div className="text-slate-600">Size Huruf: <strong>{item.qtySML} pcs</strong> @ {formatRp(item.rateSML || 0)}</div>
                                )}
                                {item.qtyAnak2 > 0 && <div className="text-slate-600">Anak 2: <strong>{item.qtyAnak2} pcs</strong> @ {formatRp(item.rateAnak2)}</div>}
                                {item.qtyAnak4 > 0 && <div className="text-slate-600">Anak 4: <strong>{item.qtyAnak4} pcs</strong> @ {formatRp(item.rateAnak4)}</div>}
                                {item.qtyAnak6 > 0 && <div className="text-slate-600">Anak 6: <strong>{item.qtyAnak6} pcs</strong> @ {formatRp(item.rateAnak6)}</div>}
                                {item.qtyAnak8 > 0 && <div className="text-slate-600">Anak 8: <strong>{item.qtyAnak8} pcs</strong> @ {formatRp(item.rateAnak8)}</div>}
                                {item.qtyAnak10 > 0 && <div className="text-slate-600">Anak 10: <strong>{item.qtyAnak10} pcs</strong> @ {formatRp(item.rateAnak10)}</div>}
                                {item.qtyAnak12 > 0 && <div className="text-slate-600">Anak 12: <strong>{item.qtyAnak12} pcs</strong> @ {formatRp(item.rateAnak12)}</div>}
                                {item.qtyAnak14 > 0 && <div className="text-slate-600">Anak 14: <strong>{item.qtyAnak14} pcs</strong> @ {formatRp(item.rateAnak14)}</div>}
                                {item.qtyAnak16 > 0 && <div className="text-slate-600">Anak 16: <strong>{item.qtyAnak16} pcs</strong> @ {formatRp(item.rateAnak16)}</div>}
                                {item.qtyAnak18 > 0 && <div className="text-slate-600">Anak 18: <strong>{item.qtyAnak18} pcs</strong> @ {formatRp(item.rateAnak18)}</div>}
                              </td>
                              <td className="p-3 text-center font-bold text-slate-800 font-mono">{item.totalPcs}</td>
                              <td className="p-3 text-right font-bold text-slate-900 font-mono">{formatRp(item.totalAmount)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2 CONTENT: PEMAKAIAN KAIN */}
            {activeInvoiceTab === 'kain' && (
              <div className="space-y-3">
                {/* Batch Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-rose-50 p-2.5 rounded-xl border border-rose-200 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedRollIds(availableRolls.map(r => r.id))}
                      className="px-2.5 py-1 bg-white hover:bg-rose-100 border border-rose-300 rounded-lg font-semibold text-rose-800 text-[11px] transition cursor-pointer"
                    >
                      Pilih Semua ({availableRolls.length})
                    </button>
                    <button
                      onClick={() => setSelectedRollIds([])}
                      className="px-2.5 py-1 bg-white hover:bg-rose-100 border border-rose-300 rounded-lg font-semibold text-rose-800 text-[11px] transition cursor-pointer"
                    >
                      Batal Semua
                    </button>
                  </div>
                  <div className="text-[11px] text-rose-900 font-medium">
                    Terpilih: <strong className="text-rose-950">{checkedRolls.length}</strong> Rol • <strong className="text-rose-800">{totalFabricMeters} Meter</strong> (- {formatRp(totalFabricDeduction)})
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={availableRolls.length > 0 && selectedRollIds.length === availableRolls.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRollIds(availableRolls.map(r => r.id));
                              } else {
                                setSelectedRollIds([]);
                              }
                            }}
                            className="w-4 h-4 rounded text-rose-600 cursor-pointer accent-rose-600"
                          />
                        </th>
                        <th className="p-3">Tanggal Masuk</th>
                        <th className="p-3">Kode Rol Kain</th>
                        <th className="p-3">Jenis / Nama Kain</th>
                        <th className="p-3 text-center">Panjang Terpakai</th>
                        <th className="p-3 text-right">Harga Modal Satuan</th>
                        <th className="p-3 text-right">Total Nilai Kain (Potongan)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {availableRolls.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400">
                            Belum ada rol kain di gudang untuk Brand ini.
                          </td>
                        </tr>
                      ) : (
                        availableRolls.map((roll) => {
                          const isChecked = selectedRollIds.includes(roll.id);
                          const meterUsed = roll.meterUsed > 0 ? roll.meterUsed : roll.meterLength;
                          const totalNilaiKain = meterUsed * (roll.hargaModalMeter || 0);

                          return (
                            <tr
                              key={roll.id}
                              onClick={() => {
                                setSelectedRollIds(prev =>
                                  prev.includes(roll.id)
                                    ? prev.filter(id => id !== roll.id)
                                    : [...prev, roll.id]
                                );
                              }}
                              className={`transition align-middle cursor-pointer ${
                                isChecked ? 'bg-rose-50/30 hover:bg-rose-50/50' : 'hover:bg-slate-50 opacity-75'
                              }`}
                            >
                              <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    setSelectedRollIds(prev =>
                                      prev.includes(roll.id)
                                        ? prev.filter(id => id !== roll.id)
                                        : [...prev, roll.id]
                                    );
                                  }}
                                  className="w-4 h-4 rounded text-rose-600 cursor-pointer accent-rose-600"
                                />
                              </td>
                              <td className="p-3 text-slate-500 font-mono text-[11px]">
                                {formatDateIndo(roll.tanggalMasuk)}
                              </td>
                              <td className="p-3">
                                <span className="font-mono font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                                  {roll.rollCode}
                                </span>
                                {roll.sourcePONumber && (
                                  <span className="block text-[9.5px] font-mono text-slate-400 mt-0.5">
                                    PO: {roll.sourcePONumber}
                                  </span>
                                )}
                              </td>
                              <td className="p-3 font-semibold text-slate-900">{roll.jenisKain}</td>
                              <td className="p-3 text-center font-mono font-bold text-slate-900">
                                {meterUsed} m
                                <span className="block text-[9px] text-slate-400 font-normal">
                                  dari {roll.meterLength} m
                                </span>
                              </td>
                              <td className="p-3 text-right font-mono text-slate-700">
                                {formatRp(roll.hargaModalMeter || 0)}
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-rose-700">
                                - {formatRp(totalNilaiKain)}
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

      {/* 3. KASBON VENDOR VIEW (ADMIN ONLY) */}
      {activeSubTab === 'kasbon' && userRole === 'ADMIN' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Manajemen Kasbon & Pinjaman Penjahit</h3>
              <p className="text-xs text-slate-400">
                Kasbon akan otomatis dipotong pada saat penggajian slip gaji terbit.
              </p>
            </div>
            <button
              onClick={() => setIsAddKasbonOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-base btn-press shrink-0"
            >
              <Plus className="w-4 h-4" />
              Catat Kasbon Baru
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Vendor Penjahit</th>
                  <th className="p-3.5">Tipe Transaksi</th>
                  <th className="p-3.5">Nominal (Rp)</th>
                  <th className="p-3.5">Tanggal</th>
                  <th className="p-3.5">Keterangan / Keperluan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {kasbonList.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-bold text-slate-900">{k.vendor}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                          k.tipe === 'PINJAMAN'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {k.tipe}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-rose-600 text-sm">{formatRp(k.jumlah)}</td>
                    <td className="p-3.5 text-slate-700 font-medium">{formatDateIndo(k.tanggal)}</td>
                    <td className="p-3.5 text-slate-600">{k.keterangan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Tambah Kasbon */}
      {isAddKasbonOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-lg border border-slate-100 space-y-5 animate-slideUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Catat Kasbon / Pinjaman Baru</h3>
              <button
                onClick={() => setIsAddKasbonOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveKasbon} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Vendor Penjahit:</label>
                <select
                  value={kasbonForm.vendor}
                  onChange={(e) => setKasbonForm({ ...kasbonForm, vendor: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                >
                  {vendors.map((v) => (
                    <option key={v.id} value={v.name}>
                      {v.name} (Sisa Kasbon: {formatRp(v.currentKasbon)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Nominal Kasbon (Rp):</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Contoh: 500.000"
                  value={formatRupiahInput(kasbonForm.jumlah)}
                  onChange={(e) => setKasbonForm({ ...kasbonForm, jumlah: parseRupiahInput(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-rose-600 text-sm outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Keterangan / Keperluan:</label>
                <input
                  type="text"
                  placeholder="Misal: Uang makan mingguan, beli sparepart jarum..."
                  value={kasbonForm.keterangan}
                  onChange={(e) => setKasbonForm({ ...kasbonForm, keterangan: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"
                  required
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddKasbonOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition"
                >
                  Simpan Kasbon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Modals */}
      {isSlipModalOpen && (
        <SlipGajiModal payroll={selectedPayrollToPrint} onClose={() => setIsSlipModalOpen(false)} />
      )}

      {/* MODAL PELUNASAN GAJI VENDOR (SETTLE PO) */}
      {settleModal.isOpen && settleModal.pkg && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-slideUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Konfirmasi Pelunasan Gaji PO
                </h3>
                <p className="text-[11px] text-slate-500">
                  Tandai PO ini telah lunas dibayarkan ke mitra penjahit
                </p>
              </div>
              <button
                onClick={() => setSettleModal({ isOpen: false })}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSettle} className="space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Vendor Penjahit:</span>
                  <strong className="text-slate-900">{selectedVendorName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Nomor PO:</span>
                  <span className="font-mono font-bold text-indigo-700">{settleModal.pkg.poNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Artikel Produk:</span>
                  <strong className="text-slate-800">{settleModal.pkg.produk} ({settleModal.pkg.brand})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Total Kuantiti:</span>
                  <strong className="text-slate-800">{settleModal.pkg.deliveredPcs} Pcs</strong>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5 mt-1 font-bold text-sm">
                  <span className="text-slate-700">Nominal Gaji Dicairkan:</span>
                  <span className="text-emerald-600 font-black">{formatRp(settleModal.pkg.totalPay)}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tanggal Pembayaran: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={settleForm.tanggalBayar}
                  onChange={(e) => setSettleForm({ ...settleForm, tanggalBayar: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Metode Pembayaran: <span className="text-rose-500">*</span>
                </label>
                <select
                  value={settleForm.metodePembayaran}
                  onChange={(e) => setSettleForm({ ...settleForm, metodePembayaran: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none text-xs cursor-pointer"
                  required
                >
                  <option value="TRANSFER">Transfer Bank (BCA / Mandiri / BNI)</option>
                  <option value="TUNAI">Tunai / Cash</option>
                  <option value="LAINNYA">Lainnya / Cek</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nomor Referensi / Bukti Transfer:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: TRF-BCA-202609-01 atau No Kwitansi"
                  value={settleForm.nomorReferensi}
                  onChange={(e) => setSettleForm({ ...settleForm, nomorReferensi: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan Pembayaran:
                </label>
                <input
                  type="text"
                  placeholder="Keterangan tambahan (opsional)..."
                  value={settleForm.catatan}
                  onChange={(e) => setSettleForm({ ...settleForm, catatan: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSettleModal({ isOpen: false })}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-xs cursor-pointer"
                >
                  Konfirmasi & Simpan Lunas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isInvoiceModalOpen && (
        <InvoiceModal invoice={compositeInvoice} onClose={() => setIsInvoiceModalOpen(false)} />
      )}

      {/* Modal Preview Cetak Invoice Manual Vendor */}
      {previewManualInvoice && (
        <VendorManualInvoiceModal
          invoice={previewManualInvoice}
          onClose={() => setPreviewManualInvoice(null)}
        />
      )}

      {/* Modal Terbitkan / Edit Invoice Manual Vendor */}
      {isCreateManualModalOpen && (
        <CreateManualInvoiceModal
          isOpen={isCreateManualModalOpen}
          onClose={() => {
            setIsCreateManualModalOpen(false);
            setEditingManualInvoice(null);
          }}
          preselectedVendor={selectedVendorName}
          editInvoice={editingManualInvoice}
          onSaved={(savedInv, shouldPrint) => {
            if (shouldPrint) {
              setPreviewManualInvoice(savedInv);
            }
          }}
        />
      )}

    </div>
  );
};
