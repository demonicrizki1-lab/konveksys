import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SlipGajiModal } from './SlipGajiModal';
import { InvoiceModal } from './InvoiceModal';
import { formatRupiahInput, parseRupiahInput, formatDateIndo, getSabtuanPeriod } from '../../utils/formatters';
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
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'payroll' | 'invoice' | 'kasbon'>(
    userRole === 'BRAND' ? 'invoice' : 'payroll'
  );

  React.useEffect(() => {
    if (userRole === 'BRAND') {
      setActiveSubTab('invoice');
    }
  }, [userRole]);

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
    const netPay = Math.max(0, totalGrossPay - kasbonDeduction);

    return {
      vendor: currentPayroll.vendor,
      totalPcs,
      totalGrossPay,
      kasbonDeduction,
      netPay,
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

  // Live Invoice Data for selected brand with active period
  const currentInvoice = calculateBuyerInvoice(
    userRole === 'BRAND' ? activeBrand : selectedBrandName,
    activeStartDate,
    activeEndDate
  );

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
              onClick={() => setActiveSubTab('payroll')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-base btn-press ${
                activeSubTab === 'payroll'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Penggajian Penjahit (Vendor Payroll)
            </button>
          )}

          <button
            onClick={() => setActiveSubTab('invoice')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-base btn-press ${
              activeSubTab === 'invoice'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {userRole === 'BRAND' ? 'Invoice Tagihan Makloon' : 'Invoice Tagihan Buyer (Multi-Size)'}
          </button>

          {userRole === 'ADMIN' && (
            <button
              onClick={() => setActiveSubTab('kasbon')}
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
      {activeSubTab !== 'kasbon' && (
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
                        {poSettlementFilter === 'UNPAID'
                          ? 'Tidak ada item kiriman yang belum lunas.'
                          : poSettlementFilter === 'SETTLED'
                          ? 'Belum ada item kiriman pada riwayat lunas.'
                          : 'Belum ada riwayat surat jalan untuk vendor ini.'}
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

      {/* 2. BUYER INVOICE VIEW */}
      {activeSubTab === 'invoice' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Controls: Select Brand */}
          <div className="lg:col-span-4 bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              {userRole === 'ADMIN' ? 'Pilih Brand Buyer' : 'Brand Client'}
            </h3>

            {userRole === 'ADMIN' ? (
              <div className="space-y-2">
                {brands.map((b) => {
                  const isSelected = selectedBrandName === b.name;
                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBrandName(b.name)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-50/80 border-emerald-500 shadow-sm'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs text-slate-900">{b.name}</div>
                        <div className="text-[10px] text-slate-500">Kontak: {b.contactPerson}</div>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        {b.code}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="font-bold text-emerald-900 text-base">{activeBrand}</div>
                <div className="text-xs text-emerald-700 mt-1">Portal Invoice Resmi</div>
              </div>
            )}

            {/* Total Billing Card */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-700 block border-b border-slate-200 pb-1">
                Kalkulasi Invoice Multi-Size:
              </span>
              <div className="flex justify-between text-slate-600">
                <span>Total Pcs Terkirim:</span>
                <span className="font-bold text-slate-900">{currentInvoice.totalPcs} Pcs</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Jatuh Tempo:</span>
                <span className="font-bold text-rose-600">{currentInvoice.jatuhTempo}</span>
              </div>
              <div className="flex justify-between text-slate-900 border-t border-slate-200 pt-2 font-bold text-sm">
                <span>Total Tagihan:</span>
                <span className="text-emerald-700 text-base">{formatRp(currentInvoice.grandTotal)}</span>
              </div>
            </div>

            <button
              onClick={() => setIsInvoiceModalOpen(true)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition"
            >
              <Printer className="w-4 h-4" />
              Preview & Cetak Invoice Resmi (PDF)
            </button>
          </div>

          {/* Right Table: Multi-size invoice items */}
          <div className="lg:col-span-8 bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Rincian Tagihan Surat Jalan: {userRole === 'BRAND' ? activeBrand : selectedBrandName}
                </h3>
                <span className="text-xs text-slate-400">Pencocokan tarif berdasarkan kelompok Size</span>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                {currentInvoice.invoiceNo}
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">No Surat Jalan</th>
                    <th className="p-3">Artikel Produk</th>
                    <th className="p-3">Rincian Multi-Size</th>
                    <th className="p-3 text-center">Total Pcs</th>
                    <th className="p-3 text-right">Total Tagihan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {currentInvoice.items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        Belum ada kiriman barang untuk Brand ini.
                      </td>
                    </tr>
                  ) : (
                    currentInvoice.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition align-top">
                        <td className="p-3 font-mono font-bold text-indigo-600">{item.suratJalanNo}</td>
                        <td className="p-3 font-bold text-slate-900">{item.produk}</td>
                        <td className="p-3 text-[11px] space-y-0.5">
                          {item.qtyS > 0 && (
                            <div className="text-slate-600">
                              Size S: <strong className="text-slate-800">{item.qtyS} pcs</strong> @ {formatRp(item.rateS)}
                            </div>
                          )}
                          {item.qtyM > 0 && (
                            <div className="text-slate-600">
                              Size M: <strong className="text-slate-800">{item.qtyM} pcs</strong> @ {formatRp(item.rateM)}
                            </div>
                          )}
                          {item.qtyL > 0 && (
                            <div className="text-slate-600">
                              Size L: <strong className="text-slate-800">{item.qtyL} pcs</strong> @ {formatRp(item.rateL)}
                            </div>
                          )}
                          {item.qtyXL > 0 && (
                            <div className="text-slate-600">
                              Size XL: <strong className="text-slate-800">{item.qtyXL} pcs</strong> @ {formatRp(item.rateXL)}
                            </div>
                          )}
                          {item.qtyXXL > 0 && (
                            <div className="text-slate-600">
                              Size 2XL: <strong className="text-slate-800">{item.qtyXXL} pcs</strong> @ {formatRp(item.rateXXL)}
                            </div>
                          )}
                          {!item.qtyS && !item.qtyM && !item.qtyL && (item.qtySML || 0) > 0 && (
                            <div className="text-slate-600">
                              Size Huruf: <strong className="text-slate-800">{item.qtySML} pcs</strong> @ {formatRp(item.rateSML || 0)}
                            </div>
                          )}
                          {item.qtyAnak4 > 0 && (
                            <div className="text-slate-600">
                              Anak 4: <strong className="text-slate-800">{item.qtyAnak4} pcs</strong> @ {formatRp(item.rateAnak4)}
                            </div>
                          )}
                          {item.qtyAnak6 > 0 && (
                            <div className="text-slate-600">
                              Anak 6: <strong className="text-slate-800">{item.qtyAnak6} pcs</strong> @ {formatRp(item.rateAnak6)}
                            </div>
                          )}
                          {item.qtyAnak8 > 0 && (
                            <div className="text-slate-600">
                              Anak 8: <strong className="text-slate-800">{item.qtyAnak8} pcs</strong> @ {formatRp(item.rateAnak8)}
                            </div>
                          )}
                          {item.qtyAnak10 > 0 && (
                            <div className="text-slate-600">
                              Anak 10: <strong className="text-slate-800">{item.qtyAnak10} pcs</strong> @ {formatRp(item.rateAnak10)}
                            </div>
                          )}
                          {item.qtyAnak12 > 0 && (
                            <div className="text-slate-600">
                              Anak 12: <strong className="text-slate-800">{item.qtyAnak12} pcs</strong> @ {formatRp(item.rateAnak12)}
                            </div>
                          )}
                          {item.qtyAnak14 > 0 && (
                            <div className="text-slate-600">
                              Anak 14: <strong className="text-slate-800">{item.qtyAnak14} pcs</strong> @ {formatRp(item.rateAnak14)}
                            </div>
                          )}
                          {item.qtyAnak16 > 0 && (
                            <div className="text-slate-600">
                              Anak 16: <strong className="text-slate-800">{item.qtyAnak16} pcs</strong> @ {formatRp(item.rateAnak16)}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-center font-bold text-slate-800">{item.totalPcs}</td>
                        <td className="p-3 text-right font-bold text-slate-900">{formatRp(item.totalAmount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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
        <InvoiceModal invoice={currentInvoice} onClose={() => setIsInvoiceModalOpen(false)} />
      )}

    </div>
  );
};
