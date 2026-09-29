import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { BuyerInvoiceSummary, BuyerInvoicePoInfo, ProductionPO, PembayaranBrand } from '../../types';
import { formatDateIndo, formatRp } from '../../utils/formatters';
import { resolveItemPONumber } from '../../utils/spkHelper';
import { InvoiceModal } from './InvoiceModal';
import {
  ReceiptText,
  Printer,
  CreditCard,
  Building2,
  FileText,
  CheckCircle2,
  Clock,
  Calendar,
  Package,
  Search,
  Eye,
  Copy,
  Check,
  AlertCircle,
  X,
  Truck,
  Scissors,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

interface BrandInvoiceItem {
  id: string;
  invoiceNo: string;
  poNumber: string;
  po?: ProductionPO;
  produkNames: string[];
  vendorTujuan?: string;
  tanggalTerbit: string;
  jatuhTempo: string;
  isOverdue: boolean;
  targetPcs: number;
  deliveredPcs: number;
  remainingPcs: number;
  grossAmount: number;
  fabricDeduction: number;
  netAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'LUNAS' | 'SEBAGIAN' | 'BELUM_DIBAYAR' | 'PROSES_PRODUKSI';
  linkedSJs: Array<BuyerInvoiceSummary['items'][0] & { itemPo?: string }>;
  linkedRolls: Array<{
    id: string;
    rollCode: string;
    jenisKain: string;
    tanggalMasuk: string;
    meterUsed: number;
    meterLength: number;
    hargaModalMeter: number;
    totalNilaiKain: number;
  }>;
  linkedPayments: PembayaranBrand[];
  invoiceSummary: BuyerInvoiceSummary;
}

interface BrandInvoicePortalProps {
  forcedBrand?: string;
  isAdminPreview?: boolean;
  onExitAdminPreview?: () => void;
}

export const BrandInvoicePortal: React.FC<BrandInvoicePortalProps> = ({
  forcedBrand,
  isAdminPreview = false,
  onExitAdminPreview,
}) => {
  const {
    activeBrand,
    productionPOs,
    suratJalanList,
    getSuratJalanItems,
    getBuyerRates,
    inboundRolls,
    spkList,
    pembayaranList,
    addPembayaran,
    getArusKasSummary,
    setActiveTab,
  } = useApp();

  const brandName = forcedBrand || (activeBrand === 'CREADIVE' ? 'NAMI' : activeBrand) || 'JENAKA KIDS';

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OUTSTANDING' | 'PAID'>('ALL');
  const [selectedInvoiceForDetail, setSelectedInvoiceForDetail] = useState<BrandInvoiceItem | null>(null);
  const [previewInvoiceModal, setPreviewInvoiceModal] = useState<BuyerInvoiceSummary | null>(null);
  const [paymentModalItem, setPaymentModalItem] = useState<BrandInvoiceItem | null>(null);
  const [isCopiedRek, setIsCopiedRek] = useState(false);

  // Form Payment State
  const [paymentForm, setPaymentForm] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    jumlah: 0,
    metode: 'TRANSFER' as const,
    referensiNomor: '',
    keterangan: '',
  });
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Copy rekening BCA
  const handleCopyRekening = () => {
    navigator.clipboard.writeText('3760923906');
    setIsCopiedRek(true);
    setTimeout(() => setIsCopiedRek(false), 2500);
  };

  // 1. Data POs untuk brand ini
  const brandPOs = useMemo(() => {
    return productionPOs.filter(
      (po) => !brandName || (po.brand && po.brand.toLowerCase() === brandName.toLowerCase())
    );
  }, [productionPOs, brandName]);

  // 2. Data Surat Jalan untuk brand ini
  const brandSJs = useMemo(() => {
    return suratJalanList.filter((sj) => {
      const sjItems = getSuratJalanItems(sj);
      return (
        sj.brand === brandName ||
        (sj.brand && sj.brand.split(',').map((b) => b.trim()).includes(brandName)) ||
        sjItems.some((it) => it.brand === brandName)
      );
    });
  }, [suratJalanList, brandName, getSuratJalanItems]);

  // 3. Flatten SJ Items dengan PO Link
  const allBrandSjItems = useMemo(() => {
    const list: Array<BuyerInvoiceSummary['items'][0] & { itemPo?: string }> = [];

    brandSJs.forEach((sj) => {
      const sjItems = getSuratJalanItems(sj);
      sjItems.forEach((it) => {
        const itBrand = it.brand || sj.brand;
        if (itBrand !== brandName && (!itBrand || !itBrand.split(',').map((b) => b.trim()).includes(brandName))) {
          return;
        }

        const rates = getBuyerRates(brandName, it.produk);
        const qtyS = it.qtyDelivered?.s || 0;
        const qtyM = it.qtyDelivered?.m || 0;
        const qtyL = it.qtyDelivered?.l || 0;
        const qtyXL = it.qtyDelivered?.xl || 0;
        const qtyXXL = it.qtyDelivered?.xxl || 0;
        const qtySML = qtyS + qtyM + qtyL;
        const qtyAnak4 = it.qtyDelivered?.anak4 || 0;
        const qtyAnak6 = it.qtyDelivered?.anak6 || 0;
        const qtyAnak8 = it.qtyDelivered?.anak8 || 0;
        const qtyAnak10 = it.qtyDelivered?.anak10 || 0;
        const qtyAnak12 = it.qtyDelivered?.anak12 || 0;
        const qtyAnak14 = it.qtyDelivered?.anak14 || 0;
        const qtyAnak16 = it.qtyDelivered?.anak16 || 0;

        const subS = qtyS * rates.rateS;
        const subM = qtyM * rates.rateM;
        const subL = qtyL * rates.rateL;
        const subXL = qtyXL * rates.rateXL;
        const subXXL = qtyXXL * rates.rateXXL;
        const subAnak4 = qtyAnak4 * rates.rateAnak4;
        const subAnak6 = qtyAnak6 * rates.rateAnak6;
        const subAnak8 = qtyAnak8 * rates.rateAnak8;
        const subAnak10 = qtyAnak10 * rates.rateAnak10;
        const subAnak12 = qtyAnak12 * rates.rateAnak12;
        const subAnak14 = qtyAnak14 * rates.rateAnak14;
        const subAnak16 = qtyAnak16 * rates.rateAnak16;

        const totalAmount =
          subS + subM + subL + subXL + subXXL + subAnak4 + subAnak6 + subAnak8 + subAnak10 + subAnak12 + subAnak14 + subAnak16;

        list.push({
          suratJalanNo: sj.noSuratJalan,
          tanggal: sj.tanggal,
          produk: it.produk,
          jenisKain: it.jenisKain,
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
          totalPcs: it.totalPcs,
          totalAmount,
          itemPo: resolveItemPONumber(it, spkList, sj, productionPOs) || undefined,
        });
      });
    });

    return list;
  }, [brandSJs, brandName, getSuratJalanItems, getBuyerRates, spkList, productionPOs]);

  // 4. Inbound Rolls terpakai untuk Brand ini
  const brandRolls = useMemo(() => {
    return inboundRolls.filter((r) => {
      return !brandName || (r.brand && r.brand.toLowerCase() === brandName.toLowerCase());
    });
  }, [inboundRolls, brandName]);

  // 5. Pembayaran Brand
  const brandPayments = useMemo(() => {
    return (pembayaranList || []).filter(
      (p) => p.brand && p.brand.toLowerCase() === brandName.toLowerCase()
    );
  }, [pembayaranList, brandName]);

  // 6. Build Daftar Invoice Resmi per PO
  const invoiceList = useMemo((): BrandInvoiceItem[] => {
    const list: BrandInvoiceItem[] = [];
    const todayStr = new Date().toISOString().split('T')[0];

    // Buat invoice untuk tiap PO
    brandPOs.forEach((po) => {
      const linkedSJs = allBrandSjItems.filter(
        (it) => it.itemPo === po.noPO || (!it.itemPo && brandPOs.length === 1)
      );

      const targetPcs = po.totalPcs || (po.items || []).reduce((s, it) => s + (it.qty || 0), 0);
      const deliveredPcs = linkedSJs.reduce((s, it) => s + (it.totalPcs || 0), 0);
      const remainingPcs = Math.max(0, targetPcs - deliveredPcs);
      const grossAmount = linkedSJs.reduce((s, it) => s + (it.totalAmount || 0), 0);

      // Fabric deduction linked to this PO
      const linkedRolls = brandRolls
        .filter((r) => r.sourcePONumber === po.noPO)
        .map((r) => {
          const meterUsed = r.meterUsed > 0 ? r.meterUsed : r.meterLength;
          const totalNilaiKain = meterUsed * (r.hargaModalMeter || 0);
          return {
            id: r.id,
            rollCode: r.rollCode || r.id,
            jenisKain: r.jenisKain || 'Kain',
            tanggalMasuk: r.tanggalMasuk || po.tanggalPO,
            meterUsed,
            meterLength: r.meterLength,
            hargaModalMeter: r.hargaModalMeter || 0,
            totalNilaiKain,
          };
        });

      const fabricDeduction = linkedRolls.reduce((s, r) => s + r.totalNilaiKain, 0);
      const netAmount = Math.max(0, grossAmount - fabricDeduction);

      // Payments yang secara eksplisit mencantumkan nomor PO ini
      const directPayments = brandPayments.filter((p) => {
        const ref = (p.referensiNomor || '').toLowerCase();
        const ket = (p.keterangan || '').toLowerCase();
        const poKey = po.noPO.toLowerCase();
        return ref.includes(poKey) || ket.includes(poKey);
      });
      const directPaid = directPayments.reduce((s, p) => s + p.jumlah, 0);

      const cleanPoPart = po.noPO.replace(/^PO-/, '').replace(/[^A-Za-z0-9]/g, '');
      const invoiceNo = `INV/${brandName.replace(/\s+/g, '')}/${cleanPoPart}`;
      const produkNames = Array.from(new Set((po.items || []).map((it) => it.namaProduk).filter(Boolean)));

      // Jatuh tempo: 7 hari setelah target PO atau delivery terakhir
      const jatuhTempo = po.targetDeadline || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      const isOverdue = jatuhTempo < todayStr && netAmount > directPaid;

      // Status
      let status: BrandInvoiceItem['status'] = 'BELUM_DIBAYAR';
      if (netAmount === 0 && deliveredPcs === 0) {
        status = 'PROSES_PRODUKSI';
      } else if (directPaid >= netAmount && netAmount > 0) {
        status = 'LUNAS';
      } else if (directPaid > 0) {
        status = 'SEBAGIAN';
      } else {
        status = 'BELUM_DIBAYAR';
      }

      const poInfo: BuyerInvoicePoInfo = {
        id: po.id,
        noPO: po.noPO,
        selectedPoNumbers: [po.noPO],
        brand: brandName,
        vendorTujuan: po.vendorTujuan,
        tanggalPO: po.tanggalPO,
        targetDeadline: po.targetDeadline,
        targetPcs,
        totalTargetPcs: targetPcs,
        totalDeliveredPcs: deliveredPcs,
        totalRemainingPcs: remainingPcs,
        pos: [
          {
            id: po.id,
            noPO: po.noPO,
            vendorTujuan: po.vendorTujuan,
            tanggalPO: po.tanggalPO,
            targetDeadline: po.targetDeadline,
            targetPcs,
            status: po.status,
          },
        ],
        items: (po.items || []).map((it) => ({
          poNumber: po.noPO,
          namaProduk: it.namaProduk,
          warna: it.warna,
          ukuran: it.ukuran,
          qty: it.qty,
          bahanKain: it.bahanKain,
          catatan: it.catatan,
        })),
      };

      const invoiceSummary: BuyerInvoiceSummary = {
        brand: brandName,
        invoiceNo,
        tanggal: po.tanggalPO || todayStr,
        jatuhTempo,
        poInfo,
        items: linkedSJs,
        totalPcs: deliveredPcs,
        subtotalGross: grossAmount,
        fabricItems: linkedRolls,
        totalFabricMeters: linkedRolls.reduce((s, r) => s + r.meterUsed, 0),
        totalFabricDeduction: fabricDeduction,
        grandTotal: netAmount,
      };

      list.push({
        id: po.id || po.noPO,
        invoiceNo,
        poNumber: po.noPO,
        po,
        produkNames: produkNames.length > 0 ? produkNames : ['Produk Makloon'],
        vendorTujuan: po.vendorTujuan || 'Workshop',
        tanggalTerbit: po.tanggalPO || todayStr,
        jatuhTempo,
        isOverdue,
        targetPcs,
        deliveredPcs,
        remainingPcs,
        grossAmount,
        fabricDeduction,
        netAmount,
        paidAmount: directPaid,
        remainingAmount: Math.max(0, netAmount - directPaid),
        status,
        linkedSJs,
        linkedRolls,
        linkedPayments: directPayments,
        invoiceSummary,
      });
    });

    // Cek apakah ada SJ yang tidak terikat ke PO manapun
    const unlinkedSJs = allBrandSjItems.filter((it) => !it.itemPo && brandPOs.length > 1);
    if (unlinkedSJs.length > 0) {
      const deliveredPcs = unlinkedSJs.reduce((s, it) => s + (it.totalPcs || 0), 0);
      const grossAmount = unlinkedSJs.reduce((s, it) => s + (it.totalAmount || 0), 0);
      const invoiceNo = `INV/${brandName.replace(/\s+/g, '')}/REGULER`;
      const jatuhTempo = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

      const invoiceSummary: BuyerInvoiceSummary = {
        brand: brandName,
        invoiceNo,
        tanggal: unlinkedSJs[0]?.tanggal || todayStr,
        jatuhTempo,
        items: unlinkedSJs,
        totalPcs: deliveredPcs,
        subtotalGross: grossAmount,
        grandTotal: grossAmount,
      };

      list.push({
        id: 'unlinked-sj-batch',
        invoiceNo,
        poNumber: 'Pengiriman Reguler / Non-PO',
        produkNames: Array.from(new Set(unlinkedSJs.map((it) => it.produk))),
        vendorTujuan: 'Maison Rayyan',
        tanggalTerbit: unlinkedSJs[0]?.tanggal || todayStr,
        jatuhTempo,
        isOverdue: jatuhTempo < todayStr && grossAmount > 0,
        targetPcs: deliveredPcs,
        deliveredPcs,
        remainingPcs: 0,
        grossAmount,
        fabricDeduction: 0,
        netAmount: grossAmount,
        paidAmount: 0,
        remainingAmount: grossAmount,
        status: grossAmount > 0 ? 'BELUM_DIBAYAR' : 'PROSES_PRODUKSI',
        linkedSJs: unlinkedSJs,
        linkedRolls: [],
        linkedPayments: [],
        invoiceSummary,
      });
    }

    return list;
  }, [brandPOs, allBrandSjItems, brandRolls, brandPayments, brandName]);

  // 7. Master Composite Invoice (Semua Surat Jalan Berjalan)
  const masterCompositeInvoice = useMemo((): BuyerInvoiceSummary => {
    const todayStr = new Date().toISOString().split('T')[0];
    const jatuhTempo = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const now = new Date();
    const invoiceNo = `INV/${brandName.toUpperCase()}/${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}/ALL`;

    const totalDelivered = allBrandSjItems.reduce((s, it) => s + (it.totalPcs || 0), 0);
    const grossTotal = allBrandSjItems.reduce((s, it) => s + (it.totalAmount || 0), 0);

    const fabricRolls = brandRolls.map((r) => {
      const meterUsed = r.meterUsed > 0 ? r.meterUsed : r.meterLength;
      const totalNilaiKain = meterUsed * (r.hargaModalMeter || 0);
      return {
        id: r.id,
        rollCode: r.rollCode || r.id,
        jenisKain: r.jenisKain || 'Kain',
        tanggalMasuk: r.tanggalMasuk || todayStr,
        meterUsed,
        meterLength: r.meterLength,
        hargaModalMeter: r.hargaModalMeter || 0,
        totalNilaiKain,
      };
    });

    const totalFabricDeduction = fabricRolls.reduce((s, r) => s + r.totalNilaiKain, 0);
    const grandTotal = Math.max(0, grossTotal - totalFabricDeduction);

    return {
      brand: brandName,
      invoiceNo,
      tanggal: todayStr,
      jatuhTempo,
      items: allBrandSjItems,
      totalPcs: totalDelivered,
      subtotalGross: grossTotal,
      fabricItems: fabricRolls,
      totalFabricMeters: fabricRolls.reduce((s, r) => s + r.meterUsed, 0),
      totalFabricDeduction,
      grandTotal,
    };
  }, [brandName, allBrandSjItems, brandRolls]);

  // 8. Ringkasan Finansial Brand
  const arusKasSummaryList = getArusKasSummary();
  const brandArusKas = arusKasSummaryList.find((s) => s.brand === brandName);

  const totalTagihanAll = invoiceList.reduce((s, inv) => s + inv.netAmount, 0);
  const totalPaidAll = brandPayments.reduce((s, p) => s + p.jumlah, 0);
  const totalOutstandingAll = brandArusKas
    ? brandArusKas.outstanding
    : Math.max(0, totalTagihanAll - totalPaidAll);

  // Cari jatuh tempo terdekat dari invoice yang belum lunas
  const nearestDueDate = useMemo(() => {
    const outstandingInvs = invoiceList.filter((inv) => inv.remainingAmount > 0 || inv.status === 'BELUM_DIBAYAR');
    if (outstandingInvs.length === 0) return null;
    const sorted = [...outstandingInvs].sort((a, b) => a.jatuhTempo.localeCompare(b.jatuhTempo));
    return sorted[0]?.jatuhTempo || null;
  }, [invoiceList]);

  // 9. Filter & Search
  const filteredInvoices = useMemo(() => {
    return invoiceList.filter((inv) => {
      // Filter Status
      if (statusFilter === 'OUTSTANDING' && (inv.status === 'LUNAS' || inv.netAmount === 0)) {
        return false;
      }
      if (statusFilter === 'PAID' && inv.status !== 'LUNAS') {
        return false;
      }

      // Filter Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNo = inv.invoiceNo.toLowerCase().includes(q);
        const matchPO = inv.poNumber.toLowerCase().includes(q);
        const matchProd = inv.produkNames.some((p) => p.toLowerCase().includes(q));
        const matchVendor = (inv.vendorTujuan || '').toLowerCase().includes(q);
        if (!matchNo && !matchPO && !matchProd && !matchVendor) {
          return false;
        }
      }

      return true;
    });
  }, [invoiceList, statusFilter, searchQuery]);

  // Handle Submit Pembayaran Cepat
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalItem || paymentForm.jumlah <= 0) return;

    setIsSubmittingPayment(true);
    try {
      const keteranganLengkap = paymentForm.keterangan.trim()
        ? `${paymentForm.keterangan} (Ref: ${paymentModalItem.invoiceNo} / ${paymentModalItem.poNumber})`
        : `Pembayaran ${paymentModalItem.invoiceNo} [${paymentModalItem.poNumber}]`;

      await addPembayaran({
        brand: brandName,
        tanggal: paymentForm.tanggal,
        jumlah: paymentForm.jumlah,
        metode: paymentForm.metode,
        referensiNomor: paymentForm.referensiNomor || `TRF-${Date.now().toString().slice(-6)}`,
        keterangan: keteranganLengkap,
      });

      setPaymentModalItem(null);
      setPaymentForm({
        tanggal: new Date().toISOString().split('T')[0],
        jumlah: 0,
        metode: 'TRANSFER',
        referensiNomor: '',
        keterangan: '',
      });
    } catch (err) {
      console.error('Gagal mencatat pembayaran:', err);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const openPaymentModal = (inv: BrandInvoiceItem) => {
    setPaymentModalItem(inv);
    setPaymentForm({
      tanggal: new Date().toISOString().split('T')[0],
      jumlah: inv.remainingAmount > 0 ? inv.remainingAmount : inv.netAmount,
      metode: 'TRANSFER',
      referensiNomor: '',
      keterangan: `Pelunasan tagihan ${inv.invoiceNo}`,
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Admin Preview Header Banner */}
      {isAdminPreview && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between shadow-sm border border-amber-600">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-slate-950" />
            <span>
              Mode Pratinjau Portal Brand: <u>{brandName}</u> (Tampilan ini persis seperti yang dilihat oleh klien)
            </span>
          </div>
          {onExitAdminPreview && (
            <button
              onClick={onExitAdminPreview}
              className="px-3 py-1 bg-slate-950 text-white hover:bg-slate-800 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Kembali ke Mode Admin
            </button>
          )}
        </div>
      )}

      {/* Top Welcome & Billing Portal Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <ReceiptText className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Tagihan & Invoice Resmi
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-full">
                  {brandName}
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Pusat monitoring tagihan makloon, dokumen invoice resmi, dan riwayat pembayaran Anda.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setPreviewInvoiceModal(masterCompositeInvoice)}
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
            title="Cetak satu invoice gabungan untuk seluruh pengiriman barang berjalan"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Invoice Gabungan</span>
          </button>

          <button
            onClick={() => setActiveTab('arus-kas')}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            title="Buka tab riwayat mutasi arus kas"
          >
            <TrendingUp className="w-4 h-4 text-slate-600" />
            <span>Riwayat Pembayaran Saya</span>
          </button>
        </div>
      </div>

      {/* Top Financial Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Menunggu Pembayaran */}
        <div className={`p-5 rounded-2xl border transition shadow-xs ${
          totalOutstandingAll > 0
            ? 'bg-amber-50/70 border-amber-200/90'
            : 'bg-emerald-50/70 border-emerald-200/90'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Belum Dibayar
            </span>
            <span className={`p-2 rounded-xl ${
              totalOutstandingAll > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className={`text-2xl font-bold tracking-tight tabular-nums ${
              totalOutstandingAll > 0 ? 'text-amber-900' : 'text-emerald-900'
            }`}>
              {formatRp(totalOutstandingAll)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
              {totalOutstandingAll > 0 ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>Ada tagihan berjalan perlu diselesaikan</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Semua tagihan lunas</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Jatuh Tempo Terdekat */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Jatuh Tempo Terdekat
            </span>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {nearestDueDate ? formatDateIndo(nearestDueDate) : 'Tidak Ada'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {nearestDueDate ? 'Batas waktu transfer invoice aktif' : 'Semua invoice beres'}
            </div>
          </div>
        </div>

        {/* Card 3: Total Sudah Dibayar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Sudah Dibayar
            </span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold tabular-nums text-emerald-700 tracking-tight">
              {formatRp(totalPaidAll)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Akumulasi pembayaran yang telah terverifikasi
            </div>
          </div>
        </div>

        {/* Card 4: Total Nilai Pesanan / Tagihan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Akumulasi Tagihan
            </span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold tabular-nums text-indigo-950 tracking-tight">
              {formatRp(totalTagihanAll)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {invoiceList.length} Invoice PO Terdaftar
            </div>
          </div>
        </div>
      </div>

      {/* Official Bank Account Information Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 text-white">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-indigo-200 font-semibold uppercase tracking-wider">
              Rekening Resmi Pembayaran Makloon
            </div>
            <div className="text-base font-bold flex items-center gap-2 mt-0.5">
              <span>BCA :</span>
              <span className="text-lg font-bold tracking-wider text-white tabular-nums">3760923906</span>
              <span className="text-xs text-indigo-200 font-medium">a/n Cecep Dayat</span>
            </div>
            <div className="text-[11px] text-slate-300 mt-0.5">
              Maison Rayyan Manufacturing • Sertakan nomor invoice / nomor PO pada berita transfer bank.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyRekening}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            {isCopiedRek ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{isCopiedRek ? 'No Rekening Disalin!' : 'Salin Nomor Rekening'}</span>
          </button>
        </div>
      </div>

      {/* Main Invoices Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Tagihan ({invoiceList.length})
            </button>
            <button
              onClick={() => setStatusFilter('OUTSTANDING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'OUTSTANDING'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Perlu Dibayar</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20">
                {invoiceList.filter((i) => i.status !== 'LUNAS' && i.netAmount > 0).length}
              </span>
            </button>
            <button
              onClick={() => setStatusFilter('PAID')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'PAID'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Riwayat Lunas</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20">
                {invoiceList.filter((i) => i.status === 'LUNAS').length}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari No Invoice, PO, atau artikel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-indigo-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Invoice Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">Dokumen & Invoice</th>
                <th className="p-3.5">Rujukan PO & Artikel</th>
                <th className="p-3.5">Kuantiti Barang (Pcs)</th>
                <th className="p-3.5 text-right">Nilai Tagihan Bersih</th>
                <th className="p-3.5 text-center">Status Pembayaran</th>
                <th className="p-3.5 text-center w-36">Aksi Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600 text-sm">Tidak ada tagihan yang sesuai filter</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Semua tagihan atau pencarian Anda saat ini tidak memiliki data.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition align-top">
                    {/* 1. Dokumen & Tanggal */}
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{inv.invoiceNo}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Terbit: {formatDateIndo(inv.tanggalTerbit)}</span>
                      </div>
                      <div className={`text-[10px] mt-0.5 font-semibold flex items-center gap-1 ${
                        inv.isOverdue ? 'text-rose-600' : 'text-slate-500'
                      }`}>
                        <Clock className="w-3 h-3" />
                        <span>Jatuh Tempo: {formatDateIndo(inv.jatuhTempo)}</span>
                      </div>
                    </td>

                    {/* 2. Rujukan PO & Artikel */}
                    <td className="p-3.5">
                      <div className="font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded text-[10.5px] inline-block tracking-tight">
                        {inv.poNumber}
                      </div>
                      <div className="font-bold text-slate-900 text-xs mt-1">
                        {inv.produkNames.join(', ')}
                      </div>
                      <div className="text-[10.5px] text-slate-500 mt-0.5">
                        Workshop: <span className="font-medium text-slate-700">{inv.vendorTujuan}</span>
                      </div>
                    </td>

                    {/* 3. Kuantiti Barang */}
                    <td className="p-3.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 tabular-nums">
                          {inv.deliveredPcs.toLocaleString('id-ID')} Pcs Terkirim
                        </span>
                        <span className="text-[10px] text-slate-400 tabular-nums">
                          Target: {inv.targetPcs.toLocaleString('id-ID')}
                        </span>
                      </div>
                      {/* Delivery Progress Bar */}
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, inv.targetPcs > 0 ? (inv.deliveredPcs / inv.targetPcs) * 100 : 0)}%`,
                          }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5">
                        <Truck className="w-3 h-3 text-slate-400" />
                        <span>{inv.linkedSJs.length} Surat Jalan Pengiriman</span>
                      </div>
                    </td>

                    {/* 4. Nilai Tagihan Bersih */}
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="font-bold tabular-nums text-slate-900 text-sm">
                        {formatRp(inv.netAmount)}
                      </div>
                      {inv.fabricDeduction > 0 && (
                        <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                          Potongan Kain: -{formatRp(inv.fabricDeduction)}
                        </div>
                      )}
                      {inv.remainingAmount > 0 && inv.status === 'SEBAGIAN' && (
                        <div className="text-[10px] text-amber-700 font-bold mt-0.5 bg-amber-50 px-1.5 py-0.2 rounded inline-block">
                          Sisa: {formatRp(inv.remainingAmount)}
                        </div>
                      )}
                    </td>

                    {/* 5. Status Pembayaran */}
                    <td className="p-3.5 text-center whitespace-nowrap">
                      {inv.status === 'LUNAS' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          LUNAS
                        </span>
                      )}
                      {inv.status === 'SEBAGIAN' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-black bg-blue-100 text-blue-800 border border-blue-200">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          SEBAGIAN
                        </span>
                      )}
                      {inv.status === 'BELUM_DIBAYAR' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          BELUM LUNAS
                        </span>
                      )}
                      {inv.status === 'PROSES_PRODUKSI' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                          PROSES JAHIT
                        </span>
                      )}
                    </td>

                    {/* 6. Aksi Dokumen */}
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoiceForDetail(inv)}
                          title="Lihat Rincian Tagihan & Surat Jalan"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setPreviewInvoiceModal(inv.invoiceSummary)}
                          title="Cetak / Download PDF Invoice Resmi"
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {inv.status !== 'LUNAS' && inv.netAmount > 0 && (
                          <button
                            type="button"
                            onClick={() => openPaymentModal(inv)}
                            title="Konfirmasi Pembayaran Transfer"
                            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition cursor-pointer"
                          >
                            <CreditCard className="w-4 h-4" />
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

      {/* MODAL 1: DETAIL RINCIAN TAGIHAN (NON-EDITABLE BRAND VIEW) */}
      {selectedInvoiceForDetail && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-slideUp overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <FileText className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span>Rincian Tagihan Invoice:</span>
                    <span className="font-bold text-indigo-700">{selectedInvoiceForDetail.invoiceNo}</span>
                  </h3>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Rujukan: {selectedInvoiceForDetail.poNumber} • {selectedInvoiceForDetail.produkNames.join(', ')}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedInvoiceForDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Summary 4-Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Tanggal Terbit</span>
                  <span className="font-bold text-slate-900">{formatDateIndo(selectedInvoiceForDetail.tanggalTerbit)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Jatuh Tempo</span>
                  <span className={`font-bold ${selectedInvoiceForDetail.isOverdue ? 'text-rose-600' : 'text-slate-900'}`}>
                    {formatDateIndo(selectedInvoiceForDetail.jatuhTempo)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Terkirim</span>
                  <span className="font-bold text-slate-900 tabular-nums">
                    {selectedInvoiceForDetail.deliveredPcs.toLocaleString('id-ID')} / {selectedInvoiceForDetail.targetPcs.toLocaleString('id-ID')} Pcs
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Tagihan Bersih</span>
                  <span className="font-bold text-emerald-700 tabular-nums text-sm">
                    {formatRp(selectedInvoiceForDetail.netAmount)}
                  </span>
                </div>
              </div>

              {/* Rincian Surat Jalan */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-indigo-600" />
                    <span>Daftar Surat Jalan Pengiriman ({selectedInvoiceForDetail.linkedSJs.length})</span>
                  </h4>
                  <span className="font-bold text-indigo-700 tabular-nums">
                    Subtotal: {formatRp(selectedInvoiceForDetail.grossAmount)}
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[9.5px]">
                      <tr>
                        <th className="p-2.5">No Surat Jalan</th>
                        <th className="p-2.5">Tanggal</th>
                        <th className="p-2.5">Artikel Produk</th>
                        <th className="p-2.5 text-center">Pcs</th>
                        <th className="p-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedInvoiceForDetail.linkedSJs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-400">
                            Belum ada pengiriman barang yang dicatat untuk PO ini.
                          </td>
                        </tr>
                      ) : (
                        selectedInvoiceForDetail.linkedSJs.map((sj, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-indigo-600">{sj.suratJalanNo}</td>
                            <td className="p-2.5 text-slate-500">{formatDateIndo(sj.tanggal)}</td>
                            <td className="p-2.5 font-bold text-slate-900">{sj.produk}</td>
                            <td className="p-2.5 text-center font-bold tabular-nums">{sj.totalPcs}</td>
                            <td className="p-2.5 text-right font-bold tabular-nums text-slate-900">{formatRp(sj.totalAmount)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Rincian Potongan Kain (Jika Ada) */}
              {selectedInvoiceForDetail.linkedRolls.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-rose-700">
                      <Scissors className="w-4 h-4 text-rose-600" />
                      <span>Potongan Nilai Kain Terpakai ({selectedInvoiceForDetail.linkedRolls.length} Rol)</span>
                    </h4>
                    <span className="font-bold text-rose-700 tabular-nums">
                      -{formatRp(selectedInvoiceForDetail.fabricDeduction)}
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-rose-200">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-rose-50 text-rose-800 font-bold uppercase text-[9.5px]">
                        <tr>
                          <th className="p-2.5">Kode Rol</th>
                          <th className="p-2.5">Jenis Kain</th>
                          <th className="p-2.5 text-center">Panjang Terpakai</th>
                          <th className="p-2.5 text-right">Potongan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rose-100">
                        {selectedInvoiceForDetail.linkedRolls.map((r, idx) => (
                          <tr key={idx}>
                            <td className="p-2.5 font-bold text-rose-900">{r.rollCode}</td>
                            <td className="p-2.5 text-slate-700">{r.jenisKain}</td>
                            <td className="p-2.5 text-center font-medium tabular-nums">{r.meterUsed} m</td>
                            <td className="p-2.5 text-right font-bold text-rose-700 tabular-nums">
                              -{formatRp(r.totalNilaiKain)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Petunjuk Rekening Pembayaran */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
                  Informasi Rekening Pembayaran Resmi:
                </span>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">BCA 3760923906</span>
                    <span className="text-slate-500 text-xs block">a/n Cecep Dayat (Maison Rayyan Manufacturing)</span>
                  </div>
                  <button
                    onClick={handleCopyRekening}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-semibold text-slate-700 text-xs flex items-center gap-1.5 transition self-start cursor-pointer"
                  >
                    {isCopiedRek ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopiedRek ? 'Disalin!' : 'Salin Rekening'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/80">
              <button
                type="button"
                onClick={() => setSelectedInvoiceForDetail(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>

              <div className="flex items-center gap-2">
                {selectedInvoiceForDetail.status !== 'LUNAS' && selectedInvoiceForDetail.netAmount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const item = selectedInvoiceForDetail;
                      setSelectedInvoiceForDetail(null);
                      openPaymentModal(item);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Konfirmasi Pembayaran</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const inv = selectedInvoiceForDetail.invoiceSummary;
                    setSelectedInvoiceForDetail(null);
                    setPreviewInvoiceModal(inv);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / Download PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: KONFIRMASI PEMBAYARAN TRANSFER CEPAT */}
      {paymentModalItem && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 animate-slideUp overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-indigo-50/70">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <CreditCard className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Konfirmasi Pembayaran Transfer</h3>
                  <div className="text-[11px] text-slate-500 font-medium">{paymentModalItem.invoiceNo}</div>
                </div>
              </div>
              <button
                onClick={() => setPaymentModalItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-5 space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Nomor PO:</span>
                  <span className="font-bold text-slate-800">{paymentModalItem.poNumber}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Total Tagihan:</span>
                  <span className="font-bold tabular-nums text-slate-800">{formatRp(paymentModalItem.netAmount)}</span>
                </div>
                <div className="flex justify-between text-indigo-700 font-bold border-t border-slate-200 pt-1 mt-1">
                  <span>Sisa Wajib Bayar:</span>
                  <span className="font-bold tabular-nums text-sm">{formatRp(paymentModalItem.remainingAmount)}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Rekening Tujuan Transfer:
                </label>
                <input
                  type="text"
                  disabled
                  value="BCA 3760923906 a/n Cecep Dayat"
                  className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tanggal Transfer: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={paymentForm.tanggal}
                  onChange={(e) => setPaymentForm({ ...paymentForm, tanggal: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none text-xs focus:bg-white focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nominal Pembayaran (Rp): <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={paymentForm.jumlah || ''}
                  onChange={(e) => setPaymentForm({ ...paymentForm, jumlah: Number(e.target.value) || 0 })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold tabular-nums text-slate-900 outline-none text-sm focus:bg-white focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nomor Referensi / ID Transaksi Bank:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: TRF-BCA-202609-01 atau No Bukti"
                  value={paymentForm.referensiNomor}
                  onChange={(e) => setPaymentForm({ ...paymentForm, referensiNomor: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none text-xs focus:bg-white focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan Pembayaran:
                </label>
                <input
                  type="text"
                  placeholder="Keterangan transfer (opsional)..."
                  value={paymentForm.keterangan}
                  onChange={(e) => setPaymentForm({ ...paymentForm, keterangan: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none text-xs focus:bg-white focus:border-indigo-500 transition"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPaymentModalItem(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isSubmittingPayment ? (
                    <span>Menyimpan...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Kirim Konfirmasi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CETAK / DOWNLOAD PDF RESMI */}
      {previewInvoiceModal && (
        <InvoiceModal
          invoice={previewInvoiceModal}
          onClose={() => setPreviewInvoiceModal(null)}
        />
      )}
    </div>
  );
};
