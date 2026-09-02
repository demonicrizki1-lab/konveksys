import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SlipGajiModal } from './SlipGajiModal';
import { InvoiceModal } from './InvoiceModal';
import { formatRupiahInput, parseRupiahInput, formatDateIndo } from '../../utils/formatters';
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
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'payroll' | 'invoice' | 'kasbon'>(
    userRole === 'BRAND' ? 'invoice' : 'payroll'
  );

  React.useEffect(() => {
    if (userRole === 'BRAND') {
      setActiveSubTab('invoice');
    }
  }, [userRole]);

  // Selected Vendor for Payroll
  const [selectedVendorName, setSelectedVendorName] = useState(vendors[0]?.name || 'SAHIRA');

  // Selected Brand for Invoice
  const [selectedBrandName, setSelectedBrandName] = useState(
    userRole === 'BRAND' ? activeBrand : brands[0]?.name || 'GREYWOLF'
  );

  React.useEffect(() => {
    if (userRole === 'BRAND') {
      setSelectedBrandName(activeBrand);
    }
  }, [userRole, activeBrand]);

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

  // Live Payroll Data for selected vendor
  const currentPayroll = calculateVendorPayroll(selectedVendorName);

  // Live Invoice Data for selected brand
  const currentInvoice = calculateBuyerInvoice(
    userRole === 'BRAND' ? activeBrand : selectedBrandName
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
            <h1 className="text-2xl font-bold text-slate-900">Pusat Keuangan & Cetak Tagihan</h1>
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

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-700 block border-b border-slate-200 pb-1">
                Kalkulasi Bersih Siap Bayar:
              </span>
              <div className="flex justify-between text-slate-600">
                <span>Gaji Kotor (Pcs x Tarif):</span>
                <span className="font-bold">{formatRp(currentPayroll.totalGrossPay)}</span>
              </div>
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
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition"
            >
              <Printer className="w-4 h-4" />
              Preview & Cetak Slip Gaji
            </button>
          </div>

          {/* Right Table: Surat Jalan Items for Selected Vendor */}
          <div className="lg:col-span-8 bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Rincian Kiriman Surat Jalan: {selectedVendorName}
                </h3>
                <span className="text-xs text-slate-400">Total {currentPayroll.items.length} transaksi kirim</span>
              </div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                Total {currentPayroll.totalPcs} Pcs
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">No Surat Jalan</th>
                    <th className="p-3">Produk (Brand)</th>
                    <th className="p-3 text-center">Qty Pcs</th>
                    <th className="p-3 text-right">Tarif Auto-Lookup</th>
                    <th className="p-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {currentPayroll.items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        Belum ada riwayat surat jalan untuk vendor ini.
                      </td>
                    </tr>
                  ) : (
                    currentPayroll.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-mono font-bold text-indigo-600">{item.suratJalanNo}</td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{item.produk}</div>
                          <span className="text-[10px] text-slate-400">{item.brand}</span>
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
                <thead className="bg-slate-900 text-white font-bold uppercase text-[10px]">
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
                          {item.qtySML > 0 && (
                            <div className="text-slate-600">
                              S/M/L: <strong className="text-slate-800">{item.qtySML} pcs</strong> @ {formatRp(item.rateSML)}
                            </div>
                          )}
                          {item.qtyXL > 0 && (
                            <div className="text-slate-600">
                              XL/2XL: <strong className="text-slate-800">{item.qtyXL} pcs</strong> @ {formatRp(item.rateXL)}
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
              <thead className="bg-slate-900 text-white font-bold uppercase text-[10px]">
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
        <SlipGajiModal payroll={currentPayroll} onClose={() => setIsSlipModalOpen(false)} />
      )}

      {isInvoiceModalOpen && (
        <InvoiceModal invoice={currentInvoice} onClose={() => setIsInvoiceModalOpen(false)} />
      )}

    </div>
  );
};
