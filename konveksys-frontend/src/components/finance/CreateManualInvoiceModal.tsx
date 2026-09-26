import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { VendorManualInvoice, VendorManualInvoiceCategory, VendorManualInvoiceItem } from '../../types';
import { formatRupiahInput, parseRupiahInput } from '../../utils/formatters';
import { X, Plus, Trash2, ReceiptText, Building2, CheckCircle2, Package, Sparkles } from 'lucide-react';

interface CreateManualInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedVendor?: string;
  onSaved?: (invoice: VendorManualInvoice, shouldPrint: boolean) => void;
  editInvoice?: VendorManualInvoice | null;
}

export const CreateManualInvoiceModal: React.FC<CreateManualInvoiceModalProps> = ({
  isOpen,
  onClose,
  preselectedVendor,
  onSaved,
  editInvoice,
}) => {
  const {
    vendors,
    productionPOs,
    spkList,
    createVendorManualInvoice,
    updateVendorManualInvoice,
    vendorManualInvoices,
  } = useApp();

  const [vendor, setVendor] = useState(editInvoice?.vendor || preselectedVendor || vendors[0]?.name || 'BU NIKEN');
  const [invoiceNo, setInvoiceNo] = useState(editInvoice?.invoiceNo || '');
  const [tanggal, setTanggal] = useState(editInvoice?.tanggal || new Date().toISOString().split('T')[0]);
  const [tanggalBayar, setTanggalBayar] = useState(editInvoice?.tanggalBayar || new Date().toISOString().split('T')[0]);
  const [kategori, setKategori] = useState<VendorManualInvoiceCategory>(editInvoice?.kategori || 'DP_ONGKOS_JAHIT');
  const [selectedPoNumber, setSelectedPoNumber] = useState(editInvoice?.poNumber || '');
  const [brand, setBrand] = useState(editInvoice?.brand || '');
  const [produk, setProduk] = useState(editInvoice?.produk || '');
  const [keterangan, setKeterangan] = useState(editInvoice?.keterangan || '');
  
  // Single nominal or detailed items
  const [isDetailed, setIsDetailed] = useState(Boolean(editInvoice?.items && editInvoice.items.length > 1));
  const [singleNominal, setSingleNominal] = useState(
    editInvoice?.totalNominal ? formatRupiahInput(editInvoice.totalNominal.toString()) : ''
  );
  const [items, setItems] = useState<VendorManualInvoiceItem[]>(
    editInvoice?.items && editInvoice.items.length > 0
      ? editInvoice.items
      : [
          {
            id: 'item-1',
            deskripsi: 'DP Ongkos Jahit Sebelum Kirim',
            qty: 100,
            satuan: 'Pcs',
            hargaSatuan: 3000,
            subtotal: 300000,
          },
        ]
  );

  const [metodePembayaran, setMetodePembayaran] = useState<'TRANSFER' | 'TUNAI' | 'CEK' | 'GIRO'>(
    editInvoice?.metodePembayaran || 'TRANSFER'
  );
  const [bankTujuan, setBankTujuan] = useState(editInvoice?.bankTujuan || 'BCA');
  const [nomorRekening, setNomorRekening] = useState(editInvoice?.nomorRekening || '');
  const [namaRekening, setNamaRekening] = useState(editInvoice?.namaRekening || '');
  const [referensiTransfer, setReferensiTransfer] = useState(editInvoice?.referensiTransfer || '');
  const [status, setStatus] = useState<'DIBAYAR' | 'PENDING'>(editInvoice?.status === 'PENDING' ? 'PENDING' : 'DIBAYAR');
  const [potongDiSlipGaji, setPotongDiSlipGaji] = useState(
    editInvoice !== undefined && editInvoice !== null ? editInvoice.potongDiSlipGaji : true
  );
  const [catatan, setCatatan] = useState(editInvoice?.catatan || '');

  // Auto-generate invoice number if empty
  useEffect(() => {
    if (!editInvoice && !invoiceNo) {
      const now = new Date();
      const yymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
      const safeVendor = (vendor || 'VND').replace(/[^a-zA-Z0-9]/g, '').substring(0, 5).toUpperCase();
      const count = (vendorManualInvoices || []).length + 1;
      const nextNo = `INV-MAN/${safeVendor}/${yymm}/${String(count).padStart(3, '0')}`;
      setInvoiceNo(nextNo);
    }
  }, [vendor, editInvoice, vendorManualInvoices, invoiceNo]);

  // When vendor changes, reset/prefill bank info if available from vendor contact
  useEffect(() => {
    if (vendor && !editInvoice) {
      const vObj = vendors.find((v) => v.name === vendor);
      if (vObj) {
        if (!namaRekening) setNamaRekening(vObj.name);
      }
    }
  }, [vendor, vendors, editInvoice, namaRekening]);

  // List of active POs for this vendor
  const vendorPOs = React.useMemo(() => {
    return productionPOs.filter((po) => !po.vendorTujuan || po.vendorTujuan === vendor);
  }, [productionPOs, vendor]);

  // When PO is chosen, auto fill brand & product
  const handleSelectPO = (poNo: string) => {
    setSelectedPoNumber(poNo);
    if (!poNo) {
      return;
    }
    const targetPO = productionPOs.find((p) => p.noPO === poNo);
    if (targetPO) {
      setBrand(targetPO.brand || '');
      const prodName = targetPO.items && targetPO.items.length > 0 ? targetPO.items[0].namaProduk : '';
      setProduk(prodName);
      if (!keterangan) {
        setKeterangan(`Pembayaran DP Ongkos Jahit ${targetPO.noPO} (${targetPO.brand} - ${prodName}) sebelum barang dikirim`);
      }
    } else {
      const targetSpk = spkList.find((s) => s.sourcePONumber === poNo || s.spkNumber === poNo);
      if (targetSpk) {
        setBrand(targetSpk.brand || '');
        setProduk(targetSpk.produk || '');
      }
    }
  };

  // Calculate total nominal
  const totalNominal = React.useMemo(() => {
    if (isDetailed) {
      return items.reduce((sum, it) => sum + (it.subtotal || 0), 0);
    }
    return parseRupiahInput(singleNominal);
  }, [isDetailed, items, singleNominal]);

  const handleItemChange = (index: number, field: keyof VendorManualInvoiceItem, val: any) => {
    setItems((prev) => {
      const next = [...prev];
      const cur = { ...next[index], [field]: val };
      if (field === 'qty' || field === 'hargaSatuan') {
        const q = field === 'qty' ? Number(val) : cur.qty || 0;
        const h = field === 'hargaSatuan' ? Number(val) : cur.hargaSatuan || 0;
        cur.subtotal = q * h;
      }
      next[index] = cur;
      return next;
    });
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        deskripsi: 'Tambahan Ongkos Jahit / Uang Muka',
        qty: 1,
        satuan: 'Pcs',
        hargaSatuan: 0,
        subtotal: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = async (shouldPrint: boolean) => {
    if (!vendor) {
      alert('Silakan pilih mitra penjahit (vendor).');
      return;
    }
    if (!invoiceNo.trim()) {
      alert('Nomor invoice tidak boleh kosong.');
      return;
    }
    if (totalNominal <= 0) {
      alert('Total nominal pembayaran harus lebih besar dari Rp 0.');
      return;
    }

    const payloadItems: VendorManualInvoiceItem[] = isDetailed
      ? items
      : [
          {
            id: 'item-1',
            deskripsi: keterangan || 'Pembayaran Dimuka / DP Ongkos Jahit',
            subtotal: totalNominal,
          },
        ];

    const dataToSave = {
      invoiceNo: invoiceNo.trim(),
      vendor,
      tanggal,
      jatuhTempo: tanggal,
      tanggalBayar: status === 'DIBAYAR' ? tanggalBayar : undefined,
      kategori,
      poNumber: selectedPoNumber || undefined,
      brand: brand || undefined,
      produk: produk || undefined,
      keterangan: keterangan || `Pembayaran uang muka vendor ${vendor}`,
      items: payloadItems,
      totalNominal,
      metodePembayaran,
      bankTujuan,
      nomorRekening,
      namaRekening,
      referensiTransfer,
      status,
      potongDiSlipGaji,
      isDeducted: false,
      catatan,
    };

    let savedResult: VendorManualInvoice;
    if (editInvoice) {
      await updateVendorManualInvoice(editInvoice.id, dataToSave);
      savedResult = { ...editInvoice, ...dataToSave };
    } else {
      savedResult = await createVendorManualInvoice(dataToSave);
    }

    if (onSaved) {
      onSaved(savedResult, shouldPrint);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-slideUp">
        
        {/* Header Modal */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <ReceiptText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                {editInvoice ? 'Edit Invoice Manual Vendor' : 'Terbitkan Invoice & Pembayaran Manual Vendor'}
              </h3>
              <p className="text-[11px] text-slate-300">
                Pencairan DP / uang muka sebelum barang hasil jahit dikirimkan via Surat Jalan.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* Row 1: Vendor & Nomor Invoice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Pilih Mitra Penjahit (Vendor) <span className="text-rose-500">*</span>
              </label>
              <select
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
              >
                {vendors.map((v) => (
                  <option key={v.id} value={v.name}>
                    {v.name} ({v.specialty || 'Mitra Jahit'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nomor Invoice Manual <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                placeholder="INV-MAN/VND/202609/001"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Row 2: Tanggal & Kategori */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tanggal Terbit & Pembayaran</label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => {
                  setTanggal(e.target.value);
                  setTanggalBayar(e.target.value);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Kategori Pembayaran</label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value as VendorManualInvoiceCategory)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-indigo-500"
              >
                <option value="DP_ONGKOS_JAHIT">DP Ongkos Jahit (Uang Muka Pra-Kirim)</option>
                <option value="PELUNASAN_DIMUKA">Pelunasan Jahit Sebelum Kirim</option>
                <option value="TALANGAN_OPERASIONAL">Talangan Operasional Jahit</option>
                <option value="BORONGAN_KHUSUS">Borongan Jahit Khusus</option>
                <option value="LAINNYA">Lainnya</option>
              </select>
            </div>
          </div>

          {/* Row 3: Link ke PO / SPK (Opsional) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-indigo-600" />
                Tautkan ke PO Produksi / SPK Terkait (Opsional)
              </span>
              <span className="text-[10.5px] text-slate-400">Untuk tracking potongan saat tuntas kirim</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[10.5px] text-slate-600 font-semibold mb-0.5">Pilih PO Produksi:</label>
                <select
                  value={selectedPoNumber}
                  onChange={(e) => handleSelectPO(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono"
                >
                  <option value="">-- Tanpa PO (Umum) --</option>
                  {vendorPOs.map((po) => (
                    <option key={po.id} value={po.noPO}>
                      {po.noPO} ({po.brand})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10.5px] text-slate-600 font-semibold mb-0.5">Brand Mitra:</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. JENAKA KIDS"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10.5px] text-slate-600 font-semibold mb-0.5">Artikel / Produk:</label>
                <input
                  type="text"
                  value={produk}
                  onChange={(e) => setProduk(e.target.value)}
                  placeholder="e.g. SENARA / KEMEJA"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Uraian / Keterangan Pembayaran */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Uraian / Keterangan Pembayaran</label>
            <input
              type="text"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="e.g. Pembayaran DP 50% Ongkos Jahit Kemeja Senara sebelum kirim Surat Jalan"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Row 5: Rincian Nominal (Single vs Multi Item) */}
          <div className="space-y-2 border-t border-slate-200 pt-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Nominal Pembayaran</span>
              <button
                type="button"
                onClick={() => setIsDetailed(!isDetailed)}
                className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
              >
                {isDetailed ? '← Beralih ke Input Nominal Tunggal' : '+ Rincikan Item & Tarif (Multi-item)'}
              </button>
            </div>

            {!isDetailed ? (
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 flex items-center justify-between gap-4">
                <span className="font-semibold text-slate-700">Total Nominal yang Dibayarkan:</span>
                <div className="w-56">
                  <div className="relative">
                    <span className="absolute left-3 top-2 font-bold text-slate-400">Rp</span>
                    <input
                      type="text"
                      value={singleNominal}
                      onChange={(e) => setSingleNominal(formatRupiahInput(e.target.value))}
                      placeholder="0"
                      className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-indigo-300 font-bold text-slate-900 bg-white text-right text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 text-left border-b border-slate-200 pb-1">
                      <th className="pb-1">Deskripsi Item</th>
                      <th className="pb-1 w-20 text-center">Qty</th>
                      <th className="pb-1 w-28 text-right">Tarif Satuan</th>
                      <th className="pb-1 w-28 text-right">Subtotal</th>
                      <th className="pb-1 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((it, idx) => (
                      <tr key={it.id || idx}>
                        <td className="py-1.5 pr-2">
                          <input
                            type="text"
                            value={it.deskripsi}
                            onChange={(e) => handleItemChange(idx, 'deskripsi', e.target.value)}
                            className="w-full px-2 py-1 rounded border border-slate-300 text-xs"
                          />
                        </td>
                        <td className="py-1.5 px-1">
                          <input
                            type="number"
                            value={it.qty || ''}
                            onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                            className="w-full px-1.5 py-1 rounded border border-slate-300 text-xs text-center"
                          />
                        </td>
                        <td className="py-1.5 px-1">
                          <input
                            type="number"
                            value={it.hargaSatuan || ''}
                            onChange={(e) => handleItemChange(idx, 'hargaSatuan', e.target.value)}
                            className="w-full px-1.5 py-1 rounded border border-slate-300 text-xs text-right"
                          />
                        </td>
                        <td className="py-1.5 pl-1 text-right font-bold text-slate-900">
                          Rp {(it.subtotal || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="py-1.5 text-center">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-rose-500 hover:text-rose-700 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Baris Rincian
                  </button>
                  <div className="text-right">
                    <span className="text-slate-500 mr-2">Total:</span>
                    <span className="font-bold text-slate-900 text-sm">
                      Rp {totalNominal.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Row 6: Metode Pembayaran & Rekening Bank */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-200 pt-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Metode Pembayaran</label>
              <select
                value={metodePembayaran}
                onChange={(e) => setMetodePembayaran(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
              >
                <option value="TRANSFER">Transfer Bank</option>
                <option value="TUNAI">Kas Tunai</option>
                <option value="CEK">Cek</option>
                <option value="GIRO">Bilyet Giro</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Bank & No Rekening Tujuan</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={bankTujuan}
                  onChange={(e) => setBankTujuan(e.target.value)}
                  placeholder="BCA"
                  className="w-20 px-2 py-1.5 rounded-lg border border-slate-300 text-xs text-center uppercase"
                />
                <input
                  type="text"
                  value={nomorRekening}
                  onChange={(e) => setNomorRekening(e.target.value)}
                  placeholder="No Rekening"
                  className="flex-1 px-2 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Atas Nama Rekening</label>
              <input
                type="text"
                value={namaRekening}
                onChange={(e) => setNamaRekening(e.target.value)}
                placeholder="Nama Pemilik Rekening"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
              />
            </div>
          </div>

          {/* Row 7: Status Pembayaran & Potong di Slip Gaji */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Status Pembayaran Saat Ini</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={status === 'DIBAYAR'}
                      onChange={() => setStatus('DIBAYAR')}
                      className="accent-emerald-600"
                    />
                    <span className="font-bold text-emerald-700">Sudah Dibayar (Lunas)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={status === 'PENDING'}
                      onChange={() => setStatus('PENDING')}
                      className="accent-amber-600"
                    />
                    <span className="font-bold text-amber-700">Pending (Menunggu Bayar)</span>
                  </label>
                </div>
              </div>

              {status === 'DIBAYAR' && (
                <div>
                  <label className="block text-[10.5px] font-semibold text-slate-600 mb-0.5">
                    No. Bukti / Ref Transfer:
                  </label>
                  <input
                    type="text"
                    value={referensiTransfer}
                    onChange={(e) => setReferensiTransfer(e.target.value)}
                    placeholder="TRF-BCA-123456"
                    className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-mono"
                  />
                </div>
              )}
            </div>

            {/* Checkbox Otomatis Potong di Slip Gaji */}
            <div className="border-t border-slate-200 pt-2.5">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={potongDiSlipGaji}
                  onChange={(e) => setPotongDiSlipGaji(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 accent-indigo-600 mt-0.5"
                />
                <div>
                  <div className="font-bold text-slate-800">
                    Otomatis Potong di Slip Gaji Penjahit Kelak (Rekomendasi)
                  </div>
                  <div className="text-[10.5px] text-slate-500 leading-tight">
                    Saat barang jahitan sudah terkirim via Surat Jalan dan dihitung gajinya, uang muka ini akan otomatis dipotong agar tidak terjadi pembayaran ganda.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Row 8: Catatan Tambahan */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
            <textarea
              rows={2}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Catatan persetujuan, alasan bayar dimuka, dsb."
              className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs"
            />
          </div>

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200 transition cursor-pointer"
          >
            Batal
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSave(false)}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Simpan Dokumen
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5 transition btn-press cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Simpan & Cetak Voucher
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
