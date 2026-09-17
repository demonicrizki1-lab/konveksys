import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  ShoppingBag,
  Calendar,
  Layers,
  FileText,
  DollarSign,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { FobPurchaseOrder, FobOrderItem, FobOrderStatus, FobOrderPriority, HPPCalculationRecord, FOBQuotation } from '../../types';
import { formatRp } from '../../utils/formatters';

interface FobOrderModalProps {
  initialOrder?: FobPurchaseOrder | null;
  brands: { name: string }[];
  vendors: { name: string }[];
  hppRecords: HPPCalculationRecord[];
  fobQuotations: FOBQuotation[];
  onSave: (order: Partial<FobPurchaseOrder>) => Promise<void>;
  onClose: () => void;
}

const DEFAULT_SIZES = ['M', 'L', 'XL', '2XL', '3XL', '4XL'];

export const FobOrderModal: React.FC<FobOrderModalProps> = ({
  initialOrder,
  brands,
  vendors,
  hppRecords,
  fobQuotations,
  onSave,
  onClose,
}) => {
  // 1. Header Fields
  const [poNumber, setPoNumber] = useState(initialOrder?.poNumber || '');
  const [internalId, setInternalId] = useState(initialOrder?.internalId || '');
  const [tanggalPo, setTanggalPo] = useState(
    initialOrder?.tanggalPo ? initialOrder.tanggalPo.substring(0, 10) : new Date().toISOString().substring(0, 10)
  );
  const [targetTiba, setTargetTiba] = useState(
    initialOrder?.targetTiba ? initialOrder.targetTiba.substring(0, 10) : ''
  );
  const [deadlineDays, setDeadlineDays] = useState<number>(initialOrder?.deadlineDays || 14);
  const [brand, setBrand] = useState(initialOrder?.brand || (brands[0]?.name || 'MONTURE'));
  const [vendor, setVendor] = useState(initialOrder?.vendor || (vendors[0]?.name || 'TRIKARSA'));
  const [pic, setPic] = useState(initialOrder?.pic || 'CECEP');
  const [prioritas, setPrioritas] = useState<FobOrderPriority>(initialOrder?.prioritas || 'TINGGI');
  const [status, setStatus] = useState<FobOrderStatus>(initialOrder?.status || 'DISETUJUI');
  const [skuInduk, setSkuInduk] = useState(initialOrder?.skuInduk || 'ROMPI HOODIE PUFFER');
  const [biayaLain, setBiayaLain] = useState<number>(initialOrder?.biayaLain || 0);

  // 2. Keterangan & Persetujuan
  const [keterangan, setKeterangan] = useState(
    initialOrder?.keterangan ||
      `1. PRODUK YANG DISEPAKATI SAMA TIM FINANCE DAN MARKETING MEMAKAI BAHAN GRADE B\n2. PACKAGING MENGGUNAKAN PLASTIK YANG SUDAH DI SABLON\n3. FINANCE MENENTUKAN BATAS BAWAH ROAS 4\n4. TARGET PENJUALAN DI ATAS 65% DARI TOTAL MASING-MASING PO UNTUK MENDAPATKAN MINIMAL PROFIT\n5. TARGET DEADLINE PRODUKSI DI AWAL 14 HARI, JIKA REPEAT ORDER BISA MENJADI 7 HARI`
  );
  const [persetujuanDibuat, setPersetujuanDibuat] = useState(initialOrder?.persetujuanDibuat || 'CECEP');
  const [persetujuanDisetujui, setPersetujuanDisetujui] = useState(initialOrder?.persetujuanDisetujui || 'MANAJEMEN BRAND');
  const [persetujuanVendor, setPersetujuanVendor] = useState(initialOrder?.persetujuanVendor || 'TRIKARSA');

  // References
  const [selectedHppId, setSelectedHppId] = useState<string>(initialOrder?.hppReferenceId || '');
  const [selectedQuotationId, setSelectedQuotationId] = useState<string>(initialOrder?.quotationReferenceId || '');

  // 3. Items List
  const [items, setItems] = useState<FobOrderItem[]>(() => {
    if (initialOrder?.items && initialOrder.items.length > 0) {
      return initialOrder.items;
    }
    return [];
  });

  // 4. Generator Matriks State
  const [generatorColors, setGeneratorColors] = useState('HITAM, NAVY, ARMY, ABU');
  const [generatorQtyPerItem, setGeneratorQtyPerItem] = useState<number>(5);
  const [selectedSizes, setSelectedSizes] = useState<string[]>(DEFAULT_SIZES);
  const [rateRegular, setRateRegular] = useState<number>(72000); // M, L
  const [rateLarge, setRateLarge] = useState<number>(77000);   // XL, 2XL
  const [rateJumbo, setRateJumbo] = useState<number>(87000);   // 3XL, 4XL

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto calculate targetTiba if deadlineDays or tanggalPo changes
  useEffect(() => {
    if (tanggalPo && deadlineDays > 0 && !targetTiba) {
      const dt = new Date(tanggalPo);
      dt.setDate(dt.getDate() + Number(deadlineDays));
      setTargetTiba(dt.toISOString().substring(0, 10));
    }
  }, [tanggalPo, deadlineDays]);

  // Handle Import HPP
  const handleSelectHpp = (hppId: string) => {
    setSelectedHppId(hppId);
    if (!hppId) return;
    const hpp = hppRecords.find((h) => h.id === hppId);
    if (hpp) {
      if (hpp.namaProduk) setSkuInduk(hpp.namaProduk);
      if (hpp.brand) setBrand(hpp.brand);
      if (hpp.vendorCmt) setVendor(hpp.vendorCmt);
      if (hpp.hargaJualRekomendasi) {
        setRateRegular(hpp.hargaJualRekomendasi);
        setRateLarge(Math.round((hpp.hargaJualRekomendasi * 1.07) / 1000) * 1000);
        setRateJumbo(Math.round((hpp.hargaJualRekomendasi * 1.2) / 1000) * 1000);
      }
    }
  };

  // Matrix Generator: generate rows from colors x sizes
  const handleGenerateMatrix = () => {
    const rawColors = generatorColors
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter((c) => c.length > 0);

    if (rawColors.length === 0) {
      alert('Mohon masukkan minimal 1 warna (dipisahkan koma)');
      return;
    }
    if (selectedSizes.length === 0) {
      alert('Pilih minimal 1 ukuran');
      return;
    }

    const newItems: FobOrderItem[] = [];
    let counter = 1;

    rawColors.forEach((warna) => {
      selectedSizes.forEach((size) => {
        let harga = rateRegular;
        const upperSize = size.toUpperCase();
        if (upperSize === 'XL' || upperSize === '2XL' || upperSize === 'XXL') {
          harga = rateLarge;
        } else if (upperSize === '3XL' || upperSize === '4XL' || upperSize === '5XL') {
          harga = rateJumbo;
        }

        newItems.push({
          id: `item-${Date.now()}-${counter}`,
          no: counter,
          sku: skuInduk || 'ARTIKEL FOB',
          warna,
          size,
          qty: generatorQtyPerItem,
          hargaBeli: harga,
          subtotal: generatorQtyPerItem * harga,
          catatan: '',
        });
        counter++;
      });
    });

    setItems(newItems);
  };

  // Add a single manual row
  const handleAddManualRow = () => {
    const nextNo = items.length + 1;
    const newItem: FobOrderItem = {
      id: `item-${Date.now()}-${nextNo}`,
      no: nextNo,
      sku: skuInduk || 'ARTIKEL FOB',
      warna: 'HITAM',
      size: 'L',
      qty: 10,
      hargaBeli: rateRegular || 75000,
      subtotal: 10 * (rateRegular || 75000),
      catatan: '',
    };
    setItems([...items, newItem]);
  };

  // Remove a row
  const handleRemoveRow = (idx: number) => {
    const updated = items.filter((_, i) => i !== idx).map((it, i) => ({ ...it, no: i + 1 }));
    setItems(updated);
  };

  // Update item field
  const handleItemChange = (idx: number, field: keyof FobOrderItem, val: any) => {
    setItems((prev) => {
      const copy = [...prev];
      const target = { ...copy[idx], [field]: val };
      if (field === 'qty' || field === 'hargaBeli') {
        const qty = Number(target.qty) || 0;
        const price = Number(target.hargaBeli) || 0;
        target.subtotal = qty * price;
      }
      copy[idx] = target;
      return copy;
    });
  };

  // Totals calculations
  const totalQty = useMemo(() => items.reduce((acc, it) => acc + (Number(it.qty) || 0), 0), [items]);
  const totalPembelian = useMemo(() => items.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0), [items]);
  const grandTotal = totalPembelian + Number(biayaLain || 0);
  const hargaRataRata = totalQty > 0 ? Math.round(totalPembelian / totalQty) : 0;

  // Save submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skuInduk.trim()) {
      alert('Mohon isi SKU / Nama Produk Induk');
      return;
    }
    if (items.length === 0) {
      alert('Mohon masukkan minimal 1 baris rincian varian atau gunakan Generator Matriks');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        ...(initialOrder?.id ? { id: initialOrder.id } : {}),
        poNumber: poNumber.trim() || `PO-PH-${String(Date.now()).slice(-4)}`,
        internalId: internalId.trim() || null,
        tanggalPo,
        targetTiba: targetTiba || null,
        deadlineDays: Number(deadlineDays) || 14,
        brand,
        vendor,
        pic: pic.trim() || null,
        prioritas,
        status,
        skuInduk: skuInduk.trim(),
        totalQty,
        hargaRataRata,
        totalPembelian,
        biayaLain: Number(biayaLain || 0),
        grandTotal,
        keterangan: keterangan.trim() || null,
        persetujuanDibuat: persetujuanDibuat.trim() || null,
        persetujuanDisetujui: persetujuanDisetujui.trim() || null,
        persetujuanVendor: persetujuanVendor.trim() || null,
        hppReferenceId: selectedHppId || null,
        quotationReferenceId: selectedQuotationId || null,
        items,
      });
      onClose();
    } catch (err: any) {
      alert('Gagal menyimpan PO: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        {/* MODAL HEADER */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>{initialOrder ? 'Edit Order Masuk PO Brand FOB' : 'Input Order Masuk (PO Brand FOB)'}</span>
                {poNumber && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {poNumber}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Pencatatan resmi dokumen pemesanan (PO) buyer/brand dengan matriks varian warna, ukuran & harga deal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* 1. AUTOFILL FROM HPP & SPH */}
          <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <div className="font-bold text-slate-800 text-xs">Opsi Tarik Data Kalkulator HPP / SPH</div>
                <div className="text-[11px] text-slate-500">
                  Otomatis isi nama produk, brand, vendor, dan harga acuan dari draft HPP yang sudah dihitung
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 min-w-[260px]">
              <select
                value={selectedHppId}
                onChange={(e) => handleSelectHpp(e.target.value)}
                className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Pilih Rekam HPP Acuan (Opsional) --</option>
                {hppRecords.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.noHpp} • {h.namaProduk} ({h.size}) - {formatRp(h.hargaJualRekomendasi)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. DOKUMEN PO HEADER INFORMATION */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>Informasi Header Purchase Order</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  NO. PO BRAND <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PO-PH-0002"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">ID INTERNAL</label>
                <input
                  type="text"
                  placeholder="Contoh: PH-0002"
                  value={internalId}
                  onChange={(e) => setInternalId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  BRAND PEMESAN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: MONTURE"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  VENDOR CMT / PELAKSANA <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: TRIKARSA"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-1">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  SKU / NAMA PRODUK INDUK <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: ROMPI HOODIE PUFFER"
                  value={skuInduk}
                  onChange={(e) => setSkuInduk(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">TANGGAL PO</label>
                <input
                  type="date"
                  value={tanggalPo}
                  onChange={(e) => setTanggalPo(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">DEADLINE (HARI)</label>
                <input
                  type="number"
                  min="1"
                  value={deadlineDays}
                  onChange={(e) => setDeadlineDays(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">TARGET TIBA</label>
                <input
                  type="date"
                  value={targetTiba}
                  onChange={(e) => setTargetTiba(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">PIC ORDER</label>
                <input
                  type="text"
                  placeholder="Contoh: CECEP"
                  value={pic}
                  onChange={(e) => setPic(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">PRIORITAS</label>
                <select
                  value={prioritas}
                  onChange={(e) => setPrioritas(e.target.value as FobOrderPriority)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="TINGGI">TINGGI (Urgent)</option>
                  <option value="NORMAL">NORMAL (Standar)</option>
                  <option value="RENDAH">RENDAH</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">STATUS PO</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as FobOrderStatus)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="DRAF">DRAF</option>
                  <option value="DISETUJUI">DISETUJUI (Deal)</option>
                  <option value="PROSES">PROSES PRODUKSI</option>
                  <option value="SELESAI">SELESAI</option>
                  <option value="BATAL">DIBATALKAN</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. QUICK MATRIX GENERATOR */}
          <div className="bg-amber-50/50 border border-amber-200/90 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-700" />
                <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Generator Matriks Varian Cepat (Warna × Ukuran)
                </span>
              </div>
              <button
                type="button"
                onClick={handleGenerateMatrix}
                className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Buat Baris Matriks Otomatis</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  DAFTAR WARNA (Pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  value={generatorColors}
                  onChange={(e) => setGeneratorColors(e.target.value)}
                  placeholder="Contoh: HITAM, NAVY, ARMY, ABU"
                  className="w-full bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  QTY DEFAULT PER VARIAN (Pcs)
                </label>
                <input
                  type="number"
                  min="1"
                  value={generatorQtyPerItem}
                  onChange={(e) => setGeneratorQtyPerItem(Number(e.target.value))}
                  className="w-full bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[10.5px] font-bold text-slate-600 mb-1">
                  HARGA UKURAN REGULER (M, L)
                </label>
                <input
                  type="number"
                  step="500"
                  value={rateRegular}
                  onChange={(e) => setRateRegular(Number(e.target.value))}
                  className="w-full bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-slate-600 mb-1">
                  HARGA UKURAN BESAR (XL, 2XL)
                </label>
                <input
                  type="number"
                  step="500"
                  value={rateLarge}
                  onChange={(e) => setRateLarge(Number(e.target.value))}
                  className="w-full bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-slate-600 mb-1">
                  HARGA UKURAN JUMBO (3XL, 4XL)
                </label>
                <input
                  type="number"
                  step="500"
                  value={rateJumbo}
                  onChange={(e) => setRateJumbo(Number(e.target.value))}
                  className="w-full bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* 4. ITEMS BREAKDOWN TABLE */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-xs">
                Daftar Rincian Varian ({items.length} Baris Item)
              </span>
              <button
                type="button"
                onClick={handleAddManualRow}
                className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris Manual</span>
              </button>
            </div>

            <div className="border border-slate-300 rounded-xl overflow-x-auto max-h-[340px]">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead className="sticky top-0 bg-slate-800 text-white z-10 font-semibold">
                  <tr>
                    <th className="py-2 px-2 text-center w-8">No</th>
                    <th className="py-2 px-2">SKU / Nama Artikel</th>
                    <th className="py-2 px-2 w-24">Warna</th>
                    <th className="py-2 px-2 w-20">Size</th>
                    <th className="py-2 px-2 text-center w-20">Qty</th>
                    <th className="py-2 px-2 text-right w-28">Harga Beli/Pcs</th>
                    <th className="py-2 px-2 text-right w-32">Subtotal</th>
                    <th className="py-2 px-2">Catatan</th>
                    <th className="py-2 px-2 text-center w-10">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {items.map((it, idx) => (
                    <tr key={it.id || idx} className="hover:bg-slate-50/80">
                      <td className="py-1.5 px-2 text-center text-slate-500 font-medium">{idx + 1}</td>
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={it.sku}
                          onChange={(e) => handleItemChange(idx, 'sku', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-900"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={it.warna}
                          onChange={(e) => handleItemChange(idx, 'warna', e.target.value.toUpperCase())}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-900 font-bold"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={it.size}
                          onChange={(e) => handleItemChange(idx, 'size', e.target.value.toUpperCase())}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-indigo-900 font-bold text-center"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="number"
                          min="0"
                          value={it.qty}
                          onChange={(e) => handleItemChange(idx, 'qty', Number(e.target.value))}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 font-black text-center"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="number"
                          step="500"
                          value={it.hargaBeli}
                          onChange={(e) => handleItemChange(idx, 'hargaBeli', Number(e.target.value))}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 font-bold text-right"
                        />
                      </td>
                      <td className="py-1.5 px-2 text-right font-black text-slate-900">
                        {formatRp(it.subtotal)}
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={it.catatan || ''}
                          placeholder="Optional"
                          onChange={(e) => handleItemChange(idx, 'catatan', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-600"
                        />
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                          title="Hapus Baris"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. SUMMARY & TOTALS */}
          <div className="bg-slate-900 text-white rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">TOTAL QTY</div>
              <div className="text-lg font-black text-white">{totalQty} Pcs</div>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">RATA-RATA HARGA</div>
              <div className="text-lg font-black text-indigo-300">{formatRp(hargaRataRata)}</div>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">BIAYA LAIN-LAIN</div>
              <input
                type="number"
                value={biayaLain}
                onChange={(e) => setBiayaLain(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs text-white font-bold mt-0.5"
              />
            </div>

            <div>
              <div className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">GRAND TOTAL PO</div>
              <div className="text-xl font-black text-emerald-400">{formatRp(grandTotal)}</div>
            </div>
          </div>

          {/* 6. KETERANGAN & KLAUSUL */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700">
              KETERANGAN & KLAUSUL KESEPAKATAN PO (Bahan, Packaging, Batas ROAS, Lead Time)
            </label>
            <textarea
              rows={4}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 font-mono leading-relaxed focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* 7. PIC SIGNATURES */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-200 pt-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">DIBUAT OLEH (PIC)</label>
              <input
                type="text"
                value={persetujuanDibuat}
                onChange={(e) => setPersetujuanDibuat(e.target.value)}
                placeholder="Nama PIC"
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">DISETUJUI OLEH (BRAND)</label>
              <input
                type="text"
                value={persetujuanDisetujui}
                onChange={(e) => setPersetujuanDisetujui(e.target.value)}
                placeholder="Nama Manajemen Brand"
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">DITERIMA VENDOR (KONVEKSI)</label>
              <input
                type="text"
                value={persetujuanVendor}
                onChange={(e) => setPersetujuanVendor(e.target.value)}
                placeholder="Nama Vendor"
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
              />
            </div>
          </div>

          {/* SUBMIT BUTTONS */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-800 hover:bg-slate-100 font-semibold text-xs transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{initialOrder ? 'Simpan Perubahan PO' : 'Simpan Order PO Brand'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>,
    document.body
  );
};
